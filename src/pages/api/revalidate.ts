import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';


interface RevalidationPayload {
  event: string;
  data: any;
  timestamp: number;
  site_url?: string;
}

interface WordPressRecipeData {
  id: number;
  slug: string;
  title?: string;
  categories?: Array<{ id: number; slug: string }>;
  tags?: Array<{ id: number; slug: string }>;
  is_new?: boolean;
}


export default async function handler (req: NextApiRequest , res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET; 
 
  if(!REVALIDATION_SECRET) {
    console.error('Missing required environment variables');
    return res.status(500).json({ message: 'Server configuration error' });
  }

   try {
    // Handle different types of revalidation requests
    const isWordPressWebhook = req.headers['x-wordpress-webhook'] === 'true';
    
    if (isWordPressWebhook) {
      // Verify WordPress webhook signature
      const signature = req.headers['x-signature'] as string;
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256' , REVALIDATION_SECRET)
        .update(payload)
        .digest('hex');

      if (!signature || signature !== expectedSignature) {
        console.error('Invalid WordPress webhook signature');
        return res.status(401).json({ message: 'Invalid signature' });
      }

      return await handleWordPressWebhook(req.body, res);
    } else {
      // Handle direct API calls (manual revalidation)
      if (req.query.secret !== REVALIDATION_SECRET) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      return await handleDirectRevalidation(req.body, res);
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return res.status(500).json({ 
      message: 'Revalidation failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}


async function handleWordPressWebhook(
  payload: RevalidationPayload, 
  res: NextApiResponse
) {
  const { event, data } = payload;
  const revalidatedPaths: string[] = [];

  console.log(`Processing WordPress webhook: ${event}`, data);

  try {
    switch (event) {
      case 'test_connection':
        return res.json({ 
          success: true, 
          message: 'WordPress connection successful',
          timestamp: Date.now() 
        });

      case 'recipe_updated':
      case 'recipe_published':
        const recipeData = data as WordPressRecipeData;
        
        // Revalidate recipe page
        await res.revalidate(`/recipe/${recipeData.slug}`);
        revalidatedPaths.push(`/recipe/${recipeData.slug}`);
        
        // Revalidate recipes list
        await res.revalidate('/recipes');
        revalidatedPaths.push('/recipes');
        
        // Revalidate category pages
        if (recipeData.categories) {
          for (const category of recipeData.categories) {
            await res.revalidate(`/category/${category.slug}`);
            revalidatedPaths.push(`/category/${category.slug}`);
          }
        }
        
        // If it's a new featured recipe, revalidate homepage
        if (recipeData.is_new) {
          await res.revalidate('/');
          revalidatedPaths.push('/');
        }
        
        // Revalidate sitemap
        await res.revalidate('/sitemap.xml');
        revalidatedPaths.push('/sitemap.xml');
        
        break;

      case 'recipe_deleted':
      case 'recipe_unpublished':
        const deletedRecipeData = data as WordPressRecipeData;
        
        // Can't revalidate deleted page, but update related pages
        await res.revalidate('/recipes');
        revalidatedPaths.push('/recipes');
        
        if (deletedRecipeData.categories) {
          for (const category of deletedRecipeData.categories) {
            await res.revalidate(`/category/${category.slug}`);
            revalidatedPaths.push(`/category/${category.slug}`);
          }
        }
        
        await res.revalidate('/sitemap.xml');
        revalidatedPaths.push('/sitemap.xml');
        
        break;

      case 'category_updated':
        await res.revalidate(`/category/${data.slug}`);
        revalidatedPaths.push(`/category/${data.slug}`);
        await res.revalidate('/recipes');
        revalidatedPaths.push('/recipes');
        break;

      default:
        console.warn(`Unhandled webhook event: ${event}`);
        return res.status(400).json({ message: 'Unhandled event type' });
    }

    // Log successful revalidation
    console.log(`Successfully revalidated paths:`, revalidatedPaths);

    return res.json({ 
      revalidated: true, 
      paths: revalidatedPaths,
      timestamp: Date.now(),
      event 
    });

  } catch (error) {
    console.error(`Revalidation failed for event ${event}:`, error);
    throw error;
  }
}

async function handleDirectRevalidation(body: any, res: NextApiResponse) {
  const { path, type, id, paths } = body;

  if (paths && Array.isArray(paths)) {
    // Batch revalidation
    const results = await Promise.allSettled(
      paths.map(async (p: string) => {
        await res.revalidate(p);
        return p;
      })
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<string>).value);

    return res.json({ 
      revalidated: true, 
      paths: successful,
      timestamp: Date.now() 
    });
  }

  // Single path revalidation
  if (path) {
    await res.revalidate(path);
    return res.json({ 
      revalidated: true, 
      path,
      timestamp: Date.now() 
    });
  }

  // Type-based revalidation (legacy support)
  if (type && id) {
    const pathToRevalidate = `/${type}/${id}`;
    await res.revalidate(pathToRevalidate);
    return res.json({ 
      revalidated: true, 
      path: pathToRevalidate,
      timestamp: Date.now() 
    });
  }

  return res.status(400).json({ message: 'Invalid revalidation request' });
}
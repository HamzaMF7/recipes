// components/seo/RecipeSeo.tsx
import Head from 'next/head';
import type { Recipe } from '@/utils/recipe';

type Props = {
  recipe: Recipe;
  canonical: string;
  baseUrl: string;
};

export default function RecipeSeo({ recipe, canonical, baseUrl }: Props) {
  const title = recipe.recipeData?.name || recipe.title;
  const desc = recipe.recipeData?.summary || '';
  const image = recipe.featuredImage?.node?.sourceUrl || `${baseUrl}/default-og.jpg`;
  const published = recipe.recipeData?.datePublished || '';
  const modified = recipe.modified || recipe.date || published;

  const breadcrumbs = [
    { name: 'Home', item: baseUrl + '/' },
    { name: 'Recipes', item: baseUrl + '/recipes' },
    { name: title, item: canonical },
  ];

  const recipeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    mainEntityOfPage: canonical,
    name: title,
    description: desc,
    image,
    author: { '@type': 'Person', name: recipe.recipeData?.author || 'Chef' },
    datePublished: published,
    dateModified: modified,
    prepTime: recipe.recipeData?.prepTime ? `PT${recipe.recipeData.prepTime}M` : undefined,
    cookTime: recipe.recipeData?.cookTime ? `PT${recipe.recipeData.cookTime}M` : undefined,
    totalTime: recipe.recipeData?.totalTime ? `PT${recipe.recipeData.totalTime}M` : undefined,
    recipeYield: recipe.recipeData?.servings,
    recipeCategory: Array.isArray(recipe.recipeData?.type)
      ? recipe.recipeData?.type?.join(', ')
      : recipe.recipeData?.type,
    recipeCuisine: Array.isArray(recipe.recipeData?.cuisine)
      ? recipe.recipeData?.cuisine?.join(', ')
      : recipe.recipeData?.cuisine,
    aggregateRating: recipe.recipeData?.rating
      ? { '@type': 'AggregateRating', ratingValue: recipe.recipeData.rating, ratingCount: '1' }
      : undefined,
    nutrition: recipe.recipeData?.nutrition
      ? {
          '@type': 'NutritionInformation',
          calories: recipe.recipeData.nutrition.calories,
          proteinContent: recipe.recipeData.nutrition.protein,
          carbohydrateContent: recipe.recipeData.nutrition.carbohydrates,
          fatContent: recipe.recipeData.nutrition.fat,
        }
      : undefined,
    recipeIngredient: recipe.recipeData?.ingredients?.map(
      (ing: any) => `${ing.amount} ${ing.unit} ${ing.name}`.trim()
    ),
    recipeInstructions:
      recipe.recipeData?.instructions?.map((instruction: any, idx: number) => ({
        '@type': 'HowToStep',
        name: `Step ${idx + 1}`,
        text: instruction.instruction,
        image: instruction.image || undefined,
      })) || [],
    keywords: Array.isArray(recipe.recipeData?.keywords)
      ? recipe.recipeData?.keywords
      : `${recipe.recipeData?.keywords || ''}`,
    isAccessibleForFree: true,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content="index,follow,max-image-preview:large" />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Your Site" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </Head>
  );
}

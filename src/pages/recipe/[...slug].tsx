// pages/recipes/[slug].tsx
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Link from 'next/link';

import { recipeService } from '@/lib/recipe-service';
import type { Recipe, RecipeServiceError } from '@/utils/recipe';

import Layout from '@/pages/_layout';
import RecipeSeo from '@/components/seo/recipeSeo';
import { AdProvider } from '@/components/ads/adProvider';
import { AdSlot } from '@/components/ads/adSlot';
import { SkipLink } from '@/components/ui/skipLink';

const RecipeDetails = dynamic(() => import('@/components/ui/recipeDetailsModern'), {
  ssr: true, // keep SSR for SEO while still code-splitting
  loading: () => (
    <div className="mx-auto max-w-3xl p-6" aria-busy="true">
      Loading recipe…
    </div>
  ),
});

export type Props = {
  recipe: Recipe | null;
  error: RecipeServiceError | null;
  baseUrl: string;
  slug: string;
};

export default function RecipePage({ recipe: ssrRecipe, error: ssrError, baseUrl, slug }: Props) {
  const router = useRouter();

  const [recipe, setRecipe] = useState<Recipe | null>(ssrRecipe);
  const [error, setError] = useState<RecipeServiceError | null>(ssrError);
  const [loading, setLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Client-side fetch only if navigated without SSR data (e.g., client transitions).
  const fetchClient = useCallback(
    async (isRetry = false) => {
      if (!slug) return;
      if (recipe && !isRetry) return; // already have data

      setLoading(true);
      if (isRetry) setRetryCount((c) => c + 1);
      try {
        const res = await recipeService.fetchRecipe(slug, {
          fetchPolicy: isRetry ? 'network-only' : 'cache-first',
          includeMetadata: true,
          retries: isRetry ? 1 : undefined,
        });

        if (res.error) {
          setError(res.error);
          setRecipe(null);
        } else {
          setRecipe(res.data!);
          setError(null);
          setRetryCount(0);
        }
      } catch (e) {
        setError({
          code: 'UNKNOWN_ERROR',
          message: 'Unexpected client error while loading the recipe.',
          timestamp: Date.now(),
          originalError: e instanceof Error ? e : undefined,
        });
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    },
    [slug, recipe]
  );

  useEffect(() => {
    if (router.isReady && !ssrRecipe && slug) {
      fetchClient(false);
    }
  }, [router.isReady, slug, ssrRecipe, fetchClient]);

  const onRetry = () => fetchClient(true);

  // Fallback not-found state (SSR returns notFound: true) – defensive
  if (!recipe && !loading && error?.code === 'NOT_FOUND') {
    return (
      <Layout>
        <SkipLink href="#content" />
        <main id="content" className="mx-auto max-w-3xl p-6">
          <h1 className="text-3xl font-semibold mb-2 text-[color:var(--dark)]">Recipe Not Found</h1>
          <p className="mb-6">The recipe you’re looking for doesn’t exist or was removed.</p>
          <div className="flex gap-3">
            <Link href="/recipes" className="btn btn-primary" aria-label="Back to recipes">
              Browse recipes
            </Link>
            <button onClick={onRetry} className="btn btn-secondary" aria-label="Retry loading recipe" type="button">
              Retry
            </button>
          </div>
        </main>
      </Layout>
    );
  }

  // Loading state for client navigations
  if (loading && !recipe) {
    return (
      <main id="content" className="mx-auto max-w-3xl p-6" aria-busy="true" aria-live="polite">
        Loading recipe…
      </main>
    );
  }

  // Generic error state
  if (!recipe && error) {
    return (
      <main id="content" className="mx-auto max-w-3xl p-6" role="alert" aria-live="assertive">
        <h1 className="text-2xl font-semibold mb-2">We couldn’t load this recipe</h1>
        <p className="mb-4">{error.message}</p>
        <div className="flex gap-3">
          <button onClick={onRetry} className="btn btn-primary" type="button">
            Try again
          </button>
          <Link href="/recipes" className="btn btn-secondary">
            Browse recipes
          </Link>
        </div>
      </main>
    );
  }

  // Happy path
  const normalizedPath = recipe?.uri && recipe.uri.startsWith('/') ? recipe.uri : `/recipes/${slug}`;
  const canonical = new URL(normalizedPath, baseUrl).toString();

  return (
    <AdProvider>
      <RecipeSeo recipe={recipe!} canonical={canonical} baseUrl={baseUrl} />
      <SkipLink href="#content" />

      {/* Top-of-page, high-visibility ad that does not push content below the fold on mobile */}
      <div className="pt-4">
        <AdSlot
          id="recipe_top_banner"
          ariaLabel="Advertisement"
          sizes={{ desktop: [[970, 250], [728, 90]], mobile: [[320, 100], [320, 50]] } as const}
          viewportRules={{ min: 0 }}
          lazy
          className="mb-4"
        />
      </div>

      <main id="content" className="pb-16" aria-busy={loading} aria-live={loading ? 'polite' : undefined}>
        {/* H1 rendered inside RecipeDetails for a single heading per page */}
        <RecipeDetails recipe={recipe!} />

        {/* Mid-content ad (between body and related/content modules) */}
        <AdSlot
          id="recipe_mid_content"
          ariaLabel="Advertisement"
          sizes={{ desktop: [[728, 90], [300, 250]], mobile: [[300, 250], [320, 100]] } as const}
          lazy
          className="my-8"
        />
      </main>
      {/* (Optional) If using Google Publisher Tag load once globally */}
      <Script
        id="gpt"
        strategy="afterInteractive"
        src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
        onLoad={() => (window as any).googletag?.cmd?.push?.(() => {})}
      />
    </AdProvider>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const started = Date.now();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://example.com';
  try {
    const slugParam = ctx.params?.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

    if (!slug || !recipeService.isValidSlug(slug)) {
      return { notFound: true };

    }

    // Fast network fetch on SSR with limited retries for TTFB
    const result = await recipeService.fetchRecipe(slug, {
      fetchPolicy: 'network-only',
      timeout: Math.min(
        12000,
        (process.env.SERVER_REQUEST_TIMEOUT && +process.env.SERVER_REQUEST_TIMEOUT) || 20000
      ),
      retries: 1,
      includeMetadata: true,
    });

    // Set CDN cache for 60s, SWR 5m (tune to your freshness needs)
    ctx.res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    if (result.error) {
      // Return notFound for semantic missing resources; otherwise render error state on client
      if (result.error.code === 'NOT_FOUND' || result.error.code === 'VALIDATION_ERROR') {
        return { notFound: true };

      }
      return { props: { recipe: null, error: result.error, baseUrl, slug } };

    }

    return { props: { recipe: result.data!, error: null, baseUrl, slug } };

  } catch (e) {
    console.error('SSR error', e, { ms: Date.now() - started });
    // Prefer surfacing a client-rendered error instead of 404 for unexpected SSR issues
    const slugParam = ctx.params?.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam || '';
    return {
      props: {
        recipe: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Server error while loading the recipe.',
          timestamp: Date.now(),
        },
        baseUrl,
        slug,
      },
    };

  }
};

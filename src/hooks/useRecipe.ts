import { useState, useEffect, useCallback, useRef } from 'react';
import { recipeService, FetchRecipeOptions } from '@/lib/recipe-service';
import { Recipe, RecipeServiceError } from '@/utils/recipe';

interface UseRecipeState {
  recipe: Recipe | null;
  loading: boolean;
  error: RecipeServiceError | null;
}

interface UseRecipeReturn extends UseRecipeState {
  fetchRecipe: (id: string, options?: FetchRecipeOptions) => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
  prefetchRecipe: (id: string) => Promise<void>;
}

interface UseRecipeOptions extends FetchRecipeOptions {
  // Auto-fetch recipe on mount if ID is provided
  autoFetch?: boolean;
  // Callback when recipe is successfully fetched
  onSuccess?: (recipe: Recipe) => void;
  // Callback when an error occurs
  onError?: (error: RecipeServiceError) => void;
}

export function useRecipe(
  initialId?: string,
  options: UseRecipeOptions = {}
): UseRecipeReturn {
  const {
    autoFetch = true,
    onSuccess,
    onError,
    ...fetchOptions
  } = options;

  const [state, setState] = useState<UseRecipeState>({
    recipe: null,
    loading: false,
    error: null,
  });

  // Keep track of current recipe ID for refetch
  const currentIdRef = useRef<string | null>(initialId || null);
  const currentOptionsRef = useRef<FetchRecipeOptions>(fetchOptions);

  // Update refs when options change
  useEffect(() => {
    currentOptionsRef.current = fetchOptions;
  }, [fetchOptions]);

  const fetchRecipe = useCallback(async (
    id: string,
    overrideOptions?: FetchRecipeOptions
  ): Promise<void> => {
    // Don't fetch if already loading the same recipe
    if (state.loading && currentIdRef.current === id) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    currentIdRef.current = id;

    try {
      const { recipe, error } = await recipeService.fetchRecipe(
        id,
        { ...currentOptionsRef.current, ...overrideOptions }
      );

      setState({
        recipe,
        loading: false,
        error,
      });

      if (error) {
        onError?.(error);
      } else if (recipe) {
        onSuccess?.(recipe);
      }
    } catch (unexpectedError) {
      const error: RecipeServiceError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        timestamp: Date.now(),
        originalError: unexpectedError instanceof Error ? unexpectedError : undefined,
      };

      setState({
        recipe: null,
        loading: false,
        error,
      });

      onError?.(error);
    }
  }, [state.loading, onSuccess, onError]);

  const refetch = useCallback(async (): Promise<void> => {
    if (!currentIdRef.current) {
      console.warn('No recipe ID available for refetch');
      return;
    }
    await fetchRecipe(currentIdRef.current);
  }, [fetchRecipe]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const prefetchRecipe = useCallback(async (id: string): Promise<void> => {
    await recipeService.prefetchRecipe(id);
  }, []);

  // Auto-fetch on mount if initialId is provided
  useEffect(() => {
    if (autoFetch && initialId) {
      fetchRecipe(initialId);
    }
  }, [initialId, autoFetch, fetchRecipe]);

  return {
    ...state,
    fetchRecipe,
    refetch,
    clearError,
    prefetchRecipe,
  };
}

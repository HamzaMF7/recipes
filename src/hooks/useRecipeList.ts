import { recipeService } from "@/lib/recipe-service";
import { RecipeServiceError } from "@/utils/recipe";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseRecipesListState {
  data: any | null; // Replace 'any' with your actual recipes list type
  loading: boolean;
  error: RecipeServiceError | null;
  hasNextPage: boolean;
}

interface UseRecipesListReturn extends UseRecipesListState {
  fetchRecipesList: (first?: number, after?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

interface UseRecipesListOptions {
  first?: number;
  autoFetch?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: RecipeServiceError) => void;
}

export function useRecipesList(
  options: UseRecipesListOptions = {}
): UseRecipesListReturn {
  const {
    first = 10,
    autoFetch = true,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UseRecipesListState>({
    data: null,
    loading: false,
    error: null,
    hasNextPage: false,
  });

  const currentParamsRef = useRef({ first, after: undefined as string | undefined });

  const fetchRecipesList = useCallback(async (
    fetchFirst: number = first,
    after?: string
  ): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    currentParamsRef.current = { first: fetchFirst, after };

    try {
      const { data, error } = await recipeService.fetchRecipesList(fetchFirst, after);

      setState({
        data,
        loading: false,
        error,
        hasNextPage: data?.recipes?.pageInfo?.hasNextPage || false,
      });

      if (error) {
        onError?.(error);
      } else if (data) {
        onSuccess?.(data);
      }
    } catch (unexpectedError) {
      const error: RecipeServiceError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        timestamp: Date.now(),
        originalError: unexpectedError instanceof Error ? unexpectedError : undefined,
      };

      setState({
        data: null,
        loading: false,
        error,
        hasNextPage: false,
      });

      onError?.(error);
    }
  }, [first, onSuccess, onError]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!state.hasNextPage || state.loading) {
      return;
    }

    const cursor = state.data?.recipes?.pageInfo?.endCursor;
    if (cursor) {
      await fetchRecipesList(first, cursor);
    }
  }, [state.hasNextPage, state.loading, state.data, fetchRecipesList, first]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchRecipesList(currentParamsRef.current.first, currentParamsRef.current.after);
  }, [fetchRecipesList]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchRecipesList();
    }
  }, [autoFetch, fetchRecipesList]);

  return {
    ...state,
    fetchRecipesList,
    loadMore,
    refetch,
    clearError,
  };
}

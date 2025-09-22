import { useCallback, useEffect, useRef, useState } from "react";

import { recipeService, type FetchRecipesListOptions } from "@/lib/recipe-service";
import type { GetRecipesData } from "@/lib/graphql-queries";
import type { RecipeServiceError } from "@/utils/recipe";

interface UseRecipesListState {
  data: GetRecipesData | null;
  loading: boolean;
  error: RecipeServiceError | null;
  hasNextPage: boolean;
}

interface UseRecipesListReturn extends UseRecipesListState {
  fetchRecipesList: (options?: Partial<FetchRecipesListOptions>) => Promise<void>;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

interface UseRecipesListOptions {
  first?: number;
  autoFetch?: boolean;
  onSuccess?: (data: GetRecipesData) => void;
  onError?: (error: RecipeServiceError) => void;
}

type RequestSnapshot = Partial<FetchRecipesListOptions> & {
  page: number;
  perPage: number;
};

function mergePages(prev: GetRecipesData | null, next: GetRecipesData, page: number): GetRecipesData {
  if (page <= 1 || !prev?.filteredRecipes) {
    return next;
  }

  const previousNodes = prev.filteredRecipes.nodes ?? [];
  const incomingNodes = next.filteredRecipes.nodes ?? [];

  return {
    filteredRecipes: {
      ...next.filteredRecipes,
      nodes: [...previousNodes, ...incomingNodes],
    },
  };
}

export function useRecipesList(options: UseRecipesListOptions = {}): UseRecipesListReturn {
  const { first = 10, autoFetch = true, onSuccess, onError } = options;

  const [state, setState] = useState<UseRecipesListState>({
    data: null,
    loading: false,
    error: null,
    hasNextPage: false,
  });

  const lastRequestRef = useRef<RequestSnapshot>({ page: 1, perPage: first });

  const fetchRecipesList = useCallback(
    async (requestOverrides: Partial<FetchRecipesListOptions> = {}): Promise<void> => {
      const page = requestOverrides.page ?? 1;
      const perPage = requestOverrides.perPage ?? first;
      const request: RequestSnapshot = {
        ...requestOverrides,
        page,
        perPage,
      };

      setState(prev => ({ ...prev, loading: true, error: null }));
      lastRequestRef.current = request;

      try {
        const { data, error } = await recipeService.fetchRecipesList(request);

        let resolvedData: GetRecipesData | null = null;
        setState(prev => {
          const mergedData = data ? mergePages(prev.data, data, page) : null;
          resolvedData = mergedData;
          return {
            data: mergedData,
            loading: false,
            error,
            hasNextPage: mergedData?.filteredRecipes?.hasMore ?? false,
          };
        });

        if (error) {
          onError?.(error);
        } else if (resolvedData) {
          onSuccess?.(resolvedData);
        }
      } catch (unexpectedError) {
        const error: RecipeServiceError = {
          code: "UNKNOWN_ERROR",
          message: "An unexpected error occurred",
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
    },
    [first, onError, onSuccess]
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (state.loading || !state.hasNextPage) {
      return;
    }

    const nextPage = lastRequestRef.current.page + 1;
    await fetchRecipesList({ ...lastRequestRef.current, page: nextPage });
  }, [fetchRecipesList, state.hasNextPage, state.loading]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchRecipesList({ ...lastRequestRef.current });
  }, [fetchRecipesList]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

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

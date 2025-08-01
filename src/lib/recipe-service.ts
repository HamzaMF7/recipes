import { ApolloError } from '@apollo/client';
import { apolloClient } from './apollo-client';
import { GET_RECIPE, GET_RECIPES_LIST, GetRecipeData, GetRecipeVariables } from '@/lib/graphql-queries';
import { Recipe, RecipeSchema, RecipeServiceError, ErrorCode } from '@/utils/recipe' ;
import { CONFIG, ERROR_CODES } from '@/utils/constants';

export interface FetchRecipeOptions {
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache';
  timeout?: number;
}

class RecipeService {
  private validateRecipeData(data: unknown): Recipe {
    try {
      return RecipeSchema.parse(data);
    } catch (error) {
      throw new Error(`Recipe validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }
  }

  private createError(code: ErrorCode, message: string, originalError?: Error): RecipeServiceError {
    return {
      code,
      message,
      originalError,
      timestamp: Date.now(),
    };
  }

  private handleApolloError(error: ApolloError): RecipeServiceError {
    if (error.networkError) {
      if (error.networkError.message.includes('timeout')) {
        return this.createError(ERROR_CODES.TIMEOUT_ERROR, 'Request timed out. Please try again.', error);
      }
      return this.createError(ERROR_CODES.NETWORK_ERROR, 'Network error occurred. Please check your connection.', error);
    }

    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const errorMessage = error.graphQLErrors.map(e => e.message).join(', ');
      return this.createError(ERROR_CODES.VALIDATION_ERROR, `GraphQL error: ${errorMessage}`, error);
    }

    return this.createError(ERROR_CODES.UNKNOWN_ERROR, 'An unexpected error occurred', error);
  }

  async fetchRecipe(
    id: string,
    options: FetchRecipeOptions = {}
  ): Promise<{ recipe: Recipe | null; error: RecipeServiceError | null }> {
    try {
      // Input validation
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return {
          recipe: null,
          error: this.createError(ERROR_CODES.VALIDATION_ERROR, 'Recipe ID is required and must be a valid string'),
        };
      }

      const { fetchPolicy = 'cache-first' } = options;

      const { data, error: apolloError } = await apolloClient.query<GetRecipeData, GetRecipeVariables>({
        query: GET_RECIPE,
        variables: { id: id.trim() },
        fetchPolicy,
        errorPolicy: 'all',
      });

      if (apolloError) {
        return {
          recipe: null,
          error: this.handleApolloError(apolloError),
        };
      }

      if (!data?.recipe) {
        return {
          recipe: null,
          error: this.createError(ERROR_CODES.NOT_FOUND, `Recipe with ID "${id}" not found`),
        };
      }

      // Validate recipe data
      const validatedRecipe = this.validateRecipeData(data.recipe);

      return {
        recipe: validatedRecipe,
        // recipe : data.recipe ,
        error: null,
      };
    } catch (error) {
      console.error('Error in fetchRecipe:', error);

      if (error instanceof ApolloError) {
        return {
          recipe: null,
          error: this.handleApolloError(error),
        };
      }

      return {
        recipe: null,
        error: this.createError(
          ERROR_CODES.UNKNOWN_ERROR,
          error instanceof Error ? error.message : 'Failed to fetch recipe'
        ),
      };
    }
  }

  async fetchRecipesList(first: number = 10, after?: string) {
    try {
      const { data, error: apolloError } = await apolloClient.query({
        query: GET_RECIPES_LIST,
        variables: { first, after },
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      });

      if (apolloError) {
        return {
          data: null,
          error: this.handleApolloError(apolloError),
        };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.createError(
          ERROR_CODES.NETWORK_ERROR,
          error instanceof Error ? error.message : 'Failed to fetch recipes list'
        ),
      };
    }
  }

  async prefetchRecipe(id: string): Promise<void> {
    try {
      await apolloClient.query({
        query: GET_RECIPE,
        variables: { id },
        fetchPolicy: 'cache-first',
      });
    } catch (error) {
      console.warn('Failed to prefetch recipe:', error);
    }
  }

  clearCache(): void {
    apolloClient.cache.reset();
  }

  // Get cache statistics
  getCacheStats() {
    const cacheData = apolloClient.cache.extract();
    return {
      size: Object.keys(cacheData).length,
      keys: Object.keys(cacheData),
    };
  }
}

export const recipeService = new RecipeService();

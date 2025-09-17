


// import { ApolloError, WatchQueryOptions, ApolloQueryResult, gql } from '@apollo/client';
// import { apolloClient } from './apollo-client';
// import { 
//   GET_FILTERED_RECIPES,
//   GET_RECIPE_BY_SLUG, 
//   GET_RECIPE_FACETS, 
//   GET_RECIPES_LIST, 
//   GetRecipeBySlugData, 
//   GetRecipeBySlugVariables,
//   GetRecipesListData,
//   GetRecipesListVariables 
// } from '@/lib/graphql-queries';
// import { Recipe, RecipeSchema, RecipeServiceError, ErrorCode } from '@/utils/recipe';
// import { CONFIG, ERROR_CODES } from '@/utils/constants';

// export interface FetchRecipeOptions {
//   fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache';
//   timeout?: number;
//   retries?: number;
//   includeMetadata?: boolean;
// }

// export interface FetchRecipesListOptions extends FetchRecipeOptions {
//   first?: number;
//   after?: string;
// }

// export interface RecipeServiceResult<T> {
//   data: T | null;
//   error: RecipeServiceError | null;
//   metadata?: {
//     cached: boolean;
//     timestamp: number;
//     source: 'cache' | 'network' | 'cache-and-network';
//   };
// }

// export interface CacheStats {
//   size: number;
//   keys: string[];
//   recipeCount: number;
//   lastUpdated: number;
// }

// // ---------------- Types for the new methods ----------------

// export interface GetFilteredRecipesVariables {
//   first?: number;
//   after?: string | null;
//   filters?: Record<string, unknown>; // align with your schema (e.g., RecipeFiltersInput)
//   search?: string | null;
// }

// export interface GetFilteredRecipesData {
//   recipes: {
//     pageInfo: { endCursor: string | null; hasNextPage: boolean };
//     edges: Array<{
//       node: {
//         id: string;
//         slug: string;
//         uri: string;
//         title: string;
//         featuredImage?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
//         recipeData?: {
//           name?: string | null;
//           summary?: string | null;
//           dietary?: string[] | null;
//           cuisine?: string[] | null;
//           method?: string[] | null;
//           difficulty?: string | null;
//           mealTypes?: string[] | null;
//           totalTime?: number | null;
//           rating?: number | null;
//           servings?: number | null;
//           servingsUnit?: string | null;
//         } | null;
//       };
//     }>;
//   };
// }

// export interface GetFacetsData {
//   cuisines: { nodes: Array<{ name: string; slug: string }> };
//   dietaries: { nodes: Array<{ name: string; slug: string }> };
//   mealTypes: { nodes: Array<{ name: string; slug: string }> };
//   methods: { nodes: Array<{ name: string; slug: string }> };
//   proteins: { nodes: Array<{ name: string; slug: string }> };
// }

// export interface GetFilteredRecipesOptions extends FetchRecipeOptions {
//   first?: number;         // default 20
//   after?: string | null;  // relay cursor
//   search?: string | null; // optional text search
//   filters?: Record<string, unknown>; // your RecipeFiltersInput shape
// }

// class RecipeService {
//   private readonly defaultTimeout = CONFIG?.REQUEST_TIMEOUT ?? 10000;
//   private readonly maxRetries = CONFIG?.RETRY_ATTEMPTS ?? 3; // ✅ FIX
//   private readonly retryDelay = CONFIG?.RETRY_DELAY ?? 1000;

//   /**
//    * Validates recipe data against the schema
//    */
//   private validateRecipeData(data: unknown): Recipe {
//     try {
//       return RecipeSchema.parse(data);
//     } catch (error) {
//       const validationMessage = error instanceof Error 
//         ?  error.message
//         : 'Unknown validation error';
      
//       throw new Error(`Recipe validation failed: ${validationMessage}`);
//     }
//   }

//   /**
//    * Creates a standardized error object
//    */
//   private createError(
//     code: ErrorCode, 
//     message: string, 
//     originalError?: Error,
//     context?: Record<string, unknown>
//   ): RecipeServiceError {
//     return {
//       code,
//       message,
//       originalError,
//       timestamp: Date.now(),
//       context,
//     };
//   }

//   /**
//    * Handles Apollo errors with specific error mapping
//    */
//   private mapGraphQLErrors(errors: readonly any[] | undefined, context?: Record<string, unknown>): RecipeServiceError | null {
//     if (!errors || errors.length === 0) return null;
//     const combined = errors.map((e) => e?.message).filter(Boolean).join(', ');
//     const hasValidation = errors.some((e) => e?.extensions?.code === 'VALIDATION_ERROR');
//     if (hasValidation) {
//       return this.createError(ERROR_CODES.VALIDATION_ERROR, `Validation error: ${combined}`, undefined, context);
//     }
//     return this.createError(ERROR_CODES.GRAPHQL_ERROR, `GraphQL error: ${combined}`, undefined, context);
//   }
//   /**
//    * Implements retry logic with exponential backoff
//    */
//   private async withRetry<T>(
//       operation: () => Promise<T>,
//       maxRetries: number = this.maxRetries,
//       context?: Record<string, unknown>
//     ): Promise<T> {
//       let lastError: any;
//       for (let attempt = 0; attempt <= maxRetries; attempt++) {
//         try {
//           return await operation();
//         } catch (err) {
//           lastError = err;
//           // Non-retryable?
//           if (err instanceof ApolloError) {
//             const nonRetryable = err.graphQLErrors?.some((e) =>
//               ['VALIDATION_ERROR', 'NOT_FOUND'].includes(String(e?.extensions?.code))
//             );
//             if (nonRetryable || attempt === maxRetries) throw err;
//           }
//           if (attempt < maxRetries) {
//             const delay = this.retryDelay * Math.pow(2, attempt);
//             console.warn(`Retrying (${attempt + 1}/${maxRetries + 1}) in ${delay}ms`, { context, error: String(lastError) });
//             await new Promise((r) => setTimeout(r, delay));
//           }
//         }
//       }
//       throw lastError;
//     }

//   /**
//    * Sanitizes and validates input slug
//    */
//   private validateRecipeSlug(slug: unknown): string {
//     if (!slug || typeof slug !== 'string') {
//       throw new Error('Recipe slug must be a non-empty string');
//     }

//     const trimmedSlug = slug.trim();
//     if (trimmedSlug === '') {
//       throw new Error('Recipe slug cannot be empty');
//     }

//     // Validate slug format (lowercase letters, numbers, and hyphens only)
//     const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
//     if (!slugPattern.test(trimmedSlug)) {
//       throw new Error('Recipe slug must contain only lowercase letters, numbers, and hyphens');
//     }

//     // Length validation
//     if (trimmedSlug.length < 3) {
//       throw new Error('Recipe slug must be at least 3 characters long');
//     }

//     if (trimmedSlug.length > 100) {
//       throw new Error('Recipe slug is too long (max 100 characters)');
//     }

//     return trimmedSlug;
//   }

//   /**
//    * Creates metadata for the response
//    */
//   private createMetadata(
//     source: 'cache' | 'network' | 'cache-and-network',
//     cached: boolean = false
//   ) {
//     return {
//       cached,
//       timestamp: Date.now(),
//       source,
//     };
//   }

//   /**
//    * Fetches a single recipe by slug with comprehensive error handling and retry logic
//    */
//   async fetchRecipe(
//       slug: unknown,
//       options: FetchRecipeOptions = {}
//     ): Promise<RecipeServiceResult<Recipe>> {
//       const context = { operation: 'fetchRecipe', slug };
//       const start = Date.now();
//       try {
//         const validatedSlug = this.validateRecipeSlug(slug);

//         const {
//           fetchPolicy = 'cache-first',
//           timeout = this.defaultTimeout,
//           retries = this.maxRetries,
//           includeMetadata = false,
//         } = options;

//         const queryOptions: WatchQueryOptions<GetRecipeBySlugVariables> = {
//           query: GET_RECIPE_BY_SLUG,
//           variables: { slug: validatedSlug },
//           fetchPolicy,
//           errorPolicy: 'all', // ✅ we will read result.errors
//           ...(timeout && { context: { timeout, fetchOptions: { timeout } } }),
//         };

//         const operation = async () =>
//           await apolloClient.query<GetRecipeBySlugData, GetRecipeBySlugVariables>(queryOptions);

//         const result: ApolloQueryResult<GetRecipeBySlugData> = await this.withRetry(operation, retries, context);

//         // ✅ Properly handle GraphQL errors when errorPolicy: 'all'
//         const gqlErr = this.mapGraphQLErrors(result.errors, context);
//         if (gqlErr) {
//           return {
//             data: null,
//             error: gqlErr,
//             ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
//           };
//         }

//         if (!result.data?.recipeBy) {
//           return {
//             data: null,
//             error: this.createError(
//               ERROR_CODES.NOT_FOUND,
//               `Recipe with slug "${validatedSlug}" not found`,
//               undefined,
//               { ...context, slug: validatedSlug }
//             ),
//             ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
//           };
//         }

//         const validatedRecipe = this.validateRecipeData(result.data.recipeBy);
//         const ms = Date.now() - start;
//         if (process.env.NODE_ENV !== 'production') {
//           console.debug(`Recipe fetched in ${ms}ms`, { slug: validatedSlug, fetchPolicy });
//         }

//         return {
//           data: validatedRecipe,
//           error: null,
//           ...(includeMetadata && {
//             metadata: this.createMetadata(fetchPolicy as any, fetchPolicy.startsWith('cache')),
//           }),
//         };
//       } catch (err) {
//         if (err instanceof ApolloError) {
//           return {
//             data: null,
//             error: this.mapGraphQLErrors([err], context),
//             ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
//           };
//         }
//         return {
//           data: null,
//           error: this.createError(
//             ERROR_CODES.UNKNOWN_ERROR,
//             err instanceof Error ? err.message : 'Failed to fetch recipe',
//             err instanceof Error ? err : undefined,
//             context
//           ),
//           ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
//         };
//       }
//     }

//   /**
//    * Fetches a paginated list of recipes
//    */
//   async fetchRecipesList(
//     options: FetchRecipesListOptions = {}
//   ): Promise<RecipeServiceResult<GetRecipesListData>> {
//     const context = { operation: 'fetchRecipesList' };
    
//     try {
//       const {
//         first = 10,
//         after,
//         fetchPolicy = 'cache-and-network',
//         retries = this.maxRetries,
//         includeMetadata = false
//       } = options;

//       // Validate pagination parameters
//       if (first < 1 || first > 100) {
//         return {
//           data: null,
//           error: this.createError(
//             ERROR_CODES.VALIDATION_ERROR, 
//             'First parameter must be between 1 and 100',
//             undefined,
//             context
//           ),
//         };
//       }

//       const operation = async () => {
//         return await apolloClient.query<GetRecipesListData, GetRecipesListVariables>({
//           query: GET_RECIPES_LIST,
//           variables: { first, after },
//           fetchPolicy,
//           errorPolicy: 'all',
//         });
//       };

//       const { data, error: apolloError } = await this.withRetry(
//         operation,
//         retries,
//         { ...context, first, after }
//       );

//       if (apolloError) {
//         return {
//           data: null,
//           error: this.mapGraphQLErrors([apolloError], context),
//           ...(includeMetadata && { 
//             metadata: this.createMetadata('network', false) 
//           }),
//         };
//       }

//       return {
//         data,
//         error: null,
//         ...(includeMetadata && { 
//           metadata: this.createMetadata(fetchPolicy as any, fetchPolicy.includes('cache')) 
//         }),
//       };

//     } catch (error) {
//       console.error('Error in fetchRecipesList:', error, context);
      
//       return {
//         data: null,
//         error: this.createError(
//           ERROR_CODES.UNKNOWN_ERROR,
//           error instanceof Error ? error.message : 'Failed to fetch recipes list',
//           error instanceof Error ? error : undefined,
//           context
//         ),
//         ...(options.includeMetadata && { 
//           metadata: this.createMetadata('network', false) 
//         }),
//       };
//     }
//   }

//     /**
//    * Fetch paginated, filtered recipes (for the All Recipes page).
//    * Keeps the same error handling / retry / metadata contract as fetchRecipe().
//    */
//   async getFilteredRecipes(
//     options: GetFilteredRecipesOptions = {}
//   ): Promise<RecipeServiceResult<GetFilteredRecipesData>> {
//     const {
//       first = 20,
//       after = null,
//       search = null,
//       filters = {},
//       fetchPolicy = 'cache-and-network',
//       timeout = this.defaultTimeout,
//       retries = this.maxRetries,
//       includeMetadata = false,
//     } = options;

//     const context = { operation: 'getFilteredRecipes', first, after, search, filters };

//     try {
//       const op = async (): Promise<ApolloQueryResult<GetFilteredRecipesData>> => {
//         return apolloClient.query<GetFilteredRecipesData, GetFilteredRecipesVariables>({
//           query: GET_FILTERED_RECIPES,
//           variables: { first, after, filters, search },
//           fetchPolicy,
//           errorPolicy: 'all',
//           ...(timeout && {
//             context: { timeout, fetchOptions: { timeout } },
//           }),
//         });
//       };

//       const { data, error: apolloError } = await this.withRetry(op, retries, context);

//       if (apolloError) {
//         return {
//           data: null,
//           error: this.mapGraphQLErrors([apolloError], context),
//           ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
//         };
//       }

//       return {
//         data,
//         error: null,
//         ...(includeMetadata && {
//           metadata: this.createMetadata(fetchPolicy as any, fetchPolicy.includes('cache')),
//         }),
//       };
//     } catch (error) {
//       console.error('Error in getFilteredRecipes:', error, context);
//       if (error instanceof ApolloError) {
//         return {
//           data: null,
//           error: this.mapGraphQLErrors([error], context),
//           ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
//         };
//       }
//       return {
//         data: null,
//         error: this.createError(
//           ERROR_CODES.UNKNOWN_ERROR,
//           error instanceof Error ? error.message : 'Failed to fetch filtered recipes',
//           error instanceof Error ? error : undefined,
//           context
//         ),
//         ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
//       };
//     }
//   }

//   /**
//    * Fetch taxonomy facets used by the filter UI (cuisine, diet, mealType, method, protein).
//    */
//   async getFacets(
//     { fetchPolicy = 'cache-first', timeout = this.defaultTimeout, retries = this.maxRetries, includeMetadata = false }: FetchRecipeOptions = {}
//   ): Promise<RecipeServiceResult<GetFacetsData>> {
//     const context = { operation: 'getFacets' };

//     try {
//       const op = async (): Promise<ApolloQueryResult<GetFacetsData>> => {
//         return apolloClient.query<GetFacetsData>({
//           query: GET_RECIPE_FACETS,
//           fetchPolicy,
//           errorPolicy: 'all',
//           ...(timeout && { context: { timeout, fetchOptions: { timeout } } }),
//         });
//       };

//       const { data, error: apolloError } = await this.withRetry(op, retries, context);

//       if (apolloError) {
//         return {
//           data: null,
//           error: this.mapGraphQLErrors([apolloError], context),
//           ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
//         };
//       }

//       return {
//         data,
//         error: null,
//         ...(includeMetadata && {
//           metadata: this.createMetadata(fetchPolicy as any, fetchPolicy.includes('cache')),
//         }),
//       };
//     } catch (error) {
//       console.error('Error in getFacets:', error, context);
//       if (error instanceof ApolloError) {
//         return {
//           data: null,
//           error: this.mapGraphQLErrors([error], context),
//           ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
//         };
//       }
//       return {
//         data: null,
//         error: this.createError(
//           ERROR_CODES.UNKNOWN_ERROR,
//           error instanceof Error ? error.message : 'Failed to fetch facets',
//           error instanceof Error ? error : undefined,
//           context
//         ),
//         ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
//       };
//     }
//   }


//   /**
//    * Prefetches a recipe by slug for better UX (fire-and-forget)
//    */
//   async prefetchRecipe(slug: unknown): Promise<void> {
//     try {
//       const validatedSlug = this.validateRecipeSlug(slug);
      
//       await apolloClient.query({
//         query: GET_RECIPE_BY_SLUG,
//         variables: { slug: validatedSlug },
//         fetchPolicy: 'cache-first',
//         errorPolicy: 'ignore', // Don't throw errors for prefetch
//       });
      
//       console.debug(`Recipe prefetched: ${validatedSlug}`);
//     } catch (error) {
//       // Silent fail for prefetch operations
//       console.warn('Failed to prefetch recipe:', error);
//     }
//   }

//   /**
//    * Prefetches multiple recipes by slugs
//    */
//   async prefetchRecipes(slugs: unknown[]): Promise<void> {
//     const validSlugs = slugs
//       .map(slug => {
//         try {
//           return this.validateRecipeSlug(slug);
//         } catch {
//           return null;
//         }
//       })
//       .filter((slug): slug is string => slug !== null);

//     const prefetchPromises = validSlugs.map(slug => this.prefetchRecipe(slug));
    
//     // Wait for all prefetches but don't throw on individual failures
//     await Promise.allSettled(prefetchPromises);
    
//     console.debug(`Prefetched ${validSlugs.length} recipes`);
//   }

//   /**
//    * Clears the Apollo cache
//    */
//   async clearCache(): Promise<void> {
//     try {
//       await apolloClient.cache.reset();
//       console.debug('Cache cleared successfully');
//     } catch (error) {
//       console.error('Failed to clear cache:', error);
//       throw new Error('Failed to clear cache');
//     }
//   }

//   /**
//    * Evicts specific recipe from cache by slug
//    */
//   evictRecipe(slug: string): void {
//     try {
//       const id = apolloClient.cache.identify({ __typename: 'Recipe', slug }); // ✅ Robust
//       if (id) apolloClient.cache.evict({ id });
//       apolloClient.cache.evict({ fieldName: 'recipeBy', args: { slug } });
//       apolloClient.cache.gc();
//       if (process.env.NODE_ENV !== 'production') console.debug(`Evicted recipe "${slug}"`);
//     } catch (e) {
//       console.warn('Failed to evict recipe from cache', e);
//     }
//   }

//   /**
//    * Evicts recipe from cache and refetches it
//    */
//   async refetchRecipe(slug: string, options: FetchRecipeOptions = {}): Promise<RecipeServiceResult<Recipe>> {
//     this.evictRecipe(slug);
//     return this.fetchRecipe(slug, {
//       ...options,
//       fetchPolicy: 'network-only', // Force network fetch
//     });
//   }

//   /**
//    * Gets comprehensive cache statistics
//    */
//   getCacheStats(): CacheStats {
//     try {
//       const cacheData = apolloClient.cache.extract();
//       const keys = Object.keys(cacheData);
//       const recipeKeys = keys.filter(key => key.startsWith('Recipe:'));
      
//       return {
//         size: keys.length,
//         keys,
//         recipeCount: recipeKeys.length,
//         lastUpdated: Date.now(),
//       };
//     } catch (error) {
//       console.error('Failed to get cache stats:', error);
//       return {
//         size: 0,
//         keys: [],
//         recipeCount: 0,
//         lastUpdated: Date.now(),
//       };
//     }
//   }

//   /**
//    * Validates a slug format without throwing (useful for UI validation)
//    */
//   isValidSlug(slug: string): boolean {
//     try {
//       this.validateRecipeSlug(slug);
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   /**
//    * Generates a URL-safe slug from a title
//    */
//   generateSlug(title: string): string {
//     return title
//       .toLowerCase()
//       .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
//       .replace(/\s+/g, '-') // Replace spaces with hyphens
//       .replace(/-+/g, '-') // Remove duplicate hyphens
//       .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
//       .substring(0, 60); // Limit length
//   }

//   /**
//    * Health check for the service
//    */
//   async healthCheck(): Promise<{ healthy: boolean; details: Record<string, unknown> }> {
//     const details: Record<string, unknown> = {};
    
//     try {
//       // Check Apollo client
//       details.apolloClient = !!apolloClient;
      
//       // Check cache
//       const cacheStats = this.getCacheStats();
//       details.cache = {
//         accessible: true,
//         size: cacheStats.size,
//       };
      
//       // Try a simple query (could be a health check endpoint)
//       const startTime = Date.now();
//       try {
//         await apolloClient.query({
//           query: GET_RECIPES_LIST,
//           variables: { first: 1 },
//           fetchPolicy: 'network-only',
//           errorPolicy: 'all',
//         });
//         details.network = {
//           accessible: true,
//           responseTime: Date.now() - startTime,
//         };
//       } catch (error) {
//         details.network = {
//           accessible: false,
//           error: error instanceof Error ? error.message : 'Unknown error',
//         };
//       }
      
//       const isHealthy = details.apolloClient && details.cache.accessible;
      
//       return {
//         healthy: isHealthy,
//         details,
//       };
//     } catch (error) {
//       return {
//         healthy: false,
//         details: {
//           error: error instanceof Error ? error.message : 'Health check failed',
//         },
//       };
//     }
//   }
// }

// // Export singleton instance
// export const recipeService = new RecipeService();

// // Export class for testing purposes
// export { RecipeService };






import { ApolloError, WatchQueryOptions, ApolloQueryResult, gql } from '@apollo/client';
import { apolloClient } from './apollo-client';
import { 
  GET_FILTERED_RECIPES,
  GET_RECIPE_BY_SLUG, 
  GET_RECIPE_FACETS, 
  GET_RECIPES_LIST, 
  GetRecipeBySlugData, 
  GetRecipeBySlugVariables,
  GetFilteredRecipesData,
  GetFilteredRecipesVars,
  GetRecipesData,
  RecipeFilterInput,
  GetFacetsData
} from '@/lib/graphql-queries';
import { Recipe, RecipeSchema, RecipeServiceError, ErrorCode } from '@/utils/recipe';
import { CONFIG, ERROR_CODES } from '@/utils/constants';

export interface FetchRecipeOptions {
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache';
  timeout?: number;
  retries?: number;
  includeMetadata?: boolean;
}

export interface FetchRecipesListOptions extends FetchRecipeOptions {
  page?: number;
  perPage?: number;
}

export interface RecipeServiceResult<T> {
  data: T | null;
  error: RecipeServiceError | null;
  metadata?: {
    cached: boolean;
    timestamp: number;
    source: 'cache' | 'network' | 'cache-and-network';
  };
}

export interface CacheStats {
  size: number;
  keys: string[];
  recipeCount: number;
  lastUpdated: number;
}

export interface GetFilteredRecipesOptions extends FetchRecipeOptions {
  page?: number;
  search? : string | null ;
  perPage?: number;
  filters?: RecipeFilterInput | null;
}

class RecipeService {
  private readonly defaultTimeout = CONFIG?.REQUEST_TIMEOUT ?? 10000;
  private readonly maxRetries = CONFIG?.RETRY_ATTEMPTS ?? 3;
  private readonly retryDelay = CONFIG?.RETRY_DELAY ?? 1000;

  /**
   * Validates recipe data against the schema
   */
  private validateRecipeData(data: unknown): Recipe {
    try {
      return RecipeSchema.parse(data);
    } catch (error) {
      const validationMessage = error instanceof Error 
        ?  error.message
        : 'Unknown validation error';
      
      throw new Error(`Recipe validation failed: ${validationMessage}`);
    }
  }

  /**
   * Creates a standardized error object
   */
  private createError(
    code: ErrorCode, 
    message: string, 
    originalError?: Error,
    context?: Record<string, unknown>
  ): RecipeServiceError {
    return {
      code,
      message,
      originalError,
      timestamp: Date.now(),
      context,
    };
  }

  /**
   * Handles Apollo errors with specific error mapping
   */
  private mapGraphQLErrors(errors: readonly any[] | undefined, context?: Record<string, unknown>): RecipeServiceError | null {
    if (!errors || errors.length === 0) return null;
    const combined = errors.map((e) => e?.message).filter(Boolean).join(', ');
    const hasValidation = errors.some((e) => e?.extensions?.code === 'VALIDATION_ERROR');
    if (hasValidation) {
      return this.createError(ERROR_CODES.VALIDATION_ERROR, `Validation error: ${combined}`, undefined, context);
    }
    return this.createError(ERROR_CODES.GRAPHQL_ERROR, `GraphQL error: ${combined}`, undefined, context);
  }

  /**
   * Implements retry logic with exponential backoff
   */
  private async withRetry<T>(
      operation: () => Promise<T>,
      maxRetries: number = this.maxRetries,
      context?: Record<string, unknown>
    ): Promise<T> {
      let lastError: any;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (err) {
          lastError = err;
          // Non-retryable?
          if (err instanceof ApolloError) {
            const nonRetryable = err.graphQLErrors?.some((e) =>
              ['VALIDATION_ERROR', 'NOT_FOUND'].includes(String(e?.extensions?.code))
            );
            if (nonRetryable || attempt === maxRetries) throw err;
          }
          if (attempt < maxRetries) {
            const delay = this.retryDelay * Math.pow(2, attempt);
            console.warn(`Retrying (${attempt + 1}/${maxRetries + 1}) in ${delay}ms`, { context, error: String(lastError) });
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
      throw lastError;
    }

  /**
   * Sanitizes and validates input slug
   */
  private validateRecipeSlug(slug: unknown): string {
    if (!slug || typeof slug !== 'string') {
      throw new Error('Recipe slug must be a non-empty string');
    }

    const trimmedSlug = slug.trim();
    if (trimmedSlug === '') {
      throw new Error('Recipe slug cannot be empty');
    }

    // Validate slug format (lowercase letters, numbers, and hyphens only)
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(trimmedSlug)) {
      throw new Error('Recipe slug must contain only lowercase letters, numbers, and hyphens');
    }

    // Length validation
    if (trimmedSlug.length < 3) {
      throw new Error('Recipe slug must be at least 3 characters long');
    }

    if (trimmedSlug.length > 100) {
      throw new Error('Recipe slug is too long (max 100 characters)');
    }

    return trimmedSlug;
  }

  /**
   * Creates metadata for the response
   */
  private createMetadata(
    source: 'cache' | 'network' | 'cache-and-network',
    cached: boolean = false
  ) {
    return {
      cached,
      timestamp: Date.now(),
      source,
    };
  }

  /**
   * Fetches a single recipe by slug with comprehensive error handling and retry logic
   */
  async fetchRecipe(
      slug: unknown,
      options: FetchRecipeOptions = {}
    ): Promise<RecipeServiceResult<Recipe>> {
      const context = { operation: 'fetchRecipe', slug };
      const start = Date.now();
      try {
        const validatedSlug = this.validateRecipeSlug(slug);

        const {
          fetchPolicy = 'cache-first',
          timeout = this.defaultTimeout,
          retries = this.maxRetries,
          includeMetadata = false,
        } = options;

        const queryOptions: WatchQueryOptions<GetRecipeBySlugVariables> = {
          query: GET_RECIPE_BY_SLUG,
          variables: { slug: validatedSlug },
          fetchPolicy,
          errorPolicy: 'all',
          ...(timeout && { context: { timeout, fetchOptions: { timeout } } }),
        };

        const operation = async () =>
          await apolloClient.query<GetRecipeBySlugData, GetRecipeBySlugVariables>(queryOptions);

        const result: ApolloQueryResult<GetRecipeBySlugData> = await this.withRetry(operation, retries, context);

        // Handle GraphQL errors when errorPolicy: 'all'
        const gqlErr = this.mapGraphQLErrors(result.errors, context);
        if (gqlErr) {
          return {
            data: null,
            error: gqlErr,
            ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
          };
        }

        if (!result.data?.recipeBy) {
          return {
            data: null,
            error: this.createError(
              ERROR_CODES.NOT_FOUND,
              `Recipe with slug "${validatedSlug}" not found`,
              undefined,
              { ...context, slug: validatedSlug }
            ),
            ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
          };
        }

        const validatedRecipe = this.validateRecipeData(result.data.recipeBy);
        const ms = Date.now() - start;
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`Recipe fetched in ${ms}ms`, { slug: validatedSlug, fetchPolicy });
        }

        return {
          data: validatedRecipe,
          error: null,
          ...(includeMetadata && {
            metadata: this.createMetadata(fetchPolicy as any, fetchPolicy.startsWith('cache')),
          }),
        };
      } catch (err) {
        if (err instanceof ApolloError) {
          return {
            data: null,
            error: this.mapGraphQLErrors([err], context),
            ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
          };
        }
        return {
          data: null,
          error: this.createError(
            ERROR_CODES.UNKNOWN_ERROR,
            err instanceof Error ? err.message : 'Failed to fetch recipe',
            err instanceof Error ? err : undefined,
            context
          ),
          ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
        };
      }
    }

  /**
   * Fetches a paginated list of recipes (simple list without filters)
   */
  async fetchRecipesList(
    options: FetchRecipesListOptions = {}
  ): Promise<RecipeServiceResult<GetRecipesData>> {
    const context = { operation: 'fetchRecipesList' };
    
    try {
      const {
        page = 1,
        perPage = 12,
        fetchPolicy = 'cache-first',
        retries = this.maxRetries,
        includeMetadata = false
      } = options;

      // Validate pagination parameters
      if (page < 1) {
        return {
          data: null,
          error: this.createError(
            ERROR_CODES.VALIDATION_ERROR, 
            'Page parameter must be greater than 0',
            undefined,
            context
          ),
        };
      }

      if (perPage < 1 || perPage > 100) {
        return {
          data: null,
          error: this.createError(
            ERROR_CODES.VALIDATION_ERROR, 
            'perPage parameter must be between 1 and 100',
            undefined,
            context
          ),
        };
      }

      const operation = async () => {
        return await apolloClient.query<GetRecipesData>({
          query: GET_RECIPES_LIST,
          variables: { page, perPage },
          fetchPolicy,
          errorPolicy: 'all',
        });
      };

      const result = await this.withRetry(
        operation,
        retries,
        { ...context, page, perPage }
      );

      const gqlErr = this.mapGraphQLErrors(result.errors, context);
      if (gqlErr) {
        return {
          data: null,
          error: gqlErr,
          ...(includeMetadata && { 
            metadata: this.createMetadata('network', false) 
          }),
        };
      }

      return {
        data: result.data,
        error: null,
        ...(includeMetadata && { 
          metadata: this.createMetadata(fetchPolicy as any, fetchPolicy.includes('cache')) 
        }),
      };

    } catch (error) {
      console.error('Error in fetchRecipesList:', error, context);
      
      if (error instanceof ApolloError) {
        return {
          data: null,
          error: this.mapGraphQLErrors([error], context),
          ...(options.includeMetadata && { 
            metadata: this.createMetadata('network', false) 
          }),
        };
      }
      
      return {
        data: null,
        error: this.createError(
          ERROR_CODES.UNKNOWN_ERROR,
          error instanceof Error ? error.message : 'Failed to fetch recipes list',
          error instanceof Error ? error : undefined,
          context
        ),
        ...(options.includeMetadata && { 
          metadata: this.createMetadata('network', false) 
        }),
      };
    }
  }

  /**
   * Fetch paginated, filtered recipes with facets (for the All Recipes page).
   */
  async getFilteredRecipes(
    options: GetFilteredRecipesOptions = {}
  ): Promise<RecipeServiceResult<GetFilteredRecipesData>> {
    const {
      page = 1,
      perPage = 12,
      filters = null,
      fetchPolicy = 'cache-first',
      timeout = this.defaultTimeout,
      retries = this.maxRetries,
      includeMetadata = false,
    } = options;

    const context = { operation: 'getFilteredRecipes', page, perPage, filters };

    try {
      // Validate pagination parameters
      if (page < 1) {
        return {
          data: null,
          error: this.createError(
            ERROR_CODES.VALIDATION_ERROR,
            'Page parameter must be greater than 0',
            undefined,
            context
          ),
        };
      }

      if (perPage < 1 || perPage > 100) {
        return {
          data: null,
          error: this.createError(
            ERROR_CODES.VALIDATION_ERROR,
            'perPage parameter must be between 1 and 100',
            undefined,
            context
          ),
        };
      }

      const op = async (): Promise<ApolloQueryResult<GetFilteredRecipesData>> => {
        return apolloClient.query<GetFilteredRecipesData, GetFilteredRecipesVars>({
          query: GET_FILTERED_RECIPES,
          variables: { filters, page, perPage },
          fetchPolicy,
          errorPolicy: 'all',
          ...(timeout && {
            context: { timeout, fetchOptions: { timeout } },
          }),
        });
      };

      const result = await this.withRetry(op, retries, context);

      const gqlErr = this.mapGraphQLErrors(result.errors, context);
      if (gqlErr) {
        return {
          data: null,
          error: gqlErr,
          ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
        };
      }

      return {
        data: result.data,
        error: null,
        ...(includeMetadata && {
          metadata: this.createMetadata(fetchPolicy as any, fetchPolicy.includes('cache')),
        }),
      };
    } catch (error) {
      console.error('Error in getFilteredRecipes:', error, context);
      if (error instanceof ApolloError) {
        return {
          data: null,
          error: this.mapGraphQLErrors([error], context),
          ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
        };
      }
      return {
        data: null,
        error: this.createError(
          ERROR_CODES.UNKNOWN_ERROR,
          error instanceof Error ? error.message : 'Failed to fetch filtered recipes',
          error instanceof Error ? error : undefined,
          context
        ),
        ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
      };
    }
  }

   /**
   * Fetch paginated, filtered recipes with facets using watchQuery for cache-and-network support.
   * This method can return both cached and network results.
   */
  async watchFilteredRecipes(
    options: GetFilteredRecipesOptions = {}
  ): Promise<RecipeServiceResult<GetFilteredRecipesData>> {
    const {
      page = 1,
      perPage = 12,
      filters = null,
      fetchPolicy = 'cache-and-network',
      timeout = this.defaultTimeout,
      retries = this.maxRetries,
      includeMetadata = false,
    } = options;

    const context = { operation: 'watchFilteredRecipes', page, perPage, filters };

    try {
      // Validate pagination parameters
      if (page < 1) {
        return {
          data: null,
          error: this.createError(
            ERROR_CODES.VALIDATION_ERROR,
            'Page parameter must be greater than 0',
            undefined,
            context
          ),
        };
      }

      if (perPage < 1 || perPage > 100) {
        return {
          data: null,
          error: this.createError(
            ERROR_CODES.VALIDATION_ERROR,
            'perPage parameter must be between 1 and 100',
            undefined,
            context
          ),
        };
      }

      const op = async (): Promise<ApolloQueryResult<GetFilteredRecipesData>> => {
        const observable = apolloClient.watchQuery<GetFilteredRecipesData, GetFilteredRecipesVars>({
          query: GET_FILTERED_RECIPES,
          variables: { filters, page, perPage },
          fetchPolicy,
          errorPolicy: 'all',
          ...(timeout && {
            context: { timeout, fetchOptions: { timeout } },
          }),
        });

        // Get the current result
        return observable.result();
      };

      const result = await this.withRetry(op, retries, context);

      const gqlErr = this.mapGraphQLErrors(result.errors, context);
      if (gqlErr) {
        return {
          data: null,
          error: gqlErr,
          ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
        };
      }

      return {
        data: result.data,
        error: null,
        ...(includeMetadata && {
          metadata: this.createMetadata(fetchPolicy as any, fetchPolicy.includes('cache')),
        }),
      };
    } catch (error) {
      console.error('Error in watchFilteredRecipes:', error, context);
      if (error instanceof ApolloError) {
        return {
          data: null,
          error: this.mapGraphQLErrors([error], context),
          ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
        };
      }
      return {
        data: null,
        error: this.createError(
          ERROR_CODES.UNKNOWN_ERROR,
          error instanceof Error ? error.message : 'Failed to watch filtered recipes',
          error instanceof Error ? error : undefined,
          context
        ),
        ...(options.includeMetadata && { metadata: this.createMetadata('network', false) }),
      };
    }
  }
   

  /**
   * Fetch taxonomy facets used by the filter UI (cuisine, diet, mealType, method, protein).
   */
  async getFacets(
    { fetchPolicy = 'cache-first', timeout = this.defaultTimeout, retries = this.maxRetries, includeMetadata = false }: FetchRecipeOptions = {}
  ): Promise<RecipeServiceResult<GetFacetsData>> {
    const context = { operation: 'getFacets' };

    try {
      const op = async (): Promise<ApolloQueryResult<GetFacetsData>> => {
        return apolloClient.query<GetFacetsData>({
          query: GET_RECIPE_FACETS,
          fetchPolicy,
          errorPolicy: 'all',
          ...(timeout && { context: { timeout, fetchOptions: { timeout } } }),
        });
      };

      const result = await this.withRetry(op, retries, context);

      const gqlErr = this.mapGraphQLErrors(result.errors, context);
      if (gqlErr) {
        return {
          data: null,
          error: gqlErr,
          ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
        };
      }

      return {
        data: result.data,
        error: null,
        ...(includeMetadata && {
          metadata: this.createMetadata(fetchPolicy as any, fetchPolicy.includes('cache')),
        }),
      };
    } catch (error) {
      console.error('Error in getFacets:', error, context);
      if (error instanceof ApolloError) {
        return {
          data: null,
          error: this.mapGraphQLErrors([error], context),
          ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
        };
      }
      return {
        data: null,
        error: this.createError(
          ERROR_CODES.UNKNOWN_ERROR,
          error instanceof Error ? error.message : 'Failed to fetch facets',
          error instanceof Error ? error : undefined,
          context
        ),
        ...(includeMetadata && { metadata: this.createMetadata('network', false) }),
      };
    }
  }

  /**
   * Prefetches a recipe by slug for better UX (fire-and-forget)
   */
  async prefetchRecipe(slug: unknown): Promise<void> {
    try {
      const validatedSlug = this.validateRecipeSlug(slug);
      
      await apolloClient.query({
        query: GET_RECIPE_BY_SLUG,
        variables: { slug: validatedSlug },
        fetchPolicy: 'cache-first',
        errorPolicy: 'ignore', // Don't throw errors for prefetch
      });
      
      console.debug(`Recipe prefetched: ${validatedSlug}`);
    } catch (error) {
      // Silent fail for prefetch operations
      console.warn('Failed to prefetch recipe:', error);
    }
  }

  /**
   * Prefetches multiple recipes by slugs
   */
  async prefetchRecipes(slugs: unknown[]): Promise<void> {
    const validSlugs = slugs
      .map(slug => {
        try {
          return this.validateRecipeSlug(slug);
        } catch {
          return null;
        }
      })
      .filter((slug): slug is string => slug !== null);

    const prefetchPromises = validSlugs.map(slug => this.prefetchRecipe(slug));
    
    // Wait for all prefetches but don't throw on individual failures
    await Promise.allSettled(prefetchPromises);
    
    console.debug(`Prefetched ${validSlugs.length} recipes`);
  }

  /**
   * Clears the Apollo cache
   */
  async clearCache(): Promise<void> {
    try {
      await apolloClient.cache.reset();
      console.debug('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw new Error('Failed to clear cache');
    }
  }

  /**
   * Evicts specific recipe from cache by slug
   */
  evictRecipe(slug: string): void {
    try {
      const id = apolloClient.cache.identify({ __typename: 'Recipe', slug });
      if (id) apolloClient.cache.evict({ id });
      apolloClient.cache.evict({ fieldName: 'recipeBy', args: { slug } });
      apolloClient.cache.gc();
      if (process.env.NODE_ENV !== 'production') console.debug(`Evicted recipe "${slug}"`);
    } catch (e) {
      console.warn('Failed to evict recipe from cache', e);
    }
  }

  /**
   * Evicts recipe from cache and refetches it
   */
  async refetchRecipe(slug: string, options: FetchRecipeOptions = {}): Promise<RecipeServiceResult<Recipe>> {
    this.evictRecipe(slug);
    return this.fetchRecipe(slug, {
      ...options,
      fetchPolicy: 'network-only', // Force network fetch
    });
  }

  /**
   * Gets comprehensive cache statistics
   */
  getCacheStats(): CacheStats {
    try {
      const cacheData = apolloClient.cache.extract();
      const keys = Object.keys(cacheData);
      const recipeKeys = keys.filter(key => key.startsWith('Recipe:'));
      
      return {
        size: keys.length,
        keys,
        recipeCount: recipeKeys.length,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        size: 0,
        keys: [],
        recipeCount: 0,
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Validates a slug format without throwing (useful for UI validation)
   */
  isValidSlug(slug: string): boolean {
    try {
      this.validateRecipeSlug(slug);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates a URL-safe slug from a title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 60); // Limit length
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ healthy: boolean; details: Record<string, unknown> }> {
    const details: Record<string, unknown> = {};
    
    try {
      // Check Apollo client
      details.apolloClient = !!apolloClient;
      
      // Check cache
      const cacheStats = this.getCacheStats();
      details.cache = {
        accessible: true,
        size: cacheStats.size,
      };
      
      // Try a simple query (could be a health check endpoint)
      const startTime = Date.now();
      try {
        await apolloClient.query({
          query: GET_RECIPES_LIST,
          variables: { page: 1, perPage: 1 },
          fetchPolicy: 'network-only',
          errorPolicy: 'all',
        });
        details.network = {
          accessible: true,
          responseTime: Date.now() - startTime,
        };
      } catch (error) {
        details.network = {
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
      
      const isHealthy = details.apolloClient && details.cache.accessible;
      
      return {
        healthy: isHealthy,
        details,
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Health check failed',
        },
      };
    }
  }
}

// Export singleton instance
export const recipeService = new RecipeService();

// Export class for testing purposes
export { RecipeService };
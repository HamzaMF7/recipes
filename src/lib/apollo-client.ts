import { CONFIG } from '@/utils/constants';
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

// Custom error link with structured logging
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        {
          operation: operation.operationName,
          variables: operation.variables,
        }
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]:`, networkError, {
      operation: operation.operationName,
    });
  }
});

// Retry link with exponential backoff
const retryLink = new RetryLink({
  delay: {
    initial: CONFIG.RETRY_DELAY,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: CONFIG.RETRY_ATTEMPTS,
    retryIf: (error, _operation) => !!error,
  },
});

// HTTP link with timeout
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL || 'http://localhost/wordpress/graphql',
  fetchOptions: {
    timeout: CONFIG.REQUEST_TIMEOUT,
  },
});

// Auth link for adding headers
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Add auth headers if needed
      // authorization: token ? `Bearer ${token}` : "",
    }
  };
});

// Enhanced cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Recipe: {
      fields: {
        recipeData: {
          merge: true, // Deep merge recipe data
        },
      },
    },
    Query: {
      fields: {
        recipes: {
          keyArgs: ['where'],
          merge(existing = { nodes: [], pageInfo: {} }, incoming) {
            return {
              ...incoming,
              nodes: [...(existing.nodes || []), ...(incoming.nodes || [])],
            };
          },
        },
      },
    },
  },
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, retryLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});

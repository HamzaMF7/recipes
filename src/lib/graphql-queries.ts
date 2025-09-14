import { Recipe } from '@/utils/recipe';
import { gql, TypedDocumentNode } from '@apollo/client';

// Query result types
export interface GetRecipeBySlugData {
  recipeBy: Recipe | null;
}

export interface GetRecipeBySlugVariables {
  slug: string;
}

export interface GetRecipesListData {
  recipes: {
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
      endCursor: string;
    };
    nodes: Array<Pick<Recipe, 'id' | 'title' | 'slug' | 'uri' | 'featuredImage'> & {
      recipeData: Pick<Recipe['recipeData'], 'name' | 'rating' | 'totalTime' | 'difficulty' | 'servings' | 'cuisine'>;
    }>;
  };
}

export interface GetRecipesListVariables {
  first?: number;
  after?: string;
}


// Type-safe query definitions
export const GET_RECIPE_BY_SLUG: TypedDocumentNode<GetRecipeBySlugData, GetRecipeBySlugVariables> = gql`
  query GetRecipeBySlug($slug: String!) {
    recipeBy(slug: $slug) {
    id
    content
    recipeData {
      name
      author
      cookTime
      cost
      cuisine
      datePublished
      dietary
      difficulty
      equipment {
        link
        name
      }
      ingredients {
        amount
        name
        notes
        unit
      }
      keywords
      method
      name
      notes
      nutrition {
        calcium
        calories
        carbohydrates
        cholesterol
        fat
        fiber
        iron
        potassium
        protein
        saturatedFat
        sodium
        sugar
        vitaminA
        vitaminC
        transFat
        vitaminD
        vitaminE
      }
      prepTime
      protein
      rating
      servings
      servingsUnit
      source
      summary
      tips
      totalTime
      variations
      instructions {
        image
        instruction
        video
      }
      restTime
      title
      mealTypes
    }
    slug
    status
    uri
    title
    featuredImage {
      node {
        altText
        title
        sourceUrl
      }
    }
  }
  }
`;

export const GET_RECIPES_LIST: TypedDocumentNode<GetRecipesListData, GetRecipesListVariables> = gql`
  query GetRecipesList($first: Int, $after: String) {
    recipes(first: $first, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        title
        slug
        uri
        featuredImage {
          node {
            altText
            sourceUrl
          }
        }
        recipeData {
          name
          rating
          totalTime
          difficulty
          servings
          cuisine
        }
      }
    }
  }
`;


/**
 * Filtered, paginated recipe list.
 * Adjust the input and "where" shape to your schema if needed.
 */
export const GET_FILTERED_RECIPES = gql`
  query GetFilteredRecipes(
    $first: Int! = 20
    $after: String
    $filters: RecipeFiltersInput
    $search: String
  ) {
    recipes(where: $filters, first: $first, after: $after, search: $search) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          slug
          uri
          title
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          recipeData {
            summary
            dietary
            cuisine
            method
            difficulty
            mealTypes
            totalTime
            rating
            servings
            servingsUnit
          }
        }
      }
    }
  }
`;

/**
 * Example server-side facets (optional).
 * If your API supports facet endpoints, add them to power dynamic picklists.
 * For now, we populate picklists statically in the page to keep things simple.
 */
export const GET_RECIPE_FACETS = gql`
  query GetRecipeFacets {
    cuisines {
      nodes { name slug }
    }
    dietaries {
      nodes { name slug }
    }
    mealTypes {
      nodes { name slug }
    }
    methods {
      nodes { name slug }
    }
    proteins {
      nodes { name slug }
    }
  }
`;

import { Recipe } from '@/utils/recipe';
import { gql, TypedDocumentNode } from '@apollo/client';

// Query result types
export interface GetRecipeBySlugData {
  recipeBy: Recipe | null;
}

export interface GetRecipeBySlugVariables {
  slug: string;
}

export interface RecipeCardNode {
  id: string;
  title: string;
  slug: string ;
  totalTime?: number | null;
  difficulty?: string | null; // e.g. "easy" | "medium" | "hard"
  dietary?: string[] | null;
  summary?: string | null;
  featuredImageId?: number | null; // GraphQL Int -> TS number
  featuredImageUrl?: string | null;
}

export interface FacetBucket<T = string | number> {
  value: T; // keep as string | number depending on facet
  label: string;
  count: number;
}

export interface RecipeFacets {
  totalTimePresets: FacetBucket<number>[];
  ratingRanges: FacetBucket<number>[];
  difficulty: FacetBucket<string>[];
  season: FacetBucket<string>[];
  diet: FacetBucket<string>[];
  cuisine: FacetBucket<string>[];
  method: FacetBucket<string>[];
  mealTypes: FacetBucket<string>[];
}

export interface RecipesConnection {
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  nodes: RecipeCardNode[];
}

export interface GetFilteredRecipesData {
  filteredRecipes: RecipesConnection & {
    facets: RecipeFacets;
  };
}

export interface GetRecipesData {
  filteredRecipes: RecipesConnection;
}

// Variables for filtered recipes query
export interface RecipeFilterInput {
  search?: string | null;
  totalTimeLte?: number | null;
  ratingGte?: number | null;
  difficulty?: string | null; // "easy" | "medium" | "hard" | etc.
  diet?: string[] | null;
  cuisine?: string[] | null;
  method?: string[] | null;
  mealTypes?: string[] | null;
  season?: string | null;
  // add any other fields you exposed on the server
}

export interface GetFilteredRecipesVars {
  filters?: RecipeFilterInput | null;
  page?: number;
  perPage?: number;
}

// Facets data structure for the getFacets query
export interface GetFacetsData {
  cuisines: { nodes: Array<{ name: string; slug: string }> };
  dietaries: { nodes: Array<{ name: string; slug: string }> };
  mealTypes: { nodes: Array<{ name: string; slug: string }> };
  methods: { nodes: Array<{ name: string; slug: string }> };
  proteins: { nodes: Array<{ name: string; slug: string }> };
}

// Type-safe query definitions
export const GET_RECIPE_BY_SLUG: TypedDocumentNode<
  GetRecipeBySlugData,
  GetRecipeBySlugVariables
> = gql`
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

// Query: GET_RECIPES_LIST
// Simple list of recipes, no filters, no facets
export const GET_RECIPES_LIST = gql`
  query GetRecipesList($page: Int = 1, $perPage: Int = 12) {
    filteredRecipes(page: $page, perPage: $perPage) {
      total
      page
      perPage
      hasMore
      nodes {
        id
        title
        slug
        summary
        totalTime
        difficulty
        dietary
        featuredImageId
        featuredImageUrl
      }
    }
  }
`;

// Query: GET_FILTERED_RECIPES
// Filtered, paginated recipe list with facets
export const GET_FILTERED_RECIPES = gql`
  query Recipes(
    $filters: RecipeFilterInput
    $page: Int = 1
    $perPage: Int = 12
  ) {
    filteredRecipes(filters: $filters, page: $page, perPage: $perPage) {
      total
      page
      perPage
      hasMore
      nodes {
        id
        title
        slug
        totalTime
        difficulty
        dietary
        summary
        featuredImageId
        featuredImageUrl
      }
      facets {
        totalTimePresets {
          value
          label
          count
        }
        ratingRanges {
          value
          label
          count
        }
        difficulty {
          value
          label
          count
        }
        season {
          value
          label
          count
        }
        diet {
          value
          label
          count
        }
        cuisine {
          value
          label
          count
        }
        method {
          value
          label
          count
        }
        mealTypes {
          value
          label
          count
        }
      }
    }
  }
`;

// Query: GET_RECIPE_FACETS
// Server-side facets for populating filter dropdowns
export const GET_RECIPE_FACETS = gql`
  query GetRecipeFacets {
    cuisines {
      nodes {
        name
        slug
        count
      }
    }
    dietaries {
      nodes {
        name
        slug
      }
    }
    mealTypes {
      nodes {
        name
        slug
      }
    }
    methods {
      nodes {
        name
        slug
      }
    }
    proteins {
      nodes {
        name
        slug
      }
    }
  }
`;





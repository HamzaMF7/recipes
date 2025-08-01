import { Recipe } from '@/utils/recipe';
import { gql, TypedDocumentNode } from '@apollo/client';

// Query result types
export interface GetRecipeData {
  recipe: Recipe | null;
}

export interface GetRecipeVariables {
  id: string;
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
export const GET_RECIPE: TypedDocumentNode<GetRecipeData, GetRecipeVariables> = gql`
  query GetRecipeWithData($id: ID!) {
    recipe(id: $id, idType: DATABASE_ID) {
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
        type
        variations
        instructions {
          image
          instruction
          video
        }
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
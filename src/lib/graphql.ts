import { Recipe } from "@/utils/recipe";

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL || 'http://localhost/wordpress/graphql';

const GET_RECIPE_QUERY = `
  query GetRecipesWithData($id: ID!) {
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

export async function fetchRecipe(id: string): Promise<Recipe | null> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_RECIPE_QUERY,
        variables: { id },
      }),
    });

    const { data, errors } = await response.json();

    if (errors) {
      console.error('GraphQL errors:', errors);
      return null;
    }

    return data?.recipe || null;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}
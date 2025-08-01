


import { GetServerSideProps } from 'next';
import { Recipe, RecipeServiceError } from '@/utils/recipe';
import { fetchRecipe } from '../../lib/graphql';
import RecipeDetails from '@/components/ui/recipeDetails';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRecipe } from '@/hooks/useRecipe';
import { recipeService } from '@/lib/recipe-service';
import { useRouter } from 'next/router';



interface RecipeState {
  recipe: Recipe | null;
  loading: boolean;
  error: RecipeServiceError | null;
}



const RecipePage = () => {

  const {query } = useRouter();
  const recipeID = query?.slug[0] ;
  
  const [state , setState ] = useState<RecipeState>({
    recipe : null , 
    loading : false , 
    error : null ,
  }) 


  const getRecipeData = async () => {
    setState((prev) : RecipeState =>( {...prev , loading: true } )) ;
    const {recipe , error} = await recipeService.fetchRecipe(recipeID) ; 
    if(error) {
      console.log(error) ; 
    }
    else {
      setState((prev) : RecipeState => ({...prev , recipe: recipe , loading: false }))
    }
  }

  useEffect(()=> {
      getRecipeData();
  } , [recipeID])
  

  const recipe = state.recipe ; 

  console.log("recipe" , recipe) ;

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--dark)' }}>
            Recipe Not Found
          </h1>
          <p className="text-gray-600 text-lg">The recipe you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
           <Head>
        <title>{recipe.recipeData.name || recipe.title}</title>
        <meta name="description" content={recipe.recipeData.summary} />
        <meta property="og:title" content={recipe.recipeData.name || recipe.title} />
        <meta property="og:description" content={recipe.recipeData.summary} />
        {recipe.featuredImage?.node?.sourceUrl && (
          <meta property="og:image" content={recipe.featuredImage.node.sourceUrl} />
        )}
        <meta name="keywords" content={recipe.recipeData.keywords?.toString()} />
        <meta name="author" content={recipe.recipeData.author} />
        <meta property="article:published_time" content={recipe.recipeData.datePublished} />
        <link rel="canonical" href={`https://yoursite.com${recipe.uri}`} />
        
        {/* Recipe Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": recipe.recipeData.name || recipe.title,
              "description": recipe.recipeData.summary,
              "image": recipe.featuredImage?.node?.sourceUrl,
              "author": {
                "@type": "Person",
                "name": recipe.recipeData.author
              },
              "datePublished": recipe.recipeData.datePublished,
              "prepTime": `PT${recipe.recipeData.prepTime}M`,
              "cookTime": `PT${recipe.recipeData.cookTime}M`,
              "totalTime": `PT${recipe.recipeData.totalTime}M`,
              "recipeYield": recipe.recipeData.servings,
              "recipeCategory": Array.isArray(recipe.recipeData.type) ? recipe.recipeData.type.join(", ") : recipe.recipeData.type,
              "recipeCuisine": Array.isArray(recipe.recipeData.cuisine) ? recipe.recipeData.cuisine.join(", ") : recipe.recipeData.cuisine,
              "aggregateRating": recipe.recipeData.rating ? {
                "@type": "AggregateRating",
                "ratingValue": recipe.recipeData.rating,
                "ratingCount": "1"
              } : undefined,
              "nutrition": {
                "@type": "NutritionInformation",
                "calories": recipe.recipeData.nutrition.calories,
                "proteinContent": recipe.recipeData.nutrition.protein,
                "carbohydrateContent": recipe.recipeData.nutrition.carbohydrates,
                "fatContent": recipe.recipeData.nutrition.fat
              },
              "recipeIngredient": recipe.recipeData.ingredients.map(ing => `${ing.amount} ${ing.unit} ${ing.name}`),
              "recipeInstructions": recipe.recipeData.instructions.map((instruction, index) => ({
                "@type": "HowToStep",
                "name": `Step ${index + 1}`,
                "text": instruction.instruction,
                "image": instruction.image || undefined
              }))
            })
          }}
        />
      </Head>
      <RecipeDetails recipe={recipe} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const recipe = await fetchRecipe(id as string);

  return {
    props: {
      recipe,
    },
  };
};
export default RecipePage;



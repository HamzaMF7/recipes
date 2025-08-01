import React, { useState } from 'react';
import Image from 'next/image';
import { Recipe } from '@/utils/recipe';
import AdBanner from './adBanner';
import RecipeActions from './recipeActions';


interface RecipeDetailsProps {
  recipe: Recipe;
}

const RecipeDetails: React.FC<RecipeDetailsProps> = ({ recipe }) => {
  const { recipeData, featuredImage, title } = recipe;
  const [activeIngredient, setActiveIngredient] = useState<number | null>(null);

  const formatTime = (time: string | number) => {
    if (typeof time === 'number') {
      return `${time} min`;
    }
    return time.replace('PT', '').replace('M', ' min').replace('H', 'h ');
  };

  const formatArray = (value: string | string[]) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const renderRecipeTags = () => {
    const tags = [];
    
    if (recipeData.dietary) tags.push(...recipeData.dietary);
    if (recipeData.type) {
      const types = Array.isArray(recipeData.type) ? recipeData.type : [recipeData.type];
      tags.push(...types);
    }
    if (recipeData.method) {
      const methods = Array.isArray(recipeData.method) ? recipeData.method : [recipeData.method];
      tags.push(...methods);
    }
    if (recipeData.difficulty) tags.push(recipeData.difficulty);
    if (recipeData.cost) tags.push(recipeData.cost);

    return tags.slice(0, 6).map((tag, index) => (
      <span
        key={index}
        className="px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm"
        style={{ backgroundColor: index % 2 === 0 ? 'var(--primary3)' : 'var(--primary2)' }}
      >
        {tag}
      </span>
    ));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Top Banner Ad */}
      <div className="py-4">
        <AdBanner width={728} height={90} position="top" />
      </div>

      {/* Header */}
      <header className="relative h-96 overflow-hidden rounded-b-3xl shadow-2xl mx-4">
        {featuredImage?.node?.sourceUrl && (
          <Image
            src={featuredImage.node.sourceUrl}
            alt={featuredImage.node.altText || title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              {renderRecipeTags()}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: 'var(--light)' }}>
              {recipeData.name || title}
            </h1>
            <div className="flex flex-wrap gap-4 text-lg items-center mb-6">
              {recipeData.author && <span>By {recipeData.author}</span>}
              {recipeData.author && <span>•</span>}
              <span>{formatArray(recipeData.cuisine)}</span>
              {recipeData.rating && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {renderStars(recipeData.rating)}
                    <span className="ml-2">({recipeData.rating}/5)</span>
                  </div>
                </>
              )}
            </div>
            <RecipeActions recipeTitle={recipeData.name || title} recipeUrl={recipe.uri} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-l-4 transform transition-transform hover:scale-105" style={{ borderColor: 'var(--primary1)' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--dark)' }}>
              {formatTime(recipeData.prepTime)}
            </div>
            <div className="text-gray-600 font-medium">Prep Time</div>
            <div className="mt-2 text-2xl">⏱️</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-l-4 transform transition-transform hover:scale-105" style={{ borderColor: 'var(--primary2)' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--dark)' }}>
              {formatTime(recipeData.cookTime)}
            </div>
            <div className="text-gray-600 font-medium">Cook Time</div>
            <div className="mt-2 text-2xl">🔥</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-l-4 transform transition-transform hover:scale-105" style={{ borderColor: 'var(--primary3)' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--dark)' }}>
              {recipeData.servings}
            </div>
            <div className="text-gray-600 font-medium">{recipeData.servingsUnit}</div>
            <div className="mt-2 text-2xl">🍽️</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-l-4 transform transition-transform hover:scale-105" style={{ borderColor: 'var(--primary4)' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--dark)' }}>
              {recipeData.difficulty}
            </div>
            <div className="text-gray-600 font-medium">Difficulty</div>
            <div className="mt-2 text-2xl">📊</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Column - Ingredients & Equipment */}
          <div className="lg:col-span-2">
            {/* Summary */}
            {recipeData.summary && (
              <section className="mb-8">
                <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--dark)' }}>
                  About This Recipe
                </h2>
                <div className="bg-white rounded-2xl shadow-lg p-8 border-l-4" style={{ borderColor: 'var(--primary1)' }}>
                  <p className="text-gray-700 leading-relaxed text-lg">{recipeData.summary}</p>
                </div>
              </section>
            )}

            {/* Ingredients */}
            <section className="mb-8">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--dark)' }}>
                Ingredients
              </h2>
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <ul className="space-y-4">
                  {recipeData.ingredients.map((ingredient, index) => (
                    <li 
                      key={index} 
                      className={`flex justify-between items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        activeIngredient === index 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveIngredient(activeIngredient === index ? null : index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          activeIngredient === index 
                            ? 'border-green-400 bg-green-400' 
                            : 'border-gray-300'
                        }`}>
                          {activeIngredient === index && <span className="text-white text-sm">✓</span>}
                        </div>
                        <span className={`font-medium text-lg ${activeIngredient === index ? 'line-through text-gray-500' : ''}`} style={{ color: activeIngredient === index ? undefined : 'var(--dark)' }}>
                          {ingredient.name}
                        </span>
                      </div>
                      <span className="text-gray-600 font-medium">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Equipment */}
            {recipeData.equipment.length > 0 && (
              <section className="mb-8">
                <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--dark)' }}>
                  Equipment Needed
                </h2>
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="grid gap-4">
                    {recipeData.equipment.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl">🔧</span>
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline font-medium"
                            style={{ color: 'var(--primary1)' }}
                          >
                            {item.name}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--dark)' }} className="font-medium">{item.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Nutrition Info */}
            {recipeData.nutrition.calories && (
              <section className="mb-8">
                <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--dark)' }}>
                  Nutrition Facts
                </h2>
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="grid grid-cols-2 gap-6">
                    {recipeData.nutrition.calories && (
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold" style={{ color: 'var(--primary2)' }}>
                          {recipeData.nutrition.calories}
                        </div>
                        <div className="text-gray-600 font-medium">Calories</div>
                      </div>
                    )}
                    {recipeData.nutrition.protein && (
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold" style={{ color: 'var(--primary1)' }}>
                          {recipeData.nutrition.protein}g
                        </div>
                        <div className="text-gray-600 font-medium">Protein</div>
                      </div>
                    )}
                    {recipeData.nutrition.carbohydrates && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold" style={{ color: 'var(--primary4)' }}>
                          {recipeData.nutrition.carbohydrates}g
                        </div>
                        <div className="text-gray-600 font-medium">Carbs</div>
                      </div>
                    )}
                    {recipeData.nutrition.fat && (
                      <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold" style={{ color: 'var(--primary3)' }}>
                          {recipeData.nutrition.fat}g
                        </div>
                        <div className="text-gray-600 font-medium">Fat</div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Instructions & Sidebar */}
          <div className="lg:col-span-2">
            {/* Sidebar Ads */}
            <div className="lg:float-right lg:ml-8 mb-8 space-y-8">
              <AdBanner width={300} height={250} position="sidebar-square" />
              <AdBanner width={160} height={600} position="sidebar-skyscraper" className="hidden lg:block" />
            </div>

            <section>
              <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--dark)' }}>
                Step-by-Step Instructions
              </h2>
              <div className="space-y-8">
                {recipeData.instructions.map((step, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
                    <div className="flex gap-6">
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                        style={{ backgroundColor: 'var(--primary2)' }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 leading-relaxed text-lg mb-6">
                          {step.instruction}
                        </p>
                        {step.image && (
                          <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
                            <Image
                              src={step.image}
                              alt={`Step ${index + 1}`}
                              fill
                              className="object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tips */}
            {recipeData.tips && (
              <section className="mt-12">
                <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--dark)' }}>
                  Chef's Tips
                </h2>
                <div className="bg-white rounded-2xl shadow-lg p-8" style={{ borderLeft: '6px solid var(--primary1)' }}>
                  {typeof recipeData.tips === 'string' ? (
                    <div className="flex items-start gap-4">
                      <span className="text-3xl" style={{ color: 'var(--primary1)' }}>💡</span>
                      <p className="text-gray-700 text-lg leading-relaxed">{recipeData.tips}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {recipeData.tips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <span className="text-3xl" style={{ color: 'var(--primary1)' }}>💡</span>
                          <p className="text-gray-700 text-lg leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Variations */}
            {recipeData.variations && (
              <section className="mt-12">
                <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--dark)' }}>
                  Recipe Variations
                </h2>
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  {typeof recipeData.variations === 'string' ? (
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">🔄</span>
                      <p className="text-gray-700 text-lg leading-relaxed">{recipeData.variations}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {recipeData.variations.map((variation, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <span className="text-3xl">🔄</span>
                          <p className="text-gray-700 text-lg leading-relaxed">{variation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Keywords/Tags */}
        {recipeData.keywords && (
          <section className="mt-16">
            <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--dark)' }}>
              Recipe Tags
            </h2>
            <div className="flex flex-wrap gap-3">
              {typeof recipeData.keywords === 'string' ? (
                recipeData.keywords.split(',').map((keyword, index) => (
                  <span
                    key={index}
                    className="px-6 py-3 rounded-full text-sm font-medium text-white shadow-lg transform transition-transform hover:scale-105"
                    style={{ backgroundColor: 'var(--primary3)' }}
                  >
                    {keyword.trim()}
                  </span>
                ))
              ) : (
                recipeData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-6 py-3 rounded-full text-sm font-medium text-white shadow-lg transform transition-transform hover:scale-105"
                    style={{ backgroundColor: 'var(--primary3)' }}
                  >
                    {keyword}
                  </span>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Banner Ad */}
      <div className="py-8 mt-16" style={{ backgroundColor: 'var(--light)' }}>
        <AdBanner width={728} height={90} position="bottom" />
      </div>
    </div>
  );
};

export default RecipeDetails;

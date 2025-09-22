import React, { useMemo, useState, useCallback } from 'react';
import Image from 'next/image';

import { AdSlot } from '@/components/ads/adSlot';
import { Recipe, type Ingredient, type Instruction, type Equipment } from '@/utils/recipe';
import { formatDuration, formatList, formatScaledAmount } from '@/utils/recipeFormatting';

import RecipeActions from './recipeActions';

type AdControls = {
  /** Insert an in‑read ad after these step numbers (1-based). Example: [2, 5] */
  injectAfterSteps?: number[];
  /** Show right-rail ads on large screens */
  showSidebar?: boolean;
  /** Show bottom banner below the article */
  showBottom?: boolean;
};

interface RecipeDetailsProps {
  recipe: Recipe;
  ads?: AdControls;
}

/* -------------------------------- Component --------------------------------- */

export default function RecipeDetails({
  recipe,
  ads = { injectAfterSteps: [2], showSidebar: true, showBottom: true },
}: RecipeDetailsProps) {
  const { recipeData, featuredImage, title, uri } = recipe;

  const displayTitle = recipeData?.name || title || 'Recipe';
  const cuisines = formatList(recipeData?.cuisine);
  const hasHero = Boolean(featuredImage?.node?.sourceUrl);

  const tags = useMemo(() => {
    const t: string[] = [];
    if (Array.isArray(recipeData?.dietary)) t.push(...recipeData!.dietary);
    if (recipeData?.type) t.push(...(Array.isArray(recipeData.type) ? recipeData.type : [recipeData.type]));
    if (recipeData?.method) t.push(...(Array.isArray(recipeData.method) ? recipeData.method : [recipeData.method]));
    if (recipeData?.difficulty) t.push(recipeData.difficulty);
    if (recipeData?.cost) t.push(recipeData.cost);
    return t.filter(Boolean).slice(0, 6);
  }, [recipeData]);

  // Servings scaler
  const baseServings = Math.max(1, Number(recipeData?.servings) || 1);
  const [servings, setServings] = useState<number>(baseServings);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const scale = servings / baseServings;
  const rating = Math.max(0, Math.min(5, Number(recipeData?.rating || 0)));

  const ingredients = useMemo<Ingredient[]>(
    () => ((recipeData?.ingredients ?? []) as Ingredient[]),
    [recipeData?.ingredients]
  );

  const equipmentItems = useMemo<Equipment[]>(
    () => ((recipeData?.equipment ?? []) as Equipment[]),
    [recipeData?.equipment]
  );

  const instructions = useMemo<Instruction[]>(
    () => ((recipeData?.instructions ?? []) as Instruction[]),
    [recipeData?.instructions]
  );

  const toggleChecked = useCallback((idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  const incServings = () => setServings((s) => Math.min(24, s + 1));
  const decServings = () => setServings((s) => Math.max(1, s - 1));
  const resetServings = () => setServings(baseServings);

  // Build anchor links for quick navigation
  const anchors = [
    { id: 'about', label: 'About' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'equipment', label: 'Equipment', show: !!recipeData?.equipment?.length },
    { id: 'nutrition', label: 'Nutrition', show: !!recipeData?.nutrition?.calories },
    { id: 'steps', label: 'Steps' },
    { id: 'tips', label: 'Tips', show: !!recipeData?.tips },
    { id: 'variations', label: 'Variations', show: !!recipeData?.variations },
  ].filter((a) => a.show !== false);

  return (
    <article className="min-h-screen bg-[color:var(--background)]">
      {/* ============================= HERO ================================== */}
      <header className="relative h-80 md:h-96 overflow-hidden rounded-b-3xl shadow-2xl mx-auto max-w-6xl px-[var(--layout-margin)]" aria-label="Recipe header">
        {hasHero ? (
          <Image
            src={featuredImage!.node!.sourceUrl!}
            alt={featuredImage!.node!.altText || `${displayTitle} hero image`}
            fill
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out hover:scale-[1.03]"
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--primary4)] to-[color:var(--light)]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" aria-hidden />
        <div className="absolute bottom-0 left-0 right-0 pb-6 md:pb-8 text-white">
          <div className="max-w-6xl mx-auto px-[var(--layout-margin)]">
            {/* Tags */}
            {tags.length > 0 && (
              <ul className="flex flex-wrap gap-2 mb-3" aria-label="Recipe tags">
                {tags.map((tag, i) => (
                  <li key={`${tag}-${i}`}>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm"
                      style={{ backgroundColor: i % 2 === 0 ? 'var(--primary3)' : 'var(--primary2)' }}
                    >
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <h1 className="text-3xl md:text-5xl font-bold mb-3 text-[color:var(--light)]">{displayTitle}</h1>

            <div className="flex flex-wrap gap-3 items-center text-base md:text-lg">
              {recipeData?.author && <span>By {recipeData.author}</span>}
              {(recipeData?.author || cuisines) && <span aria-hidden>•</span>}
              {!!cuisines && <span>{cuisines}</span>}
              {rating > 0 && (
                <>
                  <span aria-hidden>•</span>
                  <div className="flex items-center gap-2">
                    <meter
                      min={0}
                      max={5}
                      value={rating}
                      className="h-2 w-24"
                      aria-label={`${rating} out of 5 stars`}
                    />
                    <span className="text-sm">({rating}/5)</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4">
              <RecipeActions recipeTitle={displayTitle} recipeUrl={uri} />
            </div>
          </div>
        </div>
      </header>

      {/* ============================ MAIN =================================== */}
      <main id="content" className="mx-auto max-w-6xl px-[var(--layout-margin)] py-10">
        {/* On-page quick nav (improves UX & internal linking for a11y) */}
        {anchors.length > 0 && (
          <nav aria-label="On this page" className="mb-6">
            <ul className="flex flex-wrap gap-2">
              {anchors.map((a) => (
                <li key={a.id}>
                  <a
                    href={`#${a.id}`}
                    className="px-3 py-2 rounded-full bg-white/90 text-[color:var(--dark)] border border-gray-200 text-sm motion-safe:transition hover:shadow"
                    aria-label={`Jump to ${a.label}`}
                  >
                    {a.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* QUICK INFO CARDS */}
        <section aria-label="Recipe quick info" className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          {[
            { label: 'Prep Time', value: formatDuration(recipeData?.prepTime), color: 'var(--primary1)', emoji: '⏱️' },
            { label: 'Cook Time', value: formatDuration(recipeData?.cookTime), color: 'var(--primary2)', emoji: '🔥' },
            { label: recipeData?.servingsUnit || 'Servings', value: recipeData?.servings ?? '—', color: 'var(--primary3)', emoji: '🍽️' },
            { label: 'Difficulty', value: recipeData?.difficulty || '—', color: 'var(--primary4)', emoji: '📊' },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl shadow-lg p-5 text-center border-l-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-[1.02]"
              style={{ borderColor: card.color }}
            >
              <div className="text-2xl md:text-3xl font-bold mb-1 text-[color:var(--dark)]">{card.value}</div>
              <div className="text-gray-700 font-medium">{card.label}</div>
              <div className="mt-1 text-xl" aria-hidden>{card.emoji}</div>
            </div>
          ))}
        </section>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* ===================== LEFT COLUMN ===================== */}
          <div className="lg:col-span-2">
            {/* ABOUT */}
            {!!recipeData?.summary && (
              <section className="mb-8" id="about" aria-labelledby="about-heading">
                <h2 id="about-heading" className="text-2xl md:text-3xl font-bold mb-4 text-[color:var(--dark)]">
                  About This Recipe
                </h2>
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4" style={{ borderColor: 'var(--primary1)' }}>
                  <p className="text-gray-800 leading-relaxed text-base md:text-lg">{recipeData.summary}</p>
                </div>
              </section>
            )}

            {/* INGREDIENTS with servings scaler and keyboard-friendly checkboxes */}
            <section className="mb-8" id="ingredients" aria-labelledby="ingredients-heading">
              <div className="flex items-end justify-between gap-4 mb-4">
                <h2 id="ingredients-heading" className="text-2xl md:text-3xl font-bold text-[color:var(--dark)]">Ingredients</h2>

                <div className="flex items-center gap-2" aria-label="Adjust servings">
                  <button className="btn btn-secondary" onClick={decServings} aria-label="Decrease servings">−</button>
                  <div className="min-w-[3rem] text-center font-medium" aria-live="polite">{servings}</div>
                  <button className="btn btn-secondary" onClick={incServings} aria-label="Increase servings">+</button>
                  {servings !== baseServings && (
                    <button className="btn btn-primary ml-2" onClick={resetServings} aria-label="Reset servings">Reset</button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
                <ul className="space-y-3">
                  {ingredients.map((ing, idx) => {
                    const checkedNow = checked.has(idx);
                    const displayAmount = formatScaledAmount(ing.amount, scale, ing.unit);
                    const ingId = `ingredient-${idx}`;
                    return (
                      <li key={idx} className={`p-3 rounded-xl border-2 motion-safe:transition-colors ${checkedNow ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <label htmlFor={ingId} className="flex items-center justify-between gap-4 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <input
                              id={ingId}
                              type="checkbox"
                              checked={checkedNow}
                              onChange={() => toggleChecked(idx)}
                              className="size-5 accent-[color:var(--primary1)]"
                              aria-label={`${ing.name} ${displayAmount}`}
                            />
                            <span className={`font-medium text-base md:text-lg ${checkedNow ? 'line-through text-gray-500' : 'text-[color:var(--dark)]'}`}>
                              {ing.name}{ing.notes ? <span className="text-gray-500"> ({ing.notes})</span> : null}
                            </span>
                          </div>
                          <span className="text-gray-800 font-medium">{displayAmount}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            {/* EQUIPMENT */}
            {!!equipmentItems.length && (
              <section className="mb-8" id="equipment" aria-labelledby="equipment-heading">
                <h2 id="equipment-heading" className="text-2xl md:text-3xl font-bold mb-4 text-[color:var(--dark)]">Equipment Needed</h2>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <ul className="grid gap-3">
                    {equipmentItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl" aria-hidden>🔧</span>
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline font-medium text-[color:var(--primary1)]"
                            aria-label={`Open link for ${item.name}`}
                          >
                            {item.name}
                          </a>
                        ) : (
                          <span className="font-medium text-[color:var(--dark)]">{item.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* NUTRITION */}
            {!!recipeData?.nutrition?.calories && (
              <section className="mb-8" id="nutrition" aria-labelledby="nutrition-heading">
                <h2 id="nutrition-heading" className="text-2xl md:text-3xl font-bold mb-4 text-[color:var(--dark)]">Nutrition Facts</h2>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {recipeData.nutrition.calories && (
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                        <div className="text-xl md:text-2xl font-bold text-[color:var(--primary2)]">{recipeData.nutrition.calories}</div>
                        <div className="text-gray-700 font-medium">Calories</div>
                      </div>
                    )}
                    {recipeData.nutrition.protein && (
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                        <div className="text-xl md:text-2xl font-bold text-[color:var(--primary1)]">{recipeData.nutrition.protein}g</div>
                        <div className="text-gray-700 font-medium">Protein</div>
                      </div>
                    )}
                    {recipeData.nutrition.carbohydrates && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                        <div className="text-xl md:text-2xl font-bold text-[color:var(--primary4)]">{recipeData.nutrition.carbohydrates}g</div>
                        <div className="text-gray-700 font-medium">Carbs</div>
                      </div>
                    )}
                    {recipeData.nutrition.fat && (
                      <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
                        <div className="text-xl md:text-2xl font-bold text-[color:var(--primary3)]">{recipeData.nutrition.fat}g</div>
                        <div className="text-gray-700 font-medium">Fat</div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ===================== RIGHT COLUMN ===================== */}
          <div className="lg:col-span-2">
            {/* High-visibility but non-intrusive sidebar ads (desktop only for rail) */}
            {ads.showSidebar && (
              <aside className="lg:float-right lg:ml-8 mb-8 space-y-6" aria-label="Sponsored">
                <div className="ad-reserve-square">
                  <AdSlot
                    id="recipe_sidebar_square"
                    sizes={{ desktop: [[300, 250], [336, 280]], mobile: [[300, 250]] }}
                    lazy
                  />
                </div>
                <div className="hidden lg:block ad-reserve-skyscraper">
                  <AdSlot
                    id="recipe_sidebar_skyscraper"
                    sizes={{ desktop: [[160, 600], [300, 600]] }}
                    lazy
                  />
                </div>
              </aside>
            )}

            {/* INSTRUCTIONS with optional in‑read ad(s) */}
            <section id="steps" aria-labelledby="steps-heading">
              <h2 id="steps-heading" className="text-2xl md:text-3xl font-bold mb-6 text-[color:var(--dark)]">
                Step‑by‑Step Instructions
              </h2>

              <div className="space-y-6">
                {instructions.map((step, index) => {
                  const stepNo = index + 1;
                  const showInlineAd = ads.injectAfterSteps?.includes(stepNo) ?? false;

                  return (
                    <React.Fragment key={index}>
                      <div className="bg-white rounded-2xl shadow-lg p-6 motion-safe:transition-shadow motion-safe:duration-200 motion-safe:hover:shadow-xl">
                        <div className="flex gap-4 md:gap-6">
                          <div
                            className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg"
                            style={{ backgroundColor: 'var(--primary2)' }}
                            aria-label={`Step ${stepNo}`}
                          >
                            {stepNo}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 leading-relaxed text-base md:text-lg mb-4">
                              {step.instruction}
                            </p>
                            {step.image ? (
                              <div className="relative h-56 md:h-64 rounded-xl overflow-hidden shadow-md">
                                <Image
                                  src={step.image}
                                  alt={`Step ${stepNo}: ${step.instruction}`}
                                  fill
                                  className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out hover:scale-[1.03]"
                                  sizes="(max-width: 768px) 100vw, 800px"
                                  loading="lazy"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {showInlineAd && (
                        <div className="ad-reserve-inread my-6" aria-label="Sponsored">
                          <AdSlot
                            id={`recipe_step_inread_${stepNo}`}
                            sizes={{ desktop: [[728, 90], [300, 250]], mobile: [[300, 250], [320, 100]] }}
                            lazy
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>

            {/* TIPS */}
            {!!recipeData?.tips && (
              <section className="mt-10" id="tips" aria-labelledby="tips-heading">
                <h2 id="tips-heading" className="text-2xl md:text-3xl font-bold mb-4 text-[color:var(--dark)]">Chef’s Tips</h2>
                <div className="bg-white rounded-2xl shadow-lg p-6" style={{ borderLeft: '6px solid var(--primary1)' }}>
                  {Array.isArray(recipeData.tips) ? (
                    <ul className="space-y-4">
                      {recipeData.tips.map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-2xl" style={{ color: 'var(--primary1)' }} aria-hidden>💡</span>
                          <p className="text-gray-800 text-base md:text-lg leading-relaxed">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" style={{ color: 'var(--primary1)' }} aria-hidden>💡</span>
                      <p className="text-gray-800 text-base md:text-lg leading-relaxed">{recipeData.tips}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* VARIATIONS */}
            {!!recipeData?.variations && (
              <section className="mt-10" id="variations" aria-labelledby="variations-heading">
                <h2 id="variations-heading" className="text-2xl md:text-3xl font-bold mb-4 text-[color:var(--dark)]">Recipe Variations</h2>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  {Array.isArray(recipeData.variations) ? (
                    <ul className="space-y-4">
                      {recipeData.variations.map((v: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-2xl" aria-hidden>🔄</span>
                          <p className="text-gray-800 text-base md:text-lg leading-relaxed">{v}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden>🔄</span>
                      <p className="text-gray-800 text-base md:text-lg leading-relaxed">{recipeData.variations}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* TAGS */}
        {!!recipeData?.keywords && (
          <section className="mt-14" aria-labelledby="tags-heading">
            <h2 id="tags-heading" className="text-2xl md:text-3xl font-bold mb-4 text-[color:var(--dark)]">Recipe Tags</h2>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(recipeData.keywords) ? recipeData.keywords : String(recipeData.keywords).split(','))
                .map((k: string, i: number) => {
                  const kw = k.trim();
                  return (
                    <a
                      key={`${kw}-${i}`}
                      href={`/recipes?tag=${encodeURIComponent(kw)}`}
                      className="px-4 py-2 rounded-full text-sm font-medium text-white shadow motion-safe:transition hover:shadow-md"
                      style={{ backgroundColor: 'var(--primary3)' }}
                      aria-label={`View more recipes tagged ${kw}`}
                    >
                      {kw}
                    </a>
                  );
                })}
            </div>
          </section>
        )}
      </main>

      {/* BOTTOM BANNER AD (non-intrusive, reserved height to avoid CLS) */}
      {ads.showBottom && (
        <div className="py-8 mt-12 bg-[color:var(--light)]">
          <div className="mx-auto max-w-5xl px-[var(--layout-margin)] ad-reserve-bottom">
            <AdSlot
              id="recipe_bottom_banner"
              sizes={{ desktop: [[970, 250], [728, 90]], mobile: [[320, 100], [300, 250]] }}
              lazy
            />
          </div>
        </div>
      )}

      {/* Motion-safety & reserved ad heights to reduce CLS */}
      <style jsx>{`
        .btn {
          padding: 0.5rem 0.875rem;
          border-radius: 0.5rem;
          transition: transform .15s ease-in-out, box-shadow .15s ease-in-out;
        }
        .btn:focus-visible { outline: 2px solid #111; outline-offset: 2px; }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary { background: var(--primary1); color: #0a0a0a; }
        .btn-secondary { background: var(--primary4); color: #0a0a0a; }

        /* Reserve space for ads to mitigate layout shifts (approx common sizes) */
        .ad-reserve-inread { min-height: 250px; }
        .ad-reserve-square { min-height: 250px; }
        .ad-reserve-skyscraper { min-height: 600px; }
        .ad-reserve-bottom { min-height: 100px; }
        @media (min-width: 1024px) {
          .ad-reserve-inread { min-height: 90px; }
          .ad-reserve-bottom { min-height: 250px; }
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>
    </article>
  );
}

import React, { useMemo, useState, useCallback } from 'react';
import Image from 'next/image';

import { AdSlot } from '@/components/ads/adSlot';
import { Recipe, type Ingredient, type Instruction, type Equipment } from '@/utils/recipe';
import { formatDuration, formatList, formatScaledAmount } from '@/utils/recipeFormatting';
import { DEFAULT_DARK_COLORS, DEFAULT_TAG_COLORS, extendDarkColors, extendTagPalette, getDeterministicTagColor, getTagTextColorClass } from '@/utils/tagHelpers';

import RecipeActions from './recipeActions';

type AdControls = {
  injectAfterSteps?: number[]; // In-read ad after these step numbers (1-based)
  showSidebar?: boolean;
  showBottom?: boolean;
};

interface Props {
  recipe: Recipe;
  ads?: AdControls;
}

/* ----------------------------- Helpers ----------------------------- */

/* -------------------------- Main Component ------------------------- */

const MODERN_TAG_COLORS = extendTagPalette(DEFAULT_TAG_COLORS, [
  'bg-[color:var(--primary1)]',
  'bg-[color:var(--primary2)]',
  'bg-[color:var(--primary3)]',
  'bg-[color:var(--primary4)]',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-lime-600',
  'bg-stone-600',
]);

const MODERN_DARK_COLORS = extendDarkColors(DEFAULT_DARK_COLORS, [
  'bg-[color:var(--primary3)]',
  'bg-[color:var(--dark)]',
  'bg-stone-600',
]);

export default function RecipeDetailsModern({
  recipe,
  ads = { injectAfterSteps: [2], showSidebar: true, showBottom: true },
}: Props) {
  const { recipeData, featuredImage, title, uri } = recipe;

  const displayTitle = recipeData?.name || title || 'Recipe';
  const cuisines = formatList(recipeData?.cuisine);
  const hasHero = Boolean(featuredImage?.node?.sourceUrl);

  const tags = useMemo(() => {
    const t: string[] = [];
    if (Array.isArray(recipeData?.dietary)) t.push(...recipeData!.dietary);
    if (recipeData?.type) t.push(...(Array.isArray(recipeData.type) ? recipeData.type : [recipeData.type]));
    if (recipeData?.method) t.push(...(Array.isArray(recipeData.method) ? recipeData.method : [recipeData.method]));
    if (recipeData?.cuisine) t.push(...(Array.isArray(recipeData.cuisine) ? recipeData.cuisine : [recipeData.cuisine]));
    if (recipeData?.protein) t.push(...(Array.isArray(recipeData.protein) ? recipeData.protein : [recipeData.protein]));
    return t.filter(Boolean).slice(0, 8);
  }, [recipeData]);

  // Servings scaler
  const baseServings = Math.max(1, Number(recipeData?.servings) || 1);
  const [servings, setServings] = useState<number>(baseServings);
  const scale = servings / baseServings;

  // Checkable ingredients
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggleChecked = useCallback((idx: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  // Rating
  const rating = Math.max(0, Math.min(5, Number(recipeData?.rating || 0)));

  const instructions = useMemo<Instruction[]>(
    () => ((recipeData?.instructions ?? []) as Instruction[]),
    [recipeData?.instructions]
  );

  const ingredients = useMemo<Ingredient[]>(
    () => ((recipeData?.ingredients ?? []) as Ingredient[]),
    [recipeData?.ingredients]
  );

  const equipmentItems = useMemo<Equipment[]>(
    () => ((recipeData?.equipment ?? []) as Equipment[]),
    [recipeData?.equipment]
  );

  const nutritionSection = useMemo(() => {
    if (!recipeData?.nutrition) {
      return null;
    }

    type NutKey =
      | 'calories' | 'carbohydrates' | 'protein' | 'fat' | 'saturated_fat' | 'trans_fat'
      | 'fiber' | 'sugar' | 'cholesterol' | 'sodium' | 'potassium' | 'calcium' | 'iron'
      | 'vitamin_a' | 'vitamin_c' | 'vitamin_d' | 'vitamin_e';

    const LABELS: Record<NutKey, string> = {
      calories: 'Calories',
      carbohydrates: 'Carbs',
      protein: 'Protein',
      fat: 'Fat',
      saturated_fat: 'Saturated Fat',
      trans_fat: 'Trans Fat',
      fiber: 'Fiber',
      sugar: 'Sugar',
      cholesterol: 'Cholesterol',
      sodium: 'Sodium',
      potassium: 'Potassium',
      calcium: 'Calcium',
      iron: 'Iron',
      vitamin_a: 'Vitamin A',
      vitamin_c: 'Vitamin C',
      vitamin_d: 'Vitamin D',
      vitamin_e: 'Vitamin E',
    };

    const UNITS: Partial<Record<NutKey, string>> = {
      calories: '',
      carbohydrates: 'g',
      protein: 'g',
      fat: 'g',
      saturated_fat: 'g',
      trans_fat: 'g',
      fiber: 'g',
      sugar: 'g',
      cholesterol: 'mg',
      sodium: 'mg',
      potassium: 'mg',
      calcium: 'mg',
      iron: 'mg',
      vitamin_a: 'µg',
      vitamin_c: 'mg',
      vitamin_d: 'µg',
      vitamin_e: 'mg',
    };

    const ORDER: NutKey[] = [
      'calories',
      'protein', 'carbohydrates', 'fat',
      'saturated_fat', 'trans_fat', 'fiber', 'sugar',
      'cholesterol', 'sodium', 'potassium', 'calcium', 'iron',
      'vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e',
    ];

    const TONES = [
      { border: 'border-orange-100', bg: 'bg-orange-50', text: 'text-orange-700' },
      { border: 'border-green-100',  bg: 'bg-green-50',  text: 'text-green-700'  },
      { border: 'border-sky-100',    bg: 'bg-sky-50',    text: 'text-sky-700'    },
      { border: 'border-rose-100',   bg: 'bg-rose-50',   text: 'text-rose-700'   },
      { border: 'border-amber-100',  bg: 'bg-amber-50',  text: 'text-amber-700'  },
      { border: 'border-teal-100',   bg: 'bg-teal-50',   text: 'text-teal-700'   },
    ];

    const nutritionValues = recipeData.nutrition as Record<string, number | string | null | undefined>;

    const cards = ORDER
      .map((key, index) => {
        const value = nutritionValues[key] ?? nutritionValues[key.replace('_', '')];
        if (value == null || value === '') {
          return null;
        }

        const tone = TONES[index % TONES.length];
        const unit = UNITS[key];

        return (
          <div key={key} className={`rounded-2xl border p-4 ${tone.border} ${tone.bg}`}>
            <div className={`text-xs uppercase ${tone.text}`}>{LABELS[key]}</div>
            <div className={`text-xl font-bold ${tone.text}`}>
              {value}{unit ? <span className="text-sm ml-0.5">{unit}</span> : null}
            </div>
          </div>
        );
      })
      .filter(Boolean);

    if (!cards.length) {
      return null;
    }

    return (
      <section className="bg-(--light) rounded-3xl shadow-xl border border-gray-100 p-6" aria-labelledby="nutrition-heading">
        <h2 id="nutrition-heading" className="text-xl md:text-2xl font-bold mb-4">Nutrition</h2>
        <p className="sr-only">Nutrition facts including calories, macros, and vitamins per serving.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {cards}
        </div>
      </section>
    );
  }, [recipeData?.nutrition]);




  /* ------------------------------ Layout ------------------------------ */

  return (
    <article className="bg-[color:var(--background)] text-[color:var(--dark)]">
      {/* ======================= HERO / INTRO STRIP ======================= */}
      <section
        className="relative pt-8 md:pt-12"
        aria-label="Recipe hero"
      >
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          {/* Info Card */}
          <div className="order-2 md:order-1 bg-(--light)/95 rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 motion-safe:transition-transform motion-safe:duration-300 hover:md:-translate-y-0.5">
              {/* circle-initial diet/method/type badges (like RecipeCard) */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3" aria-label="Recipe tags">
                  {tags.map((rawTag, index) => {
                    const tag = String(rawTag).replace(/-/g, " ").trim();
                    const bg = getDeterministicTagColor(tag, MODERN_TAG_COLORS);
                    const text = getTagTextColorClass(bg, MODERN_DARK_COLORS);
                    return (
                      <a
                        key={`${tag}-${index}`}
                        href={`/recipes?tag=${encodeURIComponent(tag)}`}
                        className={`${bg} ${text} px-3 py-1 rounded-full text-sm font-medium motion-safe:transition-transform hover:scale-110`}
                        title={tag}
                        aria-label={`View more recipes tagged ${tag}`}
                      >
                        {tag}
                      </a>
                    );
                  })}
                </div>
              )}


            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-3">{displayTitle}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-gray-700">
              {recipeData?.author && <span>By {recipeData.author}</span>}
              {(recipeData?.author || cuisines) && <span aria-hidden>•</span>}
              {!!cuisines && <span>{cuisines}</span>}
              {rating > 0 && (
                <>
                  <span aria-hidden>•</span>
                  <div className="flex items-center gap-2">
                    <span className="sr-only">{`${rating} out of 5 stars`}</span>
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        aria-hidden
                        className={i + 1 <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-xs md:text-sm">({rating}/5)</span>
                  </div>
                </>
              )}
            </div>

            {recipeData?.summary && (
              <p className="mt-4 text-gray-800 leading-relaxed">
                {recipeData.summary}
              </p>
            )}

            <div className="mt-5">
              <RecipeActions recipeTitle={displayTitle} recipeUrl={uri} />
            </div>

            {/* Quick Facts */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { k: 'Prep', v: formatDuration(recipeData?.prepTime), color: 'var(--primary1)' },
                { k: 'Cook', v: formatDuration(recipeData?.cookTime), color: 'var(--primary2)' },
                { k: recipeData?.servingsUnit || 'Servings', v: recipeData?.servings ?? '—', color: 'var(--primary3)' },
                { k: 'Difficulty', v: recipeData?.difficulty || '—', color: 'var(--primary4)' },
              ].map((c) => (
                <div key={c.k} className="rounded-2xl border border-gray-100 bg-(--light) p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">{c.k}</div>
                  <div className="text-xl font-semibold" style={{ color: c.color }}>{c.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Card */}
          <div className="order-1 md:order-2 relative rounded-3xl overflow-hidden shadow-xl min-h-[240px] md:min-h-[360px]">
            {hasHero ? (
              <Image
                src={featuredImage!.node!.sourceUrl!}
                alt={featuredImage!.node!.altText || `${displayTitle} image`}
                fill
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 hover:scale-[1.03]"
                priority
                sizes="(max-width: 768px) 100vw, 800px"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--primary4)] to-[color:var(--light)]" />
            )}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/40 via-transparent to-transparent" aria-hidden />
          </div>
        </div>
      </section>

      {/* ============================ BODY ============================ */}
      <section className="py-10 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* ===== Left: Steps (timeline) ===== */}
          <div className="">
            <h2 id="steps" className="text-2xl md:text-3xl font-bold mb-4">Step-by-Step</h2>

            <ol className="relative border-s-2 border-gray-200 pl-6 space-y-6">
              {instructions.map((step, index) => {
                const stepNo = index + 1;
                const showInlineAd = ads.injectAfterSteps?.includes(stepNo) ?? false;

                return (
                  <li key={index} className="group">
                    {/* bullet */}
                    <span
                      className="absolute -start-3 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow"
                      style={{ backgroundColor: 'var(--primary2)' }}
                      aria-hidden
                    >
                      {stepNo}
                    </span>

                    <div className="bg-(--light) rounded-2xl shadow-lg border border-gray-100 p-5 md:p-6 motion-safe:transition-shadow motion-safe:duration-200 group-hover:shadow-xl">
                      <p className="text-gray-800 leading-relaxed">{step.instruction}</p>
                      {step.image ? (
                        <div className="relative mt-4 h-52 md:h-110 rounded-xl overflow-hidden">
                          <Image
                            src={step.image}
                            alt={`Step ${stepNo}: ${step.instruction}`}
                            fill
                            className="object-cover motion-safe:transition-transform motion-safe:duration-300 hover:scale-[1.03]"
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Inline in-read ad */}
                    {showInlineAd && (
                      <div className="my-6 ad-reserve-inread" aria-label="Sponsored">
                        <AdSlot
                          id={`recipe_inread_${stepNo}`}
                          sizes={{ desktop: [[728, 90], [300, 250]], mobile: [[300, 250], [320, 100]] }}
                          lazy
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* Tips + Variations */}
            {recipeData?.tips && (
              <section className="mt-10">
                <h3 className="text-2xl font-bold mb-3">Chef’s Tips</h3>
                <div className="bg-(--light) rounded-2xl shadow-lg border border-gray-100 p-6">
                  {Array.isArray(recipeData.tips) ? (
                    <ul className="list-disc pl-5 space-y-2 text-gray-800">
                      {recipeData.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                    </ul>
                  ) : (
                    <p className="text-gray-800 leading-relaxed">{recipeData.tips}</p>
                  )}
                </div>
              </section>
            )}

            {recipeData?.variations && (
              <section className="mt-8">
                <h3 className="text-2xl font-bold mb-3">Variations</h3>
                <div className="bg-(--light) rounded-2xl shadow-lg border border-gray-100 p-6">
                  {Array.isArray(recipeData.variations) ? (
                    <ul className="list-disc pl-5 space-y-2 text-gray-800">
                      {recipeData.variations.map((v: string, i: number) => <li key={i}>{v}</li>)}
                    </ul>
                  ) : (
                    <p className="text-gray-800 leading-relaxed">{recipeData.variations}</p>
                  )}
                </div>
              </section>
            )}

            {/* Tags */}
            {!!recipeData?.keywords && (
              <section className="mt-10">
                <h3 className="text-2xl font-bold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(recipeData.keywords) ? recipeData.keywords : String(recipeData.keywords).split(','))
                    .map((k: string, i: number) => {
                      const kw = k.trim();
                      return (
                        <a
                          key={`${kw}-${i}`}
                          href={`/recipes?tag=${encodeURIComponent(kw)}`}
                          className="px-3 py-1 rounded-full text-sm font-medium text-white shadow"
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
          </div>

          {/* ===== Right: Sticky rail (Ingredients + Nutrition + Ads) ===== */}
          <aside className="mt-12">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Ingredients Card */}
              <section className="bg-(--light) rounded-3xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h2 id="ingredients" className="text-xl md:text-2xl font-bold">Ingredients</h2>
                  <div className="flex items-center gap-2" aria-label="Adjust servings">
                    <button className="btn bg-(--primary4)" onClick={() => setServings(s => Math.max(1, s - 1))} aria-label="Decrease servings">−</button>
                    <div className="min-w-[3rem] text-center font-medium" aria-live="polite">{servings}</div>
                    <button className="btn bg-(--primary4)" onClick={() => setServings(s => Math.min(24, s + 1))} aria-label="Increase servings">+</button>
                    {servings !== baseServings && (
                      <button className="btn btn-primary ml-2" onClick={() => setServings(baseServings)} aria-label="Reset servings">Reset</button>
                    )}
                  </div>
                </div>

                <ul className="divide-y divide-gray-100">
                  {ingredients.map((ing, idx) => {
                    const isChecked = checked.has(idx);
                    const displayAmount = formatScaledAmount(ing.amount, scale, ing.unit);
                    const ingId = `ing-${idx}`;
                    return (
                      <li key={idx} className="py-3">
                        <label htmlFor={ingId} className="flex items-start justify-between gap-4 cursor-pointer">
                          <div className="flex items-start gap-3">
                            <input
                              id={ingId}
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleChecked(idx)}
                              className="mt-1 size-5 accent-[color:var(--primary1)]"
                              aria-label={`${ing.name} ${displayAmount}`}
                            />
                            <span className={`font-medium ${isChecked ? 'line-through text-gray-500' : ''}`}>
                              {ing.name}{ing.notes ? <span className="text-gray-500"> ({ing.notes})</span> : null}
                            </span>
                          </div>
                          <span className="text-gray-800 font-medium">{displayAmount}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {nutritionSection}


              {/* Equipment */}
              {!!equipmentItems.length && (
                <section className="bg-(--light) rounded-3xl shadow-xl border border-gray-100 p-6">
                  <h2 id="equipment" className="text-xl md:text-2xl font-bold mb-3">Equipment</h2>
                  <ul className="grid gap-2">
                    {equipmentItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span aria-hidden>🔧</span>
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-[color:var(--primary1)] font-medium"
                            aria-label={`Open link for ${item.name}`}
                          >
                            {item.name}
                          </a>
                        ) : (
                          <span className="font-medium">{item.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Sidebar Ads */}
              {ads.showSidebar && (
                <section aria-label="Sponsored" className="space-y-6">
                  <div className="ad-reserve-square">
                    <AdSlot
                      id="recipe_sidebar_square_modern"
                      sizes={{ desktop: [[300, 250], [336, 280]], mobile: [[300, 250]] }}
                      lazy
                    />
                  </div>
                  <div className="hidden lg:block ad-reserve-skyscraper">
                    <AdSlot
                      id="recipe_sidebar_sky_modern"
                      sizes={{ desktop: [[160, 600], [300, 600]] }}
                      lazy
                    />
                  </div>
                </section>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* =================== Bottom Banner (non-intrusive) =================== */}
      {ads.showBottom && (
        <div className="py-8 bg-[color:var(--light)] mt-4">
          <div className="mx-auto max-w-5xl px-[var(--layout-margin)] ad-reserve-bottom">
            <AdSlot
              id="recipe_bottom_banner_modern"
              sizes={{ desktop: [[970, 250], [728, 90]], mobile: [[320, 100], [300, 250]] }}
              lazy
            />
          </div>
        </div>
      )}

      {/* Local UI helpers */}
      <style jsx>{`
        .btn {
          padding: 0.5rem 0.875rem;
          border-radius: 0.5rem;
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .btn:focus-visible { outline: 2px solid #111; outline-offset: 2px; }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary { background: var(--primary1); color: #0a0a0a; }
        .btn-secondary { background: var(--primary4); color: #0a0a0a; }

        /* Reserve space for ads (CLS mitigation) */
        .ad-reserve-inread { min-height: 250px; }
        .ad-reserve-square { min-height: 250px; }
        .ad-reserve-skyscraper { min-height: 600px; }
        .ad-reserve-bottom { min-height: 100px; }
        @media (min-width: 1024px) {
          .ad-reserve-inread { min-height: 90px; }
          .ad-reserve-bottom { min-height: 250px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>
    </article>
  );
}

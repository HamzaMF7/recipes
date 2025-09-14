import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GET_FILTERED_RECIPES } from '@/lib/graphql-queries';
import RecipeCard from '@/components/ui/recipeCard';
import { GetFilteredRecipesData, recipeService } from '@/lib/recipe-service';

// ----------------------------- Types & Helpers ------------------------------

type NutritionFilters = {
  caloriesLte?: number;
  proteinGte?: number;
  carbohydratesLte?: number;
  fatLte?: number;
  sugarLte?: number;
  fiberGte?: number;
  sodiumLte?: number;
  cholesterolLte?: number;
};

type FiltersState = {
  search?: string;
  diet: string[];
  cuisine: string[];
  method: string[];
  difficulty?: string;
  mealTypes: string[];
  totalTimeLte?: number;
  ratingGte?: number;
  servingsGte?: number;
  excludeIngredients: string[];
  nutrition: NutritionFilters;
};

const DEFAULT_STATE: FiltersState = {
  search: '',
  diet: [],
  cuisine: [],
  method: [],
  difficulty: undefined,
  mealTypes: [],
  totalTimeLte: undefined,
  ratingGte: undefined,
  servingsGte: undefined,
  excludeIngredients: [],
  nutrition: {},
};

// Static picklists (swap with dynamic facets when available)
const DIET_OPTIONS = ['Gluten Free', 'Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Dairy Free'];
const CUISINE_OPTIONS = ['Italian Inspired', 'Mexican', 'Indian', 'Chinese', 'French', 'American'];
const METHOD_OPTIONS = ['Baked', 'Grilled', 'Stovetop', 'Roasted', 'Slow Cooker', 'Air Fryer'];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const MEAL_TYPE_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

// parse arrays from query
const parseList = (v: string | string[] | undefined): string[] => {
  if (!v) return [];
  const raw = Array.isArray(v) ? v.join(',') : v;
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
};

// parse number
const parseNum = (v: string | string[] | undefined): number | undefined => {
  if (!v) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

// URL <-> state mapping (simple snake_case to *_lte / *_gte params)
const stateFromQuery = (q: Record<string, any>): FiltersState => ({
  search: (q.q as string) || '',
  diet: parseList(q.diet),
  cuisine: parseList(q.cuisine),
  method: parseList(q.method),
  difficulty: (q.difficulty as string) || undefined,
  mealTypes: parseList(q.meal),
  totalTimeLte: parseNum(q.time_lte),
  ratingGte: parseNum(q.rating_gte),
  servingsGte: parseNum(q.servings_gte),
  excludeIngredients: parseList(q.exclude),
  nutrition: {
    caloriesLte: parseNum(q.cal_lte),
    proteinGte: parseNum(q.pro_gte),
    carbohydratesLte: parseNum(q.carbs_lte),
    fatLte: parseNum(q.fat_lte),
    sugarLte: parseNum(q.sugar_lte),
    fiberGte: parseNum(q.fiber_gte),
    sodiumLte: parseNum(q.na_lte),
    cholesterolLte: parseNum(q.chol_lte),
  },
});

const queryFromState = (s: FiltersState) => {
  const entries: [string, string | number][] = [];
  if (s.search) entries.push(['q', s.search]);
  if (s.diet.length) entries.push(['diet', s.diet.join(',')]);
  if (s.cuisine.length) entries.push(['cuisine', s.cuisine.join(',')]);
  if (s.method.length) entries.push(['method', s.method.join(',')]);
  if (s.difficulty) entries.push(['difficulty', s.difficulty]);
  if (s.mealTypes.length) entries.push(['meal', s.mealTypes.join(',')]);
  if (s.totalTimeLte) entries.push(['time_lte', s.totalTimeLte]);
  if (s.ratingGte) entries.push(['rating_gte', s.ratingGte]);
  if (s.servingsGte) entries.push(['servings_gte', s.servingsGte]);
  if (s.excludeIngredients.length) entries.push(['exclude', s.excludeIngredients.join(',')]);

  const n = s.nutrition;
  if (n.caloriesLte) entries.push(['cal_lte', n.caloriesLte]);
  if (n.proteinGte) entries.push(['pro_gte', n.proteinGte]);
  if (n.carbohydratesLte) entries.push(['carbs_lte', n.carbohydratesLte]);
  if (n.fatLte) entries.push(['fat_lte', n.fatLte]);
  if (n.sugarLte) entries.push(['sugar_lte', n.sugarLte]);
  if (n.fiberGte) entries.push(['fiber_gte', n.fiberGte]);
  if (n.sodiumLte) entries.push(['na_lte', n.sodiumLte]);
  if (n.cholesterolLte) entries.push(['chol_lte', n.cholesterolLte]);

  return Object.fromEntries(entries);
};

/**
 * Map UI state to GraphQL filter input.
 * Update keys to match your API's "where" input.
 */
const buildFiltersInput = (s: FiltersState) => {
  const filters: any = {};

  if (s.diet.length) filters.diet_in = s.diet;
  if (s.cuisine.length) filters.cuisine_in = s.cuisine;
  if (s.method.length) filters.method_in = s.method;
  if (s.difficulty) filters.difficulty = s.difficulty;
  if (s.mealTypes.length) filters.mealTypes_in = s.mealTypes;

  if (s.totalTimeLte) filters.totalTime_lte = s.totalTimeLte;
  if (s.ratingGte) filters.rating_gte = s.ratingGte;
  if (s.servingsGte) filters.servings_gte = s.servingsGte;

  if (s.excludeIngredients.length) {
    filters.excludeIngredients_in = s.excludeIngredients;
  }

  // Nutrition sub-filter
  const n: any = {};
  if (s.nutrition.caloriesLte) n.calories_lte = s.nutrition.caloriesLte;
  if (s.nutrition.proteinGte) n.protein_gte = s.nutrition.proteinGte;
  if (s.nutrition.carbohydratesLte) n.carbohydrates_lte = s.nutrition.carbohydratesLte;
  if (s.nutrition.fatLte) n.fat_lte = s.nutrition.fatLte;
  if (s.nutrition.sugarLte) n.sugar_lte = s.nutrition.sugarLte;
  if (s.nutrition.fiberGte) n.fiber_gte = s.nutrition.fiberGte;
  if (s.nutrition.sodiumLte) n.sodium_lte = s.nutrition.sodiumLte;
  if (s.nutrition.cholesterolLte) n.cholesterol_lte = s.nutrition.cholesterolLte;

  if (Object.keys(n).length) filters.nutrition = n;

  return filters;
};

// Small primitive UI helpers
const Checkbox = ({
  label,
  checked,
  onChange,
  id,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) => (
  <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="accent-[color:var(--primary1)] w-4 h-4"
    />
    <span>{label}</span>
  </label>
);

// ----------------------------- Page Component -------------------------------

export default function AllRecipesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FiltersState>(() => stateFromQuery(router.query));
  const [recipesData, setRecipesData] = useState<GetFilteredRecipesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);



  // fetch initial + on filter change
useEffect(() => {
  let cancelled = false;
  (async () => {
    setLoading(true); setErr(null);
    const res = await recipeService.getFilteredRecipes({
      first: 20,
      after: null,
      search: filters.search || null,
      filters: buildFiltersInput(filters),
      includeMetadata: true,
    });
    if (cancelled) return;
    if (res.error) setErr(res.error.message);
    setRecipesData(res.data);
    setLoading(false);
  })();
  return () => { cancelled = true; };
}, [filters]);


const loadMore = async () => {
  const endCursor = recipesData?.recipes.pageInfo.endCursor;
  if (!recipesData?.recipes.pageInfo.hasNextPage || !endCursor) return;
  const res = await recipeService.getFilteredRecipes({
    first: 20,
    after: endCursor,
    search: filters.search || null,
    filters: buildFiltersInput(filters),
  });
  if (res.data) {
    setRecipesData(prev =>
      !prev ? res.data : {
        recipes: {
          pageInfo: res.data.recipes.pageInfo,
          edges: [...prev.recipes.edges, ...res.data.recipes.edges],
        }
      } as GetFilteredRecipesData
    );
  }
};

  // Keep local state in sync with URL (when user hits back/forward)
  useEffect(() => {
    setFilters(stateFromQuery(router.query));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]);

  // Build variables for GraphQL
  const variables = useMemo(
    () => ({
      first: 20,
      after: null as string | null,
      filters: buildFiltersInput(filters),
      search: filters.search || undefined,
    }),
    [filters]
  );


  const recipes = useMemo(
    () => (recipesData?.recipes?.edges ?? []).map((e: any) => e.node),
    [recipesData]
  );

  const pageInfo = recipesData?.recipes?.pageInfo;

  const applyFilters = (next: FiltersState) => {
    const nextQuery = queryFromState(next);
    router.push(
      { pathname: '/recipes', query: nextQuery },
      undefined,
      { shallow: true }
    );
    setFilters(next);
    // refetch will be triggered automatically by query variables change (because state changes)
    // But to be explicit:
    refetch({
      first: 20,
      after: null,
      filters: buildFiltersInput(next),
      search: next.search || undefined,
    });
  };

  const clearAll = () => applyFilters(DEFAULT_STATE);


  // ----------------------------- Filter UI ---------------------------------

  const toggleInArray = (arr: string[], value: string): string[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const QuickChip = ({
    label,
    active,
    onToggle,
  }: {
    label: string;
    active: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`px-3 py-2 rounded-full text-sm border motion-safe:transition ${
        active
          ? 'bg-[color:var(--primary1)] text-black border-transparent'
          : 'bg-white text-[color:var(--dark)] border-gray-200 hover:bg-gray-50'
      }`}
      title={label}
    >
      {label}
    </button>
  );

  // ----------------------------- Render -------------------------------------

  return (
    <>
      <Head>
        <title>All Recipes</title>
        <meta name="description" content="Browse all recipes and filter by diet, cuisine, method, difficulty, time, rating, and nutrition." />
        <link rel="canonical" href="https://yoursite.com/recipes" />
      </Head>

      <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--dark)]">
        <section className="mx-auto max-w-6xl px-[var(--layout-margin)] py-6 md:py-8">
          {/* Title + Search */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">All Recipes</h1>
              <p className="text-gray-700 mt-1">Find your next meal by filtering what matters most to you.</p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="search" className="sr-only">Search recipes</label>
              <input
                id="search"
                type="search"
                placeholder="Search recipes..."
                defaultValue={filters.search}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    applyFilters({ ...filters, search: (e.target as HTMLInputElement).value });
                  }
                }}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 w-[min(80vw,320px)]"
              />
              <button
                className="px-4 py-2 rounded-xl bg-[color:var(--primary1)] text-black"
                onClick={() => {
                  const el = document.getElementById('search') as HTMLInputElement | null;
                  applyFilters({ ...filters, search: el?.value || '' });
                }}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Quick filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* Time presets */}
            {[15, 30, 45, 60].map((m) => (
              <QuickChip
                key={m}
                label={`≤ ${m} min`}
                active={filters.totalTimeLte === m}
                onToggle={() =>
                  applyFilters({
                    ...filters,
                    totalTimeLte: filters.totalTimeLte === m ? undefined : m,
                  })
                }
              />
            ))}

            {/* Rating */}
            {[4, 4.5].map((r) => (
              <QuickChip
                key={r}
                label={`≥ ${r}★`}
                active={filters.ratingGte === r}
                onToggle={() =>
                  applyFilters({
                    ...filters,
                    ratingGte: filters.ratingGte === r ? undefined : r,
                  })
                }
              />
            ))}

            {/* Difficulty */}
            {DIFFICULTY_OPTIONS.map((d) => (
              <QuickChip
                key={d}
                label={d[0].toUpperCase() + d.slice(1)}
                active={filters.difficulty === d}
                onToggle={() =>
                  applyFilters({
                    ...filters,
                    difficulty: filters.difficulty === d ? undefined : d,
                  })
                }
              />
            ))}
          </div>

          {/* Advanced Filters Drawer (inline here for simplicity) */}
          <section className="mt-6 bg-white border border-gray-200 rounded-2xl p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-3">Filter recipes</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Diet */}
              <div>
                <h3 className="font-medium mb-2">Diet</h3>
                <div className="flex flex-wrap gap-3">
                  {DIET_OPTIONS.map((opt) => {
                    const id = `diet-${opt}`;
                    const checked = filters.diet.includes(opt);
                    return (
                      <Checkbox
                        key={opt}
                        id={id}
                        label={opt}
                        checked={checked}
                        onChange={(v) =>
                          applyFilters({ ...filters, diet: v ? [...filters.diet, opt] : filters.diet.filter((x) => x !== opt) })
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Cuisine */}
              <div>
                <h3 className="font-medium mb-2">Cuisine</h3>
                <div className="flex flex-wrap gap-3">
                  {CUISINE_OPTIONS.map((opt) => {
                    const id = `cuisine-${opt}`;
                    const checked = filters.cuisine.includes(opt);
                    return (
                      <Checkbox
                        key={opt}
                        id={id}
                        label={opt}
                        checked={checked}
                        onChange={(v) =>
                          applyFilters({ ...filters, cuisine: v ? [...filters.cuisine, opt] : filters.cuisine.filter((x) => x !== opt) })
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Method */}
              <div>
                <h3 className="font-medium mb-2">Method</h3>
                <div className="flex flex-wrap gap-3">
                  {METHOD_OPTIONS.map((opt) => {
                    const id = `method-${opt}`;
                    const checked = filters.method.includes(opt);
                    return (
                      <Checkbox
                        key={opt}
                        id={id}
                        label={opt}
                        checked={checked}
                        onChange={(v) =>
                          applyFilters({ ...filters, method: v ? [...filters.method, opt] : filters.method.filter((x) => x !== opt) })
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Meal Type */}
              <div>
                <h3 className="font-medium mb-2">Meal Type</h3>
                <div className="flex flex-wrap gap-3">
                  {MEAL_TYPE_OPTIONS.map((opt) => {
                    const id = `meal-${opt}`;
                    const checked = filters.mealTypes.includes(opt);
                    return (
                      <Checkbox
                        key={opt}
                        id={id}
                        label={opt}
                        checked={checked}
                        onChange={(v) =>
                          applyFilters({ ...filters, mealTypes: v ? [...filters.mealTypes, opt] : filters.mealTypes.filter((x) => x !== opt) })
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Time / Rating / Servings */}
              <div>
                <h3 className="font-medium mb-2">Time, Rating & Servings</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Time ≤ (min)</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 30"
                      defaultValue={filters.totalTimeLte ?? ''}
                      onBlur={(e) =>
                        applyFilters({ ...filters, totalTimeLte: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Rating ≥</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={5}
                      placeholder="e.g. 4.5"
                      defaultValue={filters.ratingGte ?? ''}
                      onBlur={(e) =>
                        applyFilters({ ...filters, ratingGte: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Servings ≥</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 4"
                      defaultValue={filters.servingsGte ?? ''}
                      onBlur={(e) =>
                        applyFilters({ ...filters, servingsGte: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Nutrition */}
              <div className="md:col-span-2 lg:col-span-3">
                <h3 className="font-medium mb-2">Nutrition</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[
                    { k: 'caloriesLte', label: 'Calories ≤', placeholder: '480' },
                    { k: 'proteinGte', label: 'Protein ≥ (g)', placeholder: '20' },
                    { k: 'carbohydratesLte', label: 'Carbs ≤ (g)', placeholder: '50' },
                    { k: 'fatLte', label: 'Fat ≤ (g)', placeholder: '25' },
                    { k: 'sugarLte', label: 'Sugar ≤ (g)', placeholder: '10' },
                    { k: 'fiberGte', label: 'Fiber ≥ (g)', placeholder: '5' },
                    { k: 'sodiumLte', label: 'Sodium ≤ (mg)', placeholder: '800' },
                    { k: 'cholesterolLte', label: 'Cholesterol ≤ (mg)', placeholder: '70' },
                  ].map((f) => (
                    <div key={f.k}>
                      <label className="text-sm text-gray-600">{f.label}</label>
                      <input
                        type="number"
                        placeholder={f.placeholder}
                        defaultValue={(filters.nutrition as any)[f.k] ?? ''}
                        onBlur={(e) =>
                          applyFilters({
                            ...filters,
                            nutrition: {
                              ...filters.nutrition,
                              [f.k]: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Exclude ingredients */}
              <div className="md:col-span-2">
                <h3 className="font-medium mb-2">Exclude ingredients</h3>
                <input
                  type="text"
                  placeholder="e.g. nuts, dairy"
                  defaultValue={filters.excludeIngredients.join(', ')}
                  onBlur={(e) =>
                    applyFilters({
                      ...filters,
                      excludeIngredients: e.target.value
                        ? e.target.value.split(',').map((x) => x.trim()).filter(Boolean)
                        : [],
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => applyFilters(filters)}
                className="px-4 py-2 rounded-xl bg-[color:var(--primary2)] text-black"
              >
                Apply filters
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 rounded-xl bg-gray-100 text-[color:var(--dark)] border border-gray-200"
              >
                Clear all
              </button>
            </div>
          </section>

          {/* Results grid */}
          <section className="mt-6">
            {loading && recipes.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-white rounded-3xl border border-gray-200 animate-pulse" />
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <div className="py-10 text-center text-gray-700">
                No recipes matched your filters. Try broadening them.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recipes.map((r: any) => (
                    <RecipeCard
                      key={r.id}
                      image={r.featuredImage?.node?.sourceUrl || '/placeholder.jpg'}
                      title={r.recipeData?.name || r.title}
                      description={r.recipeData?.summary || ''}
                      diet={Array.isArray(r.recipeData?.dietary) ? r.recipeData.dietary : []}
                    />
                  ))}
                </div>

                {/* Load more */}
                {pageInfo?.hasNextPage && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={loadMore}
                      className="px-5 py-3 rounded-xl bg-[color:var(--primary3)] text-white motion-safe:transition hover:opacity-95"
                    >
                      View more recipes
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      </main>
    </>
  );
}

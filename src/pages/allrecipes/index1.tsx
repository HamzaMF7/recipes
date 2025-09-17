import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { recipeService, GetFilteredRecipesData } from '@/lib/recipe-service';
import { Check, ChevronDown, X } from 'lucide-react';
import RecipeCard from '@/components/ui/recipeCard';

// ----------------------------- Types & Helpers ------------------------------

type FiltersState = {
  search?: string;
  diet: string[];
  cuisine: string[];
  method: string[];
  difficulty?: string;
  mealTypes: string[];
};

const DEFAULT_STATE: FiltersState = {
  search: '',
  diet: [],
  cuisine: [],
  method: [],
  difficulty: undefined,
  mealTypes: [],
};

// Static options
const DIET_OPTIONS = ['Gluten Free', 'Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Dairy Free'];
const CUISINE_OPTIONS = ['Italian Inspired', 'Mexican', 'Indian', 'Chinese', 'French', 'American'];
const METHOD_OPTIONS = ['Baked', 'Grilled', 'Stovetop', 'Roasted', 'Slow Cooker', 'Air Fryer'];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const MEAL_TYPE_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

// Utility functions
const parseList = (v: string | string[] | undefined): string[] => {
  if (!v) return [];
  const raw = Array.isArray(v) ? v.join(',') : v;
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
};

const stateFromQuery = (q: Record<string, any>): FiltersState => ({
  search: (q.q as string) || '',
  diet: parseList(q.diet),
  cuisine: parseList(q.cuisine),
  method: parseList(q.method),
  difficulty: (q.difficulty as string) || undefined,
  mealTypes: parseList(q.meal),
});

const queryFromState = (s: FiltersState) => {
  const entries: [string, string][] = [];
  if (s.search) entries.push(['q', s.search]);
  if (s.diet.length) entries.push(['diet', s.diet.join(',')]);
  if (s.cuisine.length) entries.push(['cuisine', s.cuisine.join(',')]);
  if (s.method.length) entries.push(['method', s.method.join(',')]);
  if (s.difficulty) entries.push(['difficulty', s.difficulty]);
  if (s.mealTypes.length) entries.push(['meal', s.mealTypes.join(',')]);
  
  return Object.fromEntries(entries);
};

const buildFiltersInput = (s: FiltersState) => {
  const filters: any = {};
  
  if (s.diet.length) filters.diet_in = s.diet;
  if (s.cuisine.length) filters.cuisine_in = s.cuisine;
  if (s.method.length) filters.method_in = s.method;
  if (s.difficulty) filters.difficulty = s.difficulty;
  if (s.mealTypes.length) filters.mealTypes_in = s.mealTypes;
  
  return filters;
};

// ----------------------------- UI Components -------------------------------

const CheckboxDropdown = ({
  title,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options..."
}: {
  title: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = useCallback((option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newValues);
  }, [selectedValues, onChange]);

  const displayText = selectedValues.length > 0 
    ? `${selectedValues.length} selected` 
    : placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={selectedValues.length > 0 ? "text-gray-900" : "text-gray-500"}>
          {displayText}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="max-h-60 overflow-auto p-1">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded border border-gray-300">
                      {isSelected && <Check className="h-3 w-3 text-blue-600" />}
                    </div>
                    <span className={isSelected ? "text-gray-900" : "text-gray-700"}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ActiveFilterTag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="ml-1 rounded-full p-0.5 hover:bg-blue-200"
      aria-label={`Remove ${label} filter`}
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

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

// ----------------------------- Main Component -------------------------------

export default function ImprovedRecipeFilters() {
  const router = useRouter();
  const [filters, setFilters] = useState<FiltersState>(() => stateFromQuery(router.query));
  const [recipesData, setRecipesData] = useState<GetFilteredRecipesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recipes when filters change
  useEffect(() => {
    let cancelled = false;
    
    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await recipeService.getFilteredRecipes({
          page:1 , 
          perPage : 20 , 
          search: filters.search || null,
          filters: buildFiltersInput(filters),
          includeMetadata: true,
        });
        
        if (cancelled) return;
        
        if (result.error) {
          setError(result.error.message);
        } else {
          setRecipesData(result.data);
          console.log("recipe filtered data " , result.data , )
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch recipes');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecipes();
    return () => { cancelled = true; };
  }, [filters]);

  // Sync with URL changes
  useEffect(() => {
    setFilters(stateFromQuery(router.query));
  }, [router.query]);

  const applyFilters = useCallback((nextFilters: FiltersState) => {
    const nextQuery = queryFromState(nextFilters);
    router.push(
      { pathname: '/recipes', query: nextQuery },
      undefined,
      { shallow: true }
    );
  }, [router]);

  const updateFilters = useCallback((updates: Partial<FiltersState>) => {
    const nextFilters = { ...filters, ...updates };
    setFilters(nextFilters);
    applyFilters(nextFilters);
  }, [filters, applyFilters]);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_STATE);
    applyFilters(DEFAULT_STATE);
  }, [applyFilters]);

  const removeFilter = useCallback((type: keyof FiltersState, value?: string) => {
    const updates: Partial<FiltersState> = {};
    
    if (type === 'difficulty') {
      updates.difficulty = undefined;
    } else if (Array.isArray(filters[type]) && value) {
      updates[type] = (filters[type] as string[]).filter(v => v !== value);
    }
    
    updateFilters(updates);
  }, [filters, updateFilters]);

  // Get active filters for display
  const activeFilters = useMemo(() => {
    const active: Array<{ type: keyof FiltersState; label: string; value?: string }> = [];
    
    filters.diet.forEach(diet => active.push({ type: 'diet', label: diet, value: diet }));
    filters.cuisine.forEach(cuisine => active.push({ type: 'cuisine', label: cuisine, value: cuisine }));
    filters.method.forEach(method => active.push({ type: 'method', label: method, value: method }));
    filters.mealTypes.forEach(meal => active.push({ type: 'mealTypes', label: meal, value: meal }));
    
    if (filters.difficulty) {
      active.push({ 
        type: 'difficulty', 
        label: filters.difficulty.charAt(0).toUpperCase() + filters.difficulty.slice(1)
      });
    }
    
    return active;
  }, [filters]);

  const recipes = useMemo(() => 
    (recipesData?.recipes?.edges ?? []).map((e: any) => e.node),
    [recipesData]
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className=" px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Recipes</h1>
          <p className="mt-2 text-gray-600">
            Find your next meal by filtering what matters most to you.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="search"
              placeholder="Search recipes..."
              defaultValue={filters.search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateFilters({ search: (e.target as HTMLInputElement).value });
                }
              }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[type="search"]') as HTMLInputElement;
                updateFilters({ search: input?.value || '' });
              }}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Search
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

        {/* Filter Section */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Filters</h2>
          
          {/* Filter Dropdowns */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Diet</label>
              <CheckboxDropdown
                title="Diet"
                options={DIET_OPTIONS}
                selectedValues={filters.diet}
                onChange={(values) => updateFilters({ diet: values })}
                placeholder="Select diets..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Cuisine</label>
              <CheckboxDropdown
                title="Cuisine"
                options={CUISINE_OPTIONS}
                selectedValues={filters.cuisine}
                onChange={(values) => updateFilters({ cuisine: values })}
                placeholder="Select cuisines..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Method</label>
              <CheckboxDropdown
                title="Method"
                options={METHOD_OPTIONS}
                selectedValues={filters.method}
                onChange={(values) => updateFilters({ method: values })}
                placeholder="Select methods..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Meal Type</label>
              <CheckboxDropdown
                title="Meal Type"
                options={MEAL_TYPE_OPTIONS}
                selectedValues={filters.mealTypes}
                onChange={(values) => updateFilters({ mealTypes: values })}
                placeholder="Select meal types..."
              />
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {activeFilters.map((filter, index) => (
                  <ActiveFilterTag
                    key={`${filter.type}-${filter.value || filter.label}-${index}`}
                    label={filter.label}
                    onRemove={() => removeFilter(filter.type, filter.value)}
                  />
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div>
          {loading && recipesData?.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-red-800">Error: {error}</p>
            </div>
          ) : recipesData?.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-8 text-center">
              <p className="text-gray-600">No recipes found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recipesData?.filteredRecipes.nodes.map((r) => (
                  <RecipeCard
                    key={r.id}
                    id={r.id}
                    title={r.title}
                    description={r.summary ?? ""}
                    href={`/recipes/${r.id}`}          // or r.uri if you have it
                    featuredImageUrl={r.featuredImageUrl ?? undefined}
                    dietary={r.dietary ?? []}
                    totalTime={r.totalTime ?? undefined}
                    difficulty={r.difficulty ?? undefined}
                    // servings={r.servings ?? undefined} // include if your list query exposes it
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}



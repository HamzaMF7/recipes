import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { Check, ChevronDown, X, Filter, Loader2, ChefHat } from 'lucide-react';
import { recipeService } from '@/lib/recipe-service';
import RecipeCard from '@/components/ui/recipeCard';

// ----------------------------- Types & Configuration ------------------------

type Recipe = {
  id: string;
  title: string;
  summary: string;
  featuredImageUrl?: string;
  featuredImageId?: string;
  dietary: string[];
  totalTime?: number;
  difficulty?: string;
  slug?: string;
};

type FacetItem = {
  value: string;
  label: string;
  count: number;
};

type RecipeFacets = {
  totalTimePresets: FacetItem[];
  ratingRanges: FacetItem[];
  difficulty: FacetItem[];
  season: FacetItem[];
  diet: FacetItem[];
  cuisine: FacetItem[];
  method: FacetItem[];
  mealTypes: FacetItem[];
};

type FilteredRecipesResponse = {
  filteredRecipes: {
    total: number;
    page: number;
    perPage: number;
    hasMore: boolean;
    nodes: Recipe[];
    facets: RecipeFacets;
  };
};

type FiltersState = {
  search?: string;
  diet: string[];
  cuisine: string[];
  method: string[];
  difficulty?: string;
  mealTypes: string[];
  season?: string;              // <-- single-select season
  totalTimePreset?: string;
  ratingRange?: string;
};

type GraphQLFilters = {
  totalTimeLte: number | null;
  ratingGte: number | null;
  difficulty: string | null;
  diet: string[] | null;
  cuisine: string[] | null;
  method: string[] | null;
  mealTypes: string[] | null;
  season: string | null;        // <-- single-select
};

// ----------------------------- Utility Functions ----------------------------

const DEFAULT_STATE: FiltersState = {
  search: '',
  diet: [],
  cuisine: [],
  method: [],
  difficulty: undefined,
  mealTypes: [],
  season: undefined,
  totalTimePreset: undefined,
  ratingRange: undefined
};

const parseList = (v: string | string[] | undefined): string[] => {
  if (!v) return [];
  const raw = Array.isArray(v) ? v.join(',') : v;
  return raw.split(',').map(x => x.trim()).filter(Boolean);
};

const stateFromQuery = (q: Record<string, any>): FiltersState => ({
  search: (q.q as string) || '',
  diet: parseList(q.diet),
  cuisine: parseList(q.cuisine),
  method: parseList(q.method),
  difficulty: (q.difficulty as string) || undefined,
  mealTypes: parseList(q.meal),
  season: (q.season as string) || undefined,   // <-- not array
  totalTimePreset: (q.time as string) || undefined,
  ratingRange: (q.rating as string) || undefined
});

const queryFromState = (s: FiltersState) => {
  const entries: [string, string][] = [];
  if (s.search) entries.push(['q', s.search]);
  if (s.diet.length) entries.push(['diet', s.diet.join(',')]);
  if (s.cuisine.length) entries.push(['cuisine', s.cuisine.join(',')]);
  if (s.method.length) entries.push(['method', s.method.join(',')]);
  if (s.difficulty) entries.push(['difficulty', s.difficulty]);
  if (s.mealTypes.length) entries.push(['meal', s.mealTypes.join(',')]);
  if (s.season) entries.push(['season', s.season]);           // <-- fixed (was s.season.length / join)
  if (s.totalTimePreset) entries.push(['time', s.totalTimePreset]);
  if (s.ratingRange) entries.push(['rating', s.ratingRange]);
  return Object.fromEntries(entries);
};

const buildGraphQLFilters = (filters: FiltersState): GraphQLFilters => ({
  totalTimeLte: filters.totalTimePreset ? parseInt(filters.totalTimePreset, 10) : null,
  ratingGte: filters.ratingRange ? parseFloat(filters.ratingRange) : null,
  difficulty: filters.difficulty || null,
  diet: filters.diet.length ? filters.diet : null,
  cuisine: filters.cuisine.length ? filters.cuisine : null,
  method: filters.method.length ? filters.method : null,
  mealTypes: filters.mealTypes.length ? filters.mealTypes : null,
  season: filters.season || null,
});

// ----------------------------- Components -----------------------------------

const FacetedDropdown = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  loading = false
}: {
  title: string; // kept for API compatibility, not used in UI
  options: FacetItem[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  loading?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = useCallback((value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  }, [selectedValues, onChange]);

  const displayText = useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const selected = options.find(o => o.value === selectedValues[0]);
      return selected?.label || selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }, [selectedValues, options, placeholder]);

  const sortedOptions = useMemo(
    () =>
      [...options].sort((a, b) => {
        const aSelected = selectedValues.includes(a.value);
        const bSelected = selectedValues.includes(b.value);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return b.count - a.count;
      }),
    [options, selectedValues]
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex w-full items-center justify-between rounded-lg border border-(--dark)/20  px-3 py-2 text-sm  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className={selectedValues.length > 0 ? "text-(--dark)" : "text-(--dark)/50"}>
          {loading ? "Updating..." : displayText}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !loading && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-(--dark)/20 bg-(--light) shadow-lg">
            <div className="max-h-60 overflow-auto p-1">
              {sortedOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
              ) : (
                sortedOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  const isDisabled = option.count === 0 && !isSelected;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !isDisabled && toggleOption(option.value)}
                      disabled={isDisabled}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${isSelected ? "bg-(--primary1)" : ""} transition-colors ${
                        isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:font-medium text-(--dark) cursor-pointer'
                      }`}
                    >
                      <div className="flex h-4 w-4 items-center justify-center rounded border border-gray-300">
                        {isSelected && <Check className="h-3 w-3 text-(--dark)" />}
                      </div>
                      <span className={`flex-1 text-left ${isSelected ? "font-medium text-gray-900" : "text-gray-700"}`}>
                        {option.label}
                      </span>
                      <span className={`text-xs ${option.count > 0 ? 'text-gray-500' : 'text-gray-400'}`}>
                        ({option.count})
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-[4/3] bg-gray-200 rounded-t-lg" />
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

// ----------------------------- Main Component -------------------------------

export default function OptimizedRecipeFilters() {
  const router = useRouter();
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_STATE);
  const [data, setData] = useState<FilteredRecipesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(); // <-- works in browser & node

  // Single query fetches both recipes and updated facets
  const fetchRecipesWithFacets = useCallback(
    async (currentFilters: FiltersState, currentPage: number = 1) => {
      setLoading(true);
      setError(null);
      try {
        const result = await recipeService.getFilteredRecipes({
          page: currentPage,
          perPage: 12,
          search: currentFilters.search || null,
          filters: buildGraphQLFilters(currentFilters),
          fetchPolicy: currentPage === 1 ? 'network-only' : 'cache-first',
        });

        if ((result as any)?.error) {
          setError((result as any).error.message);
        } else if ((result as any)?.data) {
          setData((result as any).data);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch recipes. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        setPage(1);
        applyFilters(newFilters);
      }, 300);
    },
    [filters] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    // cleanup debounce on unmount
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Apply filters and update URL (use current pathname instead of hardcoding)
  const applyFilters = useCallback(
    (nextFilters: FiltersState, nextPage: number = 1) => {
      const nextQuery: Record<string, string> = { ...queryFromState(nextFilters) } as any;
      if (nextPage > 1) nextQuery.page = String(nextPage);

      router.push(
        { pathname: router.pathname, query: nextQuery },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  // Update filters
  const updateFilters = useCallback(
    (updates: Partial<FiltersState>) => {
      const nextFilters = { ...filters, ...updates };
      setFilters(nextFilters);
      setPage(1);
      applyFilters(nextFilters, 1);
      // console.debug('GraphQL filters:', buildGraphQLFilters(nextFilters));
    },
    [filters, applyFilters]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_STATE);
    setPage(1);
    applyFilters(DEFAULT_STATE, 1);
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  }, [applyFilters]);

  // Handle pagination
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      applyFilters(filters, newPage);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [filters, applyFilters]
  );

  // Sync state from URL (only after router is ready)
  useEffect(() => {
    if (!router.isReady) return;
    const newFilters = stateFromQuery(router.query);
    setFilters(newFilters);

    const queryPage = router.query.page ? parseInt(router.query.page as string, 10) : 1;
    setPage(Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1);
  }, [router.isReady, router.query]);

  // Fetch whenever filters/page change (and router ready)
  useEffect(() => {
    if (!router.isReady) return;
    fetchRecipesWithFacets(filters, page);
  }, [router.isReady, filters, page, fetchRecipesWithFacets]);

  // Computed values
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    count += filters.diet.length;
    count += filters.cuisine.length;
    count += filters.method.length;
    if (filters.difficulty) count++;
    count += filters.mealTypes.length;
    if (filters.season) count++;
    if (filters.totalTimePreset) count++;
    if (filters.ratingRange) count++;
    return count;
  }, [filters]);

  const facets = data?.filteredRecipes.facets;
  const recipes = data?.filteredRecipes.nodes || [];
  const totalRecipes = data?.filteredRecipes.total || 0;
  const hasMore = data?.filteredRecipes.hasMore || false;
  const perPage = data?.filteredRecipes.perPage || 12;
  const totalPages = Math.max(1, Math.ceil(totalRecipes / perPage));

  // simple page window around current (1..totalPages)
  const pageWindow = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <main className="min-h-screen">
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Recipes</h1>
          <p className="mt-2 text-gray-600">
            {loading && !data
              ? 'Loading recipes...'
              : totalRecipes > 0
              ? `${totalRecipes} recipes available`
              : 'Discover your next meal'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search recipes by name or ingredient..."
              defaultValue={filters.search}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full rounded-3xl border bg-(--light) border-gray-300 px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {filters.search && (
              <button
                onClick={() => {
                  if (searchInputRef.current) searchInputRef.current.value = '';
                  updateFilters({ search: '' });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100"
                aria-label="Clear search"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters - Using facet data */}
        {!!facets && (
          <div className="mb-6 flex flex-wrap gap-2  ">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              Quick filters:
            </div>

            {/* Time presets from facets */}
            {facets.totalTimePresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() =>
                  updateFilters({
                    totalTimePreset: filters.totalTimePreset === preset.value ? undefined : preset.value,
                  })
                }
                disabled={preset.count === 0 && filters.totalTimePreset !== preset.value}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filters.totalTimePreset === preset.value
                    ? 'bg-(--primary1) text-(--dark) border-1 border-(--dark)'
                    : preset.count === 0
                    ? 'bg-transparent text-(--dark)/40 border-(--dark)/20 border-1 cursor-not-allowed'
                    : 'bg-transparent text-(--dark) border-(--dark) border-1  hover:bg-(--primary1)'
                }`}
              >
                {preset.label} {preset.count > 0 && `(${preset.count})`}
              </button>
            ))}

            {/* Rating filters from facets */}
            {facets.ratingRanges.map((range) => (
              <button
                key={range.value}
                onClick={() =>
                  updateFilters({
                    ratingRange: filters.ratingRange === range.value ? undefined : range.value,
                  })
                }
                disabled={range.count === 0 && filters.ratingRange !== range.value}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filters.ratingRange === range.value
                    ? 'bg-(--primary1) text-(--dark) border-1 border-(--dark)'
                    : range.count === 0
                    ? 'bg-transparent text-(--dark)/40 border-(--dark)/20 border-1 cursor-not-allowed'
                    : 'bg-transparent text-(--dark) border-(--dark) border-1  hover:bg-(--primary1)'
                }`}
              >
                {range.label} {range.count > 0 && `(${range.count})`}
              </button>
            ))}
          </div>
        )}

        {/* Advanced Filters */}
        <div className="mb-6 rounded-3xl border border-(--dark)/20 bg-(--light) p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
              >
                Clear all ({activeFiltersCount})
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-(--dark)">Diet</label>
              <FacetedDropdown
                title="Diet"
                options={facets?.diet || []}
                selectedValues={filters.diet}
                onChange={(values) => updateFilters({ diet: values })}
                placeholder="Any diet"
                loading={loading && !facets}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-(--dark)">Cuisine</label>
              <FacetedDropdown
                title="Cuisine"
                options={facets?.cuisine || []}
                selectedValues={filters.cuisine}
                onChange={(values) => updateFilters({ cuisine: values })}
                placeholder="Any cuisine"
                loading={loading && !facets}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-(--dark)">Cooking Method</label>
              <FacetedDropdown
                title="Method"
                options={facets?.method || []}
                selectedValues={filters.method}
                onChange={(values) => updateFilters({ method: values })}
                placeholder="Any method"
                loading={loading && !facets}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-(--dark)">Difficulty</label>
              <select
                value={filters.difficulty || ''}
                onChange={(e) => updateFilters({ difficulty: e.target.value || undefined })}
                disabled={loading && !facets}
                className="w-full rounded-lg border border-(--dark)/20 px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Any difficulty</option>
                {facets?.difficulty.map((d) => (
                  <option
                    key={d.value}
                    value={d.value}
                    disabled={d.count === 0 && filters.difficulty !== d.value}
                  >
                    {d.label} ({d.count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-(--dark)">Meal Type</label>
              <FacetedDropdown
                title="Meal Type"
                options={facets?.mealTypes || []}
                selectedValues={filters.mealTypes}
                onChange={(values) => updateFilters({ mealTypes: values })}
                placeholder="Any meal"
                loading={loading && !facets}
              />
            </div>
          </div>

          {/* Season filter row — single select, no duplicate wrapping */}
          {!!facets?.season?.length && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Season</label>
              <div className="flex flex-wrap gap-2">
                {facets.season.map((season) => {
                  const isSelected = filters.season === season.value;
                  const isDisabled = season.count === 0 && !isSelected;
                  return (
                    <button
                      key={season.value}
                      type="button"
                      onClick={() => updateFilters({ season: isSelected ? undefined : season.value })}
                      disabled={isDisabled}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-(--primary1) text-(--dark) border-1 border-(--dark)'
                          : isDisabled
                          ? 'bg-transparent text-(--dark)/40 border-(--dark)/20 border-1 cursor-not-allowed'
                          : 'bg-transparent text-(--dark) border-(--dark) border-1  hover:bg-(--primary1)'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {season.label} ({season.count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {loading && !data ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-8 text-center">
              <p className="text-red-800 mb-4">{error}</p>
              <button
                onClick={() => fetchRecipesWithFacets(filters, page)}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : recipes.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <ChefHat className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="mb-4 text-lg text-gray-600">No recipes found with current filters</p>
              <p className="mb-6 text-sm text-gray-500">Try adjusting your filters or search terms</p>
              <button
                onClick={clearAllFilters}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recipes.map((r) => (
                  <RecipeCard
                    key={r.id}
                    id={r.id}
                    title={r.title}
                    description={r.summary ?? ''}
                    href={`/recipes/${r.slug ?? r.id}`}          // prefer slug if present
                    featuredImageUrl={r.featuredImageUrl ?? undefined}
                    dietary={r.dietary ?? []}
                    totalTime={r.totalTime ?? undefined}
                    difficulty={r.difficulty ?? undefined}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {pageWindow[0] > 1 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          1
                        </button>
                        {pageWindow[0] > 2 && <span className="px-2 py-2 text-gray-400">...</span>}
                      </>
                    )}

                    {pageWindow.map((n) => (
                      <button
                        key={n}
                        onClick={() => handlePageChange(n)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          n === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}

                    {pageWindow[pageWindow.length - 1] < totalPages && (
                      <>
                        {pageWindow[pageWindow.length - 1] < totalPages - 1 && (
                          <span className="px-2 py-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasMore}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Loading overlay for filter changes */}
        {loading && data && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Updating recipes...</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

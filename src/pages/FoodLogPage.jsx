import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, ChevronLeft, ChevronRight, Loader2, MessageSquareText,
  Plus, Search, Trash2, Zap,
} from 'lucide-react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { sumEntries, todayKey, uid } from '@/lib/utils';
import { FoodListItem } from '@/components/app/FoodListItem';
import SearchFoodRow from '@/components/app/SearchFoodRow';
import { PageHeader, Card, MacroLine, Input, Button } from '@/components/ui/primitives';
import {
  searchGlobalFoods,
  macrosForGrams,
  parseMealText,
  saveMealToCloud,
} from '@/lib/api/ingredientsApi';
import { parseMealLocally } from '@/lib/foods/clientMealParser';
import { buildDescribedMealEntry } from '@/lib/meals/describedMealEntry';

const LOG_TABS = [
  { id: 'describe', label: 'AI Describe', icon: MessageSquareText },
  { id: 'quick', label: 'Quick Add', icon: Zap },
  { id: 'recipes', label: 'Recipes', icon: BookOpen },
  { id: 'search', label: 'Search', icon: Search },
];

const initialQuick = { name: '', calories: '', protein: '', carbs: '', fat: '' };
const recipeInputProps = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: false,
  type: 'text',
};

function numberOrZero(value) {
  if (value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function entryTime(entry) {
  if (!entry.loggedAt) return '';
  return format(new Date(entry.loggedAt), 'h:mm a', { locale: enUS });
}

function gapLabel(prev, current) {
  if (!prev?.loggedAt || !current?.loggedAt) return null;
  const diff = Math.max(0, current.loggedAt - prev.loggedAt);
  const minutes = Math.round(diff / 60000);
  if (minutes < 20) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m after previous food`;
  if (m === 0) return `${h}h after previous food`;
  return `${h}h ${m}m after previous food`;
}

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function FoodLogPage() {
  const {
    selectedDate, shiftDate, removeEntry, entriesForDate, addEntry, addRecipe, recentFoods, recipes,
  } = useNutritionStore();
  const [activeTab, setActiveTab] = useState('describe');
  const [query, setQuery] = useState('');
  const [quick, setQuick] = useState(initialQuick);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showRecipeBuilder, setShowRecipeBuilder] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeIngredientQuery, setRecipeIngredientQuery] = useState('');
  const [recipeItems, setRecipeItems] = useState([]);
  const [recipeServings, setRecipeServings] = useState('1');
  const [describeText, setDescribeText] = useState('');
  const [describeBusy, setDescribeBusy] = useState(false);
  const [describeSaving, setDescribeSaving] = useState(false);
  const [describeError, setDescribeError] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [describePreview, setDescribePreview] = useState(null);

  const entries = useMemo(
    () => entriesForDate(selectedDate).slice().sort((a, b) => (a.loggedAt || 0) - (b.loggedAt || 0)),
    [entriesForDate, selectedDate],
  );
  const totals = useMemo(() => sumEntries(entries), [entries]);
  const isToday = selectedDate === todayKey();
  const dateTitle = isToday
    ? 'Today'
    : format(parseISO(selectedDate), 'EEEE, MMM d', { locale: enUS });
  const queryText = query.trim();
  const debouncedQueryText = useDebouncedValue(queryText, 300);
  const searchQuery = useQuery({
    queryKey: ['log-food-search', debouncedQueryText],
    queryFn: () => searchGlobalFoods(debouncedQueryText),
    enabled: activeTab === 'search' && debouncedQueryText.length >= 2,
    staleTime: 60_000,
    retry: 1,
  });
  const recipeIngredientSearchText = recipeIngredientQuery.trim();
  const recipeIngredientQueryResult = useQuery({
    queryKey: ['recipe-food-search', recipeIngredientSearchText],
    queryFn: () => searchGlobalFoods(recipeIngredientSearchText),
    enabled: activeTab === 'recipes' && showRecipeBuilder && recipeIngredientSearchText.length >= 2,
    staleTime: 60_000,
    retry: 1,
  });

  const visibleRecent = useMemo(() => {
    const q = queryText.toLowerCase();
    const foods = q
      ? recentFoods.filter((food) => food.name?.toLowerCase().includes(q))
      : recentFoods;
    return foods.slice(0, 8);
  }, [queryText, recentFoods]);

  const filteredRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((recipe) => recipe.name?.toLowerCase().includes(q));
  }, [recipes, recipeSearch]);

  const recipeTotals = useMemo(() => recipeItems.reduce(
    (sum, item) => ({
      calories: sum.calories + (item.calories || 0),
      protein: Math.round((sum.protein + (item.protein || 0)) * 10) / 10,
      carbs: Math.round((sum.carbs + (item.carbs || 0)) * 10) / 10,
      fat: Math.round((sum.fat + (item.fat || 0)) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  ), [recipeItems]);
  const describePreviewTotals = useMemo(() => {
    const items = describePreview?.items || [];
    return items.reduce(
      (sum, item) => ({
        calories: sum.calories + (item.calories || 0),
        protein: Math.round((sum.protein + (item.protein || 0)) * 10) / 10,
        carbs: Math.round((sum.carbs + (item.carbs || 0)) * 10) / 10,
        fat: Math.round((sum.fat + (item.fat || 0)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [describePreview]);

  const logFood = (food) => {
    addEntry({ ...food, meal: food.meal || 'snack' });
  };

  const logIngredient = (ingredient, selection = {}) => {
    const quantity = Math.max(1, Number(selection.quantity) || 1);
    const option = selection.servingOption;
    const grams = option ? (option.grams || ingredient.defaultGrams || 100) * quantity : ingredient.defaultGrams || 100;
    const optionMacros = option ? {
      calories: Math.round((option.calories || 0) * quantity),
      protein: Math.round((option.protein || 0) * quantity * 10) / 10,
      carbs: Math.round((option.carbs || 0) * quantity * 10) / 10,
      fat: Math.round((option.fat || 0) * quantity * 10) / 10,
    } : null;
    logFood({
      name: ingredient.displayName || ingredient.name,
      ingredientId: ingredient.id,
      barcode: ingredient.barcode,
      grams,
      servingUnit: option?.label,
      servingQuantity: quantity,
      nutritionSource: ingredient.nutritionSource || ingredient.source || 'verified-db',
      confidence: ingredient.confidence ?? 0.9,
      ...(optionMacros || macrosForGrams(ingredient.per100g || {}, grams)),
    });
  };

  const addRecipeIngredient = (food) => {
    const grams = food.defaultGrams || 100;
    const macros = food.calories != null && food.searchKind === 'product'
      ? {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      }
      : macrosForGrams(food.per100g || {}, grams);
    setRecipeItems((prev) => [
      ...prev,
      {
        id: uid(),
        name: food.displayName || food.name,
        ingredientId: food.id,
        barcode: food.barcode,
        grams,
        per100g: food.per100g || {},
        ...macros,
      },
    ]);
    setRecipeIngredientQuery('');
  };

  const removeRecipeIngredient = (id) => {
    setRecipeItems((prev) => prev.filter((item) => item.id !== id));
  };

  const saveRecipe = () => {
    const servings = Math.max(1, Number(recipeServings) || 1);
    if (!recipeName.trim() || recipeItems.length === 0) return;
    addRecipe({
      name: recipeName.trim(),
      servings,
      ingredients: recipeItems,
      totals: {
        calories: Math.round(recipeTotals.calories),
        protein: Math.round(recipeTotals.protein * 10) / 10,
        carbs: Math.round(recipeTotals.carbs * 10) / 10,
        fat: Math.round(recipeTotals.fat * 10) / 10,
      },
    });
    setRecipeName('');
    setRecipeItems([]);
    setRecipeServings('1');
    setShowRecipeBuilder(false);
  };

  const logRecipe = (recipe) => {
    const servings = Math.max(1, Number(recipe.servings) || 1);
    logFood({
      name: recipe.name,
      type: 'recipe',
      childCount: recipe.ingredients?.length || 0,
      items: recipe.ingredients || [],
      grams: recipe.ingredients?.reduce((sum, item) => sum + (item.grams || 0), 0) / servings || undefined,
      calories: Math.round((recipe.totals?.calories || 0) / servings),
      protein: Math.round(((recipe.totals?.protein || 0) / servings) * 10) / 10,
      carbs: Math.round(((recipe.totals?.carbs || 0) / servings) * 10) / 10,
      fat: Math.round(((recipe.totals?.fat || 0) / servings) * 10) / 10,
      nutritionSource: 'recipe',
      confidence: 1,
    });
  };

  const quickCalories = numberOrZero(quick.calories);
  const saveQuick = () => {
    if (!quick.name.trim() || quickCalories <= 0) return;
    logFood({
      name: quick.name.trim(),
      calories: quickCalories,
      protein: numberOrZero(quick.protein),
      carbs: numberOrZero(quick.carbs),
      fat: numberOrZero(quick.fat),
      nutritionSource: 'manual',
      confidence: 1,
    });
    setQuick(initialQuick);
  };

  const analyzeDescribeMeal = async () => {
    if (describeText.trim().length < 3) return;
    setDescribeBusy(true);
    setDescribeError('');
    setDescribePreview(null);
    setIsReviewing(false);
    try {
      let result;
      try {
        result = await parseMealText(describeText, {});
      } catch {
        result = await parseMealLocally(describeText, {});
      }

      const pending = result.items?.filter((item) => item.needsClarification).length || 0;
      if (pending > 0) {
        setDescribeError('This meal needs clarification. Add exact amounts or use the detailed Describe Meal page.');
        return;
      }
      if (!result.items?.length) {
        setDescribeError('No verified foods found. Try adding amounts like "1 banana" or "200g chicken".');
        return;
      }

      setDescribePreview(result);
      setIsReviewing(true);
    } catch (error) {
      setDescribeError(error.message || 'Could not analyze this meal.');
    } finally {
      setDescribeBusy(false);
    }
  };

  const confirmDescribeMeal = async () => {
    if (!describePreview?.items?.length) return;
    setDescribeSaving(true);
    setDescribeError('');
    try {
      const entry = buildDescribedMealEntry({
        text: describeText,
        items: describePreview.items,
        name: describePreview.mealName,
      });
      logFood(entry);

      if (describePreview.estimatedMeal || describePreview.items.some((item) => item.estimated || item.aiEstimated)) {
        await saveMealToCloud({
          id: uid(),
          name: entry.name,
          items: describePreview.items,
          totals: {
            totalCalories: describePreviewTotals.calories,
            totalProtein: describePreviewTotals.protein,
            totalCarbs: describePreviewTotals.carbs,
            totalFat: describePreviewTotals.fat,
          },
          estimatedMeal: describePreview.estimatedMeal || describePreview.items.some((item) => item.estimated || item.aiEstimated),
          sourceText: describeText,
        });
      }

      setDescribeText('');
      setDescribePreview(null);
      setIsReviewing(false);
    } catch (error) {
      setDescribeError(error.message || 'Could not log this meal.');
    } finally {
      setDescribeSaving(false);
    }
  };

  const cancelDescribeReview = () => {
    setIsReviewing(false);
    setDescribePreview(null);
    setDescribeError('');
  };

  return (
    <div className="px-4 pt-3 safe-top pb-nav space-y-4 max-w-lg mx-auto">
      <PageHeader
        label="FOOD LOG"
        title={dateTitle}
        right={
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => shiftDate(-1)} className="p-2 rounded-full bg-surface-2">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="p-2 rounded-full bg-surface-2 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <Card className="p-4">
        <MacroLine
          calories={totals.calories}
          protein={totals.protein}
          fat={totals.fat}
          carbs={totals.carbs}
          className="text-sm"
        />
        <p className="text-xs text-muted mt-2">{entries.length} foods logged</p>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-4 items-stretch border-b border-white/[0.06]">
          {LOG_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`min-w-0 flex items-center justify-center gap-1 px-1.5 py-2.5 text-[10px] font-semibold transition-colors ${
                activeTab === id ? 'text-white border-b-2 border-white' : 'text-muted border-b-2 border-transparent'
              }`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'search' && (
          <div className="p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods, ingredients, products"
                className="h-10 pl-9 bg-zinc-900 border-zinc-800 text-[13px] focus:ring-white/10"
              />
            </div>
            {queryText.length >= 2 && (searchQuery.isLoading || queryText !== debouncedQueryText) && (
              <div className="flex items-center justify-center py-8 text-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
            {debouncedQueryText.length >= 2 && searchQuery.isError && (
              <p className="text-sm text-amber-300 text-center py-4">
                Search is temporarily unavailable. Try another query or use Quick Add.
              </p>
            )}
            {debouncedQueryText.length >= 2 && queryText === debouncedQueryText && (searchQuery.data || []).map((item) => (
              <SearchFoodRow
                key={item.id}
                name={item.displayName || item.name}
                serving={item.servingOptions?.length
                  ? item.source || 'localized serving data'
                  : item.searchKind === 'product'
                  ? `${item.defaultGrams || 100}g serving · ${item.source || 'product'}`
                  : `per 100g · ${item.per100g?.calories || 0} kcal`}
                calories={item.servingOptions?.[0]?.calories ?? (item.searchKind === 'product' ? item.calories : item.per100g?.calories || 0)}
                protein={item.servingOptions?.[0]?.protein ?? (item.searchKind === 'product' ? item.protein : item.per100g?.protein || 0)}
                fat={item.servingOptions?.[0]?.fat ?? (item.searchKind === 'product' ? item.fat : item.per100g?.fat || 0)}
                carbs={item.servingOptions?.[0]?.carbs ?? (item.searchKind === 'product' ? item.carbs : item.per100g?.carbs || 0)}
                variant={item.variant}
                icon={item.searchKind === 'product' ? '📦' : '🥗'}
                servingOptions={item.servingOptions}
                onQuickAdd={(selection) => logIngredient(item, selection)}
              />
            ))}
            {debouncedQueryText.length >= 2 && queryText === debouncedQueryText && !searchQuery.isLoading && !searchQuery.isError && (searchQuery.data || []).length === 0 && (
              <p className="text-sm text-muted text-center py-6">No foods found for “{debouncedQueryText}”.</p>
            )}
            {queryText.length < 2 && visibleRecent.length === 0 && (
              <p className="text-sm text-muted text-center py-8">Search or use AI Describe / Quick Add / Recipes above.</p>
            )}
            {queryText.length < 2 && visibleRecent.map((food, i) => (
              <SearchFoodRow
                key={`${food.barcode || food.ingredientId || food.name}-${i}`}
                name={food.name}
                serving={food.grams ? `${food.grams}g · Recent` : 'Recent'}
                calories={food.calories}
                protein={food.protein}
                fat={food.fat}
                carbs={food.carbs}
                icon={food.barcode ? '📦' : '🍽'}
                onQuickAdd={() => logFood(food)}
              />
            ))}
          </div>
        )}

        {activeTab === 'quick' && (
          <div className="p-4 space-y-3">
            <Input
              value={quick.name}
              onChange={(e) => setQuick((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Food name"
            />
            <div className="grid grid-cols-2 gap-2">
              {[
                ['calories', 'Calories'],
                ['protein', 'Protein (g)'],
                ['carbs', 'Carbs (g)'],
                ['fat', 'Fat (g)'],
              ].map(([key, label]) => (
                <Input
                  key={key}
                  type="number"
                  inputMode="decimal"
                  value={quick[key]}
                  onChange={(e) => setQuick((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={label}
                />
              ))}
            </div>
            <Button className="w-full" onClick={saveQuick} disabled={!quick.name.trim() || quickCalories <= 0}>
              Log quick food
            </Button>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="p-3 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  {...recipeInputProps}
                  className="pl-10"
                  placeholder="Search saved recipes"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowRecipeBuilder((value) => !value)}
                aria-label="Create a recipe"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {showRecipeBuilder && (
              <Card className="p-4 space-y-3 border-white/10">
                <Input
                  {...recipeInputProps}
                  placeholder="Recipe name"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                />
                <Input
                  {...recipeInputProps}
                  inputMode="numeric"
                  min="1"
                  placeholder="Servings"
                  value={recipeServings}
                  onChange={(e) => setRecipeServings(e.target.value)}
                />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <Input
                    {...recipeInputProps}
                    className="pl-10"
                    placeholder="Search ingredient to add"
                    value={recipeIngredientQuery}
                    onChange={(e) => setRecipeIngredientQuery(e.target.value)}
                  />
                </div>
                {recipeIngredientQueryResult.isLoading && (
                  <div className="flex justify-center py-4 text-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
                {(recipeIngredientQueryResult.data || []).slice(0, 5).map((food) => (
                  <SearchFoodRow
                    key={food.id}
                    name={food.displayName || food.name}
                    serving={food.searchKind === 'product' ? `${food.defaultGrams || 100}g serving` : 'Ingredient'}
                    calories={food.searchKind === 'product' ? food.calories : food.per100g?.calories || 0}
                    protein={food.searchKind === 'product' ? food.protein : food.per100g?.protein || 0}
                    fat={food.searchKind === 'product' ? food.fat : food.per100g?.fat || 0}
                    carbs={food.searchKind === 'product' ? food.carbs : food.per100g?.carbs || 0}
                    icon={food.searchKind === 'product' ? '📦' : '🥗'}
                    onQuickAdd={() => addRecipeIngredient(food)}
                  />
                ))}
                {recipeItems.length > 0 && (
                  <div className="space-y-2">
                    {recipeItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <MacroLine
                            calories={item.calories}
                            protein={item.protein}
                            fat={item.fat}
                            carbs={item.carbs}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRecipeIngredient(item.id)}
                          className="p-2 text-muted hover:text-red-400"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <Card className="p-3 bg-surface-2">
                      <p className="text-[10px] text-muted font-bold uppercase">Recipe total</p>
                      <MacroLine
                        calories={recipeTotals.calories}
                        protein={recipeTotals.protein}
                        fat={recipeTotals.fat}
                        carbs={recipeTotals.carbs}
                        className="mt-1 text-sm"
                      />
                    </Card>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowRecipeBuilder(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={saveRecipe}
                    disabled={!recipeName.trim() || recipeItems.length === 0}
                  >
                    Save Recipe
                  </Button>
                </div>
              </Card>
            )}

            {filteredRecipes.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">
                {recipes.length === 0 ? 'No saved recipes yet.' : 'No recipes match your search.'}
              </p>
            ) : (
              filteredRecipes.map((recipe) => {
                const servings = Math.max(1, Number(recipe.servings) || 1);
                return (
                  <SearchFoodRow
                    key={recipe.id}
                    name={recipe.name}
                    serving={`${recipe.ingredients?.length || 0} ingredients · ${servings} servings`}
                    calories={Math.round((recipe.totals?.calories || 0) / servings)}
                    protein={Math.round(((recipe.totals?.protein || 0) / servings) * 10) / 10}
                    fat={Math.round(((recipe.totals?.fat || 0) / servings) * 10) / 10}
                    carbs={Math.round(((recipe.totals?.carbs || 0) / servings) * 10) / 10}
                    icon="🍲"
                    onQuickAdd={() => logRecipe(recipe)}
                  />
                );
              })
            )}
          </div>
        )}

        {activeTab === 'describe' && (
          <div className="p-4 space-y-3">
            {isReviewing && describePreview ? (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Review</p>
                  <h2 className="text-lg font-extrabold mt-1">Verify Your Meal Macros</h2>
                </div>
                <div className="space-y-2">
                  {(describePreview.items || []).map((item, index) => (
                    <div
                      key={`${item.rawLine || item.name}-${index}`}
                      className="rounded-2xl bg-surface-2 border border-white/[0.06] px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{item.name}</p>
                          <p className="text-[10px] text-muted mt-0.5">
                            {item.weight || item.grams || 0}g
                            {(item.estimated || item.aiEstimated) && <span className="text-amber-300"> · AI Estimated</span>}
                          </p>
                        </div>
                        <p className="text-sm font-extrabold tabular-nums shrink-0">{Math.round(item.calories || 0)} kcal</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] tabular-nums">
                        <div className="rounded-lg bg-black/20 px-2 py-1 text-center">
                          <span className="text-muted">P </span>
                          <span className="font-bold text-macro-protein">{Math.round((item.protein || 0) * 10) / 10}g</span>
                        </div>
                        <div className="rounded-lg bg-black/20 px-2 py-1 text-center">
                          <span className="text-muted">C </span>
                          <span className="font-bold text-macro-carbs">{Math.round((item.carbs || 0) * 10) / 10}g</span>
                        </div>
                        <div className="rounded-lg bg-black/20 px-2 py-1 text-center">
                          <span className="text-muted">F </span>
                          <span className="font-bold text-macro-fat">{Math.round((item.fat || 0) * 10) / 10}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Card className="p-4 bg-surface-2 border-white/10">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Total Preview</p>
                  <p className="text-2xl font-extrabold tabular-nums mt-1">{Math.round(describePreviewTotals.calories)} kcal</p>
                  <div className="flex gap-4 mt-2 text-sm font-semibold tabular-nums">
                    <span className="text-macro-protein">{describePreviewTotals.protein}g P</span>
                    <span className="text-macro-carbs">{describePreviewTotals.carbs}g C</span>
                    <span className="text-macro-fat">{describePreviewTotals.fat}g F</span>
                  </div>
                </Card>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={cancelDescribeReview}
                    disabled={describeSaving}
                  >
                    Cancel / Edit
                  </Button>
                  <Button
                    variant="accent"
                    onClick={confirmDescribeMeal}
                    disabled={describeSaving}
                  >
                    {describeSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {describeSaving ? 'Logging...' : 'Confirm & Log Meal'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  value={describeText}
                  onChange={(e) => {
                    setDescribeText(e.target.value);
                    setDescribeError('');
                    setDescribePreview(null);
                    setIsReviewing(false);
                  }}
                  placeholder={'small shawarma\n\nor\n\n200g cooked beef\nmixed cheese\n2 small tortillas'}
                  className="w-full min-h-[120px] rounded-2xl bg-surface-2 border border-white/[0.08] p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                <div className="flex justify-center">
                  <Button
                    className="min-w-[170px]"
                    onClick={analyzeDescribeMeal}
                    disabled={describeBusy || describeText.trim().length < 3}
                  >
                    {describeBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {describeBusy ? 'Analyzing...' : 'Analyze meal'}
                  </Button>
                </div>
              </>
            )}
            {describeError && <p className="text-xs text-amber-300 text-center">{describeError}</p>}
          </div>
        )}
      </Card>

      <section>
        <div className="flex items-center justify-between px-1 mb-2">
          <h2 className="text-sm font-bold">Timeline</h2>
          <span className="text-xs text-muted tabular-nums">{Math.round(totals.calories)} kcal</span>
        </div>
        <Card className="overflow-hidden p-0">
          {entries.length === 0 ? (
            <p className="text-sm text-muted text-center py-10">No foods logged for this day yet.</p>
          ) : (
            entries.map((entry, index) => {
              const gap = gapLabel(entries[index - 1], entry);
              return (
                <div key={entry.id}>
                  {gap && (
                    <div className="px-4 py-2 bg-surface-2/60 text-[10px] text-muted font-semibold uppercase tracking-[0.08em]">
                      {gap}
                    </div>
                  )}
                  <FoodListItem entry={entry} onDelete={removeEntry} timeLabel={entryTime(entry)} />
                </div>
              );
            })
          )}
        </Card>
      </section>

    </div>
  );
}

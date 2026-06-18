import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ChefHat } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNutritionStore } from '@/store/useNutritionStore';
import { searchGlobalFoods, macrosForGrams } from '@/lib/api/ingredientsApi';
import { Card, Button, Input } from '@/components/ui/primitives';
import { NumericInput } from '@/components/ui/NumericInput';
import { uid } from '@/lib/utils';

function sumIngredientTotals(ingredients) {
  return ingredients.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: Math.round((acc.protein + (item.protein || 0)) * 10) / 10,
      carbs: Math.round((acc.carbs + (item.carbs || 0)) * 10) / 10,
      fat: Math.round((acc.fat + (item.fat || 0)) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export default function RecipesPage() {
  const { recipes, addRecipe, removeRecipe, addEntry } = useNutritionStore();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [ingQuery, setIngQuery] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [servings, setServings] = useState('1');

  const { data: searchResults = [] } = useQuery({
    queryKey: ['recipe-food-search', ingQuery],
    queryFn: () => searchGlobalFoods(ingQuery),
    enabled: ingQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const totals = useMemo(() => sumIngredientTotals(ingredients), [ingredients]);

  const addIngredient = (food) => {
    const per100g = food.per100g || {};
    const weight = food.defaultGrams || 100;
    const macros = macrosForGrams(per100g, weight);
    setIngredients((prev) => [
      ...prev,
      {
        id: uid(),
        name: food.displayName || food.name,
        ingredientId: food.id,
        barcode: food.barcode,
        weight,
        grams: weight,
        per100g,
        baseCaloriesPer100g: per100g.calories || 0,
        baseProteinPer100g: per100g.protein || 0,
        baseCarbsPer100g: per100g.carbs || 0,
        baseFatPer100g: per100g.fat || 0,
        ...macros,
      },
    ]);
    setIngQuery('');
  };

  const applyIngredientWeight = (id, weight) => {
    const safeWeight = Math.max(0, Number(weight) || 0);
    setIngredients((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const per100g = item.per100g || {
        calories: item.baseCaloriesPer100g || 0,
        protein: item.baseProteinPer100g || 0,
        carbs: item.baseCarbsPer100g || 0,
        fat: item.baseFatPer100g || 0,
      };
      return {
        ...item,
        weight: safeWeight,
        grams: safeWeight,
        ...macrosForGrams(per100g, safeWeight),
      };
    }));
  };

  const saveRecipe = () => {
    if (!name.trim() || ingredients.length === 0) return;
    const servingCount = Math.max(1, Number(servings) || 1);
    addRecipe({
      name: name.trim(),
      servings: servingCount,
      ingredients,
      totals: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
      },
    });
    setShowNew(false);
    setName('');
    setIngredients([]);
    setServings('1');
  };

  const logRecipe = (recipe) => {
    const servingCount = Math.max(1, Number(recipe.servings) || 1);
    const liveTotals = sumIngredientTotals(recipe.ingredients || []);
    addEntry({
      name: recipe.name,
      type: 'recipe',
      childCount: recipe.ingredients?.length || 0,
      items: recipe.ingredients || [],
      grams: (recipe.ingredients || []).reduce((sum, item) => sum + (item.grams || 0), 0) / servingCount || undefined,
      calories: Math.round(liveTotals.calories / servingCount),
      protein: Math.round((liveTotals.protein / servingCount) * 10) / 10,
      carbs: Math.round((liveTotals.carbs / servingCount) * 10) / 10,
      fat: Math.round((liveTotals.fat / servingCount) * 10) / 10,
      nutritionSource: 'recipe',
      confidence: 1,
      meal: 'lunch',
    });
  };

  return (
    <div className="px-4 pt-4 safe-top space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rețete</h1>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> Nouă
        </Button>
      </div>

      {showNew && (
        <Card className="p-4 space-y-3">
          <Input placeholder="Nume rețetă" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Caută ingredient (staples, brand, OFF)…"
            value={ingQuery}
            onChange={(e) => setIngQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <ul className="max-h-40 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
              {searchResults.slice(0, 8).map((food) => (
                <li key={food.id || food.barcode || food.name}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                    onClick={() => addIngredient(food)}
                  >
                    <span className="font-medium">{food.displayName || food.name}</span>
                    <span className="text-muted ml-2 text-xs">{Math.round(food.per100g?.calories || 0)} kcal/100g</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ul className="space-y-2 text-sm">
            {ingredients.map((item) => (
              <li key={item.id} className="flex items-center gap-2 rounded-xl bg-surface-2 p-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted tabular-nums">{Math.round(item.calories || 0)} kcal</p>
                </div>
                <NumericInput
                  value={item.weight ?? item.grams ?? 100}
                  fallback={100}
                  min={0}
                  step={1}
                  className="w-20"
                  onNumberChange={(weight) => applyIngredientWeight(item.id, weight)}
                />
                <span className="text-xs text-muted">g</span>
                <button type="button" className="text-muted p-1" onClick={() => setIngredients((prev) => prev.filter((i) => i.id !== item.id))}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Porții</span>
            <NumericInput
              value={servings}
              fallback={1}
              min={1}
              step={1}
              className="w-20"
              onNumberChange={(value) => setServings(String(Math.max(1, value)))}
            />
          </div>
          {ingredients.length > 0 && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div><p className="text-muted">kcal</p><p className="font-bold tabular-nums">{Math.round(totals.calories)}</p></div>
              <div><p className="text-muted">P</p><p className="font-bold tabular-nums">{totals.protein}g</p></div>
              <div><p className="text-muted">C</p><p className="font-bold tabular-nums">{totals.carbs}g</p></div>
              <div><p className="text-muted">F</p><p className="font-bold tabular-nums">{totals.fat}g</p></div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowNew(false)}>Anulează</Button>
            <Button className="flex-1" onClick={saveRecipe}>Salvează</Button>
          </div>
        </Card>
      )}

      {recipes.length === 0 && !showNew && (
        <Card className="p-8 text-center">
          <ChefHat className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">Creează rețete cu ingrediente verificate, branduri locale sau produse scanate.</p>
        </Card>
      )}

      {recipes.map((r) => (
        <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{r.name}</h3>
                <p className="text-sm text-accent font-bold tabular-nums mt-1">
                  {Math.round(sumIngredientTotals(r.ingredients || []).calories || r.totals?.calories || 0)} kcal · {r.servings} porții
                </p>
                <p className="text-[10px] text-muted mt-1">{r.ingredients?.length || 0} ingrediente</p>
              </div>
              <button type="button" onClick={() => removeRecipe(r.id)} className="text-muted p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <Button size="sm" variant="secondary" className="w-full mt-3" onClick={() => logRecipe(r)}>
              Loghează 1 porție
            </Button>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Plus } from 'lucide-react';
import { Input, Card, Button, PageHeader } from '@/components/ui/primitives';
import { fetchSavedMeals } from '@/lib/api/ingredientsApi';
import { useNutritionStore } from '@/store/useNutritionStore';

export default function MyMealsPage() {
  const navigate = useNavigate();
  const addEntry = useNutritionStore((s) => s.addEntry);
  const [query, setQuery] = useState('');

  const mealsQuery = useQuery({
    queryKey: ['meals', query],
    queryFn: () => fetchSavedMeals(query),
    staleTime: 30_000,
  });

  const meals = mealsQuery.data || [];

  const logSavedMeal = (meal) => {
    const t = meal.totals || {};
    addEntry({
      name: meal.name,
      grams: meal.items?.reduce((s, i) => s + (i.weight || 0), 0) || 100,
      calories: t.totalCalories || 0,
      protein: t.totalProtein || 0,
      carbs: t.totalCarbs || 0,
      fat: t.totalFat || 0,
      type: 'described-meal',
      items: meal.items || [],
      childCount: meal.items?.length || 0,
      nutritionSource: meal.estimatedMeal ? 'estimate' : 'saved-meal',
      confidence: meal.estimatedMeal ? 0.8 : 1,
      meal: 'lunch',
    });
    navigate('/log');
  };

  return (
    <div className="px-4 pt-3 safe-top space-y-4 max-w-lg mx-auto">
      <PageHeader
        label="SAVED"
        title="Saved Meals"
        right={
          <Button size="sm" variant="secondary" onClick={() => navigate('/log')}>
            <Plus className="w-4 h-4" /> New
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <Input
          className="pl-10"
          placeholder="Caută masă salvată…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {mealsQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}

      {!mealsQuery.isLoading && meals.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted">
          <p>Nicio masă salvată.</p>
          <p className="mt-2">Folosește „Descrie masa” și salvează-o pentru reutilizare.</p>
          <Button className="mt-4 w-full" onClick={() => navigate('/log')}>
            Descrie o masă
          </Button>
        </Card>
      )}

      <ul className="space-y-3">
        {meals.map((meal) => {
          const t = meal.totals || {};
          return (
            <li key={meal.id}>
              <button type="button" onClick={() => logSavedMeal(meal)} className="w-full text-left touch-target">
                <Card className="p-4">
                  <p className="font-bold">{meal.name}</p>
                  <p className="text-xs text-muted mt-1">
                    {meal.items?.length || 0} ingrediente
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-sm font-bold text-accent tabular-nums">{t.totalCalories || 0} kcal</span>
                    <span className="text-xs text-blue-400">P {t.totalProtein || 0}g</span>
                    <span className="text-xs text-yellow-400">C {t.totalCarbs || 0}g</span>
                    <span className="text-xs text-pink-400">F {t.totalFat || 0}g</span>
                  </div>
                </Card>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

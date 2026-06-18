import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { Input, Card, Button, PageHeader, Badge } from '@/components/ui/primitives';
import SearchFoodRow from '@/components/app/SearchFoodRow';
import { searchIngredients, macrosForGrams } from '@/lib/api/ingredientsApi';
import { pushRecentIngredient } from '@/lib/cache/ingredientCache';
import { useNutritionStore } from '@/store/useNutritionStore';

const VARIANT_LABELS = { raw: 'Raw', cooked: 'Cooked', dry: 'Dry', medium: 'Medium', whole: 'Whole' };

export default function SearchIngredientPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const addEntry = useNutritionStore((s) => s.addEntry);
  const [query, setQuery] = useState(params.get('q') || '');
  const [selected, setSelected] = useState(null);
  const [grams, setGrams] = useState(100);

  useEffect(() => {
    const q = params.get('q');
    if (q) setQuery(q);
  }, [params]);

  const searchQuery = useQuery({
    queryKey: ['ingredients', query],
    queryFn: () => searchIngredients(query),
    enabled: query.trim().length >= 2,
    staleTime: 60_000,
  });

  const results = searchQuery.data || [];

  const pickIngredient = (ing) => {
    setSelected(ing);
    setGrams(ing.defaultGrams || 100);
    pushRecentIngredient(ing);
  };

  const addIngredient = () => {
    if (!selected) return;
    const macros = macrosForGrams(selected.per100g, grams);
    addEntry({
      name: selected.displayName || selected.name,
      ingredientId: selected.id,
      grams,
      meal: 'snack',
      nutritionSource: selected.nutritionSource || 'verified-db',
      confidence: selected.confidence ?? 0.9,
      ...macros,
    });
    navigate('/log');
  };

  const preview = selected ? macrosForGrams(selected.per100g, grams) : null;

  return (
    <div className="px-4 pt-3 safe-top space-y-4 max-w-lg mx-auto">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <PageHeader label="VERIFIED FOODS" title="Search Foods" />
      <p className="text-xs text-muted -mt-2">Raw and cooked variants listed separately — pick the correct one.</p>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <Input
          className="pl-12"
          placeholder="chicken, rice, eggs, banana…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          autoFocus
        />
      </div>

      {query.length < 2 && (
        <p className="text-sm text-muted text-center py-8">Type at least 2 characters</p>
      )}

      {searchQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {!selected && results.length > 0 && (
        <Card className="overflow-hidden p-0 max-h-[55dvh] overflow-y-auto">
          {results.map((ing) => (
            <button
              key={ing.id}
              type="button"
              onClick={() => pickIngredient(ing)}
              className="w-full text-left"
            >
              <SearchFoodRow
                name={ing.displayName || ing.name}
                serving={`per 100g · ${ing.per100g?.calories || 0} kcal`}
                calories={ing.per100g?.calories || 0}
                protein={ing.per100g?.protein || 0}
                fat={ing.per100g?.fat || 0}
                carbs={ing.per100g?.carbs || 0}
                variant={ing.variant}
                icon="🥗"
              />
            </button>
          ))}
        </Card>
      )}

      {selected && preview && (
        <Card className="p-5 space-y-4" elevated>
          <div>
            <p className="font-bold text-lg">{selected.displayName}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {selected.variant && (
                <Badge variant={selected.variant}>{VARIANT_LABELS[selected.variant] || selected.variant}</Badge>
              )}
              <Badge>
                {selected.source === 'usda'
                  ? 'USDA'
                  : selected.source === 'localized-nutrition'
                    ? 'Local Brand'
                    : selected.source === 'estimated'
                      ? 'Estimated'
                      : 'Verified DB'}
              </Badge>
              <span className="text-[10px] text-emerald-400 font-semibold">
                Accuracy {Math.round((selected.confidence ?? 0.95) * 100)}%
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted font-semibold uppercase">Serving (g)</label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={grams}
                onChange={(e) => setGrams(Number(e.target.value))}
                className="flex-1 accent-white"
              />
              <span className="font-bold w-14 text-right tabular-nums">{grams}g</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-2">
              <p className="text-lg font-bold">{preview.calories}</p>
              <p className="text-[10px] text-muted">kcal</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-2">
              <p className="text-lg font-bold text-macro-protein">{preview.protein}</p>
              <p className="text-[10px] text-muted">P</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-2">
              <p className="text-lg font-bold text-macro-carbs">{preview.carbs}</p>
              <p className="text-[10px] text-muted">C</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-2">
              <p className="text-lg font-bold text-macro-fat">{preview.fat}</p>
              <p className="text-[10px] text-muted">F</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>
              Back
            </Button>
            <Button variant="primary" className="flex-1" onClick={addIngredient}>
              Log · {preview.calories} kcal
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

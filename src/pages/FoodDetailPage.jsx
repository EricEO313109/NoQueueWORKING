import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { Card, Button, MacroLine, Badge, PageHeader } from '@/components/ui/primitives';
import { macrosForGrams, parseMealText } from '@/lib/api/ingredientsApi';
import { parseMealLocally } from '@/lib/foods/clientMealParser';
import { compactMealItem, totalsFromMealItems } from '@/lib/meals/describedMealEntry';
import { persistDescribeItemCorrection } from '@/lib/nutrition/userCorrections';

const SOURCE_LABELS = {
  'verified-db': 'Verified Database',
  USDA: 'USDA',
  usda: 'USDA',
  openfoodfacts: 'OpenFoodFacts',
  'user-verified': 'User Verified',
  'ai-label': 'AI Label Scan',
  describe: 'Meal Parser',
  unknown: 'Estimated',
};

export default function FoodDetailPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { entries, removeEntry, updateEntry } = useNutritionStore();
  const [addText, setAddText] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return (
      <div className="px-4 pt-4 safe-top">
        <p className="text-muted">Food not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  const source = entry.nutritionSource || entry.source || 'unknown';
  const isDescribedMeal = entry.type === 'described-meal' && Array.isArray(entry.items);

  const updateMealItems = (items) => {
    const totals = totalsFromMealItems(items);
    updateEntry(entry.id, {
      items,
      childCount: items.length,
      grams: Math.round(items.reduce((sum, item) => sum + (item.grams || item.weight || 0), 0) * 10) / 10,
      calories: Math.round(totals.calories),
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    });
  };

  const updateItemWeight = (idx, grams) => {
    const next = [...entry.items];
    const item = next[idx];
    const macros = item.per100g ? macrosForGrams(item.per100g, grams) : {};
    next[idx] = { ...item, grams, weight: grams, ...macros };
    persistDescribeItemCorrection(next[idx]);
    updateMealItems(next);
  };

  const removeMealItem = (idx) => {
    const next = entry.items.filter((_, itemIdx) => itemIdx !== idx);
    if (next.length === 0) {
      removeEntry(entry.id);
      navigate('/log');
      return;
    }
    updateMealItems(next);
  };

  const addMealItems = async () => {
    if (addText.trim().length < 3) return;
    setAdding(true);
    setAddError('');
    try {
      let result;
      try {
        result = await parseMealText(addText, {});
      } catch {
        result = await parseMealLocally(addText, {});
      }
      const pending = result.items?.filter((item) => item.needsClarification).length || 0;
      if (pending > 0) {
        setAddError('This needs clarification. Use Advanced Describe to resolve it, then log it.');
        return;
      }
      const additions = (result.items || [])
        .filter((item) => item.matched && item.calories > 0)
        .map(compactMealItem);
      if (!additions.length) {
        setAddError('No loggable ingredients found.');
        return;
      }
      updateMealItems([...(entry.items || []), ...additions]);
      setAddText('');
    } catch (error) {
      setAddError(error.message || 'Could not add those ingredients.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="px-4 pt-3 safe-top space-y-5 max-w-lg mx-auto">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted text-sm mb-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <PageHeader title={entry.name} label={entry.meal?.toUpperCase() || 'FOOD'} />

      <Card className="p-6" elevated>
        <p className="text-5xl font-extrabold tabular-nums text-center">{entry.calories}</p>
        <p className="text-center text-sm text-muted mb-6">calories</p>
        <MacroLine
          calories={entry.calories}
          protein={entry.protein}
          fat={entry.fat}
          carbs={entry.carbs}
          className="text-center text-sm"
        />
      </Card>

      {isDescribedMeal && (
        <Card className="p-4 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted">Ingredients</p>
            <p className="text-sm text-muted mt-0.5">Edit the meal without splitting it into separate log entries.</p>
          </div>

          {entry.items.map((item, idx) => (
            <div key={`${item.ingredientId || item.name}-${idx}`} className="rounded-2xl bg-surface-2 p-3 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <MacroLine
                    calories={item.calories}
                    protein={item.protein}
                    fat={item.fat}
                    carbs={item.carbs}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMealItem(idx)}
                  className="p-2 text-muted hover:text-red-400"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={600}
                  step={5}
                  value={item.grams || item.weight || 100}
                  onChange={(event) => updateItemWeight(idx, Number(event.target.value))}
                  className="flex-1 accent-white"
                />
                <span className="font-bold tabular-nums w-14 text-right text-sm">{item.grams || item.weight || 100}g</span>
              </div>
            </div>
          ))}

          <div className="space-y-2 pt-1">
            <textarea
              value={addText}
              onChange={(event) => setAddText(event.target.value)}
              placeholder={'Add more, e.g.\n20g peanut butter'}
              className="w-full min-h-[84px] rounded-2xl bg-surface-2 border border-white/[0.08] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            {addError && <p className="text-xs text-amber-300">{addError}</p>}
            <Button className="w-full" variant="secondary" onClick={addMealItems} disabled={adding || addText.trim().length < 3}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add to this meal
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted">Serving Size</p>
          <p className="text-lg font-bold mt-0.5">{entry.grams ? `${entry.grams}g` : '1 serving'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted">Source</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{SOURCE_LABELS[source] || source}</Badge>
            {entry.confidence != null && (
              <span className="text-xs text-muted">{Math.round(entry.confidence * 100)}% confidence</span>
            )}
          </div>
        </div>
        {entry.barcode && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted">Barcode</p>
            <p className="text-sm font-mono mt-0.5">{entry.barcode}</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {[
          ['Protein', entry.protein, 'text-macro-protein'],
          ['Carbs', entry.carbs, 'text-macro-carbs'],
          ['Fat', entry.fat, 'text-macro-fat'],
        ].map(([label, val, color]) => (
          <Card key={label} className="p-3 text-center">
            <p className="text-[10px] text-muted">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${color}`}>{val}g</p>
          </Card>
        ))}
      </div>

      <Button
        variant="danger"
        className="w-full"
        onClick={() => {
          removeEntry(entry.id);
          navigate('/log');
        }}
      >
        <Trash2 className="w-4 h-4" /> Remove from log
      </Button>
    </div>
  );
}

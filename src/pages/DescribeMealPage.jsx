import { useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Save, Check, AlertCircle } from 'lucide-react';
import { Button, Card, Input, PageHeader } from '@/components/ui/primitives';
import { parseMealText, saveMealToCloud, macrosForGrams } from '@/lib/api/ingredientsApi';
import { parseMealLocally } from '@/lib/foods/clientMealParser';
import { formatLoggedFoodName } from '../../lib/nutrition/quantityParser.js';
import { useNutritionStore } from '@/store/useNutritionStore';
import MealBreakdown from '@/components/meals/MealBreakdown';
import ClarificationPanel from '@/components/nutrition/ClarificationPanel';
import { uid } from '@/lib/utils';
import { buildDescribedMealEntry } from '@/lib/meals/describedMealEntry';

const EXAMPLES = [
  '1 plate chicken alfredo pasta',
  'small shawarma',
  '2 slices of pizza',
  '100g chicken breast\n100g dry rice\n20g mayonnaise\n1 tortilla',
];

function sumTotals(items) {
  const matched = items.filter((i) => i.matched && !i.needsClarification);
  return matched.reduce(
    (a, it) => ({
      totalCalories: a.totalCalories + (it.calories || 0),
      totalProtein: Math.round((a.totalProtein + (it.protein || 0)) * 10) / 10,
      totalCarbs: Math.round((a.totalCarbs + (it.carbs || 0)) * 10) / 10,
      totalFat: Math.round((a.totalFat + (it.fat || 0)) * 10) / 10,
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
  );
}

export default function DescribeMealPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const addEntry = useNutritionStore((s) => s.addEntry);
  const [text, setText] = useState(location.state?.initialText || '');
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState({});
  const [mealName, setMealName] = useState('');
  const [saved, setSaved] = useState(false);
  const [choices, setChoices] = useState({});
  const [portionSize, setPortionSize] = useState('average');

  const pendingClarification = useMemo(() => {
    if (!items) return null;
    const pending = items.find((i) => i.needsClarification && i.clarification);
    if (!pending) return null;
    return { item: pending, clarification: pending.clarification };
  }, [items]);

  const totals = useMemo(() => (items ? sumTotals(items) : null), [items]);
  const pendingCount = items?.filter((i) => i.needsClarification).length ?? 0;

  const applyResult = useCallback((data) => {
    setItems(data.items || []);
    setMeta({
      sanityWarning: data.sanityWarning,
      accuracyScore: data.accuracyScore,
      confidence: data.confidence,
      estimatedMeal: data.estimatedMeal,
      mealName: data.mealName,
      portionSize: data.portionSize,
      lowConfidenceNote: data.lowConfidenceNote,
    });
    if (data.mealName && !mealName.trim()) setMealName(data.mealName);
    if (data.portionSize) setPortionSize(data.portionSize);
    setSaved(false);
  }, [mealName]);

  const parseMutation = useMutation({
    mutationFn: async ({ input, choiceMap }) => {
      try {
        return await parseMealText(input, choiceMap);
      } catch {
        return await parseMealLocally(input, choiceMap);
      }
    },
    onSuccess: applyResult,
  });

  const runParse = (choiceMap = choices) => {
    parseMutation.mutate({ input: text, choiceMap });
  };

  const rerunWithPortion = (size) => {
    const next = { ...choices, __portion: size };
    setPortionSize(size);
    setChoices(next);
    runParse(next);
  };

  const handleClarificationSelect = (opt) => {
    const line = pendingClarification?.item?.rawLine
      || pendingClarification?.clarification?.rawLine
      || '';
    const key = line || pendingClarification?.clarification?.originalQuery || '';
    const next = {
      ...choices,
      [key]: {
        ingredientId: opt.ingredientId,
        query: opt.query || opt.ingredientId,
        grams: pendingClarification?.item?.weight,
      },
    };
    setChoices(next);
    runParse(next);
  };

  const handleWeightChange = (idx, grams) => {
    setItems((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const item = next[idx];
      if (!item?.matched || !item.per100g) return prev;
      const macros = macrosForGrams(item.per100g, grams);
      const name = formatLoggedFoodName(item.name, {
        pieceCount: item.pieceCount || 1,
        grams,
        variant: item.variant,
      });
      next[idx] = { ...item, weight: grams, name, ...macros };
      return next;
    });
  };

  const displayTotals = totals || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };

  const addAllToLog = async () => {
    if (!items || pendingCount > 0) return;
    const entry = buildDescribedMealEntry({ text, items, name: mealName || meta.mealName });
    addEntry(entry);
    if (meta.estimatedMeal) {
      await saveMealToCloud({
        id: uid(),
        name: entry.name,
        items,
        totals: displayTotals,
        estimatedMeal: true,
        sourceText: text,
      });
    }
    navigate('/log');
  };

  const saveMeal = async () => {
    if (!items || !mealName.trim()) return;
    await saveMealToCloud({
      id: uid(),
      name: mealName.trim(),
      items,
      totals: displayTotals,
    });
    setSaved(true);
  };

  const canLog = displayTotals.totalCalories > 0 && pendingCount === 0;

  return (
    <div className="px-4 pt-3 safe-top pb-screen space-y-4">
      <PageHeader
        label="HIGH ACCURACY"
        title="Describe Meal"
        onBack={() => navigate(-1)}
      />
      <p className="text-sm text-muted -mt-2">
        Type exact ingredients with weights, or describe a meal naturally like{' '}
        <strong className="text-white/80">small shawarma</strong> or{' '}
        <strong className="text-white/80">1 plate chicken alfredo pasta</strong>.
      </p>

      <textarea
        className="w-full min-h-[140px] rounded-2xl bg-surface-2 border border-white/10 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
        placeholder={'1 plate chicken alfredo pasta\n\nor\n\n100g chicken breast\n100g dry rice\n20g mayonnaise'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setText(ex)}
            className="text-[10px] px-2 py-1 rounded-lg bg-surface-2 text-muted hover:text-white"
          >
            example
          </button>
        ))}
      </div>

      <Button
        variant="primary"
        className="w-full"
        size="lg"
        disabled={text.trim().length < 3 || parseMutation.isPending}
        onClick={() => { setChoices({}); runParse({}); }}
      >
        {parseMutation.isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing…</>
        ) : (
          'Analyze with verified data'
        )}
      </Button>

      {parseMutation.isError && (
        <Card className="p-3 text-sm text-red-400">{parseMutation.error.message}</Card>
      )}

      {pendingClarification && (
        <ClarificationPanel
          clarification={pendingClarification.clarification}
          onSelect={handleClarificationSelect}
        />
      )}

      {pendingCount > 1 && (
        <Card className="p-3 flex gap-2 items-center text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {pendingCount} ingredients need clarification — answer one at a time.
        </Card>
      )}

      {items && (
        <>
          {meta.estimatedMeal && (
            <Card className="p-4 space-y-3 border-emerald-500/25 bg-emerald-500/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">Estimated Meal</p>
                  <p className="font-bold mt-1">{meta.mealName || 'Typical serving'}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Confidence: {Math.round((meta.confidence || 0) * 100)}%
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold capitalize">
                  {portionSize}
                </span>
              </div>
              {meta.lowConfidenceNote && (
                <p className="text-xs text-amber-200">{meta.lowConfidenceNote}</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['small', 'Smaller'],
                  ['average', 'Average'],
                  ['large', 'Larger'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => rerunWithPortion(value)}
                    disabled={parseMutation.isPending}
                    className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                      portionSize === value ? 'bg-white text-black' : 'bg-surface-2 text-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <MealBreakdown
            items={items}
            sanityWarning={meta.sanityWarning}
            accuracyScore={meta.accuracyScore}
            totals={displayTotals}
            onWeightChange={handleWeightChange}
          />

          {pendingCount > 0 && !pendingClarification && (
            <p className="text-xs text-amber-400 text-center">Resolve all questions before logging.</p>
          )}

          <Card className="p-4 space-y-3">
            <label className="text-xs text-muted font-semibold">Save as reusable meal</label>
            <Input
              placeholder="Chicken Rice Bowl"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
            />
            <Button variant="secondary" className="w-full" onClick={saveMeal} disabled={!mealName.trim() || pendingCount > 0}>
              {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save meal</>}
            </Button>
          </Card>

          <Button variant="primary" className="w-full" size="lg" onClick={addAllToLog} disabled={!canLog}>
            Log as 1 meal · {items.filter((i) => i.matched).length} ingredients · {Math.round(displayTotals.totalCalories)} kcal
          </Button>
        </>
      )}
    </div>
  );
}

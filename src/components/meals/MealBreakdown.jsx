import { Card } from '@/components/ui/primitives';
import AccuracyBadge from '@/components/nutrition/AccuracyBadge';

export default function MealBreakdown({
  items,
  totals,
  sanityWarning,
  accuracyScore,
  onEditItem,
  onWeightChange,
}) {
  const hasEstimated = items?.some((i) => i.estimated || i.aiEstimated);
  const t = totals || {
    totalCalories: items?.reduce((s, i) => s + (i.calories || 0), 0) || 0,
    totalProtein: items?.reduce((s, i) => s + (i.protein || 0), 0) || 0,
    totalCarbs: items?.reduce((s, i) => s + (i.carbs || 0), 0) || 0,
    totalFat: items?.reduce((s, i) => s + (i.fat || 0), 0) || 0,
  };

  return (
    <div className="space-y-3">
      {sanityWarning && (
        <Card className="p-3 border-amber-500/40 bg-amber-500/10 text-sm text-amber-200">
          {sanityWarning}
        </Card>
      )}

      {accuracyScore != null && accuracyScore > 0 && !items?.some((i) => i.needsClarification) && (
        <p className="text-xs text-center text-muted">
          Meal accuracy: <span className="font-bold text-emerald-400">{accuracyScore}%</span>
          <span className="text-muted">{hasEstimated ? ' · includes AI estimates' : ' · verified database only'}</span>
        </p>
      )}

      {items?.some((i) => i.estimated) && (
        <div className="px-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Estimated Ingredients</p>
        </div>
      )}

      {items?.map((item, idx) => (
        <Card
          key={`${item.rawLine || item.name}-${idx}`}
          className={`p-4 ${item.estimated || item.aiEstimated || item.needsClarification ? 'border-amber-500/40' : 'border-white/[0.06]'}`}
          onClick={() => onEditItem?.(idx)}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{item.name}</p>
              {item.pieceCount > 1 && (
                <p className="text-[10px] text-muted mt-0.5">{item.pieceCount} pieces · {item.weight}g total</p>
              )}
              {item.needsClarification ? (
                <p className="text-xs text-amber-400 mt-1">Needs your choice ↑</p>
              ) : (
                <p className="text-[10px] text-muted mt-0.5 tabular-nums">
                  per 100g: {item.per100g?.calories ?? '—'} kcal · P{item.per100g?.protein} C{item.per100g?.carbs} F{item.per100g?.fat}
                </p>
              )}
              <div className="mt-1.5">
                <AccuracyBadge
                  score={item.aiEstimated ? null : item.accuracyScore}
                  source={item.aiEstimated ? 'AI Estimated' : item.accuracyLabel || item.nutritionSource}
                  className={item.aiEstimated ? 'text-amber-300 bg-amber-500/15' : undefined}
                />
              </div>
              {item.validationWarnings?.map((w) => (
                <p key={w} className="text-[10px] text-amber-400/80 mt-0.5">{w}</p>
              ))}
            </div>
            <p className="font-bold text-white tabular-nums shrink-0">
              {item.matched ? `${item.calories} kcal` : '—'}
            </p>
          </div>

          {item.matched && onWeightChange && (
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={600}
                  step={5}
                  value={item.weight || 100}
                  onChange={(e) => onWeightChange(idx, Number(e.target.value))}
                  className="flex-1 accent-white"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="font-bold tabular-nums w-14 text-right text-sm">{item.weight}g</span>
              </div>
            </div>
          )}

          {item.matched && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs tabular-nums">
              <div className="rounded-lg bg-surface-2 p-2 text-center">
                <p className="text-muted text-[10px]">Protein</p>
                <p className="font-bold text-macro-protein">{item.protein}g</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-2 text-center">
                <p className="text-muted text-[10px]">Carbs</p>
                <p className="font-bold text-macro-carbs">{item.carbs}g</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-2 text-center">
                <p className="text-muted text-[10px]">Fat</p>
                <p className="font-bold text-macro-fat">{item.fat}g</p>
              </div>
            </div>
          )}
        </Card>
      ))}

      <Card className="p-4 bg-surface-2 border-white/10">
        <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Total</p>
        <p className="text-2xl font-extrabold tabular-nums">{Math.round(t.totalCalories)} kcal</p>
        <div className="flex gap-4 mt-2 text-sm font-semibold tabular-nums">
          <span className="text-macro-protein">{Math.round(t.totalProtein * 10) / 10}g P</span>
          <span className="text-macro-carbs">{Math.round(t.totalCarbs * 10) / 10}g C</span>
          <span className="text-macro-fat">{Math.round(t.totalFat * 10) / 10}g F</span>
        </div>
      </Card>
    </div>
  );
}

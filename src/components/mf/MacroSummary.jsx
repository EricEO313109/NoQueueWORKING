function MacroBar({ label, consumed, target, unit, barClass, remaining }) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const left = Math.round(remaining);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-[hsl(var(--muted-foreground))] tabular-nums text-xs">
          {Math.round(consumed)} / {target}{unit}
          <span className={`ml-2 font-bold ${left >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--primary))]'}`}>
            {left >= 0 ? `${left} rămas` : `${Math.abs(left)} peste`}
          </span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[hsl(var(--secondary))] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MacroSummary({ totals, goal, targets, remaining }) {
  return (
    <div className="mf-card p-5 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">
            Calorii
          </p>
          <p className="text-4xl font-bold tabular-nums mt-1">
            {Math.round(totals.calories)}
            <span className="text-lg text-[hsl(var(--muted-foreground))] font-medium"> / {goal}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-[hsl(var(--primary))]">
            {remaining.calories >= 0 ? remaining.calories : `+${Math.abs(Math.round(remaining.calories))}`}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {remaining.calories >= 0 ? 'kcal rămase' : 'kcal peste'}
          </p>
        </div>
      </div>

      <MacroBar label="Proteine" consumed={totals.protein} target={targets.protein} unit="g" barClass="macro-bar-protein" remaining={remaining.protein} />
      <MacroBar label="Carbo" consumed={totals.carbs} target={targets.carbs} unit="g" barClass="macro-bar-carbs" remaining={remaining.carbs} />
      <MacroBar label="Grăsimi" consumed={totals.fat} target={targets.fat} unit="g" barClass="macro-bar-fat" remaining={remaining.fat} />
    </div>
  );
}

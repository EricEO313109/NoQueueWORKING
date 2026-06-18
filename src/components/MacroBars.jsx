export default function MacroBars({ protein, carbs, fat }) {
  const items = [
    { label: 'Proteine', value: protein, unit: 'g', color: 'bg-blue-500', max: 150 },
    { label: 'Carbo', value: carbs, unit: 'g', color: 'bg-amber-500', max: 250 },
    { label: 'Grăsimi', value: fat, unit: 'g', color: 'bg-rose-500', max: 80 },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ label, value, unit, color, max }) => (
        <div key={label} className="card p-3">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-lg font-bold tabular-nums">
            {Math.round(value * 10) / 10}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full ${color} transition-all duration-500`}
              style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

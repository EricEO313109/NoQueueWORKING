import { Trash2 } from 'lucide-react';
import { MEAL_LABELS } from '@/lib/presets';

export default function MealList({ entries, onRemove }) {
  if (!entries.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-muted-foreground text-sm">Nicio masă înregistrată azi.</p>
        <p className="text-xs text-muted-foreground mt-1">Apasă + pentru a adăuga.</p>
      </div>
    );
  }

  const grouped = entries.reduce((acc, e) => {
    if (!acc[e.meal]) acc[e.meal] = [];
    acc[e.meal].push(e);
    return acc;
  }, {});

  const order = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="space-y-4">
      {order.filter((m) => grouped[m]?.length).map((meal) => (
        <div key={meal}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            {MEAL_LABELS[meal]}
          </h3>
          <ul className="space-y-2">
            {grouped[meal].map((entry) => (
              <li key={entry.id} className="card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{entry.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    P {entry.protein}g · C {entry.carbs}g · G {entry.fat}g
                  </p>
                </div>
                <span className="font-bold text-primary tabular-nums shrink-0">
                  {entry.calories} kcal
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                  aria-label="Șterge"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

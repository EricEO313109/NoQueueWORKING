import { Plus, Trash2 } from 'lucide-react';
import { MEAL_LABELS } from '@/lib/calorieStorage';

export default function MealSection({ meal, entries, onLog, onRemove }) {
  const total = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <div className="mf-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
        <div>
          <h3 className="font-bold">{MEAL_LABELS[meal]}</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums">{total} kcal</p>
        </div>
        <button
          type="button"
          onClick={() => onLog(meal)}
          className="w-9 h-9 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center hover:brightness-110 transition-all"
          aria-label={`Adaugă ${MEAL_LABELS[meal]}`}
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="px-4 py-6 text-sm text-[hsl(var(--muted-foreground))] text-center">
          Apasă + pentru a loga mese
        </p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))] last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{e.name}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums mt-0.5">
                  P {e.protein}g · C {e.carbs}g · F {e.fat}g
                </p>
              </div>
              <span className="font-bold text-sm tabular-nums text-[hsl(var(--primary))]">{e.calories}</span>
              <button
                type="button"
                onClick={() => onRemove(e.id)}
                className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

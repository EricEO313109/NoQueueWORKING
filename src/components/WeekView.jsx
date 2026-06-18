import { format, parseISO, subDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { entriesForDate, sumMacros } from '@/lib/calorieStorage';

export default function WeekView({ entries, goal, selectedDate, onSelectDate }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(parseISO(selectedDate + 'T12:00:00'), 6 - i);
    const key = d.toISOString().slice(0, 10);
    const dayEntries = entriesForDate(entries, key);
    const totals = sumMacros(dayEntries);
    const pct = goal > 0 ? Math.min(100, (totals.calories / goal) * 100) : 0;
    return { key, date: d, totals, pct };
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Ultimele 7 zile</p>
      <ul className="space-y-2">
        {days.map(({ key, date, totals, pct }) => {
          const isSelected = key === selectedDate;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelectDate(key)}
                className={`card w-full p-4 text-left transition-colors ${
                  isSelected ? 'ring-2 ring-primary border-primary/30' : 'hover:border-primary/20'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-medium capitalize">
                    {format(date, 'EEE, d MMM', { locale: ro })}
                  </span>
                  <span className="font-bold tabular-nums text-primary">
                    {Math.round(totals.calories)} kcal
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct > 100 ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g · G {Math.round(totals.fat)}g
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

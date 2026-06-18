import { format, parseISO, subDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useTracker } from '@/context/CalorieTrackerContext';
import { entriesForDate, sumMacros } from '@/lib/calorieStorage';

export default function WeekPage() {
  const tracker = useTracker();
  const navigate = useNavigate();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(parseISO(tracker.selectedDate + 'T12:00:00'), 6 - i);
    const key = d.toISOString().slice(0, 10);
    const totals = sumMacros(entriesForDate(tracker.entries, key));
    const calPct = tracker.goal > 0 ? (totals.calories / tracker.goal) * 100 : 0;
    const avgDiff = totals.calories - tracker.goal;
    return { key, date: d, totals, calPct, avgDiff };
  });

  const weekAvg = Math.round(days.reduce((s, d) => s + d.totals.calories, 0) / 7);
  const weekProtein = Math.round(days.reduce((s, d) => s + d.totals.protein, 0) / 7);

  return (
    <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Analytics</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">MacroFactor-style weekly insights</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="mf-card p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Medie calorii</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{weekAvg}</p>
        </div>
        <div className="mf-card p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Medie proteine</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{weekProtein}g</p>
        </div>
      </div>

      <div className="mf-card p-4">
        <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-4">Calorii vs obiectiv</p>
        <div className="flex items-end gap-2 h-32">
          {days.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1 h-full">
              <div className="flex-1 w-full flex items-end">
                <div
                  className="w-full rounded-t-md macro-bar-cal opacity-90"
                  style={{ height: `${Math.min(100, d.calPct)}%` }}
                />
              </div>
              <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                {format(d.date, 'EEE', { locale: ro }).slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {days.map((d) => (
          <li key={d.key}>
            <button
              type="button"
              onClick={() => { tracker.setSelectedDate(d.key); navigate('/'); }}
              className="mf-card w-full p-4 text-left hover:border-[hsl(var(--primary)/0.4)] transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium capitalize">{format(d.date, 'EEE d MMM', { locale: ro })}</span>
                <span className="font-bold text-[hsl(var(--primary))] tabular-nums">{Math.round(d.totals.calories)} kcal</span>
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 tabular-nums">
                P {Math.round(d.totals.protein)}g · C {Math.round(d.totals.carbs)}g · F {Math.round(d.totals.fat)}g
              </p>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

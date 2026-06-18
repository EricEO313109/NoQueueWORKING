import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Copy, Flame } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTracker } from '@/context/CalorieTrackerContext';
import MacroSummary from '@/components/mf/MacroSummary';
import MealSection from '@/components/mf/MealSection';
import FoodLoggerSheet from '@/components/mf/FoodLoggerSheet';
import { MEAL_ORDER } from '@/lib/calorieStorage';

function formatDay(dateStr, isToday) {
  if (isToday) return 'Astăzi';
  return format(parseISO(dateStr), 'EEEE, d MMM', { locale: ro });
}

export default function CalorieTrackerPage() {
  const tracker = useTracker();
  const [logMeal, setLogMeal] = useState(null);
  const [copyMsg, setCopyMsg] = useState('');

  const byMeal = MEAL_ORDER.reduce((acc, m) => {
    acc[m] = tracker.dayEntries.filter((e) => e.meal === m);
    return acc;
  }, {});

  const handleCopy = () => {
    const n = tracker.copyYesterday();
    setCopyMsg(n ? `Copiat ${n} intrări de ieri` : 'Nimic de copiat ieri');
    setTimeout(() => setCopyMsg(''), 2500);
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-[hsl(var(--background)/0.95)] backdrop-blur border-b border-[hsl(var(--border))]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">MacroTrack</h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] capitalize">{formatDay(tracker.selectedDate, tracker.isToday)}</p>
            </div>
          </div>
          <button type="button" onClick={handleCopy} className="mf-btn-ghost text-xs gap-1">
            <Copy className="w-3.5 h-3.5" />
            Copiază ieri
          </button>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-3 flex items-center justify-center gap-4">
          <button type="button" onClick={() => tracker.shiftDate(-1)} className="mf-btn-ghost p-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium tabular-nums">{tracker.selectedDate}</span>
          <button type="button" onClick={() => tracker.shiftDate(1)} className="mf-btn-ghost p-2" disabled={tracker.isToday}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {copyMsg && <p className="text-center text-xs text-[hsl(var(--success))] pb-2">{copyMsg}</p>}
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="mf-card p-3 flex justify-between text-xs">
          <span className="text-[hsl(var(--muted-foreground))]">Cheltuială estimată (TDEE)</span>
          <span className="font-bold tabular-nums">{tracker.expenditure} kcal</span>
        </div>

        <MacroSummary
          totals={tracker.totals}
          goal={tracker.goal}
          targets={tracker.macroTargets}
          remaining={tracker.remaining}
        />

        {MEAL_ORDER.map((meal) => (
          <MealSection
            key={meal}
            meal={meal}
            entries={byMeal[meal]}
            onLog={setLogMeal}
            onRemove={tracker.removeEntry}
          />
        ))}
      </main>

      <AnimatePresence>
        {logMeal && (
          <FoodLoggerSheet
            open={!!logMeal}
            meal={logMeal}
            tracker={tracker}
            onClose={() => setLogMeal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

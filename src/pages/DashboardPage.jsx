import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { ChevronRight as ChevronIcon } from 'lucide-react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { sumEntries, todayKey } from '@/lib/utils';
import DailySummaryCard from '@/components/app/DailySummaryCard';
import { Card, PageHeader } from '@/components/ui/primitives';
import { FoodListItem } from '@/components/app/FoodListItem';

export default function DashboardPage() {
  const selectedDate = useNutritionStore((s) => s.selectedDate);
  const targets = useNutritionStore((s) => s.targets);
  const streak = useNutritionStore((s) => s.streak);
  const storeEntries = useNutritionStore((s) => s.entries);

  const entries = useMemo(
    () => storeEntries.filter((entry) => entry.date === selectedDate),
    [storeEntries, selectedDate],
  );
  const sortedEntries = useMemo(
    () => entries.slice().sort((a, b) => (a.loggedAt || 0) - (b.loggedAt || 0)),
    [entries],
  );
  const totals = useMemo(() => sumEntries(entries), [entries]);
  const isToday = selectedDate === todayKey();

  const dateLabel = isToday
    ? 'TODAY'
    : format(parseISO(selectedDate), 'EEEE, MMMM d', { locale: enUS }).toUpperCase();

  return (
    <div className="px-4 pt-3 safe-top space-y-5 max-w-lg mx-auto">
      <PageHeader
        label={dateLabel}
        title="Dashboard"
      />

      {streak > 0 && (
        <p className="text-xs font-semibold text-accent -mt-2">{streak} day logging streak</p>
      )}

      <DailySummaryCard totals={totals} targets={targets} />

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">Nutrition Targets</p>
          <Link to="/profile" className="text-xs text-muted flex items-center gap-0.5">
            Edit <ChevronIcon className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Calories', targets.calories, 'kcal', 'text-macro-cal'],
            ['Protein', targets.protein, 'g', 'text-macro-protein'],
            ['Carbs', targets.carbs, 'g', 'text-macro-carbs'],
            ['Fat', targets.fat, 'g', 'text-macro-fat'],
          ].map(([label, val, unit, color]) => (
            <div key={label} className="rounded-xl bg-surface-2 p-3">
              <p className="text-[10px] text-muted font-medium">{label}</p>
              <p className={`text-lg font-bold tabular-nums ${color}`}>
                {val}
                <span className="text-xs text-muted font-normal ml-0.5">{unit}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-sm font-bold">Today&apos;s Logged Meals</p>
          <Link to="/log" className="text-xs text-muted">Open log</Link>
        </div>
        {sortedEntries.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">No meals logged today yet.</Card>
        ) : (
          <Card className="overflow-hidden p-0">
            {sortedEntries.slice(-6).map((entry) => (
              <FoodListItem key={entry.id} entry={entry} />
            ))}
          </Card>
        )}
      </div>

      <Link to="/log">
        <Card className="p-4 flex items-center justify-between hover:border-white/12 transition-colors">
          <div>
            <p className="font-bold text-sm">Today&apos;s Food Log</p>
            <p className="text-xs text-muted mt-0.5">{entries.length} items · {Math.round(totals.calories)} kcal</p>
          </div>
          <ChevronIcon className="w-5 h-5 text-muted" />
        </Card>
      </Link>
    </div>
  );
}

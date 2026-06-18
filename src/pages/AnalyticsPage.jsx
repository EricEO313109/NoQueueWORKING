import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useNutritionStore } from '@/store/useNutritionStore';
import { sumEntries } from '@/lib/utils';
import { PageHeader, Card, SectionHeader } from '@/components/ui/primitives';
import { WeeklyBarChart, StatCard } from '@/components/app/AnalyticsCharts';
import WeightTrendCard from '@/components/app/WeightTrendCard';

export default function AnalyticsPage() {
  const { entries, targets, selectedDate, weightLog } = useNutritionStore();

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(parseISO(selectedDate + 'T12:00:00'), 6 - i);
      const key = d.toISOString().slice(0, 10);
      const dayEntries = entries.filter((e) => e.date === key);
      return {
        key,
        label: format(d, 'EEE', { locale: enUS }).slice(0, 1),
        totals: sumEntries(dayEntries),
      };
    });
  }, [entries, selectedDate]);

  const avg = (key) => Math.round(days.reduce((s, d) => s + d.totals[key], 0) / 7);

  return (
    <div className="px-4 pt-3 safe-top space-y-5 max-w-lg mx-auto">
      <PageHeader label="INSIGHTS" title="Analytics" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="7-day avg calories" value={avg('calories')} unit="kcal/day" />
        <StatCard label="Daily target" value={targets.calories} unit="kcal" accent />
      </div>

      <WeightTrendCard />

      <Card className="p-5" elevated>
        <SectionHeader title="Calorie Trend" />
        <WeeklyBarChart days={days} targetKey="calories" target={targets.calories} colorClass="bg-macro-cal" />
      </Card>

      <Card className="p-5" elevated>
        <SectionHeader title="Protein Trend" />
        <WeeklyBarChart days={days} targetKey="protein" target={targets.protein} colorClass="bg-macro-protein" />
      </Card>

      <Card className="p-5" elevated>
        <SectionHeader title="Weekly Summary" />
        <div className="space-y-3">
          {['protein', 'carbs', 'fat'].map((m) => {
            const colors = { protein: 'text-macro-protein', carbs: 'text-macro-carbs', fat: 'text-macro-fat' };
            return (
              <div key={m} className="flex justify-between items-center text-sm">
                <span className="capitalize text-muted font-medium">{m}</span>
                <span className={`font-bold tabular-nums ${colors[m]}`}>
                  {avg(m)}g / {targets[m]}g
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {weightLog.length > 0 && (
        <Card className="p-4">
          <SectionHeader title="Weight Log" />
          <ul className="space-y-2">
            {weightLog.slice(0, 10).map((w) => (
              <li key={w.id} className="flex justify-between text-sm ns-divider pb-2">
                <span className="text-muted">{w.date}</span>
                <span className="font-bold tabular-nums">{w.kg} kg</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/primitives';

export function WeeklyBarChart({ days, targetKey, colorClass = 'bg-macro-cal', target }) {
  const max = Math.max(...days.map((d) => d.totals[targetKey]), target || 0, 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {days.map((d) => {
        const val = d.totals[targetKey];
        const h = (val / max) * 100;
        const over = target && val > target;
        return (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1 h-full">
            <div className="flex-1 w-full flex items-end">
              <motion.div
                className={`w-full rounded-t-md ${over ? 'bg-red-500/70' : colorClass}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(h, 4)}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
            <span className="text-[9px] text-muted font-medium">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function StatCard({ label, value, unit, accent }) {
  return (
    <Card className="p-4" elevated>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums mt-1 ${accent ? 'text-accent' : ''}`}>{value}</p>
      {unit && <p className="text-[10px] text-muted">{unit}</p>}
    </Card>
  );
}

export function InsightCard({ title, value, unit, children, to }) {
  const Wrapper = to ? 'a' : 'div';
  return (
    <Card className="p-4 flex flex-col min-h-[140px]" elevated {...(to ? { href: to } : {})}>
      <p className="text-xs text-muted font-semibold">{title}</p>
      <div className="flex-1 flex items-center justify-center my-2 min-h-[48px]">{children}</div>
      <p className="text-lg font-bold tabular-nums">{value} {unit}</p>
    </Card>
  );
}

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/primitives';

const COLORS = {
  calories: '#FF6B4A',
  protein: '#4DA3FF',
  carbs: '#FFD166',
  fat: '#FF6B9D',
};

export function MacroRing({ label, value, target, type, size = 88 }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const color = COLORS[type] || COLORS.calories;
  const left = Math.max(0, target - value);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - pct * circ }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums">{Math.round(value)}</span>
          <span className="text-[9px] text-muted">{left > 0 ? `${Math.round(left)}` : '✓'}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
    </div>
  );
}

export function CalorieHero({ consumed, target, remaining }) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  return (
    <Card className="p-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex justify-between items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Calorii azi</p>
          <p className="text-5xl font-bold tabular-nums tracking-tight">{Math.round(consumed)}</p>
          <p className="text-sm text-muted mt-1">din {target} kcal</p>
        </div>
        <div className="text-right">
          <p className={cn('text-3xl font-bold tabular-nums', remaining >= 0 ? 'text-emerald-400' : 'text-accent')}>
            {remaining >= 0 ? Math.round(remaining) : `+${Math.abs(Math.round(remaining))}`}
          </p>
          <p className="text-xs text-muted">{remaining >= 0 ? 'rămase' : 'peste'}</p>
        </div>
      </div>
      <div className="mt-5 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-orange-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </Card>
  );
}

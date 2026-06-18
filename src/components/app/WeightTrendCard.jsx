import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import { useNutritionStore } from '@/store/useNutritionStore';

function Sparkline({ points, width = 120, height = 40 }) {
  if (points.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="hsl(var(--macro-protein))" strokeWidth="2" />
      </svg>
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke="hsl(var(--macro-protein))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}

export default function WeightTrendCard() {
  const { profile, weightLog } = useNutritionStore();
  const sorted = [...weightLog].slice(0, 14).reverse();
  const points = sorted.length ? sorted.map((w) => w.kg) : [profile.weightKg];
  const current = points[points.length - 1] ?? profile.weightKg;
  const weekAgo = sorted.length >= 2 ? sorted[0].kg : current;
  const change = Math.round((current - weekAgo) * 10) / 10;
  const trend = sorted.length >= 3
    ? sorted.slice(-3).reduce((s, w) => s + w.kg, 0) / 3
    : current;

  return (
    <Link to="/analytics">
      <Card className="p-4 flex items-center gap-4 hover:border-white/12 transition-colors" elevated>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted font-semibold uppercase tracking-wide">Weight Trend</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{current} kg</p>
          <p className="text-xs text-muted mt-0.5">
            Trend {Math.round(trend * 10) / 10} kg
            <span className={change <= 0 ? ' text-emerald-400' : ' text-amber-400'}>
              {' '}· {change > 0 ? '+' : ''}{change} kg / 7d
            </span>
          </p>
        </div>
        <Sparkline points={points} />
        <ChevronRight className="w-5 h-5 text-muted shrink-0" />
      </Card>
    </Link>
  );
}

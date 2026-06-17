import { cn } from '@/lib/utils';

export default function AccuracyBadge({ score, source, tier, className }) {
  if (score == null && !source) return null;
  const s = score ?? 0;
  const color = s >= 95 ? 'text-emerald-400 bg-emerald-500/15'
    : s >= 80 ? 'text-cyan-400 bg-cyan-500/15'
    : s >= 60 ? 'text-amber-400 bg-amber-500/15'
    : 'text-red-400 bg-red-500/15';

  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', color, className)}>
      {s > 0 && <span>{s}%</span>}
      {source && <span className="opacity-90">{s > 0 ? `· ${source}` : source}</span>}
      {tier === 'low' && <span className="opacity-75">· verify</span>}
    </span>
  );
}

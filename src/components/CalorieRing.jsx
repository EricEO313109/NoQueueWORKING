import { motion } from 'framer-motion';

export default function CalorieRing({ consumed, goal, remaining, progress }) {
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const over = remaining < 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(150 25% 92%)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={over ? 'hsl(0 72% 55%)' : 'hsl(158 64% 40%)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums">{Math.round(consumed)}</span>
          <span className="text-sm text-muted-foreground">din {goal} kcal</span>
          <span className={`text-xs font-medium mt-1 ${over ? 'text-destructive' : 'text-primary'}`}>
            {over ? `+${Math.abs(Math.round(remaining))} peste` : `${Math.round(remaining)} rămase`}
          </span>
        </div>
      </div>
    </div>
  );
}

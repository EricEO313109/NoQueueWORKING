import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
  const variants = {
    primary: 'bg-white text-black font-bold hover:bg-white/90',
    accent: 'bg-accent text-white shadow-lg shadow-accent/25 hover:brightness-110',
    secondary: 'bg-surface-2 text-white border border-white/10 hover:bg-surface-3',
    ghost: 'text-muted hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  const sizes = {
    sm: 'h-9 px-3 text-xs rounded-full',
    md: 'h-11 px-5 text-sm rounded-full',
    lg: 'h-14 px-6 text-base rounded-full font-bold',
    icon: 'h-11 w-11 rounded-full p-0',
  };
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Card({ className, children, elevated, ...props }) {
  return (
    <div
      className={cn(
        elevated ? 'ns-card-elevated' : 'ns-card',
        'backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full h-12 rounded-full bg-surface-2 border border-white/[0.08] px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow',
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({ label, title, right, onBack }) {
  return (
    <header className="mb-1">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="touch-target -ml-2 mb-2 flex items-center gap-1 text-sm text-muted hover:text-white"
        >
          ← Back
        </button>
      )}
      {label && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      )}
      <div className="flex items-end justify-between gap-3 mt-0.5">
        <h1 className="text-[28px] font-bold tracking-tight leading-none">{title}</h1>
        {right}
      </div>
    </header>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold">{title}</h2>
      {action}
    </div>
  );
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-surface-2 border border-white/[0.06]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
            value === opt.value ? 'bg-white text-black' : 'text-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function MacroLine({ calories, protein, fat, carbs, className }) {
  return (
    <p className={cn('ns-macro-line', className)}>
      <span className="text-white/90 font-medium">{Math.round(calories)} Cal</span>
      <span className="text-muted mx-1">·</span>
      <span className="text-macro-protein">{Math.round(protein)}P</span>
      <span className="text-muted mx-1">·</span>
      <span className="text-macro-fat">{Math.round(fat)}F</span>
      <span className="text-muted mx-1">·</span>
      <span className="text-macro-carbs">{Math.round(carbs)}C</span>
    </p>
  );
}

export function Badge({ children, variant = 'default' }) {
  const styles = {
    default: 'bg-white/10 text-muted',
    raw: 'bg-emerald-500/15 text-emerald-400',
    cooked: 'bg-orange-500/15 text-orange-400',
    dry: 'bg-amber-500/15 text-amber-400',
  };
  return (
    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', styles[variant] || styles.default)}>
      {children}
    </span>
  );
}

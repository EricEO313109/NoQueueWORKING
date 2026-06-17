import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const EMOJI = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

function MacroPills({ protein, fat, carbs }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap text-[10px] tabular-nums leading-none">
      <span className="text-macro-protein">{Math.round(protein || 0)}P</span>
      <span className="text-macro-fat">{Math.round(fat || 0)}F</span>
      <span className="text-macro-carbs">{Math.round(carbs || 0)}C</span>
    </div>
  );
}

export function FoodListItem({ entry, onDelete, onAdd, showAdd, className, timeLabel }) {
  const inner = (
    <div className={cn('flex items-center gap-3 py-3.5 px-4 w-full', className)}>
      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0 text-base overflow-hidden">
        {entry.imageUrl ? (
          <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{EMOJI[entry.meal] || '🍽'}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-4 w-full">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate whitespace-nowrap text-ellipsis">{entry.name}</p>
            <div className="mt-1">
              <MacroPills protein={entry.protein} fat={entry.fat} carbs={entry.carbs} />
            </div>
          </div>
          {!showAdd && (
            <div className="shrink-0 min-w-[54px] text-right">
              <p className="text-sm font-bold tabular-nums text-white leading-none">{Math.round(entry.calories || 0)}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted leading-none">Cal</p>
              {timeLabel && <p className="mt-1 text-[9px] text-muted tabular-nums leading-none">{timeLabel}</p>}
            </div>
          )}
        </div>
        <div className="mt-1 min-w-0">
          {entry.type === 'described-meal' && entry.childCount > 0 && (
            <p className="text-[10px] text-muted tabular-nums truncate">
              {entry.childCount} ingredients · tap to view or edit
            </p>
          )}
          {entry.type !== 'described-meal' && (entry.grams || entry.pieceCount > 1) && (
            <p className="text-[10px] text-muted tabular-nums truncate">
              {entry.pieceCount > 1
                ? `${entry.pieceCount}× · ${entry.grams}g total`
                : `${entry.grams}g serving`}
            </p>
          )}
        </div>
      </div>
      {showAdd ? (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onAdd?.(entry); }}
          className="w-9 h-9 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      ) : (
        onDelete && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onDelete(entry.id); }}
            className="p-2 text-muted hover:text-red-400 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )
      )}
    </div>
  );

  if (entry.id && !showAdd) {
    return (
      <motion.div whileTap={{ scale: 0.99 }}>
        <Link to={`/food/${entry.id}`} className="block ns-divider last:border-0">
          {inner}
        </Link>
      </motion.div>
    );
  }

  return <div className="ns-divider last:border-0">{inner}</div>;
}

export function MealSection({ id, label, emoji, entries, onDeleteEntry }) {
  const mealCal = entries.reduce((s, e) => s + e.calories, 0);
  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-sm font-bold">
          {emoji} {label}
        </h3>
        <span className="text-xs text-muted tabular-nums font-medium">{mealCal} kcal</span>
      </div>
      <div className="ns-card overflow-hidden">
        {entries.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No foods logged</p>
        ) : (
          entries.map((e) => (
            <FoodListItem key={e.id} entry={e} onDelete={onDeleteEntry} />
          ))
        )}
      </div>
    </section>
  );
}

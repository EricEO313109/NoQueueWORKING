import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ChevronRight, Package, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { MacroLine, Badge } from '@/components/ui/primitives';

function FoodIcon({ icon }) {
  const Icon = icon === '📦' ? Package : Utensils;
  return <Icon className="w-4 h-4 text-zinc-500" strokeWidth={1.8} />;
}

export default function SearchFoodRow({
  to,
  name,
  serving,
  calories,
  protein,
  fat,
  carbs,
  variant,
  onQuickAdd,
  icon,
  servingOptions,
}) {
  const [selectedServingId, setSelectedServingId] = useState(servingOptions?.[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const selectedServing = useMemo(
    () => servingOptions?.find((option) => option.id === selectedServingId) || servingOptions?.[0],
    [servingOptions, selectedServingId],
  );
  const displayMacros = selectedServing ? {
    calories: Math.round((selectedServing.calories || 0) * quantity),
    protein: Math.round((selectedServing.protein || 0) * quantity * 10) / 10,
    fat: Math.round((selectedServing.fat || 0) * quantity * 10) / 10,
    carbs: Math.round((selectedServing.carbs || 0) * quantity * 10) / 10,
  } : {
    calories,
    protein,
    fat,
    carbs,
  };

  const content = (
    <motion.div
      whileTap={{ scale: 0.99 }}
      className="flex items-center gap-3 py-2.5 px-3 border-b border-zinc-900/60 last:border-0"
    >
      <div className="w-7 h-7 flex items-center justify-center shrink-0">
        <FoodIcon icon={icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[13px] leading-tight text-white truncate">{name}</p>
          {variant && <Badge variant={variant}>{variant}</Badge>}
        </div>
        <MacroLine
          calories={displayMacros.calories}
          protein={displayMacros.protein}
          fat={displayMacros.fat}
          carbs={displayMacros.carbs}
          className="text-[10px] text-zinc-400 leading-snug mt-0.5"
        />
        {servingOptions?.length ? (
          <div className="mt-1 flex items-center gap-1.5">
            <select
              value={selectedServing?.id || ''}
              onChange={(e) => setSelectedServingId(e.target.value)}
              className="max-w-[112px] rounded-full bg-zinc-950 border border-zinc-800 px-2 py-1 text-[10px] text-zinc-300 focus:outline-none"
            >
              {servingOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <div className="flex items-center rounded-full border border-zinc-800 overflow-hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setQuantity((value) => Math.max(1, value - 1));
                }}
                className="w-6 h-6 flex items-center justify-center text-zinc-400"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="min-w-5 text-center text-[10px] text-zinc-300 tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setQuantity((value) => Math.min(12, value + 1));
                }}
                className="w-6 h-6 flex items-center justify-center text-zinc-400"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : serving && <p className="text-[9px] text-zinc-500 leading-tight mt-0.5">{serving}</p>}
      </div>
      {onQuickAdd ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onQuickAdd({ servingOption: selectedServing, quantity });
          }}
          className="w-8 h-8 rounded-full border border-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 hover:border-zinc-600 hover:text-white"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.8} />
        </button>
      ) : (
        <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
      )}
    </motion.div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
}

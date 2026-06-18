import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Zap, MessageSquare, Star, UtensilsCrossed, X, Trash2, Check,
} from 'lucide-react';
import { searchFoods, foodToPlateItem } from '@/lib/foodDatabase';
import { parseMealDescription } from '@/lib/describeParser';
import { MEAL_LABELS } from '@/lib/calorieStorage';
import { NumericInput } from '@/components/ui/NumericInput';

const TABS = [
  { id: 'search', label: 'Caută', icon: Search },
  { id: 'quick', label: 'Quick', icon: Zap },
  { id: 'describe', label: 'Describe', icon: MessageSquare },
  { id: 'favorites', label: 'Favorite', icon: Star },
  { id: 'plate', label: 'Farfurie', icon: UtensilsCrossed },
];

function PlateTile({ item, onRemove }) {
  return (
    <div className="mf-card-elevated p-3 flex gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.name}</p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{item.serving || '1 porție'}</p>
        <p className="text-xs tabular-nums mt-1 text-[hsl(var(--primary))] font-bold">{item.calories} kcal</p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">
          P{item.protein} C{item.carbs} F{item.fat}
        </p>
      </div>
      <button type="button" onClick={() => onRemove(item.tempId)} className="text-[hsl(var(--muted-foreground))] hover:text-red-400 self-start">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function FoodLoggerSheet({
  open,
  onClose,
  meal,
  tracker,
}) {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [describeText, setDescribeText] = useState('');
  const [quick, setQuick] = useState({ calories: '', protein: '', carbs: '', fat: '', name: '' });

  if (!open) return null;

  const results = searchFoods(query);
  const { plate, plateTotals, favorites } = tracker;

  const addQuick = () => {
    if (!quick.calories) return;
    tracker.addToPlate({
      tempId: `quick-${Date.now()}`,
      name: quick.name || 'Quick add',
      calories: Number(quick.calories) || 0,
      protein: Number(quick.protein) || 0,
      carbs: Number(quick.carbs) || 0,
      fat: Number(quick.fat) || 0,
      serving: 'quick',
      source: 'quick',
    });
    setQuick({ calories: '', protein: '', carbs: '', fat: '', name: '' });
    setTab('plate');
  };

  const runDescribe = () => {
    const items = parseMealDescription(describeText);
    tracker.addManyToPlate(items);
    setDescribeText('');
    setTab('plate');
  };

  const logFoods = () => {
    tracker.logPlate(meal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative bg-[hsl(var(--background))] rounded-t-3xl max-h-[92vh] flex flex-col border-t border-[hsl(var(--border))]"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide font-semibold">Food Logger</p>
            <h2 className="text-lg font-bold">{MEAL_LABELS[meal]}</h2>
          </div>
          <button type="button" onClick={onClose} className="mf-btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 overflow-x-auto flex gap-1 pb-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`mf-tab flex items-center gap-1 ${tab === id ? 'mf-tab-active' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'plate' && plate.length > 0 && (
                <span className="ml-1 bg-white/20 px-1.5 rounded-full text-[10px]">{plate.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-[240px]">
          {tab === 'search' && (
            <div className="space-y-3">
              <input
                className="mf-input"
                placeholder="Caută alimente verificate..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <div className="space-y-2">
                {results.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => {
                      tracker.addToPlate(foodToPlateItem(food));
                      setTab('plate');
                    }}
                    className="w-full mf-card-elevated p-3 text-left hover:border-[hsl(var(--primary)/0.5)] transition-colors"
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{food.name}</p>
                        {food.brand && <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{food.brand}</p>}
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{food.serving}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[hsl(var(--primary))]">{food.calories}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">
                          P{food.protein} C{food.carbs} F{food.fat}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'quick' && (
            <div className="space-y-3">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Adaugă macro direct pe farfurie (MacroFactor Quick Add)</p>
              <input className="mf-input" placeholder="Nume (opțional)" value={quick.name} onChange={(e) => setQuick((q) => ({ ...q, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                {['calories', 'protein', 'carbs', 'fat'].map((k) => (
                  <NumericInput
                    key={k}
                    className="mf-input"
                    placeholder={k === 'calories' ? 'Calorii *' : `${k} (g)`}
                    value={quick[k]}
                    onValueChange={(value) => setQuick((q) => ({ ...q, [k]: value }))}
                    fallback={0}
                    decimal={k !== 'calories'}
                  />
                ))}
              </div>
              <button type="button" onClick={addQuick} className="mf-btn-primary w-full">Adaugă pe farfurie</button>
            </div>
          )}

          {tab === 'describe' && (
            <div className="space-y-3">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Descrie masa cu text — ca MacroFactor AI Describe. Ex: „2 ouă, pâine, cafea”
              </p>
              <textarea
                className="mf-input min-h-[100px] resize-none"
                placeholder="Ce ai mâncat?"
                value={describeText}
                onChange={(e) => setDescribeText(e.target.value)}
              />
              <button type="button" onClick={runDescribe} disabled={!describeText.trim()} className="mf-btn-primary w-full disabled:opacity-50">
                Interpretă & adaugă pe farfurie
              </button>
            </div>
          )}

          {tab === 'favorites' && (
            <div className="space-y-2">
              {favorites.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] py-8 text-center">
                  Marchează alimente cu ★ din căutare (în curând). Folosește preset-urile:
                </p>
              ) : null}
              {searchFoods('').slice(0, 8).map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => {
                    tracker.addToPlate(foodToPlateItem(food));
                    setTab('plate');
                  }}
                  className="w-full mf-card-elevated p-3 text-left flex justify-between"
                >
                  <span className="font-medium text-sm">{food.name}</span>
                  <span className="text-[hsl(var(--primary))] font-bold text-sm">{food.calories}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'plate' && (
            <div className="space-y-3">
              {plate.length === 0 ? (
                <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-10">
                  Farfuria e goală. Caută, Quick Add sau Describe.
                </p>
              ) : (
                <>
                  <div className="mf-card p-3 flex justify-between items-center">
                    <span className="text-sm font-semibold">Total farfurie</span>
                    <span className="font-bold text-[hsl(var(--primary))] tabular-nums">
                      {Math.round(plateTotals.calories)} kcal · P{Math.round(plateTotals.protein)} C{Math.round(plateTotals.carbs)} F{Math.round(plateTotals.fat)}
                    </span>
                  </div>
                  {plate.map((item) => (
                    <PlateTile key={item.tempId} item={item} onRemove={tracker.removeFromPlate} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[hsl(var(--border))] flex gap-2 safe-area-pb">
          {plate.length > 0 && (
            <button type="button" onClick={tracker.clearPlate} className="mf-btn-ghost flex-1">
              Golește
            </button>
          )}
          <button
            type="button"
            onClick={logFoods}
            disabled={!plate.length}
            className="mf-btn-primary flex-[2] disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            Loghează {plate.length ? `(${plate.length})` : ''}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

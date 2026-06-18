import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check, ChevronDown, X, Sparkles, ShieldCheck, AlertTriangle, Camera,
} from 'lucide-react';
import { productToLogEntry } from '@/lib/api/openFoodFacts';
import { scaleNutrient } from '@/lib/utils';
import { needsUserVerification } from '@/lib/products/macroValidation';
import { Button } from '@/components/ui/primitives';
import NutritionComparePanel from '@/components/scanner/NutritionComparePanel';

const MEAL_LABELS = {
  breakfast: 'Mic dejun',
  lunch: 'Prânz',
  dinner: 'Cină',
  snack: 'Gustare',
};

const SOURCE_LABELS = {
  user_verified: 'Verificat de tine',
  ai_label: 'Scan etichetă',
  openfoodfacts: 'OpenFoodFacts',
  barcode: 'Bază date',
};

export default function ProductResultSheet({
  product,
  onAdd,
  onClose,
  onVerifyLabel,
  labelPreview,
  comparison,
  pendingConfirm,
  onConfirmLabel,
  onDismissCompare,
}) {
  const [grams, setGrams] = useState(product.defaultGrams || 100);
  const [meal, setMeal] = useState('snack');
  const [logging, setLogging] = useState(false);
  const p = product.per100g;

  const preview = {
    calories: Math.round(scaleNutrient(grams, p.calories)),
    protein: scaleNutrient(grams, p.protein),
    carbs: scaleNutrient(grams, p.carbs),
    fat: scaleNutrient(grams, p.fat),
  };

  const showVerifyBanner = needsUserVerification(product) && !labelPreview;
  const lowConf = (product.confidence ?? product.confidence_score ?? 1) < 0.8;
  const isVerified = product.nutrition_source === 'user_verified';

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="absolute inset-x-0 bottom-0 z-30 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-surface-1 border-t border-white/10 p-5"
      style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

      <div className="flex gap-3">
        {product.imageUrl && !product.imageUrl.endsWith('...') ? (
          <img src={product.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover bg-white/5 shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center shrink-0">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base leading-tight line-clamp-2">{product.name}</h2>
          {product.brand && <p className="text-sm text-muted truncate">{product.brand}</p>}
          <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
            {isVerified ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : null}
            {SOURCE_LABELS[product.nutrition_source] || product.source}
            {product.confidence != null && ` · ${Math.round((product.confidence ?? 1) * 100)}%`}
          </p>
        </div>
        <button type="button" onClick={onClose} className="touch-target p-2 -mr-2 text-muted shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      {showVerifyBanner && (
        <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-amber-200">Verificare recomandată</p>
            <p className="text-muted mt-0.5">
              Macro-urile pot fi inexacte{lowConf ? ' (încredere scăzută)' : ''}.
              Fotografiază eticheta pentru valori corecte.
            </p>
            <Button size="sm" className="mt-2 w-full" onClick={onVerifyLabel}>
              <Camera className="w-4 h-4" /> Verifică cu fotografie
            </Button>
          </div>
        </div>
      )}

      {labelPreview && (pendingConfirm || comparison?.mismatch) && (
        <NutritionComparePanel
          appProduct={product}
          labelProduct={labelPreview}
          comparison={comparison}
          onConfirmLabel={onConfirmLabel}
          onKeepApp={onDismissCompare}
          showDevGroundTruth
        />
      )}

      <div className="grid grid-cols-4 gap-2 mt-4">
        {[
          { l: 'Kcal', v: preview.calories, c: 'text-accent' },
          { l: 'P', v: preview.protein, c: 'text-blue-400' },
          { l: 'C', v: preview.carbs, c: 'text-yellow-400' },
          { l: 'F', v: preview.fat, c: 'text-pink-400' },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl bg-surface-2 p-2.5 text-center">
            <p className={`text-lg font-bold tabular-nums ${c}`}>{v}</p>
            <p className="text-[10px] text-muted">{l}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted text-center mt-1">Valorile sunt per porția selectată</p>

      <div className="mt-4">
        <label className="text-xs text-muted font-semibold uppercase tracking-wide">Porție (g)</label>
        <div className="flex items-center gap-3 mt-2">
          <input
            type="range"
            min={10}
            max={500}
            step={5}
            value={grams}
            onChange={(e) => setGrams(Number(e.target.value))}
            className="flex-1 accent-accent h-8"
          />
          <span className="font-bold tabular-nums w-14 text-right text-lg">{grams}g</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {Object.entries(MEAL_LABELS).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMeal(m)}
            className={`py-3 rounded-2xl text-sm font-semibold touch-target ${
              meal === m ? 'bg-accent text-white' : 'bg-surface-2 text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!showVerifyBanner && !pendingConfirm && (
        <Button variant="secondary" size="md" className="w-full mt-3" onClick={onVerifyLabel}>
          <Camera className="w-4 h-4" /> Verifică eticheta nutrițională
        </Button>
      )}

      {product.ingredients && (
        <details className="mt-4">
          <summary className="text-xs text-muted cursor-pointer flex items-center gap-1 touch-target">
            Ingrediente <ChevronDown className="w-3 h-3" />
          </summary>
          <p className="text-xs text-muted mt-2 leading-relaxed max-h-20 overflow-y-auto">{product.ingredients}</p>
        </details>
      )}

      {!pendingConfirm && (
        <Button
          className="w-full mt-4"
          size="lg"
          disabled={logging}
          onClick={() => {
            if (logging) return;
            setLogging(true);
            onAdd(productToLogEntry(product, grams, meal));
          }}
        >
          <Check className="w-5 h-5" />
          {logging ? 'Added' : `Log · ${preview.calories} kcal`}
        </Button>
      )}
    </motion.div>
  );
}

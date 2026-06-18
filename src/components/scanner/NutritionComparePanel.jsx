import { compareMacros } from '@/lib/products/macroValidation';
import { scaleNutrient } from '@/lib/utils';
import { Card, Button } from '@/components/ui/primitives';
import { DEV_GROUND_TRUTH_OATS } from '@/lib/products/macroValidation';

const ROWS = [
  { key: 'calories', label: 'Calorii', unit: 'kcal' },
  { key: 'protein', label: 'Proteine', unit: 'g' },
  { key: 'carbs', label: 'Carbo', unit: 'g' },
  { key: 'fat', label: 'Grăsimi', unit: 'g' },
];

function MacroColumn({ title, per100g, grams, variant }) {
  const border = variant === 'label' ? 'border-emerald-500/40' : 'border-amber-500/40';
  return (
    <div className={`rounded-xl border ${border} p-3 flex-1`}>
      <p className="text-xs font-bold uppercase tracking-wide mb-2">{title}</p>
      <p className="text-[10px] text-muted mb-2">per 100g · porție {grams}g</p>
      {ROWS.map(({ key, label, unit }) => (
        <div key={key} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
          <span className="text-muted">{label}</span>
          <span className="font-bold tabular-nums">
            {Math.round(scaleNutrient(grams, per100g[key]))} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NutritionComparePanel({
  appProduct,
  labelProduct,
  comparison,
  onConfirmLabel,
  onKeepApp,
  showDevGroundTruth,
}) {
  const grams = appProduct?.defaultGrams || labelProduct?.defaultGrams || 100;
  const cmp = comparison || compareMacros(appProduct?.per100g, labelProduct?.per100g);

  return (
    <Card className="p-4 space-y-3 mt-3 border border-white/10">
      <h3 className="font-bold text-sm">Compară date nutriționale</h3>
      {cmp.mismatch && (
        <p className="text-xs text-amber-400">Diferențe detectate — recomandăm confirmarea valorilor din etichetă.</p>
      )}

      <div className="flex gap-2">
        <MacroColumn title="App / DB" per100g={appProduct?.per100g} grams={grams} variant="app" />
        <MacroColumn title="Etichetă (AI)" per100g={labelProduct?.per100g} grams={grams} variant="label" />
      </div>

      <div className="space-y-1">
        {ROWS.map(({ key, label }) => {
          const d = cmp.diffs?.[key];
          if (!d || d.pct < 12) return null;
          return (
            <p key={key} className="text-xs text-red-400 tabular-nums">
              Δ {label}: app {d.app} vs etichetă {d.label} ({d.pct}%)
            </p>
          );
        })}
      </div>

      {showDevGroundTruth && import.meta.env.DEV && (
        <details className="text-xs">
          <summary className="text-muted cursor-pointer">Debug: ground truth (Crownfield)</summary>
          <pre className="mt-2 p-2 bg-black/40 rounded-lg overflow-x-auto text-[10px]">
            {JSON.stringify(
              compareMacros(appProduct?.per100g, DEV_GROUND_TRUTH_OATS.per100g),
              null,
              2,
            )}
          </pre>
        </details>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="secondary" className="flex-1" onClick={onKeepApp}>
          Păstrează valorile actuale
        </Button>
        <Button size="sm" className="flex-1" onClick={onConfirmLabel}>
          Confirmă eticheta
        </Button>
      </div>
    </Card>
  );
}

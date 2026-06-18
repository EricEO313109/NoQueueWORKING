import { useTracker } from '@/context/CalorieTrackerContext';
import { NumericInput } from '@/components/ui/NumericInput';

export default function GoalPage() {
  const tracker = useTracker();
  const { macroTargets } = tracker;

  return (
    <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Macro Program</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Obiective adaptate — ca MacroFactor coaching
        </p>
      </div>

      <div className="mf-card p-5 space-y-4">
        <div>
          <label className="text-sm font-semibold">Calorii țintă / zi</label>
          <NumericInput
            className="mf-input mt-2"
            value={tracker.goal}
            onValueChange={(value) => tracker.setGoal(value)}
            fallback={2000}
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Cheltuială energetică (TDEE)</label>
          <NumericInput
            className="mf-input mt-2"
            value={tracker.expenditure}
            onNumberChange={(value) => tracker.setExpenditure(value || 2350)}
            fallback={2350}
          />
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
            Algoritmul ajustează ținta când loghezi consistent (demo static).
          </p>
        </div>
      </div>

      <div className="mf-card p-5 space-y-3">
        <h3 className="font-bold">Macro targets</h3>
        {[
          { key: 'protein', label: 'Proteine (g)', color: 'text-[hsl(var(--protein))]' },
          { key: 'carbs', label: 'Carbo (g)', color: 'text-[hsl(var(--carbs))]' },
          { key: 'fat', label: 'Grăsimi (g)', color: 'text-[hsl(var(--fat))]' },
        ].map(({ key, label, color }) => (
          <div key={key}>
            <label className={`text-sm font-medium ${color}`}>{label}</label>
            <NumericInput
              decimal
              className="mf-input mt-1"
              value={macroTargets[key]}
              onNumberChange={(value) => tracker.setTargets({ [key]: value || 0 })}
              fallback={0}
            />
          </div>
        ))}
      </div>

      <div className="mf-card p-4 text-sm text-[hsl(var(--muted-foreground))]">
        <p className="font-semibold text-white mb-2">MacroFactor features incluse:</p>
        <ul className="space-y-1 text-xs list-disc pl-4">
          <li>Food Logger unificat (Search, Quick Add, Describe, Plate)</li>
          <li>Macro bars zilnice P/C/F</li>
          <li>Mese pe sloturi (mic dejun → gustări)</li>
          <li>Copiază ziua anterioară</li>
          <li>Analytics săptămânal</li>
        </ul>
      </div>
    </main>
  );
}

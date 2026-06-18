import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { MEAL_LABELS } from '@/lib/presets';
import { NumericInput } from '@/components/ui/NumericInput';

const empty = {
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  meal: 'lunch',
};

export default function AddMealForm({ onAdd, onClose }) {
  const [form, setForm] = useState(empty);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.calories) return;
    onAdd({
      name: form.name.trim(),
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      meal: form.meal,
    });
    setForm(empty);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-md p-5 shadow-xl animate-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Adaugă masă</h2>
          <button type="button" onClick={onClose} className="btn-ghost p-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nume</label>
            <input
              className="input-field mt-1"
              placeholder="Ex: Salată cu pui"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Calorii *</label>
              <NumericInput
                className="input-field mt-1"
                placeholder="350"
                value={form.calories}
                onValueChange={(value) => set('calories', value)}
                fallback={0}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Masă</label>
              <select
                className="input-field mt-1"
                value={form.meal}
                onChange={(e) => set('meal', e.target.value)}
              >
                {Object.entries(MEAL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['protein', 'carbs', 'fat'].map((key) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground capitalize">{key === 'protein' ? 'Prot (g)' : key === 'carbs' ? 'Carb (g)' : 'Grăs (g)'}</label>
                <NumericInput
                  decimal
                  className="input-field mt-1"
                  value={form[key]}
                  onValueChange={(value) => set(key, value)}
                  fallback={0}
                />
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary w-full mt-2">
            <Plus className="w-4 h-4" />
            Adaugă
          </button>
        </form>
      </div>
    </div>
  );
}

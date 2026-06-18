import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui/primitives';
import { NumericInput } from '@/components/ui/NumericInput';
import { useNutritionStore } from '@/store/useNutritionStore';
import { calculateTDEE } from '@/lib/utils';

const STEPS = ['welcome', 'body', 'goal'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const complete = useNutritionStore((s) => s.completeOnboarding);
  const savedProfile = useNutritionStore((s) => s.profile);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => ({
    name: savedProfile?.name || '',
    sex: savedProfile?.sex || 'male',
    age: String(savedProfile?.age || 28),
    weightKg: String(savedProfile?.weightKg || 75),
    heightCm: String(savedProfile?.heightCm || 175),
    activity: String(savedProfile?.activity || 1.55),
    goal: savedProfile?.goal || 'maintain',
  }));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const normalizedProfile = {
    ...form,
    age: Number(form.age) || 28,
    weightKg: Number(form.weightKg) || 75,
    heightCm: Number(form.heightCm) || 175,
    activity: Number(form.activity) || 1.55,
  };
  const tdeePreview = calculateTDEE(normalizedProfile);

  const finish = () => {
    complete({ profile: normalizedProfile });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-app flex flex-col px-5 py-6 safe-top safe-bottom">
      <div className="flex gap-1 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-white/10'}`}
          />
        ))}
      </div>

      {step === 0 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col">
          <p className="text-accent text-sm font-bold uppercase tracking-widest">StilMacros</p>
          <h1 className="text-4xl font-extrabold mt-2 leading-tight tracking-tight">
            Scan →<br />calorii instant
          </h1>
          <p className="text-muted mt-4 text-lg leading-relaxed">
            Track macros with search, quick add, library, barcode scanning, and meal descriptions. Scanning is optional.
          </p>
          <Card className="mt-8 p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Home className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="font-bold">Explore first</p>
              <p className="text-sm text-muted">Open the dashboard, then log food however you want.</p>
            </div>
          </Card>
          <Button size="lg" className="mt-auto w-full" onClick={() => setStep(1)}>
            Get started <ChevronRight className="w-5 h-5" />
          </Button>
          <Button size="md" variant="ghost" className="mt-3 w-full" onClick={finish}>
            Skip setup and enter app
          </Button>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 space-y-4">
          <h2 className="text-2xl font-bold">Body details</h2>
          <Input placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <div className="flex gap-2">
            {['male', 'female'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('sex', s)}
                className={`flex-1 py-3 rounded-2xl font-semibold text-sm ${form.sex === s ? 'bg-accent text-white' : 'bg-surface-2 text-muted'}`}
              >
                {s === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
          {[
            { k: 'age', l: 'Age', ph: '28' },
            { k: 'weightKg', l: 'Weight (kg)', ph: '75' },
            { k: 'heightCm', l: 'Height (cm)', ph: '175' },
          ].map(({ k, l, ph }) => (
            <div key={k}>
              <label className="text-xs text-muted font-semibold">{l}</label>
              <NumericInput
                className="mt-1 w-full h-12 rounded-full bg-surface-2 border border-white/[0.08] px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                placeholder={ph}
                value={form[k]}
                onValueChange={(value) => set(k, value)}
                fallback={Number(ph)}
              />
            </div>
          ))}
          <Button size="lg" className="w-full mt-4" onClick={() => setStep(2)}>Continue</Button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 space-y-4">
          <h2 className="text-2xl font-bold">Your goal</h2>
          {[
            { id: 'lose', label: 'Lose weight', sub: '-400 kcal' },
            { id: 'maintain', label: 'Maintain', sub: 'TDEE' },
            { id: 'gain', label: 'Build muscle', sub: '+300 kcal' },
          ].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => set('goal', g.id)}
              className={`w-full p-4 rounded-2xl text-left border transition-all ${
                form.goal === g.id ? 'border-accent bg-accent/10' : 'border-white/10 bg-surface-2'
              }`}
            >
              <p className="font-bold">{g.label}</p>
              <p className="text-sm text-muted">{g.sub}</p>
            </button>
          ))}
          <Card className="p-4 mt-4">
            <p className="text-xs text-muted">Estimated TDEE</p>
            <p className="text-3xl font-bold text-accent tabular-nums">{tdeePreview} kcal</p>
          </Card>
          <Button size="lg" className="w-full mt-auto" onClick={finish}>
            <Home className="w-5 h-5" /> Enter app
          </Button>
        </motion.div>
      )}
    </div>
  );
}

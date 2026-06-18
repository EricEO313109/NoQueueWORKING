import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNutritionStore } from '@/store/useNutritionStore';
import { Card, Button, Input, PageHeader, SectionHeader } from '@/components/ui/primitives';
import { NumericInput } from '@/components/ui/NumericInput';
import CloudStatus from '@/components/CloudStatus';
import { Package, BookOpen, UtensilsCrossed, ChevronRight } from 'lucide-react';

function toDraftNumber(value) {
  return value == null ? '' : String(value);
}

function normalizeDraft(profile) {
  return {
    ...profile,
    age: toDraftNumber(profile.age),
    weightKg: toDraftNumber(profile.weightKg),
    heightCm: toDraftNumber(profile.heightCm),
    activity: toDraftNumber(profile.activity),
  };
}

function toNumberOrFallback(value, fallback) {
  if (value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function autoMacrosFromCalories(calories) {
  const n = Number(calories);
  if (!Number.isFinite(n) || n <= 0) {
    return { protein: '', carbs: '', fat: '' };
  }
  return {
    protein: String(Math.round((n * 0.30) / 4)),
    carbs: String(Math.round((n * 0.45) / 4)),
    fat: String(Math.round((n * 0.25) / 9)),
  };
}

function numericDraft(value) {
  if (value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function ProfilePage() {
  const store = useNutritionStore();
  const { profile, targets, tdee, streak, setTargets, updateProfile } = store;
  const [editing, setEditing] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [draft, setDraft] = useState(() => normalizeDraft(profile));
  const [targetDraft, setTargetDraft] = useState(() => ({
    calories: toDraftNumber(targets.calories),
    protein: toDraftNumber(targets.protein),
    carbs: toDraftNumber(targets.carbs),
    fat: toDraftNumber(targets.fat),
  }));

  useEffect(() => {
    if (isManualMode) return;
    const autoMacros = autoMacrosFromCalories(targets.calories);
    setTargetDraft({
      calories: toDraftNumber(targets.calories),
      ...autoMacros,
    });
    if (
      Number(autoMacros.protein) !== targets.protein
      || Number(autoMacros.carbs) !== targets.carbs
      || Number(autoMacros.fat) !== targets.fat
    ) {
      setTargets({
        protein: Number(autoMacros.protein),
        carbs: Number(autoMacros.carbs),
        fat: Number(autoMacros.fat),
      });
    }
  }, [isManualMode, setTargets, targets.calories, targets.carbs, targets.fat, targets.protein]);

  const saveProfile = () => {
    updateProfile({
      name: draft.name,
      age: toNumberOrFallback(draft.age, profile.age),
      weightKg: toNumberOrFallback(draft.weightKg, profile.weightKg),
      heightCm: toNumberOrFallback(draft.heightCm, profile.heightCm),
      sex: draft.sex,
      activity: toNumberOrFallback(draft.activity, profile.activity),
      goal: draft.goal,
    });
    setEditing(false);
  };

  const updateTarget = (key, value) => {
    if (key === 'calories') {
      const calories = numericDraft(value);
      const autoMacros = autoMacrosFromCalories(value);
      setTargetDraft((prev) => ({
        ...prev,
        calories: value,
        ...(isManualMode ? {} : autoMacros),
      }));
      if (calories != null) {
        setTargets({
          calories,
          ...(isManualMode ? {} : {
            protein: Number(autoMacros.protein),
            carbs: Number(autoMacros.carbs),
            fat: Number(autoMacros.fat),
          }),
        });
      }
      return;
    }

    if (!isManualMode) return;
    setTargetDraft((prev) => ({ ...prev, [key]: value }));
    const n = numericDraft(value);
    if (n != null) setTargets({ [key]: n });
  };

  const setManualMode = (enabled) => {
    setIsManualMode(enabled);
    if (!enabled) {
      const autoMacros = autoMacrosFromCalories(targetDraft.calories);
      setTargetDraft((prev) => ({ ...prev, ...autoMacros }));
      const calories = numericDraft(targetDraft.calories);
      if (calories != null) {
        setTargets({
          calories,
          protein: Number(autoMacros.protein),
          carbs: Number(autoMacros.carbs),
          fat: Number(autoMacros.fat),
        });
      }
    }
  };

  const targetCalories = numericDraft(targetDraft.calories);
  const manualProtein = numericDraft(targetDraft.protein) || 0;
  const manualCarbs = numericDraft(targetDraft.carbs) || 0;
  const manualFat = numericDraft(targetDraft.fat) || 0;
  const macroCalories = Math.round((manualProtein * 4) + (manualCarbs * 4) + (manualFat * 9));
  const showMacroWarning = isManualMode
    && targetCalories != null
    && Math.abs(macroCalories - targetCalories) > 10;

  const links = [
    { to: '/my-foods', icon: Package, label: 'My Foods', sub: 'Catalog & favorites' },
    { to: '/products', icon: Package, label: 'Barcode Products', sub: 'Scanned items' },
    { to: '/meals', icon: UtensilsCrossed, label: 'Saved Meals', sub: 'Parsed templates' },
    { to: '/recipes', icon: BookOpen, label: 'Recipes', sub: 'Custom foods' },
  ];

  return (
    <div className="px-4 pt-3 safe-top space-y-5 max-w-lg mx-auto">
      <PageHeader label="ACCOUNT" title="Profile" />

      <CloudStatus />

      <Card className="p-5" elevated>
        {!editing ? (
          <>
            <p className="text-3xl font-bold tracking-tight">{profile.name || 'User'}</p>
            <p className="text-muted text-sm mt-1">
              {profile.weightKg} kg · {profile.heightCm} cm · {profile.age} yrs
            </p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setDraft(normalizeDraft(profile)); setEditing(true); }}>
              Edit profile
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted">Name</label>
              <Input className="mt-1" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted">Weight (kg)</label>
                <NumericInput
                  className="mt-1 w-full h-12 rounded-full bg-surface-2 border border-white/[0.08] px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                  value={draft.weightKg}
                  onValueChange={(weightKg) => setDraft({ ...draft, weightKg })}
                  fallback={profile.weightKg ?? 75}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Height (cm)</label>
                <NumericInput
                  className="mt-1 w-full h-12 rounded-full bg-surface-2 border border-white/[0.08] px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                  value={draft.heightCm}
                  onValueChange={(heightCm) => setDraft({ ...draft, heightCm })}
                  fallback={profile.heightCm ?? 175}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Age</label>
                <NumericInput
                  className="mt-1 w-full h-12 rounded-full bg-surface-2 border border-white/[0.08] px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                  value={draft.age}
                  onValueChange={(age) => setDraft({ ...draft, age })}
                  fallback={profile.age ?? 28}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={saveProfile}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}
        <div className="flex gap-6 mt-5 pt-4 border-t border-white/[0.06]">
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted">TDEE</p>
            <p className="text-xl font-bold tabular-nums">{tdee}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted">Streak</p>
            <p className="text-xl font-bold tabular-nums">{streak} days</p>
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader title="Library" />
        <Card className="overflow-hidden p-0 divide-y divide-white/[0.06]">
          {links.map(({ to, icon: Icon, label, sub }) => (
            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
                <Icon className="w-5 h-5 text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-[10px] text-muted">{sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted" />
            </Link>
          ))}
        </Card>
      </section>

      <Card className="p-5 space-y-4" elevated>
        <SectionHeader title="Nutrition Targets" />
        <div>
          <label className="text-xs text-muted">Calories</label>
          <NumericInput
            className="mt-1 w-full h-12 rounded-full bg-surface-2 border border-white/[0.08] px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
            value={targetDraft.calories}
            onValueChange={(value) => updateTarget('calories', value)}
            fallback={targets.calories ?? 2000}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 border border-white/[0.06] px-4 py-3">
          <div>
            <p className="text-sm font-bold">Set Macros Manually</p>
            <p className="text-[10px] text-muted mt-0.5">
              {isManualMode ? 'Custom grams are unlocked.' : 'Auto: 30% protein / 45% carbs / 25% fat.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setManualMode(!isManualMode)}
            className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full border transition-colors duration-200 ${
              isManualMode ? 'bg-white border-white' : 'bg-black/30 border-white/10'
            }`}
            aria-pressed={isManualMode}
            aria-label="Set macros manually"
          >
            <span
              className={`absolute left-0 top-1 h-4 w-4 rounded-full transition-transform duration-200 ${
                isManualMode ? 'translate-x-1 bg-black' : 'translate-x-6 bg-white/60'
              }`}
            />
          </button>
        </div>

        {[
          { k: 'protein', l: 'Protein (g)' },
          { k: 'carbs', l: 'Carbs (g)' },
          { k: 'fat', l: 'Fat (g)' },
        ].map(({ k, l }) => (
          <div key={k}>
            <label className="text-xs text-muted">{l}</label>
            <NumericInput
              decimal
              disabled={!isManualMode}
              className={`mt-1 w-full h-12 rounded-full bg-surface-2 border border-white/[0.08] px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow ${!isManualMode ? 'opacity-70 cursor-not-allowed bg-surface-1 text-white/80' : ''}`}
              value={targetDraft[k]}
              onValueChange={(value) => updateTarget(k, value)}
              fallback={targets[k] ?? 0}
            />
          </div>
        ))}
        {showMacroWarning && (
          <p className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-200">
            Current macros add up to {macroCalories} kcal, which deviates from your target of {targetCalories} kcal.
          </p>
        )}
      </Card>
    </div>
  );
}

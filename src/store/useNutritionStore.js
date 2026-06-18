import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTDEE, macroTargetsFromCalories, todayKey, uid } from '@/lib/utils';

export const PAUL_DEFAULT_PROFILE = {
  name: 'Paul',
  sex: 'male',
  age: 17,
  weightKg: 65,
  heightCm: 175,
  activity: 1.55,
  goal: 'maintain',
};

const defaultProfile = { ...PAUL_DEFAULT_PROFILE };

const defaultTargets = {
  calories: 2200,
  protein: 165,
  carbs: 248,
  fat: 61,
  fiber: 30,
  sodium: 2300,
};

function hasBodyProfile(profile) {
  return Number(profile?.age) > 0
    && Number(profile?.weightKg) > 0
    && Number(profile?.heightCm) > 0;
}

function stripWaterState(state) {
  if (!state) return state;
  const rest = { ...state };
  delete rest.waterByDate;
  const targets = { ...(rest.targets || {}) };
  delete targets.waterMl;
  return { ...rest, targets };
}

export const useNutritionStore = create(
  persist(
    (set, get) => ({
      onboardingComplete: true,
      profile: defaultProfile,
      targets: defaultTargets,
      tdee: 2400,
      selectedDate: todayKey(),
      weightLog: [],
      streak: 0,
      lastLogDate: null,
      entries: [],
      deletedEntryIds: [],
      favorites: [],
      recentFoods: [],
      recipes: [],

      applyProfileMacros: (profile) => {
        const tdee = calculateTDEE(profile);
        let calories = tdee;
        if (profile.goal === 'lose') calories = tdee - 400;
        if (profile.goal === 'gain') calories = tdee + 300;
        const macros = macroTargetsFromCalories(calories);
        const targets = stripWaterState({ targets: get().targets }).targets;
        return { profile, tdee, targets: { ...targets, calories, ...macros } };
      },

      ensureDefaultProfile: () => {
        const s = get();
        const hasProfile = hasBodyProfile(s.profile);
        if (hasProfile && s.onboardingComplete) return;
        const profile = hasProfile ? s.profile : { ...PAUL_DEFAULT_PROFILE };
        const next = get().applyProfileMacros(profile);
        set({ ...next, onboardingComplete: true });
      },

      completeOnboarding: (data) => {
        const profile = { ...get().profile, ...data.profile };
        set({ onboardingComplete: true, ...get().applyProfileMacros(profile) });
      },

      updateProfile: (partial) => {
        const profile = { ...get().profile, ...partial };
        set(get().applyProfileMacros(profile));
      },

      setSelectedDate: (date) => set({ selectedDate: date }),
      shiftDate: (days) => {
        const d = new Date(get().selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + days);
        set({ selectedDate: d.toISOString().slice(0, 10) });
      },

      setTargets: (partial) => set({ targets: { ...get().targets, ...partial } }),

      addEntry: (entry) => {
        const date = get().selectedDate;
        const now = Date.now();
        const barcode = entry.barcode ? String(entry.barcode).replace(/\D/g, '') : '';

        if (barcode.length >= 8) {
          const dup = get().entries.find(
            (e) =>
              e.date === date
              && e.barcode
              && String(e.barcode).replace(/\D/g, '') === barcode
              && now - (e.loggedAt || 0) < 5000,
          );
          if (dup) return dup;
        }

        const full = { ...entry, id: uid(), date, loggedAt: now };
        const dedupeKey = entry.barcode || entry.ingredientId || entry.name;
        const recent = [
          { ...full, id: undefined },
          ...get().recentFoods.filter((r) => (r.barcode || r.ingredientId || r.name) !== dedupeKey),
        ].slice(0, 20);
        const today = todayKey();
        let streak = get().streak;
        if (date === today && get().lastLogDate !== today) {
          const yesterday = new Date(today + 'T12:00:00');
          yesterday.setDate(yesterday.getDate() - 1);
          const yKey = yesterday.toISOString().slice(0, 10);
          streak = get().lastLogDate === yKey ? streak + 1 : 1;
        }
        set({
          entries: [...get().entries, full],
          recentFoods: recent,
          lastLogDate: date === today ? today : get().lastLogDate,
          streak: date === today ? streak : get().streak,
        });
        return full;
      },

      removeEntry: (id) => {
        const deleted = new Set(get().deletedEntryIds || []);
        if (id) deleted.add(id);
        set({
          entries: get().entries.filter((e) => e.id !== id),
          deletedEntryIds: Array.from(deleted).slice(-1000),
        });
      },

      updateEntry: (id, patch) => set({
        entries: get().entries.map((entry) =>
          entry.id === id ? { ...entry, ...patch, updatedAt: Date.now() } : entry,
        ),
      }),

      toggleFavorite: (food) => {
        const favs = get().favorites;
        const exists = favs.find((f) => f.barcode === food.barcode);
        if (exists) set({ favorites: favs.filter((f) => f.barcode !== food.barcode) });
        else set({ favorites: [{ ...food, savedAt: Date.now() }, ...favs].slice(0, 100) });
      },

      addRecipe: (recipe) =>
        set({ recipes: [{ ...recipe, id: uid(), createdAt: Date.now() }, ...get().recipes] }),

      removeRecipe: (id) => set({ recipes: get().recipes.filter((r) => r.id !== id) }),

      logWeight: (kg) =>
        set({ weightLog: [{ kg, date: todayKey(), id: uid() }, ...get().weightLog].slice(0, 365) }),

      entriesForDate: (date) => get().entries.filter((e) => e.date === date),
    }),
    {
      name: 'nutriscan-v1',
      version: 3,
      migrate: (persisted, version) => {
        if (!persisted) return persisted;
        if (version < 2) {
          const p = persisted.profile || {};
          if (!hasBodyProfile(p)) {
            persisted.profile = { ...PAUL_DEFAULT_PROFILE };
            persisted.onboardingComplete = true;
          }
        }
        const next = stripWaterState(persisted);
        if (!Array.isArray(next.deletedEntryIds)) next.deletedEntryIds = [];
        return next;
      },
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        profile: s.profile,
        targets: stripWaterState({ targets: s.targets }).targets,
        tdee: s.tdee,
        entries: s.entries,
        deletedEntryIds: s.deletedEntryIds,
        favorites: s.favorites,
        recentFoods: s.recentFoods,
        recipes: s.recipes,
        weightLog: s.weightLog,
        streak: s.streak,
        lastLogDate: s.lastLogDate,
      }),
    }
  )
);

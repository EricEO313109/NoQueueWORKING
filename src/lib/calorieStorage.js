/** @typedef {'breakfast' | 'lunch' | 'dinner' | 'snack'} MealType */

/**
 * @typedef {Object} FoodEntry
 * @property {string} id
 * @property {string} name
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {MealType} meal
 * @property {string} date
 */

const STORAGE_KEY = 'macrofactor-clone-v2';

const DEFAULT_STATE = {
  goal: 2100,
  macroTargets: { protein: 160, carbs: 210, fat: 70 },
  expenditure: 2350,
  entries: [],
  favorites: [],
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      macroTargets: { ...DEFAULT_STATE.macroTargets, ...parsed.macroTargets },
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function entriesForDate(entries, date) {
  return entries.filter((e) => e.date === date);
}

export function sumMacros(entries) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function uid() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_LABELS = {
  breakfast: 'Mic dejun',
  lunch: 'Prânz',
  dinner: 'Cină',
  snack: 'Gustări',
};

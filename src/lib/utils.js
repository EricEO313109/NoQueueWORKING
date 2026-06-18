import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function uid() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** @param {number} grams @param {number} per100 */
export function scaleNutrient(grams, per100) {
  if (!per100 || !grams) return 0;
  return Math.round((per100 * grams) / 100 * 10) / 10;
}

export function sumEntries(entries) {
  return entries.reduce(
    (a, e) => ({
      calories: a.calories + (e.calories || 0),
      protein: a.protein + (e.protein || 0),
      carbs: a.carbs + (e.carbs || 0),
      fat: a.fat + (e.fat || 0),
      fiber: a.fiber + (e.fiber || 0),
      sodium: a.sodium + (e.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  );
}

/** Mifflin-St Jeor TDEE */
export function calculateTDEE({ sex, weightKg, heightCm, age, activity = 1.55 }) {
  const bmr =
    sex === 'female'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(bmr * activity);
}

export function macroTargetsFromCalories(calories, split = { p: 0.3, c: 0.45, f: 0.25 }) {
  return {
    protein: Math.round((calories * split.p) / 4),
    carbs: Math.round((calories * split.c) / 4),
    fat: Math.round((calories * split.f) / 9),
  };
}

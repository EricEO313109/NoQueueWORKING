import { validateCalorieConsistency, caloriesFromMacros } from '../nutrition/accuracyEngine.js';

const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat'];

export { validateCalorieConsistency, caloriesFromMacros };

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Relative difference 0–1 */
function relDiff(a, b) {
  const x = num(a);
  const y = num(b);
  if (x === 0 && y === 0) return 0;
  const denom = Math.max(Math.abs(x), Math.abs(y), 1);
  return Math.abs(x - y) / denom;
}

export function compareMacros(per100gA, per100gB, tolerance = 0.12) {
  const diffs = {};
  let mismatch = false;

  for (const key of MACRO_KEYS) {
    const d = relDiff(per100gA?.[key], per100gB?.[key]);
    diffs[key] = {
      a: num(per100gA?.[key]),
      b: num(per100gB?.[key]),
      delta: Math.round((num(per100gA?.[key]) - num(per100gB?.[key])) * 10) / 10,
      relDiff: Math.round(d * 100),
    };
    if (d > tolerance) mismatch = true;
  }

  return { mismatch, diffs, tolerance };
}

export function isLowConfidence(product, threshold = 0.8) {
  const c = product?.confidence ?? product?.confidence_score ?? 1;
  return c < threshold;
}

export function needsVerification(product, alternatePer100g) {
  if (product?.nutrition_source === 'user_verified') return false;
  if (isLowConfidence(product)) return true;
  if (alternatePer100g) {
    const { mismatch } = compareMacros(product?.per100g, alternatePer100g);
    if (mismatch) return true;
  }
  return false;
}

const KEYS = ['calories', 'protein', 'carbs', 'fat'];

function n(v) {
  return Number(v) || 0;
}

function relDiff(a, b) {
  const x = n(a);
  const y = n(b);
  if (x === 0 && y === 0) return 0;
  return Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y), 1);
}

export function compareMacros(a, b, tolerance = 0.12) {
  const diffs = {};
  let mismatch = false;
  for (const key of KEYS) {
    const rd = relDiff(a?.[key], b?.[key]);
    diffs[key] = {
      app: n(a?.[key]),
      label: n(b?.[key]),
      delta: Math.round((n(a?.[key]) - n(b?.[key])) * 10) / 10,
      pct: Math.round(rd * 100),
    };
    if (rd > tolerance) mismatch = true;
  }
  return { mismatch, diffs };
}

export function needsUserVerification(product) {
  if (product?.nutrition_source === 'user_verified') return false;
  if ((product?.confidence ?? product?.confidence_score ?? 1) < 0.8) return true;
  if (product?.needsVerification) return true;
  return false;
}

/** Ground truth: Crownfield oats example from user label */
export const DEV_GROUND_TRUTH_OATS = {
  name: 'Oat flakes (label reference)',
  per100g: { calories: 364, protein: 12.9, carbs: 61, fat: 5.2 },
  perPortion65g: { calories: 237, protein: 8.4, carbs: 39.7, fat: 3.4 },
  defaultGrams: 65,
};

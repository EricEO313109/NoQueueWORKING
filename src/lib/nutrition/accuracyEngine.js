/** Client-safe re-export of accuracy helpers (duplicated for Vite bundle without Node fs). */

export const ACCURACY_BY_SOURCE = {
  usda: { min: 0.98, max: 1, label: 'USDA' },
  USDA: { min: 0.98, max: 1, label: 'USDA' },
  manufacturer_label: { min: 0.95, max: 1, label: 'Official Label' },
  user_verified: { min: 0.9, max: 1, label: 'User Verified' },
  'verified-db': { min: 0.95, max: 1, label: 'Verified Database' },
  seed: { min: 0.95, max: 1, label: 'Verified Database' },
  openfoodfacts: { min: 0.8, max: 0.95, label: 'OpenFoodFacts' },
  ai_estimate: { min: 0.5, max: 0.8, label: 'AI Estimate' },
  unknown: { min: 0.2, max: 0.5, label: 'Unknown' },
};

function num(v) {
  return Number(v) || 0;
}

export function caloriesFromMacros(macros) {
  return num(macros.protein) * 4 + num(macros.carbs) * 4 + num(macros.fat) * 9;
}

export function validateCalorieConsistency(macros, tolerancePct = 0.1) {
  const stated = num(macros.calories);
  const expected = Math.round(caloriesFromMacros(macros));
  const base = Math.max(stated, expected, 1);
  const diffPct = Math.abs(stated - expected) / base;
  return {
    consistent: diffPct <= tolerancePct,
    expected,
    stated,
    warning: diffPct <= tolerancePct ? null : `Calories (${stated}) vs macros (${expected} kcal) mismatch.`,
  };
}

export function accuracyScoreForSource(source, confidence = 1) {
  const cfg = ACCURACY_BY_SOURCE[source] || ACCURACY_BY_SOURCE.unknown;
  const c = Math.min(1, Math.max(0, num(confidence)));
  const score = cfg.min + (cfg.max - cfg.min) * c;
  return { score: Math.round(score * 100), sourceLabel: cfg.label, tier: score >= 0.95 ? 'high' : score >= 0.8 ? 'medium' : 'low' };
}

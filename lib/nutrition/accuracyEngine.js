/**
 * StilMacros nutrition accuracy engine — verified data first, never confident guesses.
 */

export const SOURCE_PRIORITY = [
  'usda',
  'manufacturer_label',
  'user_verified',
  'verified-db',
  'seed',
  'openfoodfacts',
  'ai_estimate',
  'unknown',
];

export const ACCURACY_BY_SOURCE = {
  usda: { min: 0.98, max: 1, label: 'USDA' },
  USDA: { min: 0.98, max: 1, label: 'USDA' },
  manufacturer_label: { min: 0.95, max: 1, label: 'Official Label' },
  user_verified: { min: 0.9, max: 1, label: 'User Verified' },
  'verified-db': { min: 0.95, max: 1, label: 'Verified Database' },
  seed: { min: 0.95, max: 1, label: 'Verified Database' },
  openfoodfacts: { min: 0.8, max: 0.95, label: 'OpenFoodFacts' },
  ai_estimate: { min: 0.5, max: 0.8, label: 'AI Estimate' },
  ai_label: { min: 0.75, max: 0.9, label: 'Label Scan (AI)' },
  unknown: { min: 0.2, max: 0.5, label: 'Unknown' },
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Calories from macros: 4P + 4C + 9F */
export function caloriesFromMacros(macros) {
  return (
    num(macros.protein) * 4
    + num(macros.carbs) * 4
    + num(macros.fat) * 9
  );
}

/**
 * @returns {{ consistent: boolean, expected: number, stated: number, diffPct: number, warning: string|null }}
 */
export function validateCalorieConsistency(macros, tolerancePct = 0.1) {
  const stated = num(macros.calories);
  const expected = Math.round(caloriesFromMacros(macros));
  if (stated <= 0 && expected <= 0) {
    return { consistent: true, expected, stated, diffPct: 0, warning: null };
  }
  const base = Math.max(stated, expected, 1);
  const diffPct = Math.abs(stated - expected) / base;
  const consistent = diffPct <= tolerancePct;
  return {
    consistent,
    expected,
    stated,
    diffPct: Math.round(diffPct * 100),
    warning: consistent
      ? null
      : `Calories (${stated}) don't match macros (${expected} kcal from P/C/F).`,
  };
}

/** Recalculate calories from macros when inconsistent */
export function reconcileCalories(macros) {
  const check = validateCalorieConsistency(macros);
  if (check.consistent) return { ...macros };
  return {
    ...macros,
    calories: check.expected,
    caloriesReconciled: true,
    originalCalories: check.stated,
  };
}

export function accuracyScoreForSource(source, confidence = 1) {
  const cfg = ACCURACY_BY_SOURCE[source] || ACCURACY_BY_SOURCE.unknown;
  const c = Math.min(1, Math.max(0, num(confidence)));
  const score = cfg.min + (cfg.max - cfg.min) * c;
  return {
    score: Math.round(score * 100),
    sourceLabel: cfg.label,
    tier: score >= 0.95 ? 'high' : score >= 0.8 ? 'medium' : 'low',
  };
}

/**
 * Full validation pass on a nutrition record (per 100g or serving).
 */
export function validateNutritionRecord(record, category = 'unknown') {
  const per100g = record.per100g || record;
  const warnings = [];
  let adjusted = { ...per100g };

  const calCheck = validateCalorieConsistency(adjusted);
  if (!calCheck.consistent) {
    warnings.push(calCheck.warning);
    adjusted = reconcileCalories(adjusted);
    warnings.push('Calories adjusted to match protein, carbs, and fat.');
  }

  const catCheck = validateCategoryMacros(adjusted, category);
  if (!catCheck.valid) {
    warnings.push(...catCheck.warnings);
    adjusted = catCheck.adjusted;
  }

  const source = record.nutritionSource || record.source || 'unknown';
  const conf = record.confidence ?? 1;
  const accuracy = accuracyScoreForSource(source, conf);

  return {
    per100g: adjusted,
    warnings,
    accuracyScore: accuracy.score,
    accuracyLabel: accuracy.sourceLabel,
    accuracyTier: accuracy.tier,
    calorieCheck: calCheck,
  };
}

const CATEGORY_RULES = {
  protein: {
    maxCarbs: 5,
    maxProtein: 40,
    maxFat: 35,
    minProtein: 8,
  },
  dairy_protein: { maxCarbs: 10, maxFat: 45 },
  carb: { maxProtein: 18, minCarbs: 5 },
  fat: { maxProtein: 5, maxCarbs: 15, minFat: 50 },
  vegetable: { maxFat: 2, maxProtein: 6 },
};

export function validateCategoryMacros(per100g, category) {
  const rules = CATEGORY_RULES[category];
  const warnings = [];
  const adjusted = { ...per100g };
  if (!rules) return { valid: true, warnings, adjusted };

  if (rules.maxCarbs != null && num(adjusted.carbs) > rules.maxCarbs) {
    warnings.push(`${category} food has unusually high carbs (${adjusted.carbs}g/100g).`);
    adjusted.carbs = category === 'protein' ? 0 : rules.maxCarbs;
  }
  if (rules.maxProtein != null && num(adjusted.protein) > rules.maxProtein) {
    warnings.push(`Unusually high protein for ${category}.`);
    adjusted.protein = rules.maxProtein;
  }
  if (rules.maxFat != null && num(adjusted.fat) > rules.maxFat) {
    adjusted.fat = rules.maxFat;
    warnings.push(`Fat capped for ${category} category.`);
  }
  if (rules.minFat != null && num(adjusted.fat) < rules.minFat && category === 'fat') {
    warnings.push(`Fat too low for ${category} — check source.`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
    adjusted: reconcileCalories(adjusted),
  };
}

/** Normalize to standard ingredient schema */
export function normalizeIngredientRecord(raw) {
  const per100g = raw.per100g || {
    calories: raw.calories,
    protein: raw.protein,
    carbs: raw.carbs,
    fat: raw.fat,
    fiber: raw.fiber,
    sugar: raw.sugar,
  };
  const servingG = raw.defaultGrams || raw.servingGrams || 100;
  const f = servingG / 100;
  const perServing = {
    calories: Math.round(num(per100g.calories) * f),
    protein: Math.round(num(per100g.protein) * f * 10) / 10,
    carbs: Math.round(num(per100g.carbs) * f * 10) / 10,
    fat: Math.round(num(per100g.fat) * f * 10) / 10,
    fiber: Math.round(num(per100g.fiber) * f * 10) / 10,
    sugar: Math.round(num(per100g.sugar) * f * 10) / 10,
    grams: servingG,
  };

  const source = raw.nutritionSource || raw.source || 'verified-db';
  const accuracy = accuracyScoreForSource(source, raw.confidence ?? 1);

  return {
    name: raw.name || '',
    source,
    servingSize: raw.servingSize || `${servingG}g`,
    servingGrams: servingG,
    per100g: {
      calories: num(per100g.calories),
      protein: num(per100g.protein),
      carbs: num(per100g.carbs),
      fat: num(per100g.fat),
      fiber: num(per100g.fiber),
      sugar: num(per100g.sugar),
    },
    perServing,
    confidence: raw.confidence ?? accuracy.score / 100,
    accuracyScore: accuracy.score,
    accuracyLabel: accuracy.sourceLabel,
    userVerified: !!raw.userVerified,
    lastVerifiedAt: raw.lastVerifiedAt || null,
    verificationSource: raw.verificationSource || null,
  };
}

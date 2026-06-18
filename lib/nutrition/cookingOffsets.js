export function lineNeedsOilOffset(line) {
  const value = String(line || '').toLowerCase();
  if (/\bair\s*fri(?:ed|ed|yer)|\bair\s*fryed\b/.test(value)) return false;
  return /\b(deep\s*)?fried\b|\bfryed\b|\bpan[\s-]?fried\b|\bin\s+oil\b|\bwith\s+oil\b|\bprăjit\b|\bprajit\b/.test(value);
}

function round1(value) {
  return Math.round((value || 0) * 10) / 10;
}

export async function buildOilOffset(rawLine, deps, grams = 8) {
  const oil = await deps.getIngredientById?.('olive-oil');
  const per100g = oil?.per100g || { calories: 884, protein: 0, carbs: 0, fat: 100 };
  const f = grams / 100;
  return {
    name: 'Cooking Oil (Fried Offset)',
    ingredientId: oil?.id || 'estimated-cooking-oil',
    variant: oil?.variant || '',
    category: 'fat',
    weight: grams,
    grams,
    calories: Math.round((per100g.calories || 884) * f),
    protein: round1((per100g.protein || 0) * f),
    carbs: round1((per100g.carbs || 0) * f),
    fat: round1((per100g.fat || 100) * f),
    per100g,
    matched: true,
    estimated: true,
    aiEstimated: true,
    confidence: 0.72,
    nutritionSource: oil ? 'verified-db' : 'AI Estimated',
    accuracyScore: 72,
    accuracyLabel: 'Cooking Offset',
    validationWarnings: ['Added estimated absorbed cooking oil for fried preparation.'],
    rawLine,
  };
}

function sumTotals(items) {
  return items.reduce(
    (acc, it) => ({
      totalCalories: acc.totalCalories + (it.calories || 0),
      totalProtein: Math.round((acc.totalProtein + (it.protein || 0)) * 10) / 10,
      totalCarbs: Math.round((acc.totalCarbs + (it.carbs || 0)) * 10) / 10,
      totalFat: Math.round((acc.totalFat + (it.fat || 0)) * 10) / 10,
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
  );
}

export async function withCookingOffsets(result, lines, deps) {
  const oilOffsets = await Promise.all(
    lines.filter(lineNeedsOilOffset).map((line) => buildOilOffset(line, deps)),
  );
  if (!oilOffsets.length) return result;
  const items = [...(result.items || []), ...oilOffsets];
  return {
    ...result,
    items,
    ...sumTotals(items.filter((i) => i.matched)),
  };
}

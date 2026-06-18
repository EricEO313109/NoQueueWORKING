function round1(value) {
  return Math.round((value || 0) * 10) / 10;
}

export function totalsFromMealItems(items = []) {
  return items.reduce(
    (sum, item) => ({
      calories: sum.calories + (item.calories || 0),
      protein: round1(sum.protein + (item.protein || 0)),
      carbs: round1(sum.carbs + (item.carbs || 0)),
      fat: round1(sum.fat + (item.fat || 0)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function compactMealItem(item) {
  return {
    name: item.name,
    rawLine: item.rawLine,
    pieceCount: item.pieceCount,
    ingredientId: item.ingredientId,
    grams: item.weight ?? item.grams,
    weight: item.weight ?? item.grams,
    calories: item.calories || 0,
    protein: item.protein || 0,
    carbs: item.carbs || 0,
    fat: item.fat || 0,
    per100g: item.per100g,
    variant: item.variant,
    nutritionSource: item.nutritionSource,
    estimated: item.estimated,
    aiEstimated: item.aiEstimated,
    confidence: item.confidence,
    accuracyScore: item.accuracyScore,
  };
}

export function mealNameFromText(text, fallback = 'Described Meal') {
  const words = String(text || '')
    .replace(/\d+(\.\d+)?\s*(g|kg|ml|oz|tbsp|tsp|small|medium|large)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

  if (!words.length) return fallback;
  return words.map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');
}

export function buildDescribedMealEntry({ text, items, name }) {
  const mealItems = (items || [])
    .filter((item) => item.matched && !item.needsClarification && item.calories > 0)
    .map(compactMealItem);
  const totals = totalsFromMealItems(mealItems);

  return {
    name: name?.trim() || mealNameFromText(text),
    type: 'described-meal',
    meal: 'snack',
    items: mealItems,
    childCount: mealItems.length,
    grams: round1(mealItems.reduce((sum, item) => sum + (item.grams || item.weight || 0), 0)),
    calories: Math.round(totals.calories),
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
    nutritionSource: 'describe',
    confidence: mealItems.length
      ? round1(mealItems.reduce((sum, item) => sum + (item.confidence ?? 0.8), 0) / mealItems.length)
      : 0,
    accuracyScore: mealItems.length
      ? Math.round(mealItems.reduce((sum, item) => sum + (item.accuracyScore || 0), 0) / mealItems.length)
      : 0,
  };
}

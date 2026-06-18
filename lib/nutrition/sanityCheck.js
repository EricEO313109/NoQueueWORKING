/**
 * Detect unrealistic meal macros (especially carb overestimation on protein-heavy meals).
 */

const CARB_WARN_THRESHOLD = 60;
const PROTEIN_HEAVY_RATIO = 0.35;

export function analyzeSanity(items, totals) {
  const matched = items.filter((i) => i.matched);
  const totalProtein = totals.totalProtein || 0;
  const totalCarbs = totals.totalCarbs || 0;
  const totalCal = totals.totalCalories || 0;

  const proteinCal = totalProtein * 4;
  const isProteinHeavy = totalCal > 0 && proteinCal / totalCal >= PROTEIN_HEAVY_RATIO;
  const carbTooHigh = totalCarbs > CARB_WARN_THRESHOLD;
  const suspicious = isProteinHeavy && carbTooHigh;

  const carbItems = matched.filter((i) => (i.carbs || 0) > 15);
  const proteinItems = matched.filter((i) => (i.protein || 0) > 15 && (i.carbs || 0) < 8);

  return {
    suspicious,
    warning: suspicious
      ? 'Possible macro overestimation detected. Recalculated using verified ingredient database.'
      : null,
    carbTooHigh,
    isProteinHeavy,
    carbItems: carbItems.map((i) => i.name),
    proteinItems: proteinItems.map((i) => i.name),
  };
}

/** Re-apply category carb caps on parsed items */
export function recalcWithCaps(items, applyCapsFn) {
  return items.map((item) => {
    if (!item.matched || !item.per100g) return item;
    const capped = applyCapsFn(item.per100g, item.category);
    const f = item.weight / 100;
    return {
      ...item,
      per100g: capped,
      calories: Math.round((capped.calories || 0) * f),
      protein: Math.round((capped.protein || 0) * f * 10) / 10,
      carbs: Math.round((capped.carbs || 0) * f * 10) / 10,
      fat: Math.round((capped.fat || 0) * f * 10) / 10,
      recalculated: true,
    };
  });
}

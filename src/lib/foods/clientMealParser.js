/**
 * Offline describe parser — same engine as server, seed DB only.
 */
import seedData from '../../../data/ingredients-seed.json';
import { parseDescribeLine, splitMealText } from '../../../lib/nutrition/describeLine.js';
import { normalizeMealSearchQuery, mealQueryTokens, itemMatchesMealTokens } from '../../../lib/nutrition/foodQuery.js';
import { macrosForGrams } from '@/lib/api/ingredientsApi';
import { applyCategoryMacroCaps } from '../../../lib/nutrition/ingredientCategories.js';
import { estimateCommonMeal } from '../../../lib/nutrition/commonMealEstimates.js';
import { withCookingOffsets } from '../../../lib/nutrition/cookingOffsets.js';
import { buildParseChoices } from '../../../lib/nutrition/mealUserContext.js';
import { getFrequentFoods } from '@/lib/cache/frequentFoods';
import { getUserProducts } from '@/lib/cache/userFoodDb';
import { exportUserCorrectionsList } from '@/lib/nutrition/userCorrections';

function normalizeSeed(row) {
  const variant = row.variant || '';
  const label = variant ? ` (${variant})` : '';
  return {
    id: row.id,
    name: row.name,
    displayName: `${row.name}${label}`,
    variant,
    per100g: row.per100g || {},
    defaultGrams: row.defaultGrams || 100,
    source: 'seed',
    confidence: 0.95,
    searchTerms: row.searchTerms || [],
  };
}

const SEED = seedData.map(normalizeSeed);

function scoreLocal(item, query, line) {
  const q = normalizeMealSearchQuery(query, line).toLowerCase();
  if (!q || /^\d+$/.test(q)) return 0;
  let score = 0;
  const terms = [item.name, ...(item.searchTerms || [])].map((t) => t.toLowerCase());
  const tokens = mealQueryTokens(q);
  if (terms.some((t) => t === q || t.includes(q) || q.includes(t))) score += 100;
  if (itemMatchesMealTokens(item, tokens)) score += 90;
  if ((q.includes('tortilla') || line.toLowerCase().includes('tortilla')) && item.id?.includes('tortilla')) score += 120;
  if (q.includes('cheese') && item.id?.includes('cheese')) score += 80;
  if ((q.includes('beef') || q.includes('meat')) && item.id?.includes('beef')) score += 80;
  return score;
}

async function searchIngredients(query, opts = {}) {
  const q = normalizeMealSearchQuery(String(query || '').trim());
  if (q.length < 2 || /^\d+$/.test(q)) return [];
  return SEED
    .map((item) => ({ item, score: scoreLocal(item, q, '') }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit || 20)
    .map((x) => x.item);
}

async function getIngredientById(id) {
  const row = SEED.find((s) => s.id === id);
  return row || null;
}

const deps = { searchIngredients, getIngredientById };

function sumTotals(items) {
  return items.reduce(
    (a, it) => ({
      totalCalories: a.totalCalories + (it.calories || 0),
      totalProtein: Math.round((a.totalProtein + (it.protein || 0)) * 10) / 10,
      totalCarbs: Math.round((a.totalCarbs + (it.carbs || 0)) * 10) / 10,
      totalFat: Math.round((a.totalFat + (it.fat || 0)) * 10) / 10,
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
  );
}

function localParseChoices(choices = {}) {
  return buildParseChoices(choices, {
    frequentFoods: getFrequentFoods(),
    scannedProducts: getUserProducts(),
    userCorrections: exportUserCorrectionsList(),
  });
}

export async function parseMealLocally(text, choices = {}) {
  const mergedChoices = localParseChoices(choices);
  const lines = splitMealText(text);
  const estimated = await estimateCommonMeal(text, deps, { portion: mergedChoices.__portion || 'auto' });
  if (estimated) return withCookingOffsets(estimated, lines, deps);

  const items = await Promise.all(lines.map((line) => parseDescribeLine(line, deps, mergedChoices)));
  const withOffsets = await withCookingOffsets({ items }, lines, deps);
  const parsedItems = withOffsets.items;

  const clarifications = parsedItems.filter((i) => i.needsClarification).map((i) => i.clarification);
  const pending = clarifications.length;
  const matched = parsedItems.filter((i) => i.matched);
  const totals = sumTotals(matched);
  const avgAccuracy = matched.length && !pending
    ? Math.round(matched.reduce((s, i) => s + (i.accuracyScore || 0), 0) / matched.length)
    : 0;

  const sanityWarning = totals.totalCarbs > 60 && totals.totalProtein > 40
    ? 'Possible macro overestimation — check dry vs cooked weights.'
    : null;

  return {
    items: parsedItems,
    ...totals,
    clarifications,
    needsClarification: pending > 0,
    pendingCount: pending,
    confidence: pending > 0 ? 0 : avgAccuracy / 100,
    accuracyScore: avgAccuracy,
    sanityWarning,
  };
}

export function recalcItemWeight(item, newGrams) {
  if (!item.matched || !item.per100g) return item;
  const capped = applyCategoryMacroCaps(item.per100g, item.category || 'unknown');
  const macros = macrosForGrams(capped, newGrams);
  return { ...item, weight: newGrams, ...macros, per100g: capped };
}

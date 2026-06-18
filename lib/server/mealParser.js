import { searchIngredients, getIngredientById, macrosForGrams } from './ingredientDb.js';
import { parseDescribeLine, splitMealText } from '../nutrition/describeLine.js';
import { applyCategoryMacroCaps } from '../nutrition/ingredientCategories.js';
import { analyzeSanity, recalcWithCaps } from '../nutrition/sanityCheck.js';
import { estimateCommonMeal } from '../nutrition/commonMealEstimates.js';
import { withCookingOffsets } from '../nutrition/cookingOffsets.js';
import { buildParseChoices, normalizeMealParseContext } from '../nutrition/mealUserContext.js';
import { hydrateUserCorrections } from '../nutrition/userCorrections.js';

const deps = {
  searchIngredients: (query, options = {}) => searchIngredients(query, {
    ...options,
    fast: true,
    mealParse: true,
  }),
  getIngredientById,
};

function extractJsonArray(raw) {
  const output = String(raw || '').trim();
  if (!output) throw new Error('Empty meal JSON response');
  try {
    return JSON.parse(output);
  } catch {
    const fenced = output.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
    if (fenced) {
      try {
        return JSON.parse(fenced);
      } catch {
        // Continue to bracket salvage below.
      }
    }
    const start = output.indexOf('[');
    const end = output.lastIndexOf(']');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(output.slice(start, end + 1));
      } catch {
        // Fall through to outer error.
      }
    }
    throw new Error('Could not salvage meal JSON array');
  }
}

export function validateMealMacroArrayResponse(raw) {
  const parsed = extractJsonArray(raw);
  if (!Array.isArray(parsed)) throw new Error('Meal JSON response must be an array');
  return parsed
    .map((item) => {
      const weight = Number(item?.weight_g ?? item?.weight ?? item?.grams);
      const calories = Number(item?.calories);
      const protein = Number(item?.protein);
      const carbs = Number(item?.carbs);
      const fat = Number(item?.fat);
      if (!item?.name || !Number.isFinite(weight) || !Number.isFinite(calories)) {
        throw new Error('Meal JSON item is missing required macro fields');
      }
      return {
        name: String(item.name).trim(),
        weight,
        grams: weight,
        calories: Math.max(0, Math.round(calories)),
        protein: Math.max(0, Math.round((protein || 0) * 10) / 10),
        carbs: Math.max(0, Math.round((carbs || 0) * 10) / 10),
        fat: Math.max(0, Math.round((fat || 0) * 10) / 10),
        matched: true,
        estimated: true,
        aiEstimated: true,
        confidence: 0.7,
        nutritionSource: 'AI Estimated',
        accuracyScore: 70,
        accuracyLabel: 'AI Estimated',
      };
    });
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

function finalizeResult(items) {
  const clarifications = items
    .filter((i) => i.needsClarification && i.clarification)
    .map((i) => ({ ...i.clarification, rawLine: i.rawLine }));

  const matched = items.filter((i) => i.matched);
  let totals = sumTotals(matched);
  let sanity = analyzeSanity(items, totals);

  if (sanity.suspicious) {
    const recapped = items.map((it) => {
      if (!it.matched || !it.per100g) return it;
      const capped = applyCategoryMacroCaps(it.per100g, it.category || 'unknown');
      const macros = macrosForGrams(capped, it.weight);
      return { ...it, ...macros, per100g: capped };
    });
    totals = sumTotals(recapped.filter((i) => i.matched));
    sanity = analyzeSanity(recapped, totals);
    return {
      items: recapped,
      ...totals,
      clarifications,
      needsClarification: clarifications.length > 0,
      pendingCount: clarifications.length,
      confidence: 0.85,
      accuracyScore: matched.length
        ? Math.round(matched.reduce((s, i) => s + (i.accuracyScore || 0), 0) / matched.length)
        : 0,
      sanityWarning: sanity.warning,
      recalculated: true,
    };
  }

  const avgConf = matched.length
    ? matched.reduce((s, i) => s + (i.confidence || 0), 0) / matched.length
    : 0;
  const pending = clarifications.length;
  const avgAccuracy = matched.length
    ? Math.round(matched.reduce((s, i) => s + (i.accuracyScore || 0), 0) / matched.length)
    : 0;

  return {
    items,
    ...totals,
    clarifications,
    needsClarification: pending > 0,
    pendingCount: pending,
    confidence: pending > 0 ? 0 : Math.round(avgConf * 100) / 100,
    accuracyScore: pending > 0 ? 0 : avgAccuracy,
    sanityWarning: sanity.carbTooHigh && !sanity.isProteinHeavy
      ? 'Carbohydrate total seems high — check portions or dry vs cooked weights.'
      : null,
  };
}

async function finalizeWithLlmIfNeeded(text, ruleResult, choices, lines) {
  if (choices.__skipLlm) return ruleResult;
  const { shouldInvokeLlmFallback, parseMealWithLlm } = await import('./mealLlmParser.js');
  if (!shouldInvokeLlmFallback(ruleResult)) return ruleResult;
  const llm = await parseMealWithLlm(text, deps);
  if (!llm?.items?.length) return ruleResult;
  return { ...llm, lineCount: lines.length, parserStrategy: 'llm-fallback' };
}

export async function parseMealText(text, choices = {}) {
  const lines = splitMealText(text);
  const estimated = await estimateCommonMeal(text, deps, { portion: choices.__portion || 'auto' });
  if (estimated) {
    const est = await withCookingOffsets(estimated, lines, deps);
    return finalizeWithLlmIfNeeded(text, est, choices, lines);
  }

  const parsedItems = await Promise.all(lines.map((line) => parseDescribeLine(line, deps, choices)));
  const withOffsets = await withCookingOffsets({ items: parsedItems }, lines, deps);
  const ruleResult = { ...finalizeResult(withOffsets.items), lineCount: lines.length };
  return finalizeWithLlmIfNeeded(text, ruleResult, choices, lines);
}

export async function parseMeal(text, choices = {}, context = {}) {
  const normalizedContext = normalizeMealParseContext(context);
  hydrateUserCorrections(normalizedContext.userCorrections);
  const mergedChoices = buildParseChoices(choices, normalizedContext);
  return parseMealText(text, mergedChoices);
}

export { ingredientToProduct, getIngredientById } from './ingredientDb.js';
export { MEAL_DESCRIPTION_SYSTEM_PROMPT } from '../nutrition/mealParsingInstructions.js';

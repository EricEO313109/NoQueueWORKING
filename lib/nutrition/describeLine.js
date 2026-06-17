import {
  extractFoodNameFromLine,
  estimateGramsFromPhrase,
  parsePieceCount,
  formatLoggedFoodName,
} from './quantityParser.js';
import { normalizeMealSearchQuery, mealQueryTokens, itemMatchesMealTokens } from './foodQuery.js';
import { detectClarificationNeeded } from './clarifications.js';
import { resolveSearchQuery, getLineIntent, defaultPreparationForFood } from './lineIntent.js';
import { detectCategory, applyCategoryMacroCaps } from './ingredientCategories.js';
import { validateNutritionRecord, validateCalorieConsistency, reconcileCalories } from './accuracyEngine.js';
import { getUserCorrection } from './userCorrections.js';
import { estimateFoodFromText, hasEstimatedFoodProfile } from './estimatedFoodFallback.js';

const MIN_MATCH_SCORE = 72;

function estimateFallback(foodName, line, weight) {
  return estimateFoodFromText(line, foodName, weight);
}

function leadingCount(line) {
  const words = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    o: 1,
    un: 1,
    una: 1,
    doi: 2,
    doua: 2,
    două: 2,
    trei: 3,
    patru: 4,
  };
  const match = String(line || '').toLowerCase().match(/^\s*(\d+(?:[.,]\d+)?|a|an|one|two|three|four|five|six|o|un|una|doi|doua|două|trei|patru)\b/);
  if (!match) return 1;
  return Math.max(1, words[match[1]] || Number(match[1].replace(',', '.')) || 1);
}

function scoreIngredientForMeal(item, query, line) {
  const q = query.toLowerCase().trim();
  const lineL = line.toLowerCase();
  const intent = getLineIntent(line, query);
  let score = 0;

  const name = item.name.toLowerCase();
  const display = (item.displayName || '').toLowerCase();
  const terms = (item.searchTerms || []).map((t) => t.toLowerCase());

  if (name === q || display === q) score += 200;
  if (terms.includes(q)) score += 180;

  if (intent.preparation === 'cooked' && (item.variant === 'cooked' || terms.some((t) => t.includes('cooked')))) score += 55;
  if (intent.preparation === 'raw' && item.variant === 'raw') score += 55;
  if (intent.preparation === 'dry' && item.variant === 'dry') score += 55;
  if (intent.preparation === 'fried' && item.variant === 'fried') score += 50;

  if (intent.cut && (name.includes(intent.cut) || terms.some((t) => t.includes(intent.cut)))) score += 70;

  if (lineL.includes('small') && (q.includes('tortilla') || q.includes('wrap')) && item.id?.includes('tortilla')) score += 35;
  if ((q.includes('tortilla') || lineL.includes('tortilla')) && item.id?.includes('tortilla')) score += 120;
  if (item.source === 'usda' && !itemMatchesMealTokens(item, mealQueryTokens(q))) score -= 200;

  for (const t of terms) {
    if (t === q) score += 120;
    else if (q.includes(t) || t.includes(q)) score += 50;
    else if (q.split(/\s+/).filter(Boolean).every((w) => t.includes(w) || name.includes(w))) score += 40;
  }

  if (name.includes(q) || q.includes(name)) score += 35;

  const queryCat = detectCategory(q) || intent.category;
  const itemCat = detectCategory(name);
  if (queryCat === itemCat && queryCat !== 'unknown') score += 30;

  if (queryCat === 'protein' && itemCat === 'carb') score -= 120;
  if (queryCat === 'protein' && (item.per100g?.carbs ?? 0) > 15) score -= 80;
  if (queryCat === 'dairy_protein' && itemCat === 'carb') score -= 100;
  if (queryCat === 'fat' && (item.per100g?.protein ?? 0) > 8) score -= 60;

  const sourceBoost = { seed: 45, usda: 35, user_verified: 50, 'verified-db': 45 };
  score += sourceBoost[item.source] ?? 10;

  return score;
}

function enrichMatched(item, foodName, line, grams) {
  const category = detectCategory(foodName) || detectCategory(item.name);
  let per100g = { ...item.per100g };

  const corrected = getUserCorrection(item.id);
  if (corrected?.per100g) {
    per100g = corrected.per100g;
    item = { ...item, source: 'user_verified', confidence: 1 };
  }

  per100g = applyCategoryMacroCaps(per100g, category);
  const validated = validateNutritionRecord(
    { per100g, source: item.source, confidence: item.confidence },
    category,
  );
  per100g = validated.per100g;

  const f = grams / 100;
  let macros = {
    calories: Math.round(per100g.calories * f),
    protein: Math.round(per100g.protein * f * 10) / 10,
    carbs: Math.round(per100g.carbs * f * 10) / 10,
    fat: Math.round(per100g.fat * f * 10) / 10,
    fiber: Math.round((per100g.fiber || 0) * f * 10) / 10,
    sugar: Math.round((per100g.sugar || 0) * f * 10) / 10,
  };
  macros = reconcileCalories(macros);
  const servingCheck = validateCalorieConsistency(macros);

  const source = item.source === 'seed' ? 'verified-db' : item.source === 'usda' ? 'USDA' : item.source;
  const pieceCount = parsePieceCount(line);
  const displayName = formatLoggedFoodName(item.displayName || item.name, {
    pieceCount,
    grams,
    variant: item.variant,
  });

  return {
    name: displayName,
    pieceCount,
    ingredientId: item.id,
    variant: item.variant,
    category,
    weight: grams,
    ...macros,
    per100g,
    matched: true,
    confidence: validated.accuracyScore / 100,
    nutritionSource: source,
    accuracyScore: validated.accuracyScore,
    accuracyLabel: validated.accuracyLabel,
    validationWarnings: [
      ...(validated.warnings || []),
      ...(servingCheck.warning ? [servingCheck.warning] : []),
      ...(macros.caloriesReconciled ? ['Calories aligned to macro formula (4×P + 4×C + 9×F).'] : []),
    ],
    rawLine: line,
  };
}

function buildClarificationFromRanked(foodName, line, ranked) {
  const tokens = mealQueryTokens(normalizeMealSearchQuery(foodName, line));
  const filtered = tokens.length
    ? ranked.filter((r) => itemMatchesMealTokens(r.item, tokens) || r.item.source === 'seed')
    : ranked;
  const pool = filtered.length ? filtered : ranked.filter((r) => r.item.source !== 'usda');
  const top = pool[0];
  const options = pool
    .filter((r) => r.score >= 40)
    .slice(0, 8)
    .map((r) => ({
      label: r.item.displayName || r.item.name,
      ingredientId: r.item.id,
      query: r.item.id,
      variant: r.item.variant,
      score: r.score,
    }));

  return {
    needsClarification: true,
    clarification: {
      groupId: `pick-${foodName}`,
      question: `Which did you mean for "${normalizeMealSearchQuery(foodName, line) || foodName.trim()}"?`,
      options,
      originalQuery: foodName,
      rawLine: line,
      hint: top ? `Best guess: ${top.item.displayName} (${top.score}% match)` : null,
    },
  };
}

export async function parseDescribeLine(line, deps, choices = {}) {
  const foodName = extractFoodNameFromLine(line);
  const searchName = normalizeMealSearchQuery(foodName, line);
  const weight = estimateGramsFromPhrase(line, searchName || foodName);
  const choice = choices[line] || choices[foodName];

  if (choice?.ingredientId && deps.getIngredientById) {
    const item = await deps.getIngredientById(choice.ingredientId);
    if (item) return enrichMatched(item, foodName, line, choice.grams ?? weight);
  }

  const searchQ = choice?.query
    ? (choice.ingredientId || choice.query)
    : resolveSearchQuery(searchName || foodName, line);

  if (!choice?.ingredientId) {
    const clarify = detectClarificationNeeded(searchName || foodName, line);
    if (clarify) {
      return {
        name: foodName,
        weight,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        matched: false,
        needsClarification: true,
        clarification: clarify,
        rawLine: line,
      };
    }
  }

  const primaryQuery =
    typeof searchQ === 'string' && searchQ.length < 40 ? searchQ : (searchName || foodName);
  const searchOpts = { limit: 20, mealParse: true };
  let results = await deps.searchIngredients(primaryQuery, searchOpts);

  if (!results?.length && primaryQuery !== (searchName || foodName).trim()) {
    results = await deps.searchIngredients((searchName || foodName).trim(), searchOpts);
  }

  if (!results?.length) {
    const prep = defaultPreparationForFood(foodName, line);
    if (prep && !choice) {
      const retry = await deps.searchIngredients(resolveSearchQuery(searchName || foodName, `${line} ${prep}`), { limit: 12, mealParse: true });
      if (retry?.length) {
        const ranked = retry
          .map((item) => ({ item, score: scoreIngredientForMeal(item, resolveSearchQuery(searchName || foodName, line), line) }))
          .filter((x) => x.score >= MIN_MATCH_SCORE)
          .sort((a, b) => b.score - a.score);
        if (ranked.length) return enrichMatched(ranked[0].item, foodName, line, weight);
      }
    }
    return estimateFallback(foodName, line, weight);
  }

  const ranked = results
    .map((item) => ({
      item,
      score: scoreIngredientForMeal(item, resolveSearchQuery(searchName || foodName, line), line),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return estimateFallback(foodName, line, weight);

  const top = ranked[0];
  const second = ranked[1];
  const estimatedProfile = hasEstimatedFoodProfile(line, foodName);

  if (!choice?.ingredientId) {
    if (top.score < MIN_MATCH_SCORE) {
      return estimateFallback(foodName, line, weight);
    }

    if (
      second
      && top.item.name === second.item.name
      && top.item.variant !== second.item.variant
      && top.score - second.score < 30
    ) {
      return {
        needsClarification: true,
        clarification: {
          groupId: `variant-${top.item.name}`,
          question: `${top.item.name} — which preparation?`,
          options: ranked
            .filter((r) => r.item.name === top.item.name)
            .slice(0, 6)
            .map((r) => ({
              label: r.item.displayName || r.item.name,
              ingredientId: r.item.id,
              query: r.item.id,
            })),
          originalQuery: foodName,
          rawLine: line,
        },
      };
    }

    const prep = defaultPreparationForFood(foodName, line);
    if (prep && top.item.variant && top.item.variant !== prep && top.score < 95) {
      const better = ranked.find((r) => r.item.variant === prep);
      if (better && better.score >= top.score - 15) {
        return enrichMatched(better.item, foodName, line, weight);
      }
      if (!better && top.score < 90) {
        return buildClarificationFromRanked(foodName, line, ranked.filter((r) =>
          !prep || r.item.variant === prep || r.item.variant === 'dry' || r.item.variant === 'cooked'));
      }
    }
  }

  if (!choice?.ingredientId && estimatedProfile && (top.item.source === 'usda' || top.item.source === 'USDA')) {
    return estimateFallback(foodName, line, weight);
  }

  if (!choice?.ingredientId && top.item.source === 'localized-nutrition' && top.item.servingOptions?.[0] && !/\b\d+(?:[.,]\d+)?\s*(g|gram|grams|kg|ml|l|oz)\b/i.test(line)) {
    const count = leadingCount(line);
    const serving = top.item.servingOptions[0];
    return {
      ...enrichMatched(top.item, foodName, line, (serving.grams || weight) * count),
      calories: Math.round((serving.calories || 0) * count),
      protein: Math.round((serving.protein || 0) * count * 10) / 10,
      carbs: Math.round((serving.carbs || 0) * count * 10) / 10,
      fat: Math.round((serving.fat || 0) * count * 10) / 10,
      weight: (serving.grams || weight) * count,
      servingUnit: serving.label,
      servingQuantity: count,
    };
  }

  return enrichMatched(top.item, foodName, line, choice?.grams ?? weight);
}

export function splitMealText(text) {
  const cleaned = text
    .replace(/i made a wrap with:?/gi, '')
    .replace(/i ate:?/gi, '')
    .replace(/i had:?/gi, '')
    .trim();

  const lines = cleaned
    .split(/\n|;|(?:\s+and\s+)/i)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  if (lines.length > 1) return lines;

  return cleaned
    .split(/,/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);
}

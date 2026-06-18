import { normalizeMealSearchQuery, stripDiacritics } from './foodQuery.js';
import { estimateGramsFromPhrase, extractFoodNameFromLine } from './quantityParser.js';
import { applyCategoryMacroCaps } from './ingredientCategories.js';
import { reconcileCalories } from './accuracyEngine.js';

export function normalizeContextText(text) {
  return stripDiacritics(String(text || ''))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function per100gFromRecord(record) {
  if (record?.per100g) return record.per100g;
  const grams = Math.max(1, Number(record?.grams || record?.defaultGrams || record?.weight) || 100);
  return {
    calories: Math.round(((record?.calories || 0) / grams) * 100),
    protein: Math.round(((record?.protein || 0) / grams) * 100 * 10) / 10,
    carbs: Math.round(((record?.carbs || 0) / grams) * 100 * 10) / 10,
    fat: Math.round(((record?.fat || 0) / grams) * 100 * 10) / 10,
  };
}

function scoreContextItem(item, query, line = '') {
  const q = normalizeContextText(query);
  if (q.length < 2) return 0;
  const haystack = normalizeContextText([
    item.name,
    item.displayName,
    item.brand,
    item.matchName,
    item.barcode,
    ...(item.searchTerms || []),
  ].filter(Boolean).join(' '));
  if (!haystack) return 0;
  const tokens = q.split(' ').filter(Boolean);
  let score = Math.min(80, (item.use_count || 0) * 6);
  if (haystack === q) score += 220;
  if (haystack.includes(q)) score += 160;
  if (tokens.every((token) => haystack.includes(token))) score += 100;
  if (tokens.some((token) => haystack.includes(token))) score += 45;
  if (normalizeContextText(line).includes(haystack) || haystack.includes(normalizeContextText(line))) score += 30;
  return score;
}

export function findUserContextMatch(query, line, context = {}) {
  const pool = [
    ...(context.frequentFoods || []),
    ...(context.scannedProducts || []),
    ...(context.userCorrections || []),
  ].filter((item) => item && per100gFromRecord(item).calories >= 0);

  const ranked = pool
    .map((item) => ({ item, score: scoreContextItem(item, query, line) }))
    .filter(({ score }) => score >= 120)
    .sort((a, b) => b.score - a.score);

  return ranked[0] || null;
}

export function findCorrectionForQuery(query, corrections = []) {
  const q = normalizeContextText(query);
  if (!q) return null;

  for (const record of corrections) {
    const matchKey = normalizeContextText(record.matchKey || record.matchName || record.name || '');
    if (!matchKey) continue;
    if (matchKey === q || q.includes(matchKey) || matchKey.includes(q)) return record;
  }
  return null;
}

export function buildItemFromUserContext(match, foodName, line, weight) {
  const item = match.item;
  const per100g = applyCategoryMacroCaps(per100gFromRecord(item), item.category || 'unknown');
  const grams = weight || estimateGramsFromPhrase(line, foodName);
  const f = grams / 100;
  const macros = reconcileCalories({
    calories: Math.round(per100g.calories * f),
    protein: Math.round(per100g.protein * f * 10) / 10,
    carbs: Math.round(per100g.carbs * f * 10) / 10,
    fat: Math.round(per100g.fat * f * 10) / 10,
  });

  const source = item.source === 'user-correction'
    ? 'user_verified'
    : item.barcode
      ? 'user-scanned-brand'
      : 'local-memory';

  return {
    name: item.displayName || item.name || foodName,
    brandName: item.brand,
    barcode: item.barcode,
    ingredientId: item.ingredientId || item.food_id || item.id,
    weight: grams,
    grams,
    ...macros,
    per100g,
    matched: true,
    estimated: false,
    confidence: 1,
    nutritionSource: source,
    accuracyScore: 100,
    accuracyLabel: source === 'user_verified' ? 'User Verified' : 'Personal Match',
    rawLine: line,
    contextScore: match.score,
  };
}

export function buildItemFromCorrection(correction, foodName, line, weight) {
  const per100g = applyCategoryMacroCaps(correction.per100g, correction.category || 'unknown');
  const grams = weight || correction.defaultGrams || estimateGramsFromPhrase(line, foodName);
  const f = grams / 100;
  const macros = reconcileCalories({
    calories: Math.round(per100g.calories * f),
    protein: Math.round(per100g.protein * f * 10) / 10,
    carbs: Math.round(per100g.carbs * f * 10) / 10,
    fat: Math.round(per100g.fat * f * 10) / 10,
  });

  return {
    name: correction.name || correction.matchName || foodName,
    ingredientId: correction.ingredientId,
    barcode: correction.barcode,
    weight: grams,
    grams,
    ...macros,
    per100g,
    matched: true,
    estimated: false,
    confidence: 1,
    nutritionSource: 'user_verified',
    accuracyScore: 100,
    accuracyLabel: 'User Corrected',
    rawLine: line,
  };
}

export function normalizeMealParseContext(body = {}) {
  return {
    frequentFoods: Array.isArray(body.frequentFoods) ? body.frequentFoods : [],
    scannedProducts: Array.isArray(body.scannedProducts) ? body.scannedProducts : [],
    userCorrections: Array.isArray(body.userCorrections) ? body.userCorrections : [],
  };
}

export function buildParseChoices(choices = {}, context = {}) {
  return {
    ...choices,
    __userContext: {
      frequentFoods: context.frequentFoods || [],
      scannedProducts: context.scannedProducts || [],
      userCorrections: context.userCorrections || [],
    },
  };
}

export function resolveLineWithUserContext(line, choices = {}) {
  const foodName = extractFoodNameFromLine(line);
  const searchName = normalizeMealSearchQuery(foodName, line);
  const weight = estimateGramsFromPhrase(line, searchName || foodName);
  const context = choices.__userContext || {};

  const correction = findCorrectionForQuery(searchName || foodName, context.userCorrections);
  if (correction?.per100g) {
    return buildItemFromCorrection(correction, foodName, line, weight);
  }

  const match = findUserContextMatch(searchName || foodName, line, context);
  if (match) return buildItemFromUserContext(match, foodName, line, weight);

  return null;
}

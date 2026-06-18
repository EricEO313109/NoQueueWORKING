import { searchIngredients, getIngredientById } from '../server/ingredientDb.js';
import {
  detectCategory,
  applyCategoryMacroCaps,
  MEAL_PARSE_SOURCE_PRIORITY,
} from './ingredientCategories.js';
import { detectClarificationNeeded, detectVariantAmbiguity } from './clarifications.js';
import { validateNutritionRecord, accuracyScoreForSource } from './accuracyEngine.js';
import { applyUserCorrectionToProduct, getUserCorrection } from './userCorrections.js';

function scoreIngredientForMeal(item, query, line) {
  const q = query.toLowerCase().trim();
  const lineL = line.toLowerCase();
  let score = 0;

  const name = item.name.toLowerCase();
  const display = (item.displayName || '').toLowerCase();
  const terms = (item.searchTerms || []).map((t) => t.toLowerCase());

  if (name === q || display === q) score += 200;
  if (terms.includes(q)) score += 180;

  if (q.includes('cooked') && (item.variant === 'cooked' || terms.some((t) => t.includes('cooked')))) score += 40;
  if (q.includes('raw') && item.variant === 'raw') score += 40;
  if (q.includes('dry') && item.variant === 'dry') score += 40;
  if (q.includes('fried') && (item.variant === 'fried' || terms.some((t) => t.includes('fried')))) score += 35;
  if (lineL.includes('small') && (q.includes('tortilla') || q.includes('wrap')) && item.id?.includes('tortilla')) score += 30;

  for (const t of terms) {
    if (t === q) score += 120;
    else if (q.includes(t) || t.includes(q)) score += 50;
    else if (q.split(/\s+/).every((w) => t.includes(w) || name.includes(w))) score += 35;
  }

  if (name.includes(q) || q.includes(name)) score += 40;

  const queryCat = detectCategory(q);
  const itemCat = detectCategory(name);
  if (queryCat === itemCat && queryCat !== 'unknown') score += 25;

  if (queryCat === 'protein' && itemCat === 'carb') score -= 80;
  if (queryCat === 'protein' && (item.per100g?.carbs ?? 0) > 20) score -= 60;
  if (queryCat === 'dairy_protein' && itemCat === 'carb') score -= 80;

  score += MEAL_PARSE_SOURCE_PRIORITY[item.source] ?? 20;

  return score;
}

export async function matchIngredientForMeal(foodName, line = '', { chosenId, chosenQuery } = {}) {
  const q = (chosenQuery || foodName).trim();
  if (q.length < 2) return null;

  if (!chosenId && !chosenQuery) {
    const clarify = detectClarificationNeeded(foodName, line);
    if (clarify) {
      return { needsClarification: true, clarification: clarify };
    }
  }

  if (chosenId) {
    const item = getIngredientById(chosenId);
    if (item) return enrichMatchedIngredient(item, foodName, line);
  }

  const results = await searchIngredients(q, { limit: 15 });
  if (!results.length) return null;

  if (!chosenId) {
    const variantClarify = detectVariantAmbiguity(foodName, results);
    if (variantClarify) {
      return { needsClarification: true, clarification: variantClarify };
    }
  }

  const ranked = results
    .map((item) => ({ item, score: scoreIngredientForMeal(item, q, line) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return null;

  const best = ranked[0].item;

  // If top two scores are close and different variants, ask user
  if (!chosenId && ranked.length >= 2) {
    const top = ranked[0];
    const second = ranked[1];
    if (
      top.item.name === second.item.name
      && top.item.variant !== second.item.variant
      && top.score - second.score < 25
    ) {
      return {
        needsClarification: true,
        clarification: {
          groupId: `pick-${top.item.name}`,
          question: `Which ${top.item.name}?`,
          options: ranked
            .filter((r) => r.item.name === top.item.name)
            .slice(0, 6)
            .map((r) => ({
              label: r.item.displayName || r.item.name,
              ingredientId: r.item.id,
              query: r.item.id,
              variant: r.item.variant,
            })),
          originalQuery: foodName,
          rawLine: line,
        },
      };
    }
  }

  return enrichMatchedIngredient(best, foodName, line);
}

function enrichMatchedIngredient(item, foodName, line) {
  const category = detectCategory(foodName);
  let per100g = applyCategoryMacroCaps(item.per100g, category);

  const corrected = getUserCorrection(item.id);
  if (corrected?.per100g) {
    per100g = corrected.per100g;
    item = { ...item, source: 'user_verified', confidence: 1 };
  }

  const validated = validateNutritionRecord(
    { per100g, source: item.source, confidence: item.confidence },
    category,
  );

  const source = item.source === 'seed' ? 'verified-db' : item.source === 'usda' ? 'USDA' : item.source;
  const accuracy = accuracyScoreForSource(source, item.confidence ?? 1);

  return {
    ...item,
    per100g: validated.per100g,
    category,
    nutritionSource: source,
    matchScore: 0,
    confidence: validated.accuracyScore / 100,
    accuracyScore: validated.accuracyScore,
    accuracyLabel: validated.accuracyLabel,
    validationWarnings: validated.warnings,
  };
}

export async function resolveIngredientById(id) {
  const item = getIngredientById(id);
  if (!item) return null;
  return enrichMatchedIngredient(item, item.name, '');
}

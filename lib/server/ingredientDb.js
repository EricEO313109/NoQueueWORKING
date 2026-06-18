import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
let seedData = [];
try {
  seedData = JSON.parse(
    fs.readFileSync(path.join(__dir, '../../data/ingredients-seed.json'), 'utf8'),
  );
} catch (error) {
  console.error('[ingredientDb] Failed to load seed data:', error?.message || error);
  seedData = [];
}
import { searchUsdaFoods } from './usda.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import {
  normalizeMealSearchQuery,
  mealQueryTokens,
  itemMatchesMealTokens,
} from '../nutrition/foodQuery.js';
import { searchLocalizedFoods, hasStrongLocalizedMatch, getLocalizedFoodById } from '../nutrition/localizedFoodSearch.js';

const VARIANT_LABELS = {
  raw: 'Raw',
  cooked: 'Cooked',
  dry: 'Dry',
  fried: 'Fried',
  '': '',
  medium: 'Medium',
  '1 piece': '1 piece',
  slice: 'Slice',
  whole: 'Whole',
};

function normalizeIngredient(row) {
  const variant = row.variant || '';
  const label = VARIANT_LABELS[variant] || variant;
  const displayName = label ? `${row.name} (${label})` : row.name;
  const per100g = {
    calories: row.per100g?.calories ?? 0,
    protein: row.per100g?.protein ?? 0,
    carbs: row.per100g?.carbs ?? 0,
    fat: row.per100g?.fat ?? 0,
    fiber: row.per100g?.fiber ?? 0,
    sugar: row.per100g?.sugar ?? 0,
  };
  const defaultGrams = row.defaultGrams || 100;
  const source = row.source || 'seed';
  return {
    id: row.id,
    name: row.name,
    displayName,
    variant,
    servingSize: row.servingSize || `${defaultGrams}g`,
    serving: '100g',
    per100g,
    perServing: {
      grams: defaultGrams,
      calories: Math.round(per100g.calories * defaultGrams / 100),
      protein: Math.round(per100g.protein * defaultGrams / 100 * 10) / 10,
      carbs: Math.round(per100g.carbs * defaultGrams / 100 * 10) / 10,
      fat: Math.round(per100g.fat * defaultGrams / 100 * 10) / 10,
    },
    defaultGrams,
    source,
    confidence: row.confidence ?? (source === 'usda' ? 0.98 : 0.95),
    searchTerms: row.searchTerms || [],
    userVerified: !!row.userVerified,
    lastVerifiedAt: row.lastVerifiedAt || null,
    verificationSource: row.verificationSource || null,
  };
}

function scoreMatch(item, query) {
  const q = query.toLowerCase().trim();
  if (!q || /^\d+$/.test(q)) return 0;
  const tokens = mealQueryTokens(q);
  let score = 0;
  const name = item.name.toLowerCase();
  const display = item.displayName.toLowerCase();
  const hay = `${name} ${display} ${(item.searchTerms || []).join(' ').toLowerCase()}`;

  if (name === q || display === q) score += 100;
  if (name.startsWith(q) || display.startsWith(q)) score += 50;
  if (name.includes(q) || display.includes(q)) score += 30;

  for (const term of item.searchTerms || []) {
    const t = term.toLowerCase();
    if (t === q) score += 80;
    else if (t.startsWith(q)) score += 40;
    else if (t.includes(q)) score += 20;
  }

  if (tokens.length > 0) {
    if (itemMatchesMealTokens(item, tokens)) score += 90;
    else if (item.source === 'usda') score -= 80;
    else score -= 30;
  }

  if (item.source === 'seed') score += 25;

  return Math.max(0, score);
}

function searchSeed(query, limit = 25) {
  const items = seedData.map((r) => normalizeIngredient({ ...r, source: 'seed' }));
  return items
    .map((item) => ({ item, score: scoreMatch(item, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}

async function searchSupabaseIngredients(query, limit = 15) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit);
  if (error) {
    console.warn('[ingredients] supabase', error.message);
    return [];
  }
  return (data || []).map((r) => normalizeIngredient({
    id: r.id,
    name: r.name,
    variant: r.variant,
    per100g: r.per_100g,
    defaultGrams: r.default_grams,
    source: r.source,
    searchTerms: r.search_terms || [],
  }));
}

export async function searchIngredients(query, { limit = 40, mealParse = false, fast = false } = {}) {
  const raw = String(query || '').trim();
  const q = normalizeMealSearchQuery(raw);
  if (q.length < 2 || /^\d+$/.test(q)) return [];

  const tokens = mealQueryTokens(q);
  const map = new Map();

  for (const item of searchLocalizedFoods(q, { limit })) {
    map.set(item.id, item);
  }

  for (const item of searchSeed(q, limit)) {
    map.set(item.id, item);
  }

  const seedTop = Array.from(map.values())
    .map((item) => ({ item, score: scoreMatch(item, q) }))
    .sort((a, b) => b.score - a.score)[0];
  const seedStrong = seedTop && seedTop.score >= 70;

  if (!fast) {
    try {
      const dbItems = await searchSupabaseIngredients(q, 15);
      for (const item of dbItems) map.set(item.id, item);
    } catch (e) {
      console.warn('[ingredients] supabase', e?.message);
    }
  }

  const skipUsda = (mealParse && seedStrong) || hasStrongLocalizedMatch(q);
  if (!fast && !skipUsda) {
    try {
      const usdaQuery = tokens.length ? tokens.join(' ') : q;
      const usda = await searchUsdaFoods(usdaQuery, 12);
      for (const item of usda) {
        if (mealParse && tokens.length && !itemMatchesMealTokens(item, tokens)) continue;
        if (!map.has(item.id)) map.set(item.id, item);
      }
    } catch (e) {
      console.warn('[ingredients] usda', e?.message);
    }
  }

  return Array.from(map.values())
    .map((item) => ({ item, score: scoreMatch(item, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}

export function getIngredientById(id) {
  const seed = seedData.find((r) => r.id === id);
  if (seed) return normalizeIngredient({ ...seed, source: 'seed' });
  const localized = getLocalizedFoodById(id);
  if (localized) return localized;
  return null;
}

export function macrosForGrams(per100g, grams) {
  const g = grams || 100;
  const f = g / 100;
  return {
    calories: Math.round((per100g.calories || 0) * f),
    protein: Math.round((per100g.protein || 0) * f * 10) / 10,
    carbs: Math.round((per100g.carbs || 0) * f * 10) / 10,
    fat: Math.round((per100g.fat || 0) * f * 10) / 10,
  };
}

export function ingredientToProduct(ingredient, grams) {
  const g = grams || ingredient.defaultGrams || 100;
  const macros = macrosForGrams(ingredient.per100g, g);
  return {
    name: ingredient.displayName || ingredient.name,
    ingredientId: ingredient.id,
    grams: g,
    ...macros,
    per100g: ingredient.per100g,
    source: ingredient.source,
    confidence: ingredient.confidence,
  };
}

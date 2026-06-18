import { apiFetch } from './client';
import { deviceHeaders } from '@/lib/deviceId';
import { getCachedSearch, setCachedSearch } from '@/lib/cache/ingredientCache';
import { getRecentIngredients } from '@/lib/cache/ingredientCache';
import { searchOpenFoodFacts } from '@/lib/api/openFoodFacts';
import { searchLocalizedFoods, hasStrongLocalizedMatch } from '../../../lib/nutrition/localizedFoodSearch.js';
import { searchFrequentFoods, hasStrongFrequentFoodMatch } from '@/lib/cache/frequentFoods';
import { normalizeMealSearchQuery, stripDiacritics } from '../../../lib/nutrition/foodQuery.js';
import { estimateFoodFromText } from '../../../lib/nutrition/estimatedFoodFallback.js';
import seedData from '../../../data/ingredients-seed.json';

const SEARCH_TIMEOUT_MS = 3500;

function withTimeout(ms = SEARCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timeout) };
}

function mergeSearchResults(...lists) {
  const merged = [];
  const seen = new Set();
  for (const list of lists) {
    for (const item of list || []) {
      const key = item.id || item.barcode || item.name;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

function scoreLocal(item, rawQuery) {
  const q = stripDiacritics(normalizeMealSearchQuery(rawQuery).toLowerCase());
  const terms = [item.name, ...(item.searchTerms || [])].map((t) => stripDiacritics(t.toLowerCase()));
  let score = 0;
  if (stripDiacritics(item.name.toLowerCase()).includes(q)) score += 30;
  if (terms.some((t) => t === q)) score += 100;
  if (terms.some((t) => t.includes(q) || q.includes(t))) score += 40;
  return score;
}

function localSearch(query) {
  const q = normalizeMealSearchQuery(query).toLowerCase().trim();
  return seedData
    .map((item) => ({ item, score: scoreLocal(item, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40)
    .map((x) => x.item)
    .map((item) => {
      const variant = item.variant ? ` (${item.variant})` : '';
      return {
        id: item.id,
        name: item.name,
        displayName: `${item.name}${variant}`,
        variant: item.variant || '',
        serving: '100g',
        per100g: item.per100g,
        defaultGrams: item.defaultGrams || 100,
        source: 'seed',
        confidence: 1,
      };
    });
}

function estimatedSearchFallback(query) {
  const estimate = estimateFoodFromText(query);
  if (!estimate?.matched) return [];
  return [{
    id: estimate.ingredientId || `estimated-${estimate.name}`,
    name: estimate.name,
    displayName: estimate.name,
    per100g: estimate.per100g,
    defaultGrams: estimate.weight || estimate.grams || 100,
    source: 'estimated',
    confidence: estimate.confidence ?? 0.55,
    searchKind: 'estimated',
    estimated: true,
    ...estimate,
  }];
}

async function fetchRemoteIngredients(query) {
  try {
    const timeout = withTimeout();
    try {
      const res = await apiFetch(`/api/ingredients/search?q=${encodeURIComponent(query)}`, {
        headers: deviceHeaders(),
        signal: timeout.signal,
      });
      if (res.ok) {
        const { ingredients } = await res.json();
        return ingredients || [];
      }
    } finally {
      timeout.done();
    }
  } catch (e) {
    console.warn('[ingredients] api', e);
  }
  return [];
}

export async function searchIngredients(query) {
  const q = normalizeMealSearchQuery(query.trim());
  if (q.length < 2) return [];

  const cached = getCachedSearch(q);
  if (cached?.ingredients?.length) return cached.ingredients;

  const memory = searchFrequentFoods(q);
  const recent = getRecentIngredients().filter((i) =>
    stripDiacritics(i.name?.toLowerCase() || '').includes(stripDiacritics(q.toLowerCase())),
  );
  const localized = searchLocalizedFoods(q);
  const remote = await fetchRemoteIngredients(q);
  const local = localSearch(q);
  const estimated = (remote.length + local.length + localized.length === 0)
    ? estimatedSearchFallback(q)
    : [];

  const merged = mergeSearchResults(memory, recent, localized, remote, local, estimated);
  setCachedSearch(q, merged);
  return merged;
}

function productToSearchResult(product) {
  const grams = product.defaultGrams || 100;
  const macros = macrosForGrams(product.per100g || {}, grams);
  return {
    id: `product-${product.barcode || product.name}`,
    name: product.name,
    displayName: product.brand ? `${product.name} (${product.brand})` : product.name,
    barcode: product.barcode,
    imageUrl: product.imageUrl,
    defaultGrams: grams,
    per100g: product.per100g || {},
    source: product.source || 'openfoodfacts',
    confidence: product.confidence ?? 0.85,
    searchKind: 'product',
    ...macros,
  };
}

export async function searchGlobalFoods(query) {
  const q = normalizeMealSearchQuery(query.trim());
  if (q.length < 2) return [];

  const [ingredients, products] = await Promise.allSettled([
    searchIngredients(q),
    Promise.race([
      searchOpenFoodFacts(q),
      new Promise((resolve) => {
        setTimeout(() => resolve([]), SEARCH_TIMEOUT_MS);
      }),
    ]),
  ]);

  const merged = [];
  const seen = new Set();
  const add = (item) => {
    const key = item.barcode || item.id || item.name;
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  };

  if (ingredients.status === 'fulfilled') {
    ingredients.value.forEach((item) => add({ ...item, searchKind: item.searchKind || 'ingredient' }));
  }
  if (products.status === 'fulfilled') {
    products.value.map(productToSearchResult).forEach(add);
  }

  if (!merged.length) {
    estimatedSearchFallback(q).forEach(add);
  }

  return merged.slice(0, 40);
}

export async function parseMealText(text, choices = {}) {
  const { buildMealParsePayload } = await import('@/lib/api/mealParseContext');
  const res = await apiFetch('/api/parse-meal', {
    method: 'POST',
    headers: deviceHeaders(),
    body: JSON.stringify({
      ...buildMealParsePayload(text, choices),
      deviceId: deviceHeaders()['X-Device-Id'],
    }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Analiză eșuată');
  }
  return res.json();
}

export async function fetchSavedMeals(query = '') {
  try {
    const path = query
      ? `/api/meals?q=${encodeURIComponent(query)}`
      : '/api/meals';
    const res = await apiFetch(path, { headers: deviceHeaders() });
    if (res.ok) {
      const { meals } = await res.json();
      return meals || [];
    }
  } catch { /* local */ }
  const { searchLocalMeals, getLocalMeals } = await import('@/lib/cache/mealsDb');
  return query ? searchLocalMeals(query) : getLocalMeals();
}

export async function saveMealToCloud(meal) {
  const { saveLocalMeal } = await import('@/lib/cache/mealsDb');
  saveLocalMeal(meal);
  try {
    const res = await apiFetch('/api/meals', {
      method: 'POST',
      headers: deviceHeaders(),
      body: JSON.stringify({
        ...meal,
        deviceId: deviceHeaders()['X-Device-Id'],
      }),
    });
    if (res.ok) {
      const { meal: saved } = await res.json();
      saveLocalMeal(saved);
      return saved;
    }
  } catch { /* local only */ }
  return meal;
}

export function macrosForGrams(per100g, grams) {
  const f = (grams || 100) / 100;
  return {
    calories: Math.round((per100g.calories || 0) * f),
    protein: Math.round((per100g.protein || 0) * f * 10) / 10,
    carbs: Math.round((per100g.carbs || 0) * f * 10) / 10,
    fat: Math.round((per100g.fat || 0) * f * 10) / 10,
  };
}

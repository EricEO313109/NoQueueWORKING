import { getUserProducts } from '@/lib/cache/userFoodDb';

const MEMORY_KEY = 'nutri:frequent-foods';
const PENDING_SCAN_KEY = 'nutri:pending-scanned-food';

function safeRead(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasUsableMacros(food) {
  const p = food?.per100g || {};
  return (p.calories || food?.calories || 0) > 0
    || (p.protein || food?.protein || 0) > 0
    || (p.carbs || food?.carbs || 0) > 0
    || (p.fat || food?.fat || 0) > 0;
}

function per100gFromFood(food) {
  if (food?.per100g) return food.per100g;
  const grams = Math.max(1, Number(food?.grams || food?.defaultGrams) || 100);
  return {
    calories: Math.round(((food?.calories || 0) / grams) * 100),
    protein: Math.round(((food?.protein || 0) / grams) * 100 * 10) / 10,
    carbs: Math.round(((food?.carbs || 0) / grams) * 100 * 10) / 10,
    fat: Math.round(((food?.fat || 0) / grams) * 100 * 10) / 10,
  };
}

function toMemoryItem(food, count = 0) {
  const per100g = per100gFromFood(food);
  const name = food.displayName || food.name || food.productName || 'Food';
  const brand = food.brand || '';
  const id = String(food.barcode || food.ingredientId || food.id || name);
  return {
    food_id: id,
    id: `memory-${id}`,
    barcode: food.barcode,
    ingredientId: food.ingredientId,
    name,
    displayName: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name,
    brand,
    use_count: count,
    per100g,
    defaultGrams: food.defaultGrams || food.grams || 100,
    source: food.source || food.nutritionSource || 'local-memory',
    nutritionSource: food.nutritionSource || food.source || 'local-memory',
    confidence: food.confidence ?? 1,
    searchKind: food.searchKind || 'memory',
  };
}

function scoreMemoryFood(food, query) {
  const q = normalizeText(query);
  if (q.length < 2) return 0;
  const haystack = normalizeText(`${food.name} ${food.displayName} ${food.brand} ${food.barcode || ''}`);
  if (!haystack) return 0;
  const tokens = q.split(' ').filter(Boolean);
  let score = Math.min(60, (food.use_count || 0) * 8);
  if (haystack === q) score += 200;
  if (haystack.includes(q)) score += 140;
  if (tokens.every((token) => haystack.includes(token))) score += 80;
  if (tokens.some((token) => haystack.includes(token))) score += 35;
  return score;
}

export function getFrequentFoods() {
  return safeRead(MEMORY_KEY, []);
}

export function incrementFrequentFood(food) {
  if (!food || !hasUsableMacros(food)) return null;
  const item = toMemoryItem(food);
  const previous = getFrequentFoods();
  const existing = previous.find((entry) => entry.food_id === item.food_id);
  const next = {
    ...(existing || item),
    ...item,
    use_count: (existing?.use_count || 0) + 1,
    last_used_at: Date.now(),
  };
  const merged = [next, ...previous.filter((entry) => entry.food_id !== item.food_id)]
    .sort((a, b) => (b.use_count || 0) - (a.use_count || 0) || (b.last_used_at || 0) - (a.last_used_at || 0))
    .slice(0, 100);
  localStorage.setItem(MEMORY_KEY, JSON.stringify(merged));
  return next;
}

export function searchFrequentFoods(query, { limit = 15, strongOnly = false } = {}) {
  return getFrequentFoods()
    .map((food) => ({ food, score: scoreMemoryFood(food, query) }))
    .filter(({ score }) => score >= (strongOnly ? 140 : 35))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ food }) => ({ ...food, source: 'local-memory', searchKind: 'memory' }));
}

export function hasStrongFrequentFoodMatch(query) {
  return searchFrequentFoods(query, { limit: 1, strongOnly: true }).length > 0;
}

export function findScannedProductMatches(query, { limit = 6 } = {}) {
  return getUserProducts()
    .filter(hasUsableMacros)
    .map((product) => toMemoryItem(product))
    .map((product) => ({ product, score: scoreMemoryFood(product, query) }))
    .filter(({ score }) => score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);
}

export function macrosForWeight(per100g, weight) {
  const factor = (Number(weight) || 0) / 100;
  return {
    calories: Math.round((per100g?.calories || 0) * factor),
    protein: Math.round((per100g?.protein || 0) * factor * 10) / 10,
    carbs: Math.round((per100g?.carbs || 0) * factor * 10) / 10,
    fat: Math.round((per100g?.fat || 0) * factor * 10) / 10,
  };
}

export function applyScannedBrandToItem(item, selected = 0) {
  const options = findScannedProductMatches(item.rawLine || item.name);
  if (!options.length) return item;
  const index = Math.max(0, Math.min(selected, options.length - 1));
  const brand = options[index];
  const weight = item.weight || item.grams || brand.defaultGrams || 100;
  return {
    ...item,
    name: brand.displayName || brand.name,
    brandName: brand.brand,
    barcode: brand.barcode,
    per100g: brand.per100g,
    weight,
    grams: weight,
    ...macrosForWeight(brand.per100g, weight),
    nutritionSource: 'user-scanned-brand',
    confidence: 1,
    accuracyScore: 100,
    scannedBrandOptions: options,
    selectedScannedBrandIndex: index,
  };
}

export function parseBareAmount(text) {
  const match = normalizeText(text).match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s+([a-z][a-z\s]{1,40})$/);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, foodName: match[2].trim() };
}

export function resolveFrequentMealText(text) {
  const lines = String(text || '')
    .split(/\n|,|;|(?:\s+and\s+)/i)
    .map((line) => line.trim())
    .filter((line) => line.length > 1);
  if (!lines.length) return null;
  const items = [];
  for (const line of lines) {
    const bare = parseBareAmount(line);
    const query = bare?.foodName || line;
    const match = searchFrequentFoods(query, { limit: 1, strongOnly: true })[0];
    if (!match) return null;
    const weight = bare?.amount || match.defaultGrams || 100;
    items.push({
      name: match.displayName || match.name,
      rawLine: line,
      weight,
      grams: weight,
      per100g: match.per100g,
      matched: true,
      estimated: false,
      nutritionSource: 'local-memory',
      confidence: 1,
      accuracyScore: 100,
      ...macrosForWeight(match.per100g, weight),
    });
  }
  return { items, estimatedMeal: false, confidence: 1, accuracyScore: 100 };
}

export function setPendingScannedFood(payload) {
  localStorage.setItem(PENDING_SCAN_KEY, JSON.stringify({ ...payload, ts: Date.now() }));
}

export function consumePendingScannedFood(target) {
  const pending = safeRead(PENDING_SCAN_KEY, null);
  if (!pending || (target && pending.target !== target)) return null;
  localStorage.removeItem(PENDING_SCAN_KEY);
  return pending;
}

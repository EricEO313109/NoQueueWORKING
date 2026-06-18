const KEY = 'nutri:ingredients-cache';
const RECENT_KEY = 'nutri:ingredients-recent';

export function getCachedSearch(query) {
  try {
    const cache = JSON.parse(localStorage.getItem(KEY) || '{}');
    return cache[query.toLowerCase()] || null;
  } catch {
    return null;
  }
}

export function setCachedSearch(query, ingredients) {
  try {
    const cache = JSON.parse(localStorage.getItem(KEY) || '{}');
    cache[query.toLowerCase()] = { ingredients, at: Date.now() };
    const keys = Object.keys(cache);
    if (keys.length > 80) delete cache[keys[0]];
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

export function pushRecentIngredient(ingredient) {
  const list = getRecentIngredients();
  const entry = { ...ingredient, savedAt: Date.now() };
  const next = [entry, ...list.filter((i) => i.id !== ingredient.id)].slice(0, 30);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return entry;
}

export function getRecentIngredients() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Client-side user nutrition corrections (localStorage).
 */
const STORAGE_KEY = 'stilmacros-user-corrections';

function normalizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function loadCorrections() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function exportUserCorrectionsList() {
  return Object.entries(loadCorrections()).map(([key, value]) => ({
    key,
    ...value,
  }));
}

export function saveUserCorrection(key, data) {
  const store = loadCorrections();
  const k = String(key).replace(/\D/g, '') || String(key);
  store[k] = {
    ...data,
    userVerified: true,
    verificationSource: 'user',
    lastVerifiedAt: new Date().toISOString(),
    nutritionSource: 'user_verified',
    source: 'user-correction',
    confidence: 1,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return store[k];
}

export function saveNameCorrection(name, data) {
  const matchKey = normalizeName(name);
  return saveUserCorrection(`name:${matchKey}`, {
    ...data,
    name: data.name || name,
    matchName: name,
    matchKey,
  });
}

export function getUserCorrection(key) {
  const k = String(key).replace(/\D/g, '') || String(key);
  return loadCorrections()[k] || null;
}

export function getUserCorrectionByName(name) {
  const matchKey = normalizeName(name);
  return loadCorrections()[`name:${matchKey}`] || null;
}

export function findCorrectionForQuery(query) {
  const q = normalizeName(query);
  if (!q) return null;
  const store = loadCorrections();
  const direct = store[`name:${q}`];
  if (direct) return direct;
  return Object.values(store).find((record) => {
    const key = normalizeName(record.matchKey || record.matchName || record.name);
    return key && (key === q || q.includes(key) || key.includes(q));
  }) || null;
}

export function applyUserCorrectionToItem(item) {
  if (!item) return item;
  const byId = getUserCorrection(item.barcode || item.ingredientId || item.id);
  const byName = findCorrectionForQuery(item.name || item.rawLine);
  const correction = byId?.per100g ? byId : byName;
  if (!correction?.per100g) return item;

  const grams = item.weight || item.grams || correction.defaultGrams || 100;
  const f = grams / 100;
  const per100g = correction.per100g;
  return {
    ...item,
    name: correction.name || item.name,
    per100g,
    weight: grams,
    grams,
    calories: Math.round((per100g.calories || 0) * f),
    protein: Math.round((per100g.protein || 0) * f * 10) / 10,
    carbs: Math.round((per100g.carbs || 0) * f * 10) / 10,
    fat: Math.round((per100g.fat || 0) * f * 10) / 10,
    userVerified: true,
    nutritionSource: 'user_verified',
    confidence: 1,
    accuracyScore: 100,
  };
}

export function persistDescribeItemCorrection(item) {
  if (!item?.name || !item?.per100g) return null;
  return saveNameCorrection(item.name, {
    name: item.name,
    per100g: item.per100g,
    defaultGrams: item.weight || item.grams || 100,
    ingredientId: item.ingredientId,
    barcode: item.barcode,
    category: item.category,
  });
}

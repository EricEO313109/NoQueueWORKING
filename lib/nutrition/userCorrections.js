/**
 * User-verified nutrition corrections — preferred on next lookup.
 * Server: in-memory + optional Supabase later. Client mirrors to localStorage.
 */

const memoryStore = new Map();

export function correctionKey(barcodeOrId) {
  return String(barcodeOrId || '').replace(/\D/g, '') || String(barcodeOrId);
}

export function saveUserCorrection(key, data) {
  const k = correctionKey(key);
  const record = {
    ...data,
    userVerified: true,
    verificationSource: 'user',
    lastVerifiedAt: new Date().toISOString(),
    nutritionSource: 'user_verified',
    confidence: 1,
  };
  memoryStore.set(k, record);
  return record;
}

export function getUserCorrection(key) {
  return memoryStore.get(correctionKey(key)) || null;
}

export function hydrateUserCorrections(list = []) {
  if (!Array.isArray(list)) return;
  for (const record of list) {
    if (!record?.per100g) continue;
    const key = record.key || record.barcode || record.ingredientId || record.matchKey || record.matchName;
    if (key) saveUserCorrection(key, record);
  }
}

export function findCorrectionForQuery(query, corrections = []) {
  const q = String(query || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!q) return null;

  for (const record of corrections) {
    const matchKey = String(record.matchKey || record.matchName || record.name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!matchKey) continue;
    if (matchKey === q || q.includes(matchKey) || matchKey.includes(q)) return record;
  }
  return null;
}

export function applyUserCorrectionToProduct(product) {
  if (!product) return product;
  const key = product.barcode || product.ingredientId || product.id;
  const correction = getUserCorrection(key);
  if (!correction?.per100g) return product;

  return {
    ...product,
    per100g: { ...product.per100g, ...correction.per100g },
    defaultGrams: correction.defaultGrams ?? product.defaultGrams,
    servingSize: correction.servingSize ?? product.servingSize,
    userVerified: true,
    nutritionSource: 'user_verified',
    confidence: 1,
    verificationSource: 'user',
    lastVerifiedAt: correction.lastVerifiedAt,
  };
}

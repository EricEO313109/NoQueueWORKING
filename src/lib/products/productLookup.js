import { getCachedProduct, setCachedProduct, pushRecentBarcode } from '@/lib/cache/foodCache';
import { getUserProduct, saveUserProduct, searchUserProducts, getUserProducts } from '@/lib/cache/userFoodDb';
import { apiFetch, isCloudEnabled } from '@/lib/api/client';
import { deviceHeaders } from '@/lib/deviceId';
import { ProductNotFoundError, fetchFromOpenFoodFactsDirect } from '@/lib/api/openFoodFacts';

const LOG = import.meta.env.DEV;

function log(...args) {
  if (LOG) console.log('[StilMacros:lookup]', ...args);
}

export function isValidProduct(product) {
  if (!product?.name) return false;
  const p = product.per100g;
  if (!p || typeof p !== 'object') return false;
  return (p.calories ?? 0) > 0 || (p.protein ?? 0) > 0 || (p.carbs ?? 0) > 0 || (p.fat ?? 0) > 0;
}

function normalizeProduct(raw) {
  if (!raw) return null;
  const barcode = String(raw.barcode || '').replace(/\D/g, '') || raw.barcode;
  return {
    ...raw,
    barcode: barcode || raw.barcode,
    name: raw.name || raw.productName || 'Produs',
    per100g: raw.per100g || {},
    defaultGrams: raw.defaultGrams ?? 100,
    servingSize: raw.servingSize || `${raw.defaultGrams ?? 100}g`,
  };
}

function lookupLocal(barcode) {
  const clean = String(barcode).replace(/\D/g, '');
  const user = getUserProduct(clean);
  if (user && isValidProduct(user)) {
    log('HIT local user DB', clean, user.name);
    return user;
  }
  const cached = getCachedProduct(clean);
  if (cached && isValidProduct(cached)) {
    log('HIT local cache', clean, cached.name);
    return cached;
  }
  return null;
}

export function cacheProduct(product) {
  const p = normalizeProduct(product);
  if (!p || !isValidProduct(p)) return null;
  const code = String(p.barcode || '').replace(/\D/g, '');
  if (code.length >= 8) {
    saveUserProduct(p);
    setCachedProduct(code, p);
    pushRecentBarcode(code);
  } else if (p.barcode) {
    saveUserProduct(p);
  }
  return p;
}

async function lookupRemote(barcode) {
  const clean = String(barcode).replace(/\D/g, '');
  log('API GET /api/products/', clean);
  const res = await apiFetch(`/api/products/${clean}`, { headers: deviceHeaders() });
  const json = await res.json().catch(() => ({}));

  if (res.status === 404) {
    log('MISS remote', clean);
    const err = new ProductNotFoundError(clean);
    err.code = json.code || 'NOT_FOUND';
    throw err;
  }

  if (!res.ok) {
    log('API error', res.status, json);
    throw new Error(json.error || `Eroare server (${res.status})`);
  }

  const product = normalizeProduct({
    ...json.product,
    needsVerification: json.needsVerification,
    alternatePer100g: json.alternatePer100g,
    lowConfidence: json.lowConfidence,
  });
  if (!isValidProduct(product)) {
    log('EMPTY product response', json);
    throw new ProductNotFoundError(clean);
  }

  log('HIT remote', clean, product.name, json.source, json.needsVerification ? 'needs-verify' : 'ok');
  return cacheProduct(product);
}

/**
 * Priority: local cache → API (Supabase + OFF).
 * OpenAI only via label scan — never here.
 */
export async function lookupProductByBarcode(barcode) {
  const clean = String(barcode).replace(/\D/g, '');
  if (clean.length < 8) throw new Error('Cod invalid (minim 8 cifre)');

  const local = lookupLocal(clean);
  if (local) return local;

  if (isCloudEnabled()) {
    try {
      return await lookupRemote(clean);
    } catch (e) {
      if (e instanceof ProductNotFoundError || e?.code === 'NOT_FOUND') {
        log('try OFF direct fallback', clean);
        try {
          const off = await fetchFromOpenFoodFactsDirect(clean);
          return cacheProduct(off);
        } catch {
          throw e;
        }
      }
      throw e;
    }
  }

  throw new Error('Conectează-te la internet pentru produse noi');
}

export async function searchProductCatalog(query) {
  const q = query.trim();
  const local = searchUserProducts(q);

  if (!isCloudEnabled()) return local;

  try {
    const path = q ? `/api/products/catalog?q=${encodeURIComponent(q)}` : '/api/products/catalog';
    const res = await apiFetch(path, { headers: deviceHeaders() });
    if (!res.ok) return local;
    const { products } = await res.json();
    const merged = [...local];
    for (const p of products || []) {
      const norm = normalizeProduct(p);
      if (!norm?.barcode) continue;
      if (!merged.find((m) => m.barcode === norm.barcode)) merged.push(norm);
    }
    return merged.slice(0, 50);
  } catch (e) {
    log('catalog search fail', e);
    return local;
  }
}

export async function fetchProductCatalog() {
  const local = getUserProducts();
  if (!isCloudEnabled()) return local;

  try {
    const res = await apiFetch('/api/products/catalog', { headers: deviceHeaders() });
    if (!res.ok) return local;
    const { products } = await res.json();
    const map = new Map();
    for (const p of [...(products || []), ...local]) {
      const norm = normalizeProduct(p);
      if (norm?.barcode) map.set(norm.barcode, { ...norm, savedAt: norm.savedAt || Date.now() });
    }
    return Array.from(map.values()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  } catch {
    return local;
  }
}

export { getUserProducts };

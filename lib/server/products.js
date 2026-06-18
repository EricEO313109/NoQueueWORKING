import { getSupabaseAdmin } from './supabaseAdmin.js';
import { fetchFromOpenFoodFacts } from './openFoodFacts.js';
import { rowToProduct, productToRow } from './nutritionParser.js';
import { mergeProducts, sourcePriority } from './nutritionMerge.js';
import { compareMacros, needsVerification, isLowConfidence } from './macroValidation.js';

function isValidProduct(p) {
  if (!p?.name) return false;
  const n = p.per100g;
  return n && ((n.calories ?? 0) > 0 || (n.protein ?? 0) > 0);
}

async function loadFromDb(clean) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').select('*').eq('barcode', clean).maybeSingle();
  if (error) console.error('[products] supabase', error);
  return data ? rowToProduct(data) : null;
}

/**
 * Barcode lookup with validation — does NOT overwrite user_verified with OFF.
 */
export async function getProductByBarcode(barcode) {
  const clean = String(barcode).replace(/\D/g, '');
  if (clean.length < 8) throw new Error('Cod invalid');

  console.log('[products] lookup', clean);

  const cached = await loadFromDb(clean);
  const off = await fetchFromOpenFoodFacts(clean);

  if (!cached && !off) {
    const err = new Error('Produs negăsit');
    err.code = 'NOT_FOUND';
    err.barcode = clean;
    throw err;
  }

  let product = cached || off;
  let alternatePer100g = null;

  if (cached && off) {
    const { mismatch, diffs } = compareMacros(cached.per100g, off.per100g);
    alternatePer100g = mismatch ? off.per100g : null;

    if (cached.nutrition_source === 'user_verified') {
      product = cached;
      console.log('[products] user_verified — keep DB macros', clean);
    } else if (mismatch) {
      product = { ...cached, alternatePer100g, macroDiffs: diffs };
      console.log('[products] macro mismatch cache vs OFF', clean, diffs);
      // Do not auto-save OFF over cache when mismatch
    } else {
      product = mergeProducts(cached, off);
      if (sourcePriority(off.nutrition_source) > sourcePriority(cached.nutrition_source)) {
        await saveProduct(product, { force: false });
      }
    }
  } else if (off && !cached) {
    product = off;
    await saveProduct(product);
    console.log('[products] HIT OFF + saved', clean, off.name);
  } else if (cached) {
    product = cached;
    console.log('[products] HIT supabase', clean, cached.name);
  }

  if (!isValidProduct(product)) {
    const err = new Error('Produs negăsit');
    err.code = 'NOT_FOUND';
    err.barcode = clean;
    throw err;
  }

  const verify = needsVerification(product, alternatePer100g);
  return {
    ...product,
    needsVerification: verify,
    alternatePer100g: verify ? alternatePer100g : undefined,
    lowConfidence: isLowConfidence(product),
  };
}

export async function saveProduct(product, { force = true } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return product;

  const clean = String(product.barcode).replace(/\D/g, '');
  const existing = await loadFromDb(clean);

  let toSave = product;
  if (existing && !force) {
    toSave = mergeProducts(existing, product);
  } else if (existing) {
    toSave = mergeProducts(existing, product);
  }

  const row = productToRow(toSave);
  const { error } = await supabase.from('products').upsert(row, { onConflict: 'barcode' });
  if (error) console.error('[products] save', error);
  return toSave;
}

export async function confirmProductNutrition(barcode, macros, meta = {}) {
  const clean = String(barcode).replace(/\D/g, '');
  const existing = await loadFromDb(clean) || { barcode: clean, name: meta.name || 'Produs' };

  const verified = {
    ...existing,
    per100g: macros.per100g || macros,
    defaultGrams: macros.defaultGrams ?? existing.defaultGrams ?? 100,
    servingSize: macros.servingSize ?? existing.servingSize,
    nutrition_source: 'user_verified',
    source: 'user_verified',
    confidence: 1,
    confidence_score: 1,
    estimated: false,
    last_verified_at: new Date().toISOString(),
    name: meta.name || existing.name,
    brand: meta.brand || existing.brand,
  };

  return saveProduct(verified, { force: true });
}

export async function searchProducts(query, limit = 50) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let q = supabase.from('products').select('*').order('updated_at', { ascending: false }).limit(limit);
  if (query?.trim()) {
    const term = query.trim();
    q = supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${term}%,brand.ilike.%${term}%,barcode.ilike.%${term}%`)
      .order('updated_at', { ascending: false })
      .limit(limit);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[products] search', error);
    return [];
  }
  return (data || []).map(rowToProduct);
}

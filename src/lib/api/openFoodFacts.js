import { saveUserProduct } from '@/lib/cache/userFoodDb';
import { setCachedProduct, pushRecentBarcode } from '@/lib/cache/foodCache';
import { scaleNutrient } from '@/lib/utils';
import { lookupProductByBarcode, cacheProduct, isValidProduct } from '@/lib/products/productLookup';

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';

export class ProductNotFoundError extends Error {
  constructor(barcode) {
    super('Produs negăsit');
    this.name = 'ProductNotFoundError';
    this.barcode = barcode;
    this.code = 'NOT_FOUND';
  }
}

function parseServingGrams(servingSize, quantity) {
  if (quantity) {
    const m = String(quantity).match(/([\d.]+)\s*g/i);
    if (m) return parseFloat(m[1]);
  }
  if (servingSize) {
    const m = String(servingSize).match(/([\d.]+)\s*g/i);
    if (m) return parseFloat(m[1]);
  }
  return 100;
}

function normalizeOFF(barcode, p) {
  const n = p.nutriments || {};
  const per100g = {
    calories: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
    protein: n.proteins_100g ?? 0,
    carbs: n.carbohydrates_100g ?? 0,
    fat: n.fat_100g ?? 0,
    fiber: n.fiber_100g ?? 0,
    sodium: (n.sodium_100g ?? 0) * 1000,
    sugars: n.sugars_100g ?? 0,
  };
  const defaultGrams = parseServingGrams(p.serving_size, p.product_quantity);

  return {
    barcode,
    name: p.product_name || p.generic_name || 'Produs necunoscut',
    brand: p.brands || p.brand_owner || '',
    imageUrl: p.image_front_small_url || p.image_url || '',
    ingredients: p.ingredients_text || p.ingredients_text_ro || '',
    servingSize: p.serving_size || `${defaultGrams}g`,
    defaultGrams,
    per100g,
    source: 'openfoodfacts',
    confidence: 1,
  };
}

/** Layered lookup: local → API (Supabase + OFF). OpenAI only via label flow. */
export async function fetchProductByBarcode(barcode) {
  return lookupProductByBarcode(barcode);
}

/** Direct OFF fallback (dev/offline only — not used in normal scan flow) */
export async function fetchFromOpenFoodFactsDirect(barcode) {
  const clean = String(barcode).replace(/\D/g, '');
  const res = await fetch(`${OFF_BASE}/${clean}.json`, {
    headers: { 'User-Agent': 'StilMacros/1.0' },
  });
  if (!res.ok) throw new ProductNotFoundError(clean);
  const json = await res.json();
  if (json.status !== 1 || !json.product) throw new ProductNotFoundError(clean);
  const product = normalizeOFF(clean, json.product);
  if (!isValidProduct(product)) throw new ProductNotFoundError(clean);
  return cacheProduct(product);
}

export function normalizeScannedProduct(raw) {
  return {
    barcode: String(raw.barcode || '').replace(/\D/g, ''),
    name: raw.name || 'Produs scanat',
    brand: raw.brand || '',
    imageUrl: raw.imageUrl || '',
    ingredients: raw.ingredients || '',
    servingSize: raw.servingSize || `${raw.defaultGrams || 100}g`,
    defaultGrams: raw.defaultGrams || 100,
    per100g: {
      calories: raw.per100g?.calories ?? 0,
      protein: raw.per100g?.protein ?? 0,
      carbs: raw.per100g?.carbs ?? 0,
      fat: raw.per100g?.fat ?? 0,
      fiber: raw.per100g?.fiber ?? 0,
      sodium: raw.per100g?.sodium ?? 0,
      sugars: raw.per100g?.sugars ?? 0,
    },
    source: raw.source || 'label-scan',
    confidence: raw.confidence ?? 0.5,
    estimated: raw.estimated ?? false,
  };
}

export function persistScannedProduct(raw) {
  const product = normalizeScannedProduct(raw);
  return cacheProduct(product) || product;
}

export function productToLogEntry(product, grams, meal = 'snack') {
  const g = grams || product.defaultGrams || 100;
  const p = product.per100g;
  return {
    name: product.brand ? `${product.name} (${product.brand})` : product.name,
    barcode: product.barcode,
    grams: g,
    calories: Math.round(scaleNutrient(g, p.calories)),
    protein: scaleNutrient(g, p.protein),
    carbs: scaleNutrient(g, p.carbs),
    fat: scaleNutrient(g, p.fat),
    fiber: scaleNutrient(g, p.fiber),
    sodium: scaleNutrient(g, p.sodium),
    sugars: scaleNutrient(g, p.sugars),
    meal,
    imageUrl: product.imageUrl,
  };
}

export async function searchOpenFoodFacts(query) {
  const q = encodeURIComponent(query.trim());
  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&cc=ro&page_size=12&fields=code,product_name,brands,nutriments,image_front_small_url,serving_size`,
    { headers: { 'User-Agent': 'StilMacros/1.0' } }
  );
  const json = await res.json();
  return (json.products || [])
    .filter((p) => p.code && p.nutriments)
    .map((p) => normalizeOFF(p.code, p));
}

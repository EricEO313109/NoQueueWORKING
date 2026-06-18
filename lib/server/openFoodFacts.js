const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';

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

function scaleToPer100g(value, servingGrams) {
  if (value == null || !servingGrams || servingGrams === 100) return value ?? 0;
  return Math.round((value * 100 / servingGrams) * 10) / 10;
}

/** Prefer explicit _100g fields; never use ambiguous per-serving as per100g */
function buildPer100g(n, servingGrams) {
  const has100g = n['energy-kcal_100g'] != null || n.proteins_100g != null;

  if (has100g) {
    return {
      calories: Math.round(n['energy-kcal_100g'] ?? 0),
      protein: n.proteins_100g ?? 0,
      carbs: n.carbohydrates_100g ?? 0,
      fat: n.fat_100g ?? 0,
      fiber: n.fiber_100g ?? 0,
      sodium: (n.sodium_100g ?? 0) * 1000,
      sugars: n.sugars_100g ?? 0,
      confidence: 0.9,
    };
  }

  const kcalServing = n['energy-kcal_serving'] ?? n['energy-kcal'];
  if (kcalServing != null && servingGrams) {
    return {
      calories: Math.round(scaleToPer100g(kcalServing, servingGrams)),
      protein: scaleToPer100g(n.proteins_serving ?? n.proteins, servingGrams),
      carbs: scaleToPer100g(n.carbohydrates_serving ?? n.carbohydrates, servingGrams),
      fat: scaleToPer100g(n.fat_serving ?? n.fat, servingGrams),
      fiber: scaleToPer100g(n.fiber_serving ?? n.fiber, servingGrams),
      sodium: scaleToPer100g((n.sodium_serving ?? n.sodium ?? 0) * 1000, servingGrams),
      sugars: scaleToPer100g(n.sugars_serving ?? n.sugars, servingGrams),
      confidence: 0.75,
    };
  }

  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    sugars: 0,
    confidence: 0.3,
  };
}

export function normalizeOFF(barcode, p) {
  const n = p.nutriments || {};
  const defaultGrams = parseServingGrams(p.serving_size, p.product_quantity);
  const built = buildPer100g(n, defaultGrams);

  return {
    barcode,
    name: p.product_name || p.generic_name || 'Produs necunoscut',
    brand: p.brands || p.brand_owner || '',
    imageUrl: p.image_front_small_url || p.image_url || '',
    ingredients: p.ingredients_text || p.ingredients_text_ro || '',
    servingSize: p.serving_size || `${defaultGrams}g`,
    defaultGrams,
    per100g: {
      calories: built.calories,
      protein: built.protein,
      carbs: built.carbs,
      fat: built.fat,
      fiber: built.fiber,
      sodium: built.sodium,
      sugars: built.sugars,
    },
    source: 'openfoodfacts',
    nutrition_source: 'openfoodfacts',
    confidence: built.confidence,
    confidence_score: built.confidence,
    estimated: false,
  };
}

export async function fetchFromOpenFoodFacts(barcode) {
  const res = await fetch(`${OFF_BASE}/${barcode}.json`, {
    headers: { 'User-Agent': 'NutriScan/1.0 (cloud)' },
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.status !== 1 || !json.product) return null;
  return normalizeOFF(barcode, json.product);
}

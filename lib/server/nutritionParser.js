function num(s) {
  if (s == null) return null;
  const n = parseFloat(String(s).replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function kjToKcal(kj) {
  return kj != null ? Math.round(kj / 4.184) : null;
}

const PATTERNS = {
  energyKcal: [
    /(?:energie|energy|valoare energet[aă]|calorii)[^\d]{0,40}?(\d+[.,]?\d*)\s*kcal/i,
    /(\d+[.,]?\d*)\s*kcal/i,
  ],
  protein: [/(?:proteine|proteins|protein)[^\d]{0,25}?(\d+[.,]?\d*)\s*g/i],
  carbs: [/(?:carbohidrati|carbohidrați|carbohydrates|glucide)[^\d]{0,25}?(\d+[.,]?\d*)\s*g/i],
  fat: [/(?:grasimi|grăsimi|fat|lipides)[^\d]{0,25}?(\d+[.,]?\d*)\s*g/i],
  sugars: [/(?:zaharuri|zahăruri|sugars)[^\d]{0,30}?(\d+[.,]?\d*)\s*g/i],
  fiber: [/(?:fibre|fiber)[^\d]{0,25}?(\d+[.,]?\d*)\s*g/i],
  sodium: [/(?:sodiu|sodium)[^\d]{0,25}?(\d+[.,]?\d*)\s*(?:mg|g)/i],
  serving: [/(?:portie|porție|serving)[^\d]{0,20}?(\d+[.,]?\d*)\s*g/i],
};

function extractFirst(text, regexList) {
  for (const re of regexList) {
    const m = text.match(re);
    if (m?.[1] != null) {
      const v = num(m[1]);
      if (v != null) return v;
    }
  }
  return null;
}

function detectBasis(text) {
  const lower = text.toLowerCase();
  if (/100\s*g|100g|per 100|la 100/.test(lower)) return '100g';
  if (/portie|porție|serving/.test(lower)) return 'serving';
  return '100g';
}

function scaleTo100g(value, basis, servingGrams) {
  if (value == null) return 0;
  if (basis === '100g') return value;
  return (value / (servingGrams || 100)) * 100;
}

/** Romanian EU labels: two columns (100g | portion) — take first number on each row */
function parseDualColumn100g(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!/100\s*g|100g|la\s*100/i.test(text)) return null;

  const pickFirst = (line, re) => {
    const m = line.match(re);
    if (!m) return null;
    const nums = [...line.matchAll(/(\d+[.,]\d+|\d+)/g)].map((x) => num(x[1]));
    return nums[0] ?? null;
  };

  let calories = null;
  let protein = null;
  let carbs = null;
  let fat = null;
  let servingGrams = 100;

  for (const line of lines) {
    const low = line.toLowerCase();
    if (/portie|porție|portion/i.test(low) && /(\d+)\s*g/.test(low)) {
      const sm = line.match(/(\d+[.,]?\d*)\s*g/);
      if (sm) servingGrams = num(sm[1]) || servingGrams;
    }
    if (/energie|valoare energet|energy/i.test(low)) {
      const kcal = line.match(/(\d+[.,]?\d*)\s*kcal/i);
      if (kcal) calories = num(kcal[1]);
      else {
        const kj = line.match(/(\d+[.,]?\d*)\s*kj/i);
        if (kj) calories = kjToKcal(num(kj[1]));
      }
    }
    if (/proteine|protein/i.test(low) && !/acizi/i.test(low)) protein = pickFirst(line, /proteine/i);
    if (/glucide|carbohidr/i.test(low)) carbs = pickFirst(line, /glucide|carbohidr/i);
    if (/grasimi|grăsimi|fat/i.test(low) && !/acizi|saturat/i.test(low)) fat = pickFirst(line, /grasimi|grăsimi/i);
  }

  if (calories == null && protein == null) return null;
  return {
    per100g: {
      calories: Math.round(calories || 0),
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      sugars: 0,
      fiber: 0,
      sodium: 0,
    },
    defaultGrams: servingGrams,
    servingSize: `${servingGrams}g`,
    confidence: [calories, protein, carbs, fat].filter((v) => v > 0).length / 4,
  };
}

export function parseNutritionText(rawText) {
  const text = rawText.replace(/\r/g, '\n');
  const dual = parseDualColumn100g(text);
  if (dual && (dual.confidence || 0) >= 0.5) {
    return { ...dual, ingredients: '' };
  }

  const basis = detectBasis(text);
  const servingGrams = extractFirst(text, PATTERNS.serving) || 100;

  let calories = extractFirst(text, PATTERNS.energyKcal);
  if (calories == null) {
    const kjMatch = text.match(/(\d+[.,]?\d*)\s*kj/i);
    if (kjMatch) calories = kjToKcal(num(kjMatch[1]));
  }

  const per100g = {
    calories: Math.round(scaleTo100g(calories, basis, servingGrams) || 0),
    protein: scaleTo100g(extractFirst(text, PATTERNS.protein), basis, servingGrams) || 0,
    carbs: scaleTo100g(extractFirst(text, PATTERNS.carbs), basis, servingGrams) || 0,
    fat: scaleTo100g(extractFirst(text, PATTERNS.fat), basis, servingGrams) || 0,
    sugars: scaleTo100g(extractFirst(text, PATTERNS.sugars), basis, servingGrams) || 0,
    fiber: scaleTo100g(extractFirst(text, PATTERNS.fiber), basis, servingGrams) || 0,
    sodium: scaleTo100g(extractFirst(text, PATTERNS.sodium), basis, servingGrams) || 0,
  };

  const ingMatch = text.match(/(?:ingrediente|ingredients)[:\s]+(.{10,500})/i);

  return {
    per100g,
    defaultGrams: servingGrams,
    servingSize: `${servingGrams}g`,
    ingredients: ingMatch?.[1]?.split('\n')[0]?.trim() || '',
    confidence: [calories, per100g.protein, per100g.carbs, per100g.fat].filter(Boolean).length / 4,
  };
}

function mapSourceToNutrition(source) {
  if (!source) return 'barcode';
  if (source === 'user_verified') return 'user_verified';
  if (source === 'openfoodfacts') return 'openfoodfacts';
  if (['openai-vision', 'label-scan', 'ocr', 'ocr-label', 'ai_label'].includes(source)) return 'ai_label';
  return 'barcode';
}

function mapNutritionToSource(nutritionSource) {
  if (nutritionSource === 'user_verified') return 'user_verified';
  if (nutritionSource === 'openfoodfacts') return 'openfoodfacts';
  if (nutritionSource === 'ai_label') return 'label-scan';
  return nutritionSource || 'barcode';
}

export function rowToProduct(row) {
  if (!row) return null;
  const nutrition_source = row.nutrition_source || mapSourceToNutrition(row.source);
  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand || '',
    imageUrl: row.image_url || '',
    ingredients: row.ingredients || '',
    servingSize: row.serving_size || '100g',
    defaultGrams: Number(row.default_grams) || 100,
    per100g: row.per_100g || {},
    source: row.source,
    nutrition_source,
    confidence: row.confidence_score ?? row.confidence ?? 1,
    confidence_score: row.confidence_score ?? row.confidence ?? 1,
    estimated: row.estimated,
    last_verified_at: row.last_verified_at || null,
  };
}

/** Writes columns present in 001 schema; 002 columns added when migration runs */
export function productToRow(p) {
  const nutrition_source = p.nutrition_source || mapSourceToNutrition(p.source);
  const row = {
    barcode: String(p.barcode).replace(/\D/g, ''),
    name: p.name || 'Produs scanat',
    brand: p.brand || '',
    image_url: p.imageUrl || '',
    ingredients: p.ingredients || '',
    serving_size: p.servingSize || `${p.defaultGrams || 100}g`,
    default_grams: p.defaultGrams || 100,
    per_100g: p.per100g,
    source: mapNutritionToSource(nutrition_source),
    confidence: p.confidence_score ?? p.confidence ?? 0.8,
    estimated: p.estimated ?? false,
    updated_at: new Date().toISOString(),
  };
  if (p.nutrition_source || p.last_verified_at) {
    row.nutrition_source = nutrition_source;
    row.confidence_score = p.confidence_score ?? p.confidence ?? 0.8;
    if (p.last_verified_at || nutrition_source === 'user_verified') {
      row.last_verified_at = p.last_verified_at || new Date().toISOString();
    }
  }
  return row;
}

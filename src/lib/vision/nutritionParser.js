/**
 * Parses OCR text from nutrition labels (Romanian + English + EU formats).
 * Normalizes to per-100g values.
 */

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
    /(?:energie|energy)[^\d]{0,40}?(\d+[.,]?\d*)\s*kj/i,
  ],
  protein: [
    /(?:proteine|proteins|protein)[^\d]{0,25}?(\d+[.,]?\d*)\s*g/i,
  ],
  carbs: [
    /(?:carbohidrati|carbohidrați|carbohydrates|glucide)[^\d]{0,25}?(\d+[.,]?\d*)\s*g/i,
  ],
  fat: [
    /(?:grasimi|grăsimi|fat|lipides|lipide totale)[^\d]{0,25}?(\d+[.,]?\d*)\s*g/i,
  ],
  sugars: [
    /(?:zaharuri|zahăruri|sugars|dont les sucres|of which sugars)[^\d]{0,30}?(\d+[.,]?\d*)\s*g/i,
  ],
  fiber: [
    /(?:fibre|fiber|fibres)[^\d]{0,25}?(\d+[.,]?\d*)\s*g/i,
  ],
  sodium: [
    /(?:sodiu|sodium|sare)[^\d]{0,25}?(\d+[.,]?\d*)\s*(?:mg|g)/i,
  ],
  serving: [
    /(?:portie|porție|serving|portion)[^\d]{0,20}?(\d+[.,]?\d*)\s*g/i,
    /(?:per|\/)\s*(\d+[.,]?\d*)\s*g/i,
  ],
  ingredients: [
    /(?:ingrediente|ingredients)[:\s]+(.{10,800})/i,
  ],
};

function extractFirst(text, regexList, transform = (v) => v) {
  for (const re of regexList) {
    const m = text.match(re);
    if (m?.[1] != null) {
      const v = transform(num(m[1]));
      if (v != null) return v;
    }
  }
  return null;
}

function detectBasis(text) {
  const lower = text.toLowerCase();
  if (/100\s*g|100g|per 100|la 100|pour 100/.test(lower)) return '100g';
  if (/portie|porție|serving|portion/.test(lower)) return 'serving';
  return '100g';
}

function scaleTo100g(value, basis, servingGrams) {
  if (value == null) return 0;
  if (basis === '100g') return value;
  const sg = servingGrams || 100;
  return (value / sg) * 100;
}

function parseDualColumn100g(text) {
  if (!/100\s*g|100g|la\s*100/i.test(text)) return null;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let calories = null;
  let protein = null;
  let carbs = null;
  let fat = null;
  let servingGrams = 100;
  for (const line of lines) {
    const low = line.toLowerCase();
    if (/portie|porție/i.test(low)) {
      const sm = line.match(/(\d+[.,]?\d*)\s*g/);
      if (sm) servingGrams = num(sm[1]) || servingGrams;
    }
    if (/energie|valoare energet/i.test(low)) {
      const kcal = line.match(/(\d+[.,]?\d*)\s*kcal/i);
      if (kcal) calories = num(kcal[1]);
      else {
        const kj = line.match(/(\d+[.,]?\d*)\s*kj/i);
        if (kj) calories = kjToKcal(num(kj[1]));
      }
    }
    if (/proteine/i.test(low)) {
      const nums = [...line.matchAll(/(\d+[.,]\d+|\d+)/g)].map((x) => num(x[1]));
      if (nums[0] != null) protein = nums[0];
    }
    if (/glucide|carbohidr/i.test(low)) {
      const nums = [...line.matchAll(/(\d+[.,]\d+|\d+)/g)].map((x) => num(x[1]));
      if (nums[0] != null) carbs = nums[0];
    }
    if (/grasimi|grăsimi/i.test(low) && !/saturat/i.test(low)) {
      const nums = [...line.matchAll(/(\d+[.,]\d+|\d+)/g)].map((x) => num(x[1]));
      if (nums[0] != null) fat = nums[0];
    }
  }
  if (calories == null && protein == null) return null;
  return {
    per100g: { calories: Math.round(calories || 0), protein: protein || 0, carbs: carbs || 0, fat: fat || 0, sugars: 0, fiber: 0, sodium: 0 },
    defaultGrams: servingGrams,
    servingSize: `${servingGrams}g`,
    confidence: [calories, protein, carbs, fat].filter((v) => v > 0).length / 4,
    ingredients: '',
  };
}

export function parseNutritionText(rawText) {
  const text = rawText.replace(/\r/g, '\n');
  const dual = parseDualColumn100g(text);
  if (dual && (dual.confidence || 0) >= 0.5) return dual;

  const basis = detectBasis(text);
  const servingGrams = extractFirst(text, PATTERNS.serving) || 100;

  let calories = extractFirst(text, PATTERNS.energyKcal.slice(0, 2));
  if (calories == null) {
    const kjMatch = text.match(/(\d+[.,]?\d*)\s*kj/i);
    if (kjMatch) calories = kjToKcal(num(kjMatch[1]));
  }

  const protein = extractFirst(text, PATTERNS.protein);
  const carbs = extractFirst(text, PATTERNS.carbs);
  const fat = extractFirst(text, PATTERNS.fat);
  const sugars = extractFirst(text, PATTERNS.sugars);
  const fiber = extractFirst(text, PATTERNS.fiber);
  let sodium = extractFirst(text, PATTERNS.sodium);
  if (sodium != null && text.match(/sodiu|sodium/i)?.input?.includes('g') && sodium < 10) {
    sodium = sodium * 1000;
  }

  const ingMatch = text.match(PATTERNS.ingredients[0]);
  const ingredients = ingMatch?.[1]?.split(/\n/)[0]?.trim().slice(0, 500) || '';

  const per100g = {
    calories: Math.round(scaleTo100g(calories, basis, servingGrams) || 0),
    protein: scaleTo100g(protein, basis, servingGrams) || 0,
    carbs: scaleTo100g(carbs, basis, servingGrams) || 0,
    fat: scaleTo100g(fat, basis, servingGrams) || 0,
    sugars: scaleTo100g(sugars, basis, servingGrams) || 0,
    fiber: scaleTo100g(fiber, basis, servingGrams) || 0,
    sodium: scaleTo100g(sodium, basis, servingGrams) || 0,
  };

  const confidence = [calories, protein, carbs, fat].filter((v) => v != null).length / 4;

  return {
    per100g,
    defaultGrams: servingGrams,
    servingSize: `${servingGrams}g`,
    ingredients,
    confidence,
    rawBasis: basis,
  };
}

/** Estimate from product category when OCR fails */
export function estimateFromCategory(barcode, productName = '') {
  const name = productName.toLowerCase();
  const estimates = [
    { re: /ciocolat|chocolate|snack|biscui/i, per100g: { calories: 520, protein: 6, carbs: 58, fat: 28 } },
    { re: /iaurt|yogurt/i, per100g: { calories: 75, protein: 4, carbs: 8, fat: 3 } },
    { re: /suc|juice|bautura|drink/i, per100g: { calories: 45, protein: 0, carbs: 11, fat: 0 } },
    { re: /paine|bread/i, per100g: { calories: 265, protein: 9, carbs: 49, fat: 3 } },
    { re: /cereale|cereal/i, per100g: { calories: 380, protein: 8, carbs: 72, fat: 6 } },
  ];
  for (const e of estimates) {
    if (e.re.test(name)) return { ...e, confidence: 0.25 };
  }
  return {
    per100g: { calories: 250, protein: 8, carbs: 30, fat: 10, sugars: 5, fiber: 2, sodium: 400 },
    confidence: 0.15,
    defaultGrams: 100,
    servingSize: '100g',
    ingredients: '',
  };
}

export function mergeNutrition(primary, secondary) {
  if (!secondary) return primary;
  const p = primary?.per100g || {};
  const s = secondary?.per100g || {};
  return {
    per100g: {
      calories: p.calories || s.calories || 0,
      protein: p.protein || s.protein || 0,
      carbs: p.carbs || s.carbs || 0,
      fat: p.fat || s.fat || 0,
      sugars: p.sugars || s.sugars || 0,
      fiber: p.fiber || s.fiber || 0,
      sodium: p.sodium || s.sodium || 0,
    },
    defaultGrams: primary?.defaultGrams || secondary?.defaultGrams || 100,
    servingSize: primary?.servingSize || secondary?.servingSize || '100g',
    ingredients: primary?.ingredients || secondary?.ingredients || '',
    confidence: Math.max(primary?.confidence || 0, secondary?.confidence || 0),
  };
}

/**
 * Ingredient categories for meal parsing — caps carbs on protein/fat foods, realistic defaults.
 */

export const CATEGORIES = {
  protein: {
    keywords: [
      'chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'tuna', 'egg', 'ou',
      'steak', 'vită', 'pui', 'carne', 'ham', 'bacon', 'sausage', 'shrimp', 'cod',
    ],
    maxCarbsPer100g: 5,
    defaultVagueGrams: 120,
  },
  dairy_protein: {
    keywords: ['cheese', 'brânză', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'mixed cheese'],
    maxCarbsPer100g: 8,
    defaultVagueGrams: 40,
  },
  carb: {
    keywords: [
      'rice', 'pasta', 'bread', 'tortilla', 'wrap', 'lipie', 'oats', 'oat', 'potato',
      'banana', 'cereal', 'orez', 'paste', 'pâine', 'cartof', 'banană', 'porridge',
    ],
    maxCarbsPer100g: 90,
    defaultVagueGrams: 80,
  },
  fat: {
    keywords: ['mayo', 'mayonnaise', 'butter', 'oil', 'ulei', 'maioneză', 'unt', 'sauce', 'dressing'],
    maxCarbsPer100g: 15,
    defaultVagueGrams: 15,
  },
  vegetable: {
    keywords: ['broccoli', 'spinach', 'salad', 'tomato', 'cucumber', 'vegetable', 'legume'],
    maxCarbsPer100g: 15,
    defaultVagueGrams: 80,
  },
};

const PIECE_GRAMS = {
  tortilla: { small: 45, medium: 55, large: 70, default: 50 },
  wrap: { small: 45, medium: 55, large: 70, default: 50 },
  lipie: { small: 45, medium: 55, large: 70, default: 50 },
  egg: { default: 50 },
  ou: { default: 50 },
  wing: { default: 30 },
  aripa: { default: 30 },
  banana: { small: 90, medium: 118, large: 136, default: 118 },
  apple: { small: 150, medium: 182, large: 220, default: 182 },
  slice: { default: 30 },
};

export function detectCategory(foodName) {
  const q = foodName.toLowerCase().trim();
  for (const [cat, cfg] of Object.entries(CATEGORIES)) {
    if (cfg.keywords.some((kw) => q.includes(kw))) return cat;
  }
  return 'unknown';
}

export function applyCategoryMacroCaps(per100g, category) {
  const p = { ...per100g };
  const cfg = CATEGORIES[category];
  if (!cfg?.maxCarbsPer100g) return p;
  if ((p.carbs ?? 0) > cfg.maxCarbsPer100g) {
    p.carbs = category === 'protein' ? 0 : cfg.maxCarbsPer100g;
  }
  return p;
}

export function defaultGramsForFood(foodName, line = '') {
  const q = foodName.toLowerCase();
  const lineL = line.toLowerCase();
  const cat = detectCategory(q);

  const sizeMatch = lineL.match(/\b(small|medium|large)\b/i);
  const size = sizeMatch?.[1]?.toLowerCase() || 'default';

  const countMatch = lineL.match(/\b(\d+)\s*(small|medium|large)?\s*(tortillas?|wraps?|lipii?|eggs?|ouă?|ou|wings?|aripi|bananas?|apples?|slices?)/i);
  if (countMatch) {
    const n = parseInt(countMatch[1], 10);
    let food = countMatch[3].toLowerCase().replace(/s$/, '');
    if (/^ouă?$/.test(food)) food = 'ou';
    if (food === 'aripi') food = 'aripa';
    const sz = countMatch[2]?.toLowerCase() || size;
    const base = PIECE_GRAMS[food]?.[sz] ?? PIECE_GRAMS[food]?.default ?? 50;
    return Math.round(n * base);
  }

  for (const [food, sizes] of Object.entries(PIECE_GRAMS)) {
    if (q.includes(food)) return sizes[size] ?? sizes.default;
  }

  if (/\ba\s+bit\b/i.test(lineL)) return 12;
  if (/\ba\s+little\b/i.test(lineL)) return 10;
  if (/\bsome\b/i.test(lineL)) return 25;
  if (/\bhandful\b/i.test(lineL)) return 30;

  const cfg = CATEGORIES[cat];
  return cfg?.defaultVagueGrams ?? 80;
}

/** Prefer seed DB over USDA for meal parsing */
export const MEAL_PARSE_SOURCE_PRIORITY = {
  seed: 100,
  usda: 40,
  openfoodfacts: 30,
  user: 90,
};

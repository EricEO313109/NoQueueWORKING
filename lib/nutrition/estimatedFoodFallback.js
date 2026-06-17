const ESTIMATED_FOODS = [
  {
    name: 'Rice Cakes',
    patterns: [/\brice cakes?\b/, /\borez expandat\b/],
    unit: /cakes?|pieces?|buc(?:ati|ăți)?/,
    gramsPerUnit: 9,
    macrosPerUnit: { calories: 35, protein: 0.7, carbs: 7.3, fat: 0.3 },
    per100g: { calories: 389, protein: 7.8, carbs: 81, fat: 3.3 },
  },
  {
    name: 'Whey Protein',
    patterns: [/\bwhey\b/, /\bprotein powder\b/, /\bscoop of whey\b/],
    unit: /scoops?/,
    gramsPerUnit: 30,
    macrosPerUnit: { calories: 120, protein: 24, carbs: 3, fat: 2 },
    per100g: { calories: 400, protein: 80, carbs: 10, fat: 6.7 },
  },
  {
    name: 'Creatine Mixture',
    patterns: [/\bcreatine\b/, /\bcreatina\b/],
    unit: /scoops?|servings?/,
    gramsPerUnit: 5,
    macrosPerUnit: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    per100g: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  },
  {
    name: 'Egg Whites',
    patterns: [/\begg whites?\b/, /\balbus(?:uri)?\b/],
    unit: /egg whites?|whites?|albus(?:uri)?/,
    gramsPerUnit: 33,
    macrosPerUnit: { calories: 17, protein: 3.6, carbs: 0.2, fat: 0 },
    per100g: { calories: 52, protein: 10.9, carbs: 0.7, fat: 0.2 },
  },
  {
    name: 'Oat Milk',
    patterns: [/\boat milk\b/, /\blapte de ovaz\b/, /\blapte de ovăz\b/],
    unit: /cups?|glasses?/,
    gramsPerUnit: 240,
    macrosPerUnit: { calories: 120, protein: 3, carbs: 16, fat: 5 },
    per100g: { calories: 50, protein: 1.3, carbs: 6.7, fat: 2.1 },
  },
  {
    name: 'Almonds',
    patterns: [/\balmonds?\b/, /\bmigdale\b/],
    phraseGrams: [{ pattern: /\bhandful\b/, grams: 30 }],
    per100g: { calories: 579, protein: 21, carbs: 22, fat: 50 },
  },
  {
    name: 'Sourdough Bread',
    patterns: [/\bsourdough\b/, /\bpaine cu maia\b/, /\bpâine cu maia\b/],
    unit: /slices?|felii?/,
    gramsPerUnit: 45,
    macrosPerUnit: { calories: 115, protein: 4, carbs: 22, fat: 1 },
    per100g: { calories: 255, protein: 8.8, carbs: 49, fat: 2.2 },
  },
  {
    name: 'Avocado',
    patterns: [/\bavocado\b/],
    phraseGrams: [{ pattern: /\bhalf\b|\bjumatate\b|\bjumătate\b/, grams: 75 }],
    per100g: { calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  },
  {
    name: 'Mici / Mititei',
    patterns: [/\bmici\b/, /\bmititei\b/],
    unit: /mici|mititei|pieces?|buc(?:ati|ăți)?/,
    gramsPerUnit: 50,
    macrosPerUnit: { calories: 145, protein: 7.5, carbs: 1, fat: 12.5 },
    per100g: { calories: 290, protein: 15, carbs: 2, fat: 25 },
  },
  {
    name: 'French Fries',
    patterns: [/\bcartofi prajiti\b/, /\bcartofi prăjiți\b/, /\bfries\b/, /\bfrench fries\b/],
    phraseGrams: [{ pattern: /\bportie\b|\bporție\b|\bserving\b/, grams: 150 }],
    per100g: { calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  },
  {
    name: 'Ciorbă Rădăuțeană',
    patterns: [/\bciorba radauteana\b/, /\bciorbă rădăuțeană\b/, /\bradauteana\b/, /\brădăuțeană\b/],
    phraseGrams: [{ pattern: /\bbowl\b|\bportie\b|\bporție\b/, grams: 350 }],
    per100g: { calories: 70, protein: 5, carbs: 4, fat: 4 },
  },
  {
    name: 'Chicken Shawarma',
    patterns: [/\bshawarma\b/, /\bshaorma\b/],
    phraseGrams: [{ pattern: /\bsmall\b|\bmic[ăa]?\b/, grams: 320 }],
    per100g: { calories: 230, protein: 12, carbs: 21, fat: 11 },
  },
];

const NUMBER_WORDS = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  o: 1,
  un: 1,
  una: 1,
  doi: 2,
  doua: 2,
  două: 2,
  trei: 3,
  patru: 4,
  cinci: 5,
};

function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function round1(value) {
  return Math.round((value || 0) * 10) / 10;
}

function parseCount(line) {
  const match = normalize(line).match(/\b(\d+(?:[.,]\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|o|un|una|doi|doua|două|trei|patru|cinci)\b/);
  if (!match) return 1;
  const raw = match[1].replace(',', '.');
  return NUMBER_WORDS[raw] || Math.max(1, Number(raw) || 1);
}

function gramsFromLine(line, profile, defaultGrams) {
  const normalized = normalize(line);
  const explicit = normalized.match(/\b(\d+(?:[.,]\d+)?)\s*(g|gram|grams|grame)\b/);
  if (explicit) return Math.max(1, Number(explicit[1].replace(',', '.')));

  const phrase = profile.phraseGrams?.find((entry) => entry.pattern.test(normalized));
  if (phrase) return phrase.grams;

  if (profile.unit && profile.gramsPerUnit && profile.unit.test(normalized)) {
    return Math.round(parseCount(line) * profile.gramsPerUnit);
  }

  return defaultGrams;
}

function macrosFromPer100g(per100g, grams) {
  const f = grams / 100;
  return {
    calories: Math.round((per100g.calories || 0) * f),
    protein: round1((per100g.protein || 0) * f),
    carbs: round1((per100g.carbs || 0) * f),
    fat: round1((per100g.fat || 0) * f),
  };
}

export function estimateFoodFromText(line, foodName = '', defaultGrams = 100) {
  const haystack = normalize(`${line} ${foodName}`);
  const profile = ESTIMATED_FOODS.find((entry) => entry.patterns.some((pattern) => pattern.test(haystack)));
  const resolved = profile || {
    name: foodName ? foodName.replace(/\b\w/g, (m) => m.toUpperCase()) : 'Estimated Food',
    per100g: { calories: 180, protein: 5, carbs: 24, fat: 6 },
  };
  const grams = gramsFromLine(line, resolved, defaultGrams);
  const unitMatch = resolved.unit && resolved.gramsPerUnit && resolved.unit.test(haystack);
  const count = unitMatch ? parseCount(line) : 1;
  const macros = resolved.macrosPerUnit && unitMatch
    ? {
      calories: Math.round(resolved.macrosPerUnit.calories * count),
      protein: round1(resolved.macrosPerUnit.protein * count),
      carbs: round1(resolved.macrosPerUnit.carbs * count),
      fat: round1(resolved.macrosPerUnit.fat * count),
    }
    : macrosFromPer100g(resolved.per100g, grams);

  return {
    name: resolved.name,
    weight: grams,
    grams,
    ...macros,
    per100g: resolved.per100g,
    matched: true,
    estimated: true,
    aiEstimated: true,
    confidence: profile ? 0.74 : 0.62,
    nutritionSource: 'AI Estimated',
    accuracyScore: profile ? 74 : 62,
    accuracyLabel: 'AI Estimated',
    validationWarnings: ['Estimated from common nutrition references; verify label if available.'],
    rawLine: line,
  };
}

export function hasEstimatedFoodProfile(line, foodName = '') {
  const haystack = normalize(`${line} ${foodName}`);
  return ESTIMATED_FOODS.some((entry) => entry.patterns.some((pattern) => pattern.test(haystack)));
}

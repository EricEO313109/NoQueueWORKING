import conversions from '../../data/portion-conversions.json' with { type: 'json' };

const GENERIC_UNIT_GRAMS = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  cup: 185,
  cups: 185,
  tbsp: 15,
  tbs: 15,
  tablespoon: 15,
  tablespoons: 15,
  spoon: 15,
  spoons: 15,
  spoonful: 15,
  spoonfuls: 15,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

const FOOD_UNIT_GRAMS = [
  {
    tokens: ['milk', 'latte', 'yogurt'],
    units: { ml: 1.03, milliliter: 1.03, milliliters: 1.03, l: 1030, liter: 1030, liters: 1030, cup: 244, cups: 244 },
  },
  {
    tokens: ['oil', 'olive oil'],
    units: {
      ml: 0.91,
      milliliter: 0.91,
      milliliters: 0.91,
      l: 910,
      liter: 910,
      liters: 910,
      tbsp: 14,
      tbs: 14,
      tablespoon: 14,
      tablespoons: 14,
      spoon: 14,
      spoons: 14,
      tsp: 5,
      teaspoon: 5,
      teaspoons: 5,
    },
  },
  {
    tokens: ['peanut butter', 'pb'],
    units: {
      tbsp: 16,
      tbs: 16,
      tablespoon: 16,
      tablespoons: 16,
      spoon: 16,
      spoons: 16,
      spoonful: 16,
      spoonfuls: 16,
      tsp: 5,
      teaspoon: 5,
      teaspoons: 5,
    },
  },
  {
    tokens: ['mayo', 'mayonnaise'],
    units: { tbsp: 15, tbs: 15, tablespoon: 15, tablespoons: 15, spoon: 15, spoons: 15, tsp: 5, teaspoon: 5, teaspoons: 5 },
  },
  {
    tokens: ['butter'],
    units: { tbsp: 14, tbs: 14, tablespoon: 14, tablespoons: 14, spoon: 14, spoons: 14, tsp: 5, teaspoon: 5, teaspoons: 5 },
  },
];

function parseAmount(value) {
  if (!value) return 1;
  const normalized = value.toLowerCase().replace(',', '.').trim();
  if (normalized === 'a' || normalized === 'an' || normalized === 'one') return 1;
  if (normalized === 'two') return 2;
  if (normalized === 'three') return 3;
  if (normalized.includes('/')) {
    const [num, den] = normalized.split('/').map(Number);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) return num / den;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 1;
}

function gramsPerUnit(unit, text, foodName = '') {
  const normalizedUnit = unit.toLowerCase();
  const haystack = `${foodName} ${text}`.toLowerCase();
  const foodMatch = FOOD_UNIT_GRAMS.find((entry) =>
    entry.tokens.some((token) => haystack.includes(token)),
  );
  return foodMatch?.units?.[normalizedUnit] || GENERIC_UNIT_GRAMS[normalizedUnit] || null;
}

/** Match phrase-based portions before generic defaults */
export function gramsFromPortionPhrase(text) {
  const line = text.toLowerCase().trim();
  for (const entry of conversions) {
    for (const phrase of entry.phrases || []) {
      if (line.includes(phrase.toLowerCase())) {
        return entry.grams;
      }
    }
  }
  return null;
}

export function gramsFromPortionUnit(text, foodName = '') {
  const line = String(text || '').toLowerCase();
  const match = line.match(
    /\b(\d+(?:[.,]\d+)?|\d+\/\d+|a|an|one|two|three)?\s*(ml|milliliters?|l|liters?|g|grams?|kg|kilograms?|oz|ounces?|lbs?|pounds?|tbsp|tbs|tablespoons?|spoons?|spoonfuls?|tsp|teaspoons?|cups?|pieces?|slices?)\b/i,
  );
  if (!match) return null;

  const amount = parseAmount(match[1]);
  const unit = match[2].toLowerCase();
  if (/^g(rams?)?$/.test(unit)) return Math.round(amount);
  if (/^(kg|kilograms?)$/.test(unit)) return Math.round(amount * 1000);
  if (/pieces?|slices?/.test(unit)) return null;
  const perUnit = gramsPerUnit(unit, line, foodName);
  if (!perUnit) return null;
  return Math.round(amount * perUnit);
}

export function stripPortionUnits(text) {
  return String(text || '')
    .replace(/\b(\d+(?:[.,]\d+)?|\d+\/\d+|a|an|one|two|three)?\s*(ml|milliliters?|l|liters?|g|grams?|kg|kilograms?|oz|ounces?|lbs?|pounds?|tbsp|tbs|tablespoons?|spoons?|spoonfuls?|tsp|teaspoons?|cups?|pieces?|slices?)\b(?:\s+of)?/gi, '')
    .trim();
}

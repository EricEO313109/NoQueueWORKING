import { defaultGramsForFood } from './ingredientCategories.js';
import { gramsFromPortionPhrase, gramsFromPortionUnit, stripPortionUnits } from './portionConversions.js';

const LIQUID_FOOD_TOKENS = [
  'milk', 'lapte', 'water', 'apa', 'juice', 'suc', 'yogurt', 'iaurt', 'cream', 'latte',
  'smoothie', 'soda', 'coffee', 'tea', 'ceai', 'shake', 'cola',
];

const PHRASE_GRAMS = [
  [/\ba\s+bit\s+of\b/i, 12],
  [/\ba\s+little\b/i, 10],
  [/\ba\s+small\s+amount\b/i, 15],
  [/\bsome\b/i, 25],
  [/\ba\s+spoon(?:ful)?\s+of\b/i, 15],
  [/\ba\s+scoop\s+of\b/i, 30],
  [/\ba\s+tablespoon\b/i, 15],
  [/\btbsp\b/i, 15],
  [/\ba\s+teaspoon\b/i, 5],
  [/\btsp\b/i, 5],
  [/\ba\s+handful(?:\s+of)?\b/i, 30],
  [/\ba\s+fist[-\s]?sized\s+(?:portion\s+of\s+)?\b/i, 175],
  [/\ba\s+splash\s+of\b/i, 15],
  [/\ba\s+drop\s+of\b/i, 5],
  [/\ba\s+pinch\b/i, 2],
];

const TEXT_ALIASES = [
  [/\bchick(?:e|i)n\b/gi, 'chicken'],
  [/\bchiken\b/gi, 'chicken'],
  [/\bpui\b/gi, 'chicken'],
  [/\bshaorma\b/gi, 'shawarma'],
  [/\bshaurma\b/gi, 'shawarma'],
  [/\bpotatoe?s?\b/gi, 'potato'],
  [/\bcartofi\b/gi, 'potato'],
  [/\bpb\b/gi, 'peanut butter'],
  [/\bfryed\b/gi, 'fried'],
  [/\bair\s*fryed\b/gi, 'air fried'],
  [/\bair\s*fryer\b/gi, 'air fried'],
];

export function autocorrectMealText(text) {
  return TEXT_ALIASES.reduce((value, [re, replacement]) => value.replace(re, replacement), String(text || ''));
}

function isLiquidFood(text) {
  const hay = String(text || '').toLowerCase();
  return LIQUID_FOOD_TOKENS.some((token) => hay.includes(token));
}

function bareNumberAmount(line, foodName = '') {
  const leading = String(line || '').match(/^\s*(\d+(?:[.,]\d+)?)\s+[^\d\s]/);
  const trailing = String(line || '').match(/[^\d\s]\s+(\d+(?:[.,]\d+)?)\s*$/);
  const raw = leading?.[1] || trailing?.[1];
  if (!raw) return null;
  const amount = Number(raw.replace(',', '.'));
  // Keep small values available for piece-count foods like "2 eggs".
  if (!Number.isFinite(amount) || amount < 10) return null;
  if (isLiquidFood(`${line} ${foodName}`)) {
    const mlGrams = gramsFromPortionUnit(`${amount} ml`, foodName);
    if (mlGrams != null) return mlGrams;
    return Math.round(amount * 1.03);
  }
  return amount;
}

export function estimateGramsFromPhrase(text, foodName = '') {
  let line = autocorrectMealText(text).trim();
  let grams = gramsFromPortionUnit(line, foodName);
  if (grams != null) {
    line = stripPortionUnits(line);
  }

  if (grams == null) {
    grams = gramsFromPortionPhrase(line);
  }

  if (grams == null) {
    for (const [re, g] of PHRASE_GRAMS) {
      if (re.test(line)) {
        grams = g;
        line = line.replace(re, '').trim();
        break;
      }
    }
  }

  // Explicit grams: "200g" or "200 g" or "200 grams"
  const explicitG = line.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|grams|grame)\b/i)
    || line.match(/(\d+(?:[.,]\d+)?)g\b/i);
  if (explicitG) {
    grams = parseFloat(explicitG[1].replace(',', '.'));
    line = line.replace(explicitG[0], '').trim();
  }

  const kgMatch = line.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
  if (kgMatch) {
    grams = parseFloat(kgMatch[1].replace(',', '.')) * 1000;
    line = line.replace(kgMatch[0], '').trim();
  }

  if (grams == null) {
    grams = bareNumberAmount(line, foodName || line);
  }

  // Piece counts: "1 small tortilla", "2 eggs" — NOT bare "1" without food context
  if (grams == null) {
    grams = defaultGramsForFood(foodName || line, text);
  }

  return Math.max(5, Math.min(2000, Math.round(grams)));
}

export function extractFoodNameFromLine(line) {
  let name = autocorrectMealText(line)
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|grams|grame|kg)\b/gi, '')
    .replace(/(\d+(?:[.,]\d+)?)g\b/gi, '')
    .replace(/\b(\d+(?:[.,]\d+)?|\d+\/\d+|a|an|one|two|three)?\s*(ml|milliliters?|l|liters?|cup|cups|tbsp|tbs|tablespoons?|tsp|teaspoons?|spoons?|spoonfuls?|oz|ounces?|lbs?|pounds?)\b(?:\s+of)?/gi, '')
    .replace(/\b(a bit of|a little|some|a handful(?: of)?|a fist[-\s]?sized(?: portion of)?|a scoop of|a splash of|a drop of|a pinch)\b/gi, '')
    .replace(/\b(\d+)\s*(small|medium|large)\s+/gi, '')
    .replace(/\b(\d+)\s*(small|medium|large)?\s*(tortillas?|wraps?|lipii?|eggs?|ouă?|wings?|aripi|bananas?|apples?|slices?)\b/gi, '$3')
    .replace(/\b(made a wrap with|i ate|i had|with|air fried|fried|baked|grilled|boiled|roasted|steamed|cooked|raw|dry)\b/gi, '')
    .trim();
  name = name.replace(/^\d+\s+/, '').trim();
  name = name.replace(/^of\s+/i, '').trim();
  name = name.replace(/^[,:\-\s]+|[,:\-\s]+$/g, '').trim();
  if (/^tortillas?$/i.test(name)) return 'tortilla';
  if (/^wraps?$/i.test(name)) return 'wrap';
  return name.replace(/\s+\d+(?:[.,]\d+)?$/, '').trim() || line.trim();
}

/** Count from lines like "2 tortillas" or "3 eggs" */
export function parsePieceCount(line) {
  const m = autocorrectMealText(line).match(
    /\b(\d+)\s*(small|medium|large)?\s*(tortillas?|wraps?|lipii?|eggs?|ouă?|wings?|aripi|bananas?|apples?|slices?)\b/i,
  );
  if (m) return Math.max(1, parseInt(m[1], 10));
  return 1;
}

export function formatLoggedFoodName(itemName, { pieceCount = 1, grams, variant } = {}) {
  const base = (itemName || 'Food').replace(/\s*\(1 piece\)\s*/i, '').trim();
  if (pieceCount > 1) {
    const each = grams > 0 ? Math.round(grams / pieceCount) : null;
    return each ? `${pieceCount}× ${base} (${each}g each)` : `${pieceCount}× ${base}`;
  }
  if (variant === '1 piece' || /\(1 piece\)/i.test(itemName)) return `${base} (1 piece)`;
  return base;
}

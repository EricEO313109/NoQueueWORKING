/**
 * Infer preparation & search query from a meal line BEFORE matching.
 * Reduces false clarifications and wrong variant picks.
 */

const COOKED_WORDS = /\b(cooked|grilled|fried|fryed|baked|boiled|roasted|steamed|air\s*fried|air\s*fryed|air\s*fryer|fiert|gătit|prăjit)\b/i;
const RAW_WORDS = /\b(raw|crud|uncooked)\b/i;
const DRY_WORDS = /\b(dry|dried|uscat|uncooked rice|dry weight)\b/i;

const CUT_PATTERNS = [
  { re: /\bchicken\s+breast\b/i, base: 'chicken breast', category: 'protein' },
  { re: /\bbreast\s+chicken\b/i, base: 'chicken breast', category: 'protein' },
  { re: /\bchicken\s+thigh\b/i, base: 'chicken thigh', category: 'protein' },
  { re: /\bchicken\s+wings?\b/i, base: 'chicken wing', category: 'protein' },
  { re: /\bwings?\b/i, base: 'chicken wing', category: 'protein' },
  { re: /\bchicken\s+drumstick\b/i, base: 'chicken drumstick', category: 'protein' },
  { re: /\bchicken\s+mince\b/i, base: 'chicken mince', category: 'protein' },
  { re: /\bground\s+chicken\b/i, base: 'chicken mince', category: 'protein' },
  { re: /\bbeef\s+lean\b/i, base: 'beef lean', category: 'protein' },
  { re: /\blean\s+beef\b/i, base: 'beef lean', category: 'protein' },
  { re: /\bbeef\s+regular\b/i, base: 'beef regular', category: 'protein' },
  { re: /\bwhite\s+rice\b/i, base: 'white rice', category: 'carb' },
  { re: /\bbrown\s+rice\b/i, base: 'brown rice', category: 'carb' },
  { re: /\b(salmon|tuna|turkey|pork)\b/i, base: null, category: 'protein' },
];

const FOOD_ALIASES = [
  [/\bchick(?:e|i)n\b/i, 'chicken'],
  [/\bchiken\b/i, 'chicken'],
  [/\bshaorma\b/i, 'shawarma'],
  [/\bshaurma\b/i, 'shawarma'],
  [/\bpotatoe?s?\b/i, 'potato'],
  [/\bcartofi\b/i, 'potato'],
  [/\bpb\b/i, 'peanut butter'],
  [/\bfryed\b/i, 'fried'],
  [/\bair\s*fryed\b/i, 'air fried'],
  [/\bmayo(naise)?\b/i, 'mayonnaise'],
  [/\brice\b/i, 'rice'],
  [/\borez\b/i, 'rice'],
  [/\bpaste\b/i, 'pasta'],
  [/\bpui\b/i, 'chicken'],
  [/\bvită\b/i, 'beef'],
  [/\bbrânză\b/i, 'cheese'],
  [/\blipie\b/i, 'tortilla'],
  [/\bwrap\b/i, 'tortilla'],
  [/\bunt\b/i, 'butter'],
  [/\bulei\b/i, 'olive oil'],
  [/\bouă?\b/i, 'egg'],
];

export function getLineIntent(line, foodName = '') {
  const lineL = line.toLowerCase();
  const nameL = foodName.toLowerCase().trim();
  const combined = `${lineL} ${nameL}`;

  let preparation = null;
  if (DRY_WORDS.test(combined)) preparation = 'dry';
  else if (RAW_WORDS.test(combined)) preparation = 'raw';
  else if (COOKED_WORDS.test(combined)) preparation = 'cooked';

  let cut = null;
  let category = null;
  for (const { re, base, category: cat } of CUT_PATTERNS) {
    if (re.test(combined)) {
      cut = base;
      category = cat;
      break;
    }
  }

  let normalizedName = nameL;
  for (const [re, alias] of FOOD_ALIASES) {
    if (re.test(normalizedName) || re.test(lineL)) {
      normalizedName = normalizedName.replace(re, alias);
    }
  }

  return {
    preparation,
    cut,
    category,
    normalizedName: normalizedName.trim(),
    hasExplicitGrams: /(\d+(?:[.,]\d+)?)\s*(?:g|gram|grams)\b/i.test(line) || /(\d+(?:[.,]\d+)?)g\b/i.test(line),
    isDryWeight: DRY_WORDS.test(combined),
    isCookedWeight: COOKED_WORDS.test(combined) && !DRY_WORDS.test(combined),
  };
}

/** Build search query that locks variant when line states it (never duplicate prep words) */
export function resolveSearchQuery(foodName, line = '') {
  const intent = getLineIntent(line, foodName);
  let q = (intent.cut || intent.normalizedName || foodName).trim();

  if (intent.preparation === 'dry' && !DRY_WORDS.test(q)) q = `${q} dry`;
  else if (intent.preparation === 'raw' && !RAW_WORDS.test(q)) q = `${q} raw`;
  else if (intent.preparation === 'cooked' && !COOKED_WORDS.test(q)) q = `${q} cooked`;

  return q.replace(/\s+/g, ' ').trim() || foodName;
}

/** Default preparation when line is ambiguous (conservative for accuracy) */
export function defaultPreparationForFood(foodName, line = '') {
  const intent = getLineIntent(line, foodName);
  const n = (intent.normalizedName || foodName).toLowerCase();

  if (intent.preparation) return intent.preparation;

  if (/\b(rice|pasta|oats)\b/.test(n) && intent.hasExplicitGrams) {
    return 'dry';
  }

  if (/\b(chicken|beef|pork|fish|salmon|egg)\b/.test(n)) {
    return 'cooked';
  }

  return null;
}

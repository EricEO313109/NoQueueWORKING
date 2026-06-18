/**
 * Normalize meal-line text into a stable search query (no bare "2", no USDA false positives).
 */

const PLURAL_TO_SINGULAR = [
  [/\btortillas\b/i, 'tortilla'],
  [/\bwraps\b/i, 'wrap'],
  [/\beggs\b/i, 'egg'],
  [/\bapples\b/i, 'apple'],
  [/\bbananas\b/i, 'banana'],
  [/\bslices\b/i, 'slice'],
  [/\bwings\b/i, 'wing'],
  [/\bpotatoes\b/i, 'potato'],
  [/\bpotatos\b/i, 'potato'],
];

const QUERY_ALIASES = [
  [/\bchick(?:e|i)n\b/i, 'chicken'],
  [/\bchiken\b/i, 'chicken'],
  [/\bpui\b/i, 'chicken'],
  [/\bshaorma\b/i, 'shawarma'],
  [/\bshaurma\b/i, 'shawarma'],
  [/\bcartofi\b/i, 'potato'],
  [/\bpb\b/i, 'peanut butter'],
  [/\bovaz\b/i, 'oats'],
  [/\bovăz\b/i, 'oats'],
  [/\biaurt\s+grecesc\b/i, 'greek yogurt'],
  [/\bfryed\b/i, 'fried'],
  [/\b(mix|mixed)\s+cheese\b/i, 'mixed cheese'],
  [/\bcheese\s+(cheddar|mozzarella|mozzarela).*/i, 'mixed cheese'],
  [/\bcheddar\s+mozzarela\b/i, 'mixed cheese'],
  [/\bdiced\s+meat\b/i, 'beef cooked'],
  [/\bmeat\s+cooked\b/i, 'beef cooked'],
  [/\bcooked\s+in\s+a\s+pan\b/i, 'cooked'],
  [/\bpan[\s-]?fried\b/i, 'fried'],
  [/\bair\s*fryed\b/i, 'air fried'],
  [/\bair\s*fryer\b/i, 'air fried'],
];

/** Strip diacritics for cross-locale matching (ovaz ↔ ovăz). */
export function stripDiacritics(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Meaningful tokens for matching (drops counts and filler words) */
export function mealQueryTokens(text) {
  const stop = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'with', 'and', 'or', 'to', 'for']);
  return stripDiacritics(String(text || ''))
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !/^\d+$/.test(t) && !stop.has(t));
}

export function normalizeMealSearchQuery(rawName, line = '') {
  let n = String(rawName || line || '').trim();

  n = n
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|grams|grame|kg)\b/gi, '')
    .replace(/(\d+(?:[.,]\d+)?)g\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(cup|cups|tbsp|tsp|oz)\b/gi, '')
    .replace(/\b(a bit of|a little|some|a spoon of|a handful|a pinch)\b/gi, '')
    .replace(/\b(made a wrap with|i ate|i had|cooked in a pan)\b/gi, '')
    .trim();

  // "2 tortillas" → keep food word, drop count prefix
  n = n.replace(
    /\b\d+\s*(small|medium|large)?\s*(tortillas?|wraps?|lipii?|eggs?|ouă?|bananas?|apples?|slices?)\b/gi,
    '$2',
  );
  n = n.replace(/^\d+\s+/, '').trim();
  n = n.replace(/\s+\d+(?:[.,]\d+)?$/, '').trim();

  for (const [re, alias] of QUERY_ALIASES) {
    if (re.test(n) || re.test(line)) n = n.replace(re, alias);
  }
  for (const [re, sing] of PLURAL_TO_SINGULAR) {
    n = n.replace(re, sing);
  }

  n = n.replace(/^[,:\-\s]+|[,:\-\s]+$/g, '').trim();
  return n || String(rawName || '').trim();
}

export function itemMatchesMealTokens(item, tokens) {
  if (!tokens.length) return false;
  const hay = stripDiacritics([
    item.name,
    item.displayName,
    ...(item.searchTerms || []),
    item.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase());

  return tokens.every((tok) => {
    const stem = tok.replace(/s$/, '');
    return hay.includes(tok) || hay.includes(stem) || hay.split(/\s+/).some((w) => w.startsWith(stem));
  });
}

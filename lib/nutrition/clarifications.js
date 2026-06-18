/**
 * Detect ambiguous ingredient queries — ask instead of guessing.
 */

const AMBIGUOUS_GROUPS = [
  {
    id: 'chicken',
    patterns: [/^chicken$/i, /^pui$/i, /^chicken\s*$/i],
    excludeIfLineHas: /\b(breast|thigh|drumstick|mince|wing|ground|piept|raw|cooked|grilled|fried|dry)\b/i,
    question: 'Which chicken?',
    options: [
      { label: 'Chicken Breast (Raw)', query: 'chicken breast raw', variant: 'raw' },
      { label: 'Chicken Breast (Cooked)', query: 'chicken breast cooked', variant: 'cooked' },
      { label: 'Chicken Thigh (Raw)', query: 'chicken thigh raw', variant: 'raw' },
      { label: 'Chicken Thigh (Cooked)', query: 'chicken thigh cooked', variant: 'cooked' },
      { label: 'Chicken Drumstick', query: 'chicken drumstick', variant: 'cooked' },
      { label: 'Chicken Mince', query: 'chicken mince', variant: 'raw' },
    ],
  },
  {
    id: 'rice',
    patterns: [/^rice$/i, /^orez$/i, /^white\s+rice$/i, /^brown\s+rice$/i],
    excludeIfLineHas: /\b(dry|cooked|raw|uscat|fiert|boiled|steamed|white|brown)\b/i,
    question: 'Rice — dry or cooked weight?',
    options: [
      { label: 'White Rice (Dry)', query: 'rice dry', variant: 'dry' },
      { label: 'White Rice (Cooked)', query: 'rice cooked', variant: 'cooked' },
    ],
  },
  {
    id: 'beef',
    patterns: [/^beef$/i, /^vită$/i, /^carne\s+vită$/i],
    excludeIfLineHas: /\b(lean|regular|mince|steak|ground|raw|cooked|grilled|fried|dry)\b/i,
    question: 'Which beef?',
    options: [
      { label: 'Beef Lean (Raw)', query: 'beef lean raw', variant: 'raw' },
      { label: 'Beef Lean (Cooked)', query: 'beef lean cooked', variant: 'cooked' },
      { label: 'Beef Regular (Raw)', query: 'beef regular raw', variant: 'raw' },
      { label: 'Beef Regular (Cooked)', query: 'beef regular cooked', variant: 'cooked' },
    ],
  },
  {
    id: 'pasta',
    patterns: [/^pasta$/i, /^paste$/i],
    excludeIfLineHas: /\b(dry|cooked|uscat|fiert|\d+\s*g)\b/i,
    question: 'Pasta — dry or cooked weight?',
    options: [
      { label: 'Pasta (Dry)', query: 'pasta dry', variant: 'dry' },
      { label: 'Pasta (Cooked)', query: 'pasta cooked', variant: 'cooked' },
    ],
  },
  {
    id: 'potato',
    patterns: [/^potato$/i, /^potatoes$/i, /^cartof/i],
    excludeIfLineHas: /\b(raw|baked|fried|boiled|cooked|\d+\s*g)\b/i,
    question: 'How was the potato prepared?',
    options: [
      { label: 'Potato (Raw)', query: 'potato raw', variant: 'raw' },
      { label: 'Potato (Boiled)', query: 'potato boiled', variant: 'cooked' },
      { label: 'Potato (Baked)', query: 'potato baked', variant: 'cooked' },
      { label: 'Potato (Fried)', query: 'potato fried', variant: 'cooked' },
    ],
  },
  {
    id: 'egg',
    patterns: [/^eggs?$/i, /^ou$/i, /^ouă$/i],
    excludeIfLineHas: /\b(\d+\s*g|\d+\s*(egg|ou))\b/i,
    question: 'Eggs — specify count or weight',
    options: [
      { label: '1 Egg (~50g)', query: '1 egg', variant: 'whole' },
      { label: '2 Eggs (~100g)', query: '2 eggs', variant: 'whole' },
    ],
  },
];

export function detectClarificationNeeded(foodName, line = '') {
  const q = foodName.toLowerCase().trim();
  const lineL = line.toLowerCase();
  const combined = `${lineL} ${q}`;

  for (const group of AMBIGUOUS_GROUPS) {
    const matchesPattern = group.patterns.some((p) => p.test(q));
    if (!matchesPattern) continue;
    if (group.excludeIfLineHas?.test(combined)) continue;

    return {
      groupId: group.id,
      question: group.question,
      options: group.options,
      originalQuery: foodName,
      rawLine: line,
    };
  }
  return null;
}

/** When search returns multiple variants of same base food without variant in query */
export function detectVariantAmbiguity(query, searchResults) {
  const q = query.toLowerCase().trim();
  if (/\b(raw|cooked|dry|fried|baked|boiled|grilled)\b/i.test(q)) return null;

  const byBase = new Map();
  for (const item of searchResults) {
    const base = item.name.toLowerCase();
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(item);
  }

  for (const [base, items] of byBase) {
    const variants = new Set(items.map((i) => i.variant).filter(Boolean));
    if (variants.size < 2) continue;
    if (!q.includes(base.split(' ')[0])) continue;

    return {
      groupId: `variant-${base}`,
      question: `Choose preparation for ${items[0].name}:`,
      options: items.map((item) => ({
        label: item.displayName || item.name,
        query: item.id,
        ingredientId: item.id,
        variant: item.variant,
      })),
      originalQuery: query,
    };
  }
  return null;
}

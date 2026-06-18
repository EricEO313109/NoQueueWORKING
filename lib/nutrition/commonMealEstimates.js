const SIZE_MULTIPLIERS = {
  small: 0.75,
  average: 1,
  medium: 1,
  large: 1.3,
};

const COMMON_MEALS = [
  {
    id: 'chicken-alfredo-pasta',
    name: 'Chicken Alfredo Pasta',
    confidence: 0.84,
    patterns: [/chicken\s+alfredo/, /alfredo.*chicken/],
    ingredients: [
      ['pasta-cooked', 180],
      ['chicken-breast-cooked', 120],
      ['alfredo-sauce', 80],
      ['parmesan', 15],
    ],
  },
  {
    id: 'alfredo-pasta',
    name: 'Alfredo Pasta',
    confidence: 0.8,
    patterns: [/alfredo/, /alfredo\s+pasta/],
    ingredients: [
      ['pasta-cooked', 220],
      ['alfredo-sauce', 100],
      ['parmesan', 15],
    ],
  },
  {
    id: 'carbonara',
    name: 'Carbonara',
    confidence: 0.82,
    patterns: [/carbonara/],
    ingredients: [
      ['pasta-cooked', 220],
      ['bacon', 45],
      ['egg-whole', 50],
      ['parmesan', 20],
      ['cream', 35],
    ],
  },
  {
    id: 'shawarma',
    name: 'Chicken Shawarma',
    confidence: 0.78,
    patterns: [/shawarma/, /shaorma/],
    ingredients: [
      ['tortilla-wrap', 70],
      ['chicken-thigh-cooked', 130],
      ['garlic-sauce', 35],
      ['potato-fried', 45],
      ['tomato', 35],
      ['lettuce', 25],
    ],
  },
  {
    id: 'pizza-slice',
    name: 'Pizza Slice',
    confidence: 0.8,
    countUnit: /slices?|pieces?/,
    baseCount: 1,
    patterns: [/pizza/],
    ingredients: [
      ['pizza-crust', 65],
      ['mozzarella', 35],
      ['tomato-sauce', 25],
      ['pepperoni', 15],
    ],
  },
  {
    id: 'cheeseburger',
    name: 'Cheeseburger',
    confidence: 0.78,
    patterns: [/cheese\s*burger/, /cheeseburger/, /burger/],
    ingredients: [
      ['burger-bun', 75],
      ['beef-patty-cooked', 110],
      ['cheddar-cheese', 25],
      ['ketchup', 15],
      ['lettuce', 15],
      ['tomato', 25],
    ],
  },
  {
    id: 'chicken-wrap',
    name: 'Chicken Wrap',
    confidence: 0.82,
    patterns: [/chicken\s+wrap/, /chicken\s+tortilla/],
    ingredients: [
      ['tortilla-wrap', 60],
      ['chicken-breast-cooked', 120],
      ['lettuce', 25],
      ['tomato', 30],
      ['garlic-sauce', 25],
    ],
  },
  {
    id: 'burrito',
    name: 'Burrito',
    confidence: 0.76,
    patterns: [/burrito/],
    ingredients: [
      ['tortilla-wrap', 80],
      ['rice-white-cooked', 120],
      ['black-beans-cooked', 80],
      ['beef-regular-cooked', 90],
      ['cheddar-cheese', 25],
      ['tomato-sauce', 30],
    ],
  },
  {
    id: 'tacos',
    name: 'Tacos',
    confidence: 0.76,
    countUnit: /tacos?/,
    baseCount: 2,
    patterns: [/tacos?/],
    ingredients: [
      ['tortilla-wrap', 80],
      ['beef-regular-cooked', 100],
      ['cheddar-cheese', 25],
      ['lettuce', 25],
      ['tomato', 35],
    ],
  },
  {
    id: 'lasagna',
    name: 'Lasagna',
    confidence: 0.82,
    patterns: [/lasagn[ae]/],
    ingredients: [['lasagna', 350]],
  },
  {
    id: 'fried-rice',
    name: 'Fried Rice',
    confidence: 0.8,
    patterns: [/fried\s+rice/],
    ingredients: [
      ['rice-white-cooked', 230],
      ['egg-whole', 50],
      ['chicken-breast-cooked', 80],
      ['olive-oil', 12],
      ['soy-sauce', 15],
    ],
  },
  {
    id: 'kebab',
    name: 'Kebab',
    confidence: 0.76,
    patterns: [/kebab/],
    ingredients: [
      ['tortilla-wrap', 70],
      ['chicken-thigh-cooked', 150],
      ['garlic-sauce', 35],
      ['lettuce', 30],
      ['tomato', 35],
    ],
  },
  {
    id: 'ramen',
    name: 'Ramen',
    confidence: 0.74,
    patterns: [/ramen/],
    ingredients: [
      ['noodles-cooked', 250],
      ['egg-whole', 50],
      ['chicken-thigh-cooked', 80],
      ['soy-sauce', 15],
    ],
  },
  {
    id: 'sushi',
    name: 'Sushi',
    confidence: 0.76,
    countUnit: /pieces?|rolls?/,
    baseCount: 8,
    patterns: [/sushi/],
    ingredients: [
      ['rice-white-cooked', 160],
      ['salmon-raw', 80],
      ['avocado', 35],
      ['soy-sauce', 10],
    ],
  },
  {
    id: 'steak',
    name: 'Steak',
    confidence: 0.84,
    patterns: [/steak/],
    ingredients: [
      ['beef-lean-cooked', 220],
      ['butter', 10],
    ],
  },
  {
    id: 'pancakes',
    name: 'Pancakes',
    confidence: 0.78,
    patterns: [/pancakes?/],
    ingredients: [
      ['pancakes', 180],
      ['honey', 20],
      ['butter', 10],
    ],
  },
  {
    id: 'cereal',
    name: 'Bowl of Cereal',
    confidence: 0.82,
    patterns: [/cereal/, /cornflakes?/],
    ingredients: [
      ['cereal', 45],
      ['milk-whole', 200],
    ],
  },
  {
    id: 'latte',
    name: 'Latte',
    confidence: 0.86,
    patterns: [/latte/],
    ingredients: [
      ['milk-whole', 260],
      ['espresso', 60],
    ],
  },
  {
    id: 'protein-shake',
    name: 'Protein Shake',
    confidence: 0.84,
    patterns: [/protein\s+shake/, /whey\s+shake/],
    ingredients: [
      ['protein-powder', 30],
      ['milk-whole', 250],
      ['banana', 80],
    ],
  },
];

const NATURAL_INGREDIENTS = [
  { id: 'oats-dry', grams: 50, patterns: [/\boats?\b/, /\boatmeal\b/, /\bporridge\b/] },
  { id: 'milk-whole', grams: 200, patterns: [/\bmilk\b/] },
  { id: 'banana', grams: 118, unit: /bananas?/, gramsPerUnit: 118, patterns: [/\bbananas?\b/] },
  { id: 'chicken-wing-cooked', grams: 30, unit: /wings?/, gramsPerUnit: 30, patterns: [/\bchicken wings?\b/, /\baripi(?: de pui)?\b/] },
  { id: 'chicken-breast-cooked', grams: 120, patterns: [/\bchicken\b/, /\bgrilled chicken\b/] },
  { id: 'pasta-cooked', grams: 180, patterns: [/\bpasta\b/, /\bspaghetti\b/] },
  { id: 'rice-white-cooked', grams: 180, patterns: [/\brice\b/] },
  { id: 'egg-whole', grams: 50, unit: /eggs?/, gramsPerUnit: 50, patterns: [/\beggs?\b/] },
  { id: 'mayonnaise', grams: 20, patterns: [/\bmayo\b/, /\bmayonnaise\b/] },
  { id: 'peanut-butter', grams: 32, patterns: [/\bpeanut butter\b/, /\bpb\b/] },
  { id: 'mixed-nuts', grams: 30, patterns: [/\bnuts?\b/, /\bmixed nuts\b/, /\bseeds?\b/] },
  { id: 'tortilla-wrap', grams: 50, patterns: [/\btortillas?\b/, /\bwraps?\b/] },
  { id: 'mixed-cheese', grams: 40, patterns: [/\bcheese\b/] },
  { id: 'greek-yogurt', grams: 170, patterns: [/\bgreek yogurt\b/, /\byogurt\b/] },
  { id: 'cereal', grams: 45, patterns: [/\bcereal\b/, /\bcornflakes?\b/] },
  { id: 'protein-powder', grams: 30, patterns: [/\bprotein powder\b/, /\bwhey\b/] },
  { id: 'beef-lean-cooked', grams: 150, patterns: [/\bbeef\b/, /\bsteak\b/] },
  { id: 'salmon-cooked', grams: 150, patterns: [/\bsalmon\b/] },
  { id: 'tuna-canned', grams: 120, patterns: [/\btuna\b/] },
  { id: 'bread-white', grams: 60, patterns: [/\bbread\b/, /\btoast\b/] },
  { id: 'avocado', grams: 70, patterns: [/\bavocado\b/] },
  { id: 'honey', grams: 20, patterns: [/\bhoney\b/] },
];

function round1(value) {
  return Math.round((value || 0) * 10) / 10;
}

function hasExplicitWeight(text) {
  return /\b\d+(?:[.,]\d+)?\s*(g|gram|grams|kg|ml|tbsp|tbs|tablespoons?|tsp|teaspoons?|cups?|oz)\b/i.test(text);
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\bchick(?:e|i)n\b/g, 'chicken')
    .replace(/\bchiken\b/g, 'chicken')
    .replace(/\bpui\b/g, 'chicken')
    .replace(/\bshaorma\b/g, 'shawarma')
    .replace(/\bshaurma\b/g, 'shawarma')
    .replace(/\bpotatoe?s?\b/g, 'potato')
    .replace(/\bcartofi\b/g, 'potato')
    .replace(/\bpb\b/g, 'peanut butter')
    .replace(/\bfryed\b/g, 'fried')
    .replace(/\b(homemade|home\s*made|plate\s+of|bowl\s+of|serving\s+of|order\s+of|one|a|an)\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSize(text, override) {
  if (override && SIZE_MULTIPLIERS[override]) return override;
  const line = text.toLowerCase();
  if (/\bsmall\b/.test(line)) return 'small';
  if (/\blarge|big\b/.test(line)) return 'large';
  return 'average';
}

function wordToNumber(value) {
  const map = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
  return map[value?.toLowerCase()] || Number(value);
}

function detectCount(text, template) {
  if (!template.countUnit) return 1;
  const match = text.match(new RegExp(`\\b(\\d+|one|two|three|four|five|six|seven|eight)\\s+(?:${template.countUnit.source})\\b`, 'i'));
  const count = wordToNumber(match?.[1]);
  if (!Number.isFinite(count) || count <= 0) return 1;
  return count / (template.baseCount || 1);
}

function findTemplate(text) {
  const line = normalize(text);
  return COMMON_MEALS.find((meal) => meal.patterns.some((pattern) => pattern.test(line)));
}

function findNaturalIngredients(text) {
  const line = normalize(text);
  const matches = [];
  for (const ingredient of NATURAL_INGREDIENTS) {
    if (ingredient.id === 'chicken-breast-cooked' && /\bwings?\b/.test(line)) continue;
    if (ingredient.patterns.some((pattern) => pattern.test(line))) {
      matches.push(ingredient);
    }
  }
  return matches;
}

function gramsForNaturalIngredient(match, text) {
  const line = String(text || '').toLowerCase();
  const bare = line.match(/^\s*(\d+(?:[.,]\d+)?)\s+[^\d\s]/)
    || line.match(/[^\d\s]\s+(\d+(?:[.,]\d+)?)\s*$/);
  if (bare) {
    const amount = Number(bare[1].replace(',', '.'));
    if (Number.isFinite(amount) && amount >= 10) return amount;
  }
  if (match.unit && match.gramsPerUnit && match.unit.test(line)) {
    const count = wordToNumber(line.match(/\b(\d+|one|two|three|four|five|six|seven|eight)\b/i)?.[1]) || 1;
    return Math.round(count * match.gramsPerUnit);
  }
  if (/\bhandful\b/.test(line)) return 30;
  if (/\bfist[-\s]?sized\b/.test(line)) return 175;
  if (/\bsplash\b/.test(line)) return match.id.includes('oil') ? 14 : 15;
  if (/\bdrop\b/.test(line)) return match.id.includes('oil') ? 5 : 5;
  if (/\bscoop\b/.test(line)) return match.id === 'protein-powder' ? 30 : match.grams;
  if (/\bspoonful\b|\bspoon\b/.test(line)) {
    if (match.id === 'peanut-butter') return 16;
    if (match.id.includes('oil')) return 14;
    return 15;
  }
  return match.grams;
}

function naturalMealName(matches) {
  const names = matches
    .slice(0, 4)
    .map((match) => match.id.split('-')[0])
    .filter(Boolean);
  if (!names.length) return 'Estimated Meal';
  return names.map((name) => name[0].toUpperCase() + name.slice(1)).join(' ');
}

function preparationLabel(text) {
  const line = normalize(text);
  if (/\bair\s*fried\b/.test(line)) return 'Air Fried';
  if (/\bgrilled\b/.test(line)) return 'Grilled';
  if (/\bbaked\b/.test(line)) return 'Baked';
  if (/\bfried\b/.test(line)) return 'Fried';
  if (/\bboiled\b/.test(line)) return 'Boiled';
  if (/\braw\b/.test(line)) return 'Raw';
  return null;
}

function displayNameForEstimate(ingredient, rawLine) {
  const prep = preparationLabel(rawLine);
  if (/\bwings?\b/.test(normalize(rawLine))) {
    return prep ? `Chicken Wings (${prep})` : 'Chicken Wings';
  }
  const base = ingredient.displayName || ingredient.name;
  return prep ? `${base} (${prep})` : base;
}

async function buildItem([ingredientId, baseGrams], deps, multiplier, rawLine, confidence) {
  const ingredient = await deps.getIngredientById(ingredientId);
  if (!ingredient) {
    return {
      name: ingredientId,
      weight: Math.round(baseGrams * multiplier),
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      matched: false,
      estimated: true,
      rawLine,
      error: 'Missing ingredient in verified database.',
    };
  }

  const grams = Math.round(baseGrams * multiplier);
  const f = grams / 100;
  return {
    name: displayNameForEstimate(ingredient, rawLine),
    ingredientId: ingredient.id,
    variant: ingredient.variant,
    weight: grams,
    grams,
    calories: Math.round((ingredient.per100g?.calories || 0) * f),
    protein: round1((ingredient.per100g?.protein || 0) * f),
    carbs: round1((ingredient.per100g?.carbs || 0) * f),
    fat: round1((ingredient.per100g?.fat || 0) * f),
    per100g: ingredient.per100g,
    matched: true,
    estimated: true,
    confidence,
    nutritionSource: ingredient.source === 'seed' ? 'verified-db' : ingredient.source,
    accuracyScore: Math.round(confidence * 100),
    accuracyLabel: 'Estimated Meal',
    rawLine,
  };
}

export function shouldTryCommonMealEstimate(text) {
  const cleaned = String(text || '').trim();
  if (!cleaned || hasExplicitWeight(cleaned)) return false;
  if (cleaned.includes('\n') || cleaned.includes(',')) return false;
  if (/\brice\s+cakes?\b/i.test(cleaned)) return false;
  return !!findTemplate(cleaned) || findNaturalIngredients(cleaned).length > 0;
}

export async function estimateCommonMeal(text, deps, { portion = 'auto' } = {}) {
  if (!shouldTryCommonMealEstimate(text)) return null;
  const template = findTemplate(text);
  const size = detectSize(text, portion === 'auto' ? null : portion);
  const naturalMatches = template ? [] : findNaturalIngredients(text);
  if (!template && !naturalMatches.length) return null;

  const multiplier = SIZE_MULTIPLIERS[size] * (template ? detectCount(text, template) : 1);
  const baseConfidence = template?.confidence || (naturalMatches.length > 1 ? 0.76 : 0.68);
  const confidence = Math.max(0.55, Math.min(0.92, baseConfidence - (size === 'average' ? 0 : 0.03)));
  const ingredientEntries = template?.ingredients || naturalMatches.map((match) => [
    match.id,
    gramsForNaturalIngredient(match, text),
  ]);
  const items = await Promise.all(
    ingredientEntries.map((ingredient) => buildItem(ingredient, deps, multiplier, `Estimated from: ${text}`, confidence)),
  );
  const totals = items.reduce(
    (sum, item) => ({
      totalCalories: sum.totalCalories + (item.calories || 0),
      totalProtein: round1(sum.totalProtein + (item.protein || 0)),
      totalCarbs: round1(sum.totalCarbs + (item.carbs || 0)),
      totalFat: round1(sum.totalFat + (item.fat || 0)),
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
  );

  return {
    mode: 'estimated-meal',
    estimatedMeal: true,
    mealName: template?.name || naturalMealName(naturalMatches),
    portionSize: size,
    confidence: round1(confidence),
    accuracyScore: Math.round(confidence * 100),
    lowConfidenceNote: confidence < 0.82 ? 'This is an estimate based on a typical serving.' : null,
    items,
    ...totals,
    clarifications: [],
    needsClarification: false,
    pendingCount: 0,
    lineCount: 1,
  };
}

import { FOOD_DB, foodToPlateItem } from './foodDatabase';

const RULES = [
  { pattern: /(\d+)\s*ou/i, foodId: 'egg', mult: (n) => n },
  { pattern: /ou/i, foodId: 'egg', mult: () => 1 },
  { pattern: /banan[aă]/i, foodId: 'banana', mult: () => 1 },
  { pattern: /pui|piept/i, foodId: 'chicken-breast', mult: () => 1 },
  { pattern: /orez/i, foodId: 'rice-white', mult: () => 1.5 },
  { pattern: /paste/i, foodId: 'pasta', mult: () => 1.5 },
  { pattern: /iaurt/i, foodId: 'greek-yogurt', mult: () => 1 },
  { pattern: /pâine|pain[eă]/i, foodId: 'bread-whole', mult: () => 2 },
  { pattern: /somon/i, foodId: 'salmon', mult: () => 1 },
  { pattern: /salat[aă]/i, foodId: 'salad', mult: () => 1.5 },
  { pattern: /cafea/i, foodId: 'coffee', mult: () => 1 },
  { pattern: /protein[aă]|whey/i, foodId: 'protein-whey', mult: () => 1 },
  { pattern: /avocado/i, foodId: 'avocado', mult: () => 0.5 },
];

/** Parse meal description into plate items (MacroFactor Describe-style) */
export function parseMealDescription(text) {
  const lower = text.toLowerCase();
  const found = [];
  const used = new Set();

  for (const rule of RULES) {
    if (!rule.pattern.test(lower)) continue;
    const food = FOOD_DB.find((f) => f.id === rule.foodId);
    if (!food || used.has(food.id)) continue;
    const match = lower.match(rule.pattern);
    const n = match?.[1] ? parseInt(match[1], 10) : 1;
    found.push(foodToPlateItem(food, rule.mult(n)));
    used.add(food.id);
  }

  if (!found.length && text.trim()) {
    found.push({
      tempId: `custom-${Date.now()}`,
      name: text.trim().slice(0, 60),
      calories: 300,
      protein: 15,
      carbs: 30,
      fat: 12,
      serving: 'estimate',
      source: 'describe',
    });
  }

  return found;
}

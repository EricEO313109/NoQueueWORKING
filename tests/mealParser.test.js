import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseMealText, validateMealMacroArrayResponse } from '../lib/server/mealParser.js';
import { estimateGramsFromPhrase, extractFoodNameFromLine } from '../lib/nutrition/quantityParser.js';
import { resolveSearchQuery } from '../lib/nutrition/lineIntent.js';

describe('quantityParser', () => {
  it('parses 1 small tortilla as ~45-55g not 1g', () => {
    const line = '1 small tortilla';
    const name = extractFoodNameFromLine(line);
    const g = estimateGramsFromPhrase(line, name);
    assert.ok(g >= 40 && g <= 60, `expected 40-60g got ${g}`);
  });

  it('parses explicit 200g beef', () => {
    const g = estimateGramsFromPhrase('200g cooked beef', 'cooked beef');
    assert.equal(g, 200);
  });

  it('mixed cheese defaults to ~40g not 100g', () => {
    const g = estimateGramsFromPhrase('mixed cheese', 'mixed cheese');
    assert.ok(g >= 30 && g <= 55, `expected 30-55g got ${g}`);
  });

  it('converts peanut butter spoons as units', () => {
    const tbspLine = '2 tbsp peanut butter';
    const tbspName = extractFoodNameFromLine(tbspLine);
    const tbspGrams = estimateGramsFromPhrase(tbspLine, tbspName);
    assert.equal(tbspName, 'peanut butter');
    assert.equal(tbspGrams, 32);

    const spoonLine = 'a spoon of peanut butter';
    const spoonName = extractFoodNameFromLine(spoonLine);
    const spoonGrams = estimateGramsFromPhrase(spoonLine, spoonName);
    assert.equal(spoonName, 'peanut butter');
    assert.equal(spoonGrams, 16);
  });

  it('parses concatenated metric liquid volumes', () => {
    const compactLine = '250ml milk';
    const compactName = extractFoodNameFromLine(compactLine);
    const compactGrams = estimateGramsFromPhrase(compactLine, compactName);
    assert.equal(compactName, 'milk');
    assert.ok(compactGrams >= 250 && compactGrams <= 260, `250ml milk got ${compactGrams}g`);

    const spacedLine = '250 ml milk';
    const spacedName = extractFoodNameFromLine(spacedLine);
    const spacedGrams = estimateGramsFromPhrase(spacedLine, spacedName);
    assert.equal(spacedName, 'milk');
    assert.equal(spacedGrams, compactGrams);
  });

  it('maps colloquial handful portions without dropping food names', () => {
    const line = 'a handful of nuts';
    const name = extractFoodNameFromLine(line);
    const grams = estimateGramsFromPhrase(line, name);
    assert.equal(name, 'nuts');
    assert.equal(grams, 30);
  });

  it('treats bare liquid counts as milliliters not grams', () => {
    const line = '300 milk';
    const name = extractFoodNameFromLine(line);
    const grams = estimateGramsFromPhrase(line, name);
    assert.equal(name, 'milk');
    assert.ok(grams >= 300 && grams <= 315, `300 milk should be ~309g, got ${grams}`);
  });
});

describe('lineIntent', () => {
  it('resolves dry rice query', () => {
    assert.equal(resolveSearchQuery('rice', '100g dry rice'), 'rice dry');
  });

  it('resolves cooked beef without duplicating cooked', () => {
    const q = resolveSearchQuery('cooked beef', '200g cooked beef');
    assert.equal(q, 'cooked beef');
    assert.ok(!/\bcooked\b.*\bcooked\b/i.test(q));
  });

  it('does not over-trigger chicken on breast', () => {
    const q = resolveSearchQuery('chicken breast', '100g chicken breast');
    assert.ok(q.includes('chicken breast'));
  });
});

describe('parseMealText — beef cheese tortilla', () => {
  it('carbs stay under 50g for protein-heavy meal', async () => {
    const result = await parseMealText(`200g cooked beef
mixed cheese
1 small tortilla`);

    assert.ok(result.items.every((i) => i.matched), 'all ingredients should match');
    assert.ok(result.totalCarbs < 50, `carbs ${result.totalCarbs}g should be < 50g`);
    assert.ok(result.totalProtein > 40);
    assert.ok(result.accuracyScore >= 90, `accuracy ${result.accuracyScore}`);
  });
});

describe('parseMealText — wrap meal (user report)', () => {
  it('matches tortilla not cream of wheat; parses meat and cheese', async () => {
    const result = await parseMealText(
      '150g diced meat cooked in a pan ,2 tortillas,40g mix cheese cheddar mozzarela',
    );

    const tortilla = result.items.find((i) => i.rawLine?.includes('tortilla') || i.name?.toLowerCase().includes('tortilla'));
    const meat = result.items.find((i) => i.rawLine?.includes('meat') || i.name?.toLowerCase().includes('beef'));
    const cheese = result.items.find((i) => i.rawLine?.includes('cheese') || i.name?.toLowerCase().includes('cheese'));

    assert.ok(tortilla?.matched, 'tortilla should match seed');
    assert.ok(tortilla?.pieceCount === 2, `expected 2 pieces got ${tortilla?.pieceCount}`);
    assert.ok(tortilla?.name?.includes('2×'), `name should show 2× got ${tortilla?.name}`);
    assert.ok(!tortilla?.name?.toLowerCase().includes('cream of wheat'));
    assert.ok(tortilla.weight >= 90 && tortilla.weight <= 110, `2 tortillas ~100g got ${tortilla?.weight}`);
    assert.ok(meat?.matched, 'diced meat should match beef');
    assert.ok(cheese?.matched, 'mix cheese should match');
    assert.ok(!result.needsClarification, 'should not ask for cream of wheat');
  });
});

describe('parseMealText — classic chicken rice meal', () => {
  it('parses chicken breast + dry rice + mayo + tortilla accurately', async () => {
    const result = await parseMealText(`100g chicken breast
100g dry rice
20g mayonnaise
1 small tortilla`);

    assert.equal(result.items.length, 4);
    assert.ok(result.items.every((i) => i.matched), JSON.stringify(result.items.map((i) => i.name)));
    assert.ok(!result.needsClarification, 'specific lines should not need clarification');

    const chicken = result.items.find((i) => i.name.toLowerCase().includes('chicken'));
    const rice = result.items.find((i) => i.name.toLowerCase().includes('rice'));
    const mayo = result.items.find((i) => i.name.toLowerCase().includes('mayo'));
    const tortilla = result.items.find((i) => i.name.toLowerCase().includes('tortilla'));

    assert.ok(chicken && chicken.protein >= 25, `chicken protein ${chicken?.protein}`);
    assert.ok(rice && rice.carbs >= 70 && rice.carbs <= 85, `dry rice carbs ${rice?.carbs}`);
    assert.ok(mayo && mayo.fat >= 12, `mayo fat ${mayo?.fat}`);
    assert.ok(tortilla && tortilla.carbs >= 12 && tortilla.carbs <= 22, `tortilla carbs ${tortilla?.carbs}`);

    assert.ok(result.totalCalories >= 700 && result.totalCalories <= 1100);
    assert.ok(result.accuracyScore >= 90);
  });
});

describe('parseMealText — natural meal estimates', () => {
  it('estimates chicken alfredo pasta from a natural description', async () => {
    const result = await parseMealText('1 plate chicken alfredo pasta');

    assert.equal(result.mode, 'estimated-meal');
    assert.equal(result.estimatedMeal, true);
    assert.ok(result.mealName.toLowerCase().includes('alfredo'));
    assert.ok(result.items.length >= 4);
    assert.ok(result.items.every((i) => i.matched), JSON.stringify(result.items));
    assert.ok(result.items.some((i) => i.name.toLowerCase().includes('chicken')));
    assert.ok(result.totalCalories >= 500 && result.totalCalories <= 900, `calories ${result.totalCalories}`);
    assert.ok(result.totalProtein >= 35, `protein ${result.totalProtein}`);
    assert.ok(result.confidence >= 0.8);
  });

  it('applies small portion scaling for shawarma', async () => {
    const average = await parseMealText('shawarma');
    const small = await parseMealText('small shawarma');

    assert.equal(small.estimatedMeal, true);
    assert.equal(small.portionSize, 'small');
    assert.ok(small.totalCalories < average.totalCalories);
    assert.ok(small.lowConfidenceNote);
  });

  it('handles counted pizza slices', async () => {
    const result = await parseMealText('2 slices of pizza');

    assert.equal(result.estimatedMeal, true);
    assert.ok(result.mealName.toLowerCase().includes('pizza'));
    assert.ok(result.totalCalories >= 450 && result.totalCalories <= 800, `calories ${result.totalCalories}`);
    assert.ok(result.items.some((i) => i.name.toLowerCase().includes('mozzarella')));
  });

  it('keeps precise ingredient logging unchanged', async () => {
    const result = await parseMealText(`100g chicken breast
100g dry rice
20g mayonnaise`);

    assert.notEqual(result.mode, 'estimated-meal');
    assert.equal(result.items.length, 3);
    assert.ok(result.items.every((i) => !i.estimated));
  });

  it('estimates recognizable natural ingredient phrases without weights', async () => {
    const result = await parseMealText('oats milk banana');

    assert.equal(result.mode, 'estimated-meal');
    assert.equal(result.estimatedMeal, true);
    assert.ok(result.items.some((i) => i.name.toLowerCase().includes('oats')));
    assert.ok(result.items.some((i) => i.name.toLowerCase().includes('milk')));
    assert.ok(result.items.some((i) => i.name.toLowerCase().includes('banana')));
    assert.ok(result.totalCalories >= 350 && result.totalCalories <= 600, `calories ${result.totalCalories}`);
    assert.ok(result.confidence >= 0.7);
  });

  it('estimates chicken pasta instead of matching an unrelated restaurant item', async () => {
    const result = await parseMealText('chicken pasta');

    assert.equal(result.mode, 'estimated-meal');
    assert.ok(result.items.some((i) => i.name.toLowerCase().includes('chicken breast')));
    assert.ok(result.items.some((i) => i.name.toLowerCase().includes('pasta')));
    assert.ok(!result.items.some((i) => i.name.toLowerCase().includes('olive garden')));
  });

  it('parses concatenated ml and handful portions in a messy sentence', async () => {
    const result = await parseMealText('250ml milk and a handful of nuts');

    assert.notEqual(result.mode, 'estimated-meal');
    assert.equal(result.items.length, 2);
    const milk = result.items.find((i) => i.name.toLowerCase().includes('milk'));
    const nuts = result.items.find((i) => i.name.toLowerCase().includes('nuts'));
    assert.ok(milk?.matched, JSON.stringify(result.items));
    assert.ok(nuts?.matched, JSON.stringify(result.items));
    assert.ok(milk.weight >= 250 && milk.weight <= 260, `milk weight ${milk?.weight}`);
    assert.equal(nuts.weight, 30);
  });

  it('uses colloquial baselines for splash and fist-sized portions', async () => {
    const splash = await parseMealText('a splash of milk');
    const milk = splash.items.find((i) => i.name.toLowerCase().includes('milk'));
    assert.ok(milk?.matched, JSON.stringify(splash.items));
    assert.ok(milk.weight >= 14 && milk.weight <= 16, `splash milk weight ${milk?.weight}`);

    const fist = await parseMealText('a fist-sized portion of rice');
    const rice = fist.items.find((i) => i.name.toLowerCase().includes('rice'));
    assert.ok(rice?.matched, JSON.stringify(fist.items));
    assert.ok(rice.weight >= 150 && rice.weight <= 200, `fist rice weight ${rice?.weight}`);
  });

  it('falls back to AI estimated macros for unmatched common foods', async () => {
    const result = await parseMealText(`1 banana
4 rice cakes`);

    const banana = result.items.find((i) => i.name.toLowerCase().includes('banana'));
    const riceCakes = result.items.find((i) => i.name.toLowerCase().includes('rice cakes'));

    assert.ok(banana?.matched, JSON.stringify(result.items));
    assert.ok(riceCakes?.matched, JSON.stringify(result.items));
    assert.equal(riceCakes.aiEstimated, true);
    assert.equal(riceCakes.calories, 140);
    assert.equal(riceCakes.weight, 36);
    assert.ok(result.totalCalories >= 250 && result.totalCalories <= 270, `total ${result.totalCalories}`);
    assert.equal(result.needsClarification, false);
  });

  it('uses resilient fallback profiles for Romanian and fitness foods', async () => {
    const samples = [
      ['a handful of almonds', 'almonds'],
      ['3 thick slices of sourdough', 'sourdough'],
      ['2 mici', 'mici'],
      ['ciorbă rădăuțeană', 'rădăuțeană'],
    ];

    for (const [text, expected] of samples) {
      const result = await parseMealText(text);
      assert.ok(result.totalCalories > 0, `${text} should have calories`);
      assert.ok(result.items.some((i) => i.name.toLowerCase().includes(expected) && i.matched), JSON.stringify(result.items));
      assert.equal(result.needsClarification, false, `${text} should not need clarification`);
    }
  });

  it('autocorrects messy chicken wing logs and converts naked counts to grams', async () => {
    const result = await parseMealText('8 chiken wings air fryed');
    const wings = result.items.find((item) => item.name.toLowerCase().includes('wing'));

    assert.ok(wings?.matched, JSON.stringify(result.items));
    assert.match(wings.name, /Chicken Wings/i);
    assert.equal(wings.weight, 240);
    assert.ok(wings.calories > 400, `calories ${wings.calories}`);
    assert.equal(result.needsClarification, false);
    assert.equal(result.items.some((item) => item.name.toLowerCase().includes('oil')), false);
  });

  it('treats naked egg counts as pieces instead of grams', async () => {
    const result = await parseMealText('2 eggs');
    const eggs = result.items.find((item) => item.name.toLowerCase().includes('egg'));

    assert.ok(eggs?.matched, JSON.stringify(result.items));
    assert.equal(eggs.weight, 100);
    assert.ok(result.totalCalories >= 130 && result.totalCalories <= 170, `total ${result.totalCalories}`);
  });

  it('adds an oil offset for fried-in-oil preparation but not air fried', async () => {
    const fried = await parseMealText('8 chicken wings fried in oil');
    const airFried = await parseMealText('8 chicken wings air fried');

    assert.ok(fried.items.some((item) => item.name === 'Cooking Oil (Fried Offset)'), JSON.stringify(fried.items));
    assert.equal(airFried.items.some((item) => item.name === 'Cooking Oil (Fried Offset)'), false);
    assert.ok(fried.totalFat > airFried.totalFat, `${fried.totalFat} vs ${airFried.totalFat}`);
  });

  it('salvages malformed LLM JSON array wrappers', () => {
    const items = validateMealMacroArrayResponse('```json\n[{"name":"Chicken Wings (Air Fried)","weight_g":240,"calories":487,"protein":51,"carbs":0,"fat":33}]\n```');

    assert.equal(items.length, 1);
    assert.equal(items[0].name, 'Chicken Wings (Air Fried)');
    assert.equal(items[0].weight, 240);
    assert.equal(items[0].matched, true);
  });
});

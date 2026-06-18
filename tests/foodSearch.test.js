import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { searchIngredients } from '../lib/server/ingredientDb.js';
import { normalizeMealSearchQuery } from '../lib/nutrition/foodQuery.js';

describe('food search normalization', () => {
  it('expands pb shorthand to peanut butter', () => {
    assert.equal(normalizeMealSearchQuery('pb'), 'peanut butter');
  });

  it('matches pb against seed peanut butter', async () => {
    const results = await searchIngredients('pb', { limit: 10 });
    assert.ok(results.some((item) => item.id === 'peanut-butter'), JSON.stringify(results.map((r) => r.id)));
  });

  it('matches ovaz without diacritics to oats', async () => {
    const results = await searchIngredients('ovaz', { limit: 10 });
    assert.ok(results.some((item) => item.id?.includes('oats')), JSON.stringify(results.map((r) => r.id)));
  });

  it('finds lidl oats in localized catalog', async () => {
    const results = await searchIngredients('lidl oats', { limit: 10 });
    assert.ok(
      results.some((item) => item.id?.includes('lidl-crownfield-oats')),
      JSON.stringify(results.map((r) => r.id)),
    );
  });
});

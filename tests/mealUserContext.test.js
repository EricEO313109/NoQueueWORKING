import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  findUserContextMatch,
  findCorrectionForQuery,
  buildItemFromUserContext,
  resolveLineWithUserContext,
} from '../lib/nutrition/mealUserContext.js';

describe('mealUserContext', () => {
  const frequentFoods = [{
    name: 'Crownfield Oats',
    brand: 'Lidl',
    per100g: { calories: 370, protein: 13, carbs: 58, fat: 7 },
    use_count: 4,
  }];

  const userCorrections = [{
    matchName: 'oats',
    matchKey: 'oats',
    name: 'My Oats',
    per100g: { calories: 380, protein: 14, carbs: 60, fat: 6 },
  }];

  it('prioritizes frequent food brand match over generic fallback', () => {
    const match = findUserContextMatch('crownfield oats', '40g crownfield oats', { frequentFoods });
    assert.ok(match);
    assert.ok(match.score >= 120);
    const item = buildItemFromUserContext(match, 'crownfield oats', '40g crownfield oats', 40);
    assert.equal(item.nutritionSource, 'local-memory');
    assert.equal(item.calories, Math.round(370 * 0.4));
  });

  it('applies saved name correction before context search', () => {
    const item = resolveLineWithUserContext('50g oats', {
      __userContext: { frequentFoods, userCorrections },
    });
    assert.equal(item.name, 'My Oats');
    assert.equal(item.nutritionSource, 'user_verified');
    assert.equal(item.calories, Math.round(380 * 0.5));
  });

  it('finds fuzzy correction by query token', () => {
    const hit = findCorrectionForQuery('rolled oats', userCorrections);
    assert.ok(hit);
    assert.equal(hit.name, 'My Oats');
  });
});

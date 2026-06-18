import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCalorieConsistency,
  caloriesFromMacros,
  validateCategoryMacros,
  accuracyScoreForSource,
} from '../lib/nutrition/accuracyEngine.js';
import { detectClarificationNeeded } from '../lib/nutrition/clarifications.js';

describe('accuracyEngine', () => {
  it('calculates calories from macros', () => {
    assert.equal(caloriesFromMacros({ protein: 40, carbs: 40, fat: 20 }), 500);
  });

  it('flags 900 kcal vs 500 expected', () => {
    const r = validateCalorieConsistency({ calories: 900, protein: 40, carbs: 40, fat: 20 });
    assert.equal(r.consistent, false);
    assert.ok(r.diffPct > 10);
  });

  it('USDA source scores 98%+', () => {
    const a = accuracyScoreForSource('usda', 1);
    assert.ok(a.score >= 98);
  });

  it('caps protein food carbs', () => {
    const r = validateCategoryMacros({ calories: 250, protein: 52, carbs: 110, fat: 15 }, 'protein');
    assert.ok(r.adjusted.carbs <= 5);
  });
});

describe('clarifications', () => {
  it('asks for chicken variant', () => {
    const c = detectClarificationNeeded('chicken', 'chicken');
    assert.ok(c);
    assert.ok(c.options.length >= 4);
  });

  it('does not ask when cooked specified', () => {
    assert.equal(detectClarificationNeeded('cooked chicken breast', '200g cooked chicken breast'), null);
  });

  it('asks dry vs cooked for rice', () => {
    const c = detectClarificationNeeded('rice', 'rice');
    assert.equal(c.groupId, 'rice');
  });
});

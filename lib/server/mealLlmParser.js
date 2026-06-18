import { MEAL_DESCRIPTION_SYSTEM_PROMPT } from '../nutrition/mealParsingInstructions.js';
import { validateMealMacroArrayResponse } from './mealParser.js';
import { withCookingOffsets } from '../nutrition/cookingOffsets.js';
import { splitMealText } from '../nutrition/describeLine.js';

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
}

function sumTotals(items) {
  return items.reduce(
    (acc, it) => ({
      totalCalories: acc.totalCalories + (it.calories || 0),
      totalProtein: Math.round((acc.totalProtein + (it.protein || 0)) * 10) / 10,
      totalCarbs: Math.round((acc.totalCarbs + (it.carbs || 0)) * 10) / 10,
      totalFat: Math.round((acc.totalFat + (it.fat || 0)) * 10) / 10,
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
  );
}

export async function parseMealWithLlm(text, deps = {}) {
  const apiKey = getOpenAiKey();
  if (!apiKey) return null;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MEAL_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: MEAL_DESCRIPTION_SYSTEM_PROMPT },
        { role: 'user', content: String(text || '').trim().slice(0, 1500) },
      ],
      temperature: 0,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[meal-llm] failed', res.status, err.slice(0, 160));
    return null;
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    const items = validateMealMacroArrayResponse(raw).map((item) => ({
      ...item,
      rawLine: text,
      parserSource: 'llm',
    }));
    const lines = splitMealText(text);
    const base = {
      items,
      ...sumTotals(items),
      estimatedMeal: true,
      confidence: 0.82,
      accuracyScore: 82,
      parserSource: 'llm',
    };
    return withCookingOffsets(base, lines, deps);
  } catch (error) {
    console.error('[meal-llm] invalid payload', error?.message || error);
    return null;
  }
}

export function shouldInvokeLlmFallback(result) {
  if (!result?.items?.length) return true;
  const weak = result.items.filter((item) =>
    !item.matched
    || item.needsClarification
    || (item.aiEstimated && (item.accuracyScore || 0) < 75)
    || item.nutritionSource === 'AI Estimated');
  return weak.length > 0 || (result.accuracyScore || 0) < 72;
}

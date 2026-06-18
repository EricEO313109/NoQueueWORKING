/** USDA FoodData Central — https://fdc.nal.usda.gov/api-guide.html */

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

function nutrient(nutrients, id) {
  const n = nutrients?.find((x) => x.nutrientId === id || x.nutrient?.id === id);
  return n?.value ?? n?.amount ?? 0;
}

function fdcToIngredient(food) {
  const nutrients = food.foodNutrients || [];
  const per100g = {
    calories: Math.round(nutrient(nutrients, 1008) || nutrient(nutrients, 2047) || 0),
    protein: Math.round((nutrient(nutrients, 1003) || 0) * 10) / 10,
    carbs: Math.round((nutrient(nutrients, 1005) || 0) * 10) / 10,
    fat: Math.round((nutrient(nutrients, 1004) || 0) * 10) / 10,
  };
  if (!per100g.calories && !per100g.protein) return null;

  const name = food.description || food.lowercaseDescription || 'Food';
  const id = `usda-${food.fdcId}`;
  return {
    id,
    name: name.split(',')[0].trim(),
    displayName: name.slice(0, 80),
    variant: '',
    serving: '100g',
    per100g,
    defaultGrams: 100,
    source: 'usda',
    confidence: 0.85,
    searchTerms: [name.toLowerCase()],
  };
}

export async function searchUsdaFoods(query, limit = 10) {
  const apiKey = process.env.USDA_API_KEY || process.env.FDC_API_KEY || 'DEMO_KEY';
  const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=${limit}&dataType=Foundation,SR%20Legacy&api_key=${apiKey}`;

  const res = await fetch(url, { headers: { 'User-Agent': 'NutriScan/1.0' } });
  if (!res.ok) return [];

  const json = await res.json();
  return (json.foods || [])
    .map(fdcToIngredient)
    .filter(Boolean);
}

/** @typedef {{ id: string, name: string, brand?: string, calories: number, protein: number, carbs: number, fat: number, serving: string }} FoodItem */

/** @type {FoodItem[]} */
export const FOOD_DB = [
  { id: 'egg', name: 'Ou', calories: 78, protein: 6, carbs: 0.6, fat: 5, serving: '1 ou mare' },
  { id: 'egg-white', name: 'Albuș ou', calories: 17, protein: 3.6, carbs: 0.2, fat: 0, serving: '1 ou' },
  { id: 'oats', name: 'Fulgi de ovăz', calories: 150, protein: 5, carbs: 27, fat: 3, serving: '40g' },
  { id: 'banana', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, serving: '1 medie' },
  { id: 'apple', name: 'Măr', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving: '1 mediu' },
  { id: 'bread-whole', name: 'Pâine integrală', brand: 'Generic', calories: 80, protein: 4, carbs: 14, fat: 1, serving: '1 felie' },
  { id: 'chicken-breast', name: 'Piept de pui', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  { id: 'chicken-thigh', name: 'Pulpe pui fără piele', calories: 209, protein: 26, carbs: 0, fat: 11, serving: '100g' },
  { id: 'salmon', name: 'Somon', calories: 208, protein: 20, carbs: 0, fat: 13, serving: '100g' },
  { id: 'tuna', name: 'Ton în apă', calories: 116, protein: 26, carbs: 0, fat: 1, serving: '100g' },
  { id: 'rice-white', name: 'Orez alb fiert', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: '100g' },
  { id: 'rice-brown', name: 'Orez brun fiert', calories: 112, protein: 2.6, carbs: 24, fat: 0.9, serving: '100g' },
  { id: 'pasta', name: 'Paste fierte', calories: 157, protein: 5.8, carbs: 31, fat: 0.9, serving: '100g' },
  { id: 'potato', name: 'Cartofi fierți', calories: 87, protein: 1.9, carbs: 20, fat: 0.1, serving: '100g' },
  { id: 'sweet-potato', name: 'Cartof dulce', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: '100g' },
  { id: 'broccoli', name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, serving: '100g' },
  { id: 'salad', name: 'Salată verde', calories: 20, protein: 2, carbs: 3, fat: 0.2, serving: '100g' },
  { id: 'avocado', name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, serving: '100g' },
  { id: 'olive-oil', name: 'Ulei măsline', calories: 119, protein: 0, carbs: 0, fat: 13.5, serving: '1 lingură' },
  { id: 'peanut-butter', name: 'Unt de arahide', calories: 94, protein: 4, carbs: 3, fat: 8, serving: '1 lingură' },
  { id: 'greek-yogurt', name: 'Iaurt grecesc 2%', brand: 'Generic', calories: 130, protein: 15, carbs: 8, fat: 4, serving: '170g' },
  { id: 'cottage', name: 'Brânză cottage', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, serving: '100g' },
  { id: 'milk-skim', name: 'Lapte degresat', calories: 83, protein: 8, carbs: 12, fat: 0.2, serving: '240ml' },
  { id: 'protein-whey', name: 'Proteină whey', brand: 'Scoop', calories: 120, protein: 24, carbs: 3, fat: 1.5, serving: '1 scoop' },
  { id: 'beef-lean', name: 'Vită slabă', calories: 250, protein: 26, carbs: 0, fat: 15, serving: '100g' },
  { id: 'turkey', name: 'Curcan', calories: 135, protein: 30, carbs: 0, fat: 1, serving: '100g' },
  { id: 'cheese-cheddar', name: 'Cheddar', calories: 113, protein: 7, carbs: 0.4, fat: 9, serving: '28g' },
  { id: 'hummus', name: 'Hummus', calories: 70, protein: 2, carbs: 4, fat: 5, serving: '2 linguri' },
  { id: 'coffee', name: 'Cafea neagră', calories: 2, protein: 0.3, carbs: 0, fat: 0, serving: '240ml' },
  { id: 'protein-bar', name: 'Baton proteic', brand: 'Generic', calories: 200, protein: 20, carbs: 22, fat: 7, serving: '1 baton' },
];

export function searchFoods(query) {
  const q = query.trim().toLowerCase();
  if (!q) return FOOD_DB.slice(0, 12);
  return FOOD_DB.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.brand?.toLowerCase().includes(q) ||
      f.id.includes(q)
  );
}

export function foodToPlateItem(food, multiplier = 1) {
  const m = Number(multiplier) || 1;
  return {
    tempId: `${food.id}-${Date.now()}`,
    name: food.name,
    calories: Math.round(food.calories * m),
    protein: Math.round(food.protein * m * 10) / 10,
    carbs: Math.round(food.carbs * m * 10) / 10,
    fat: Math.round(food.fat * m * 10) / 10,
    serving: food.serving,
    source: 'search',
  };
}

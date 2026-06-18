const KEY = 'nutri:custom-meals';

export function getLocalMeals() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLocalMeal(meal) {
  const list = getLocalMeals().filter((m) => m.id !== meal.id);
  list.unshift({ ...meal, savedAt: meal.savedAt || Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  return meal;
}

export function deleteLocalMeal(id) {
  const list = getLocalMeals().filter((m) => m.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function searchLocalMeals(query) {
  const q = query.trim().toLowerCase();
  if (!q) return getLocalMeals();
  return getLocalMeals().filter((m) => m.name?.toLowerCase().includes(q));
}

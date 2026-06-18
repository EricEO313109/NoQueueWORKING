import { getFrequentFoods } from '@/lib/cache/frequentFoods';
import { getUserProducts } from '@/lib/cache/userFoodDb';
import { exportUserCorrectionsList } from '@/lib/nutrition/userCorrections';

export function buildMealParsePayload(text, choices = {}) {
  const mealDescription = String(text || '').trim();
  return {
    text: mealDescription,
    mealDescription,
    choices,
    frequentFoods: getFrequentFoods(),
    scannedProducts: getUserProducts(),
    userCorrections: exportUserCorrectionsList(),
  };
}

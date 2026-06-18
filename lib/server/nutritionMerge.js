/** Higher = wins for per100g / serving macros */
export const SOURCE_PRIORITY = {
  barcode: 1,
  openfoodfacts: 2,
  ai_label: 3,
  user_verified: 4,
};

export function sourcePriority(nutritionSource) {
  return SOURCE_PRIORITY[nutritionSource] ?? SOURCE_PRIORITY.barcode;
}

function pickName(existing, incoming) {
  if (!existing?.name) return incoming?.name;
  if (!incoming?.name || incoming.name === 'Produs scanat') return existing.name;
  if (existing.name.length >= incoming.name.length) return existing.name;
  return incoming.name;
}

/**
 * Merge nutrition data. Never overwrites user_verified macros with lower priority.
 */
export function mergeProducts(existing, incoming) {
  if (!existing) return { ...incoming };
  if (!incoming) return { ...existing };

  const exP = sourcePriority(existing.nutrition_source || existing.source);
  const inP = sourcePriority(incoming.nutrition_source || incoming.source);

  const useIncomingMacros = inP > exP;
  const samePriority = inP === exP;

  let per100g = existing.per100g;
  let defaultGrams = existing.defaultGrams ?? 100;
  let servingSize = existing.servingSize;
  let nutrition_source = existing.nutrition_source || 'barcode';
  let confidence_score = existing.confidence ?? existing.confidence_score ?? 1;
  let last_verified_at = existing.last_verified_at;

  if (useIncomingMacros) {
    per100g = incoming.per100g;
    defaultGrams = incoming.defaultGrams ?? defaultGrams;
    servingSize = incoming.servingSize ?? servingSize;
    nutrition_source = incoming.nutrition_source || incoming.source || 'ai_label';
    confidence_score = incoming.confidence ?? incoming.confidence_score ?? confidence_score;
    last_verified_at = incoming.last_verified_at ?? last_verified_at;
  } else if (samePriority && incoming.per100g) {
    // tie-break: prefer higher confidence
    const inConf = incoming.confidence ?? incoming.confidence_score ?? 0;
    const exConf = existing.confidence ?? existing.confidence_score ?? 0;
    if (inConf > exConf) {
      per100g = incoming.per100g;
      confidence_score = inConf;
      nutrition_source = incoming.nutrition_source || nutrition_source;
    }
  }

  // user_verified always protected
  if (existing.nutrition_source === 'user_verified') {
    per100g = existing.per100g;
    nutrition_source = 'user_verified';
    confidence_score = existing.confidence_score ?? existing.confidence ?? 1;
    last_verified_at = existing.last_verified_at;
  }

  return {
    barcode: existing.barcode || incoming.barcode,
    name: pickName(existing, incoming),
    brand: existing.brand || incoming.brand || '',
    imageUrl: existing.imageUrl || incoming.imageUrl || '',
    ingredients: existing.ingredients || incoming.ingredients || '',
    per100g,
    defaultGrams,
    servingSize: servingSize || `${defaultGrams}g`,
    source: incoming.source || existing.source,
    nutrition_source,
    confidence: confidence_score,
    confidence_score,
    estimated: incoming.estimated ?? existing.estimated ?? false,
    last_verified_at,
  };
}

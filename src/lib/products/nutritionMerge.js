export const SOURCE_PRIORITY = {
  barcode: 1,
  openfoodfacts: 2,
  ai_label: 3,
  user_verified: 4,
};

export function sourcePriority(nutritionSource) {
  return SOURCE_PRIORITY[nutritionSource] ?? 1;
}

export function mergeProducts(existing, incoming) {
  if (!existing) return { ...incoming };
  if (!incoming) return { ...existing };

  const exP = sourcePriority(existing.nutrition_source);
  const inP = sourcePriority(incoming.nutrition_source);

  if (existing.nutrition_source === 'user_verified') {
    return { ...existing, barcode: existing.barcode || incoming.barcode };
  }

  if (inP > exP) {
    return {
      ...existing,
      ...incoming,
      name: existing.name?.length > (incoming.name?.length || 0) ? existing.name : incoming.name,
      per100g: incoming.per100g,
      nutrition_source: incoming.nutrition_source,
      confidence: incoming.confidence ?? incoming.confidence_score,
    };
  }

  return { ...existing, ...incoming, per100g: existing.per100g };
}

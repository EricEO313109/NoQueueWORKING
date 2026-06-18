export const queryKeys = {
  product: (barcode) => ['product', barcode],
  search: (q) => ['search', q],
  meals: () => ['meals'],
  productCatalog: () => ['product-catalog'],
  logFoodSearch: (q) => ['log-food-search', q],
  recipeFoodSearch: (q) => ['recipe-food-search', q],
};

export function invalidateMealsQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.meals() });
}

export function invalidateProductQueries(queryClient, barcode) {
  if (barcode) {
    queryClient.invalidateQueries({ queryKey: queryKeys.product(String(barcode)) });
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.productCatalog() });
}

export function invalidateFoodSearchQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['log-food-search'] });
  queryClient.invalidateQueries({ queryKey: ['recipe-food-search'] });
  queryClient.invalidateQueries({ queryKey: ['ingredient-search'] });
}

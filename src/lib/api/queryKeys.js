export const queryKeys = {
  product: (barcode) => ['product', barcode],
  search: (q) => ['search', q],
  meals: () => ['meals'],
  productCatalog: () => ['product-catalog'],
  logFoodSearch: (q) => ['log-food-search', q],
  recipeFoodSearch: (q) => ['recipe-food-search', q],
};

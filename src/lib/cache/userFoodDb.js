const USER_DB_KEY = 'nutri:user-products';

export function getUserProducts() {
  try {
    return JSON.parse(localStorage.getItem(USER_DB_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getUserProduct(barcode) {
  const clean = String(barcode).replace(/\D/g, '');
  return getUserProducts().find((p) => p.barcode === clean) || null;
}

export function saveUserProduct(product) {
  const clean = String(product.barcode).replace(/\D/g, '');
  const entry = {
    ...product,
    barcode: clean,
    savedAt: Date.now(),
    source: product.source || 'user-scan',
  };
  const list = getUserProducts().filter((p) => p.barcode !== clean);
  list.unshift(entry);
  localStorage.setItem(USER_DB_KEY, JSON.stringify(list.slice(0, 500)));
  return entry;
}

export function searchUserProducts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return getUserProducts().slice(0, 20);
  return getUserProducts().filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.barcode?.includes(q)
  ).slice(0, 20);
}

export function getUserProductCount() {
  return getUserProducts().length;
}

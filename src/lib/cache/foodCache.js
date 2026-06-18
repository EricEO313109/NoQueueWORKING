const CACHE_PREFIX = 'nutri:product:';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function getCachedProduct(barcode) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + barcode);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function setCachedProduct(barcode, data) {
  localStorage.setItem(CACHE_PREFIX + barcode, JSON.stringify({ data, ts: Date.now() }));
}

export function getRecentBarcodes() {
  try {
    return JSON.parse(localStorage.getItem('nutri:recent-barcodes') || '[]');
  } catch {
    return [];
  }
}

export function pushRecentBarcode(barcode) {
  const list = getRecentBarcodes().filter((b) => b !== barcode);
  list.unshift(barcode);
  localStorage.setItem('nutri:recent-barcodes', JSON.stringify(list.slice(0, 50)));
}

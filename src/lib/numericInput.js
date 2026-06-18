export function sanitizeIntegerInput(raw) {
  const value = String(raw ?? '');
  if (value === '') return '';
  const digits = value.replace(/\D/g, '');
  if (digits === '') return '';
  return String(parseInt(digits, 10));
}

export function sanitizeDecimalInput(raw) {
  const value = String(raw ?? '').replace(',', '.');
  if (value === '') return '';

  let cleaned = value.replace(/[^\d.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
  }

  if (cleaned === '.') return '0.';
  if (cleaned.endsWith('.')) {
    const head = cleaned.slice(0, -1);
    return head === '' ? '0.' : `${parseInt(head, 10)}.`;
  }

  if (!cleaned.includes('.')) return sanitizeIntegerInput(cleaned);

  const [intPart, decPart = ''] = cleaned.split('.');
  return `${parseInt(intPart || '0', 10)}.${decPart}`;
}

export function parseNumericValue(raw, { decimal = false, fallback = 0 } = {}) {
  if (raw === '' || raw == null) return fallback;
  const n = decimal ? parseFloat(raw) : parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

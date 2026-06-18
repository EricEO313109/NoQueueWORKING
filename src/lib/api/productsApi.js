import { apiFetch } from './client';
import { deviceHeaders } from '@/lib/deviceId';
import { ProductNotFoundError } from './openFoodFacts';
import { sanitizeErrorMessage } from './sanitizeError';

export async function fetchProductFromCloud(barcode) {
  const clean = String(barcode).replace(/\D/g, '');
  const res = await apiFetch(`/api/products/${clean}`, { headers: deviceHeaders() });

  if (res.status === 404) {
    const json = await res.json().catch(() => ({}));
    const err = new ProductNotFoundError(clean);
    err.code = json.code || 'NOT_FOUND';
    throw err;
  }

  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || 'Eroare server');
  }

  const json = await res.json();
  const product = json.product;
  if (!product?.name || !product?.per100g) {
    throw new Error('Răspuns produs invalid');
  }
  return {
    ...product,
    needsVerification: json.needsVerification,
    alternatePer100g: json.alternatePer100g,
    lowConfidence: json.lowConfidence,
  };
}

export async function analyzeLabelOnCloud({
  barcode,
  imageBase64,
  ocrText,
  mode,
  userConfirmed,
  confirmedMacros,
}) {
  const res = await apiFetch('/api/analyze-label', {
    method: 'POST',
    headers: deviceHeaders(),
    body: JSON.stringify({
      barcode,
      imageBase64,
      ocrText,
      mode: mode || (userConfirmed ? 'verify' : undefined),
      userConfirmed,
      confirmedMacros,
      deviceId: deviceHeaders()['X-Device-Id'],
    }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(sanitizeErrorMessage(json.error || 'Analiză eșuată'));
  }

  return res.json();
}

export async function confirmLabelNutrition(barcode, confirmedMacros, meta = {}) {
  const json = await analyzeLabelOnCloud({
    barcode,
    userConfirmed: true,
    confirmedMacros,
    ...meta,
  });
  return json.product;
}

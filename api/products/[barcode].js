import { getProductByBarcode } from '../../lib/server/products.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { barcode } = req.query;
  if (!barcode) return res.status(400).json({ error: 'Barcode required' });

  try {
    const product = await getProductByBarcode(barcode);
    return res.status(200).json({
      product,
      source: product.nutrition_source || product.source || 'database',
      needsVerification: product.needsVerification ?? false,
      alternatePer100g: product.alternatePer100g,
      lowConfidence: product.lowConfidence ?? false,
    });
  } catch (e) {
    if (e.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Produs negăsit', barcode: e.barcode, code: 'NOT_FOUND' });
    }
    console.error('[products]', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}

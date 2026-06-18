import { getSupabaseAdmin } from '../../lib/server/supabaseAdmin.js';
import { rowToProduct } from '../../lib/server/nutritionParser.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(200).json({ products: [] });
  }

  const q = (req.query.q || '').trim();
  let query = supabase
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (q) {
    query = supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${q}%,brand.ilike.%${q}%,barcode.ilike.%${q}%`)
      .order('updated_at', { ascending: false })
      .limit(50);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[catalog]', error);
    return res.status(500).json({ error: error.message });
  }

  const products = (data || []).map((row) => ({
    ...rowToProduct(row),
    savedAt: new Date(row.updated_at || row.created_at).getTime(),
  }));

  return res.status(200).json({ products, count: products.length });
}

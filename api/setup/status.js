import { getSupabaseAdmin, isCloudConfigured } from '../../lib/server/supabaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabaseAdmin();
  const status = {
    cloud: isCloudConfigured(),
    openai: !!process.env.OPENAI_API_KEY,
    supabaseConnected: false,
    migration002: false,
    tables: {},
    ready: false,
  };

  if (!supabase) {
    return res.status(200).json({ ...status, hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel' });
  }

  try {
    const { error: prodErr } = await supabase.from('products').select('barcode').limit(1);
    status.tables.products = !prodErr;
    status.supabaseConnected = status.tables.products;

    const { error: migErr } = await supabase.from('products').select('nutrition_source').limit(1);
    status.migration002 = !migErr;

    status.ready = status.cloud && status.openai && status.supabaseConnected;
  } catch (e) {
    status.error = e.message;
  }

  return res.status(200).json(status);
}

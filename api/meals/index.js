import { getSupabaseAdmin } from '../../lib/server/supabaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const deviceId = req.headers['x-device-id'] || req.body?.deviceId || req.query?.deviceId;
  if (!deviceId) return res.status(400).json({ error: 'X-Device-Id required' });

  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    if (!supabase) return res.status(200).json({ meals: [] });
    const q = (req.query.q || '').trim();
    let query = supabase
      .from('custom_meals')
      .select('*')
      .eq('device_id', deviceId)
      .order('updated_at', { ascending: false })
      .limit(100);
    if (q) query = query.ilike('name', `%${q}%`);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    const meals = (data || []).map((r) => ({
      id: r.id,
      name: r.name,
      items: r.items,
      totals: r.totals,
      savedAt: new Date(r.updated_at || r.created_at).getTime(),
    }));
    return res.status(200).json({ meals });
  }

  if (req.method === 'POST') {
    const { name, items, totals } = req.body || {};
    if (!name?.trim() || !items?.length) {
      return res.status(400).json({ error: 'name and items required' });
    }
    const meal = {
      id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      items,
      totals: totals || sumTotals(items),
      device_id: deviceId,
      savedAt: Date.now(),
    };
    if (supabase) {
      const { data, error } = await supabase.from('custom_meals').upsert({
        id: meal.id,
        device_id: deviceId,
        name: meal.name,
        items: meal.items,
        totals: meal.totals,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }).select().single();
      if (error) console.error('[meals] save', error);
      if (data) meal.id = data.id;
    }
    return res.status(200).json({ meal });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (supabase && id) {
      await supabase.from('custom_meals').delete().eq('id', id).eq('device_id', deviceId);
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function sumTotals(items) {
  return items.reduce(
    (a, it) => ({
      totalCalories: a.totalCalories + (it.calories || 0),
      totalProtein: Math.round((a.totalProtein + (it.protein || 0)) * 10) / 10,
      totalCarbs: Math.round((a.totalCarbs + (it.carbs || 0)) * 10) / 10,
      totalFat: Math.round((a.totalFat + (it.fat || 0)) * 10) / 10,
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
  );
}

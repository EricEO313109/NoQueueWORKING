import { getSupabaseAdmin } from '../lib/server/supabaseAdmin.js';
import { entryToRow, entryFromRow } from '../lib/server/mappers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const deviceId = req.headers['x-device-id'] || req.body?.deviceId;
  if (!deviceId) return res.status(400).json({ error: 'X-Device-Id required' });

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(503).json({ error: 'Cloud not configured', status: 'error' });

  try {
    if (req.method === 'GET') {
      const [device, entries, favorites, recipes, weight] = await Promise.all([
        supabase.from('devices').select('*').eq('device_id', deviceId).maybeSingle(),
        supabase.from('food_entries').select('*').eq('device_id', deviceId).order('logged_at', { ascending: false }).limit(500),
        supabase.from('favorites').select('*').eq('device_id', deviceId),
        supabase.from('recipes').select('*').eq('device_id', deviceId).order('created_at', { ascending: false }),
        supabase.from('weight_log').select('*').eq('device_id', deviceId).order('logged_date', { ascending: false }).limit(365),
      ]);

      const queryErrors = [device, entries, favorites, recipes, weight]
        .map((result) => result.error)
        .filter(Boolean);
      if (queryErrors.length) {
        console.error('[sync GET]', queryErrors);
        return res.status(500).json({ error: 'Cloud sync read failed' });
      }

      const d = device.data;
      return res.status(200).json({
        profile: d?.profile || {},
        targets: d?.targets || {},
        onboardingComplete: d?.onboarding_complete ?? false,
        entries: (entries.data || []).map(entryFromRow),
        favorites: (favorites.data || []).map((f) => f.payload).filter(Boolean),
        recipes: (recipes.data || []).map((r) => ({
          id: r.id,
          name: r.name,
          servings: r.servings,
          ingredients: r.ingredients,
          totals: r.totals,
          createdAt: new Date(r.created_at).getTime(),
        })),
        weightLog: (weight.data || []).map((w) => ({
          id: w.id,
          kg: w.kg,
          date: w.logged_date,
        })),
      });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const {
      profile, targets, entries, deletedEntryIds, favorites, recipes, weightLog, onboardingComplete,
    } = req.body || {};

    const deletedIds = Array.isArray(deletedEntryIds)
      ? deletedEntryIds.filter((id) => typeof id === 'string' && id.length > 0)
      : [];

    const deviceUpsert = await supabase.from('devices').upsert({
      device_id: deviceId,
      profile: profile || {},
      targets: targets || {},
      onboarding_complete: onboardingComplete ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'device_id' });
    if (deviceUpsert.error) {
      console.error('[sync POST devices]', deviceUpsert.error);
      return res.status(500).json({ error: 'Cloud sync write failed' });
    }

    if (deletedIds.length) {
      const deleted = await supabase.from('food_entries').delete().eq('device_id', deviceId).in('id', deletedIds);
      if (deleted.error) {
        console.error('[sync POST delete entries]', deleted.error);
        return res.status(500).json({ error: 'Cloud sync delete failed' });
      }
    }

    if (entries?.length) {
      const deleted = new Set(deletedIds);
      const rows = entries
        .filter((e) => e?.date && !deleted.has(e.id))
        .map((e) => entryToRow(deviceId, e));
      const upserted = await supabase.from('food_entries').upsert(rows, { onConflict: 'id' });
      if (upserted.error) {
        console.error('[sync POST entries]', upserted.error);
        return res.status(500).json({ error: 'Cloud sync entries failed' });
      }
    }

    if (favorites?.length) {
      const upserted = await supabase.from('favorites').upsert(
        favorites.filter((f) => f?.barcode).map((f) => ({
          device_id: deviceId,
          barcode: f.barcode,
          payload: f,
        })),
        { onConflict: 'device_id,barcode' },
      );
      if (upserted.error) {
        console.error('[sync POST favorites]', upserted.error);
        return res.status(500).json({ error: 'Cloud sync favorites failed' });
      }
    }

    if (recipes?.length) {
      const upserted = await supabase.from('recipes').upsert(
        recipes.map((r) => ({
          id: r.id && String(r.id).length > 10 ? r.id : crypto.randomUUID(),
          device_id: deviceId,
          name: r.name,
          servings: r.servings,
          ingredients: r.ingredients,
          totals: r.totals,
        })),
        { onConflict: 'id' },
      );
      if (upserted.error) {
        console.error('[sync POST recipes]', upserted.error);
        return res.status(500).json({ error: 'Cloud sync recipes failed' });
      }
    }

    if (weightLog?.length) {
      const upserted = await supabase.from('weight_log').upsert(
        weightLog.map((w) => ({
          id: w.id && String(w.id).length > 10 ? w.id : crypto.randomUUID(),
          device_id: deviceId,
          kg: w.kg,
          logged_date: w.date,
        })),
        { onConflict: 'id' },
      );
      if (upserted.error) {
        console.error('[sync POST weight]', upserted.error);
        return res.status(500).json({ error: 'Cloud sync weight failed' });
      }
    }

    return res.status(200).json({ ok: true, status: 'ok' });
  } catch (error) {
    console.error('[sync]', error);
    return res.status(500).json({ error: 'Cloud sync failed' });
  }
}

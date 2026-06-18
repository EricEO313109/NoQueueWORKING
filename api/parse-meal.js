import { parseMeal } from '../lib/server/mealParser.js';
import { getSupabaseAdmin } from '../lib/server/supabaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    text,
    mealDescription,
    deviceId,
    choices,
    frequentFoods,
    scannedProducts,
    userCorrections,
  } = req.body || {};
  const inputText = String(text || mealDescription || '').trim().slice(0, 1500);
  if (!inputText) {
    return res.status(400).json({ error: 'text required' });
  }

  try {
    const result = await parseMeal(inputText, choices || {}, {
      frequentFoods,
      scannedProducts,
      userCorrections,
    });

    const supabase = getSupabaseAdmin();
    if (supabase && deviceId) {
      supabase.from('meal_parses').insert({
        device_id: deviceId,
        input_text: inputText,
        result,
      }).then(null, () => {});
    }

    return res.status(200).json(result);
  } catch (e) {
    console.error('[parse-meal]', e);
    return res.status(500).json({ error: 'Nu am putut analiza masa. Încearcă din nou.' });
  }
}

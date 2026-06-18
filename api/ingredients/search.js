import { searchIngredients } from '../../lib/server/ingredientDb.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = (req.query.q || '').trim();
  if (q.length < 2) {
    return res.status(200).json({ ingredients: [], count: 0 });
  }

  try {
    const ingredients = await searchIngredients(q, { limit: 40 });
    return res.status(200).json({ ingredients, count: ingredients.length, query: q });
  } catch (e) {
    console.error('[ingredients/search]', e);
    return res.status(500).json({ error: 'Search failed' });
  }
}

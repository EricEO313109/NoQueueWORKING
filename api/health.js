import { isCloudConfigured } from '../lib/server/supabaseAdmin.js';

const ROUTES = [
  'GET /api/health',
  'GET /api/products/:barcode',
  'GET /api/ingredients/search',
  'POST /api/analyze-label',
  'POST /api/parse-meal',
  'GET /api/meals',
  'POST /api/meals',
  'GET /api/sync',
  'POST /api/sync',
];

async function checkOpenAiKey() {
  const key = process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, '');
  if (!key || !key.startsWith('sk-')) return { configured: false, valid: false };
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    return { configured: true, valid: res.ok };
  } catch {
    return { configured: true, valid: false };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const cloud = isCloudConfigured();
  const openaiCheck = await checkOpenAiKey();

  res.status(200).json({
    status: 'ok',
    ok: true,
    cloud,
    openai: openaiCheck.configured,
    openaiValid: openaiCheck.valid,
    routes: ROUTES,
    ready: cloud,
    labelScan: cloud ? 'ocr+fallback' : 'client-ocr',
    timestamp: new Date().toISOString(),
  });
}

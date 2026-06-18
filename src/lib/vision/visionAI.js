/**
 * Optional cloud vision — set VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY in .env
 * Falls back silently to OCR-only when keys missing.
 */

const NUTRITION_SCHEMA = `Extract nutrition from this food label image. Return ONLY valid JSON:
{
  "name": "product name if visible",
  "brand": "brand if visible",
  "per100g": { "calories": number, "protein": number, "carbs": number, "fat": number, "sugars": number, "fiber": number, "sodium": number },
  "defaultGrams": number,
  "servingSize": "string",
  "ingredients": "string"
}
Use kcal not kJ. Normalize all values per 100g. Support Romanian and English labels.`;

function parseJsonResponse(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function analyzeWithGemini(imageBase64, apiKey) {
  const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: NUTRITION_SCHEMA },
            { inline_data: { mime_type: 'image/jpeg', data: base64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
      }),
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = parseJsonResponse(text);
  if (!parsed?.per100g) return null;
  return {
    ...parsed,
    confidence: 0.92,
    source: 'gemini-vision',
  };
}

export async function analyzeWithOpenAI(imageBase64, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: NUTRITION_SCHEMA },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ],
      }],
      max_tokens: 400,
      temperature: 0,
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const parsed = parseJsonResponse(json.choices?.[0]?.message?.content);
  if (!parsed?.per100g) return null;
  return {
    ...parsed,
    confidence: 0.9,
    source: 'openai-vision',
  };
}

export async function analyzeWithVisionAI(imageDataUrl) {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const r = await analyzeWithGemini(imageDataUrl, geminiKey);
      if (r) return r;
    } catch { /* fallback */ }
  }
  if (openaiKey) {
    try {
      const r = await analyzeWithOpenAI(imageDataUrl, openaiKey);
      if (r) return r;
    } catch { /* fallback */ }
  }
  return null;
}

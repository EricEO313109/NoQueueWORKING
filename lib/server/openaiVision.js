import { parseNutritionText } from './nutritionParser.js';

const VISION_PROMPT = 'Analyze the uploaded image of this food packaging nutrition grid. Identify exact macronutrients per 100g or 100ml. Output only minified JSON: {"brand_name":string,"product_title":string,"calories_per_100g":number,"protein_per_100g":number,"carbs_per_100g":number,"fat_per_100g":number,"confidence":number}. No markdown or explanations.';

function parseJson(text) {
  const m = text?.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

function parseServingGrams(servingSize) {
  if (!servingSize) return 100;
  const m = String(servingSize).match(/([\d.]+)\s*g/i);
  return m ? parseFloat(m[1]) : 100;
}

function normalizeToPer100g(parsed) {
  if (parsed.calories_per_100g != null) {
    parsed = {
      ...parsed,
      productName: parsed.product_title,
      brand: parsed.brand_name,
      calories: parsed.calories_per_100g,
      protein: parsed.protein_per_100g,
      carbs: parsed.carbs_per_100g,
      fat: parsed.fat_per_100g,
      per100g: {
        calories: parsed.calories_per_100g,
        protein: parsed.protein_per_100g,
        carbs: parsed.carbs_per_100g,
        fat: parsed.fat_per_100g,
      },
      defaultGrams: 100,
      servingSize: '100g',
    };
  }
  const servingGrams = parseServingGrams(parsed.servingSize || parsed.defaultGrams);
  let per = parsed.per100g;

  if (!per || !per.calories) {
    const scale = (v) => {
      const n = Number(v) || 0;
      if (servingGrams > 0 && servingGrams !== 100) return Math.round((n * 100 / servingGrams) * 10) / 10;
      return n;
    };
    per = {
      calories: Math.round(scale(parsed.calories)),
      protein: scale(parsed.protein),
      carbs: scale(parsed.carbs),
      fat: scale(parsed.fat),
      fiber: parsed.per100g?.fiber ?? 0,
      sugars: parsed.per100g?.sugars ?? 0,
      sodium: parsed.per100g?.sodium ?? 0,
    };
  }

  return {
    per100g: {
      calories: Math.round(per.calories || 0),
      protein: Number(per.protein) || 0,
      carbs: Number(per.carbs) || 0,
      fat: Number(per.fat) || 0,
      fiber: Number(per.fiber) || 0,
      sugars: Number(per.sugars) || 0,
      sodium: Number(per.sodium) || 0,
    },
    defaultGrams: servingGrams,
    servingSize: parsed.servingSize || `${servingGrams}g`,
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    name: parsed.productName || parsed.name || 'Produs scanat',
  };
}

function getOpenAiKey() {
  const key = process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, '');
  if (!key || key.length < 20 || !key.startsWith('sk-')) return null;
  return key;
}

export async function extractNutritionFromImage(imageUrl, imageBase64) {
  const apiKey = getOpenAiKey();
  if (!apiKey) return null;

  const imageContent = imageUrl
    ? { type: 'image_url', image_url: { url: imageUrl } }
    : { type: 'image_url', image_url: { url: imageBase64 } };

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
        content: [{ type: 'text', text: VISION_PROMPT }, imageContent],
      }],
      max_tokens: 400,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[openai] vision failed', res.status, err.slice(0, 120));
    return null;
  }

  const json = await res.json();
  const parsed = parseJson(json.choices?.[0]?.message?.content);
  if (!parsed || (parsed.confidence ?? 0) <= 0) return null;

  const norm = normalizeToPer100g(parsed);
  if (!norm.per100g.calories && !norm.per100g.protein) return null;

  return {
    name: norm.name,
    brand: parsed.brand || '',
    per100g: norm.per100g,
    defaultGrams: norm.defaultGrams,
    servingSize: norm.servingSize,
    ingredients: parsed.ingredients || '',
    confidence: norm.confidence,
    confidence_score: norm.confidence,
    source: 'openai-vision',
    nutrition_source: 'ai_label',
    estimated: false,
  };
}

/** OCR fallback when OpenAI unavailable */
export function extractFromOcrText(ocrText, barcode) {
  const parsed = parseNutritionText(ocrText || '');
  if ((parsed.confidence || 0) < 0.2) {
    return null;
  }
  return {
    name: `Produs ${barcode?.slice(-6) || 'nou'}`,
    brand: '',
    per100g: parsed.per100g,
    defaultGrams: parsed.defaultGrams || 100,
    servingSize: parsed.servingSize || '100g',
    ingredients: parsed.ingredients || '',
    confidence: parsed.confidence,
    confidence_score: parsed.confidence,
    source: 'ocr',
    nutrition_source: 'ai_label',
    estimated: false,
  };
}

export { VISION_PROMPT };

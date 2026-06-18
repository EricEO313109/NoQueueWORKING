import { preprocessLabelImage } from './imageProcessing';
import { runOcr } from './ocrEngine';
import { parseNutritionText, estimateFromCategory, mergeNutrition } from './nutritionParser';
import { analyzeWithVisionAI } from './visionAI';

export async function analyzeNutritionLabel(imageDataUrl, { barcode, onProgress } = {}) {
  onProgress?.({ stage: 'enhance', progress: 0.05, message: 'Procesez imaginea…' });
  const enhanced = await preprocessLabelImage(imageDataUrl);

  onProgress?.({ stage: 'ai', progress: 0.15, message: 'AI analizează eticheta…' });
  const aiResult = await analyzeWithVisionAI(enhanced);

  onProgress?.({ stage: 'ocr', progress: 0.35, message: 'Citesc tabelul nutrițional…' });
  const ocr = await runOcr(enhanced, onProgress);
  const parsed = parseNutritionText(ocr.text);

  onProgress?.({ stage: 'parse', progress: 0.85, message: 'Extrag macro-uri…' });

  let merged = mergeNutrition(
    aiResult ? {
      per100g: aiResult.per100g,
      defaultGrams: aiResult.defaultGrams,
      servingSize: aiResult.servingSize,
      ingredients: aiResult.ingredients,
      confidence: aiResult.confidence,
    } : null,
    parsed
  );

  if ((merged.confidence || 0) < 0.25) {
    const estimate = estimateFromCategory(barcode, aiResult?.name || '');
    merged = mergeNutrition(merged, estimate);
    merged.confidence = Math.max(merged.confidence || 0, estimate.confidence || 0);
    merged.estimated = true;
  }

  onProgress?.({ stage: 'done', progress: 1, message: 'Gata!' });

  return {
    name: aiResult?.name || `Produs ${barcode?.slice(-6) || 'nou'}`,
    brand: aiResult?.brand || '',
    barcode: barcode || '',
    imageUrl: enhanced,
    per100g: {
      calories: Math.round(merged.per100g.calories || 0),
      protein: round1(merged.per100g.protein),
      carbs: round1(merged.per100g.carbs),
      fat: round1(merged.per100g.fat),
      sugars: round1(merged.per100g.sugars),
      fiber: round1(merged.per100g.fiber),
      sodium: round1(merged.per100g.sodium),
    },
    defaultGrams: merged.defaultGrams || 100,
    servingSize: merged.servingSize || '100g',
    ingredients: merged.ingredients || '',
    confidence: merged.confidence || ocr.confidence,
    estimated: merged.estimated || false,
    source: aiResult?.source || 'ocr-label',
    ocrPreview: ocr.text.slice(0, 200),
  };
}

function round1(n) {
  return Math.round((n || 0) * 10) / 10;
}

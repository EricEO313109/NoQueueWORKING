import { getSupabaseAdmin } from '../lib/server/supabaseAdmin.js';
import { extractNutritionFromImage, extractFromOcrText } from '../lib/server/openaiVision.js';
import { saveProduct, confirmProductNutrition } from '../lib/server/products.js';
import { mergeProducts } from '../lib/server/nutritionMerge.js';
import { compareMacros } from '../lib/server/macroValidation.js';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

async function getExisting(clean) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase.from('products').select('*').eq('barcode', clean).maybeSingle();
  if (!data) return null;
  const { rowToProduct } = await import('../lib/server/nutritionParser.js');
  return rowToProduct(data);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      barcode,
      imageBase64,
      ocrText,
      deviceId,
      userConfirmed,
      confirmedMacros,
      mode,
    } = req.body || {};
    const clean = String(barcode || '').replace(/\D/g, '');

    if (userConfirmed && confirmedMacros && clean.length >= 8) {
      const product = await confirmProductNutrition(clean, confirmedMacros, {
        name: req.body.productName,
        brand: req.body.brand,
      });
      return res.status(200).json({ product, confirmed: true });
    }

    if (!imageBase64 && !ocrText) {
      return res.status(400).json({ error: 'imageBase64 or ocrText required' });
    }

    const existing = clean.length >= 8 ? await getExisting(clean) : null;

    const supabase = getSupabaseAdmin();
    let publicUrl = null;
    let storagePath = null;

    if (supabase && imageBase64) {
      const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      storagePath = `labels/${deviceId || 'anon'}/${clean || 'unknown'}-${Date.now()}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from('label-images')
        .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('label-images').getPublicUrl(storagePath);
        publicUrl = urlData?.publicUrl;
      }
    }

    let extracted = null;
    let usedOcr = false;
    if (publicUrl || imageBase64) {
      try {
        extracted = await extractNutritionFromImage(publicUrl, imageBase64);
      } catch (e) {
        console.error('[analyze-label] openai', e?.message?.slice(0, 80));
      }
    }
    if (!extracted && ocrText?.trim()) {
      extracted = extractFromOcrText(ocrText, clean);
      usedOcr = !!extracted;
    }
    if (!extracted) {
      return res.status(422).json({
        error: 'Nu am putut citi tabelul nutrițional. Folosește lumină bună, încadrează doar tabelul „Declarație nutrițională”, sau încearcă din galerie.',
        code: 'PARSE_FAILED',
        ocrReceived: !!ocrText?.trim(),
      });
    }

    const pseudoBarcode = (name) => {
      let h = 0;
      const s = String(name || 'label');
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
      return `9${Math.abs(h).toString().padStart(12, '0').slice(0, 12)}`;
    };

    const finalBarcode = clean.length >= 8 ? clean : pseudoBarcode(extracted?.name);
    const labelProduct = {
      ...extracted,
      barcode: finalBarcode,
      nutrition_source: 'ai_label',
      source: 'openai-vision',
      imageUrl: publicUrl || existing?.imageUrl || '',
      name: extracted.name || existing?.name,
      brand: extracted.brand || existing?.brand || '',
    };

    const merged = existing
      ? mergeProducts(existing, labelProduct)
      : labelProduct;

    if (mode === 'verify' || userConfirmed) {
      merged.nutrition_source = userConfirmed ? 'user_verified' : merged.nutrition_source;
      if (userConfirmed) {
        merged.confidence_score = 1;
        merged.last_verified_at = new Date().toISOString();
      }
    }

    let comparison = null;
    if (existing?.per100g) {
      comparison = compareMacros(existing.per100g, labelProduct.per100g);
    }

    const needsConfirmation = (extracted.confidence ?? 0) < 0.8 || comparison?.mismatch;

    if (userConfirmed) {
      await confirmProductNutrition(finalBarcode, merged, { name: merged.name, brand: merged.brand });
    } else if (!existing || existing.nutrition_source !== 'user_verified') {
      await saveProduct(merged);
    }

    if (supabase && storagePath) {
      await supabase.from('label_scans').insert({
        barcode: clean || null,
        device_id: deviceId || null,
        storage_path: storagePath,
        public_url: publicUrl,
        ocr_text: ocrText?.slice(0, 5000) || null,
        extracted: merged,
      });
    }

    return res.status(200).json({
      product: merged,
      labelExtracted: labelProduct,
      comparison,
      needsConfirmation,
      confidence: extracted.confidence,
      imageUrl: publicUrl,
      usedOcr,
    });
  } catch (e) {
    console.error('[analyze-label]', e);
    return res.status(500).json({
      error: 'Analiză eșuată. Reîncearcă cu o poză mai clară a tabelului nutrițional.',
      code: 'SERVER_ERROR',
    });
  }
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useQuery, useMutation } from '@tanstack/react-query';

import {

  ScanLine, Flashlight, Loader2, RefreshCw, Camera, Keyboard, AlertCircle, Search, MessageSquareText,

} from 'lucide-react';

import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

import {

  fetchProductByBarcode,

  persistScannedProduct,

  ProductNotFoundError,

} from '@/lib/api/openFoodFacts';

import { isValidProduct } from '@/lib/products/productLookup';

import { queryKeys } from '@/lib/api/queryKeys';


import { analyzeNutritionLabel } from '@/lib/vision/analyzeLabel';

import { analyzeLabelOnCloud } from '@/lib/api/productsApi';

import { isCloudEnabled } from '@/lib/api/client';

import { runOcr } from '@/lib/vision/ocrEngine';

import { preprocessLabelImage } from '@/lib/vision/imageProcessing';

import { Button, Card } from '@/components/ui/primitives';

import { useNutritionStore } from '@/store/useNutritionStore';

import ScanOverlay from '@/components/scanner/ScanOverlay';
import LabelScanView from '@/components/scanner/LabelScanView';
import ProductResultSheet from '@/components/scanner/ProductResultSheet';
import { confirmLabelNutrition } from '@/lib/api/productsApi';
import { sanitizeErrorMessage } from '@/lib/api/sanitizeError';

const FLOW = {

  CHOOSER: 'chooser',

  BARCODE: 'barcode',

  LOOKUP: 'lookup',

  LABEL: 'label',
  VERIFY_LABEL: 'verify_label',
  PROCESSING: 'processing',
  RESULT: 'result',
};

function lookupErrorMessage(err) {

  if (err instanceof ProductNotFoundError || err?.code === 'NOT_FOUND') {

    return 'Produs negăsit în baze de date';

  }

  if (err?.message?.includes('Cod invalid')) return err.message;

  if (err?.message?.includes('internet')) return err.message;

  return sanitizeErrorMessage(err?.message || 'Eroare la căutare — încearcă din nou');
}



export default function BarcodeScannerView({ onSuccess, initialMode = 'chooser', logOnAdd = true }) {

  const [flow, setFlow] = useState(initialMode === 'label' ? FLOW.LABEL : initialMode === 'barcode' ? FLOW.BARCODE : FLOW.CHOOSER);

  const [barcode, setBarcode] = useState(null);

  const [product, setProduct] = useState(null);

  const [manualCode, setManualCode] = useState('');

  const [lookupError, setLookupError] = useState(null);

  const [torch, setTorch] = useState(false);

  const [paused, setPaused] = useState(false);

  const [overlay, setOverlay] = useState(null);
  const [labelPreview, setLabelPreview] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);

  const addEntry = useNutritionStore((s) => s.addEntry);
  const processingRef = useRef(false);
  const addedBarcodeRef = useRef(null);
  const lookupHandledRef = useRef(null);
  const stopCameraRef = useRef(null);

  const onBarcodeDetected = useCallback((code) => {
    if (paused || flow !== FLOW.BARCODE || processingRef.current) return;

    const clean = String(code).replace(/\D/g, '');
    if (clean.length < 8) return;

    processingRef.current = true;
    console.log('[StilMacros:scan] detected', clean);

    stopCameraRef.current?.();
    setBarcode(clean);
    setLookupError(null);
    setFlow(FLOW.LOOKUP);
    setOverlay({ stage: 'scan-barcode', progress: 0.5, message: 'Caut produsul…' });
  }, [paused, flow]);

  const {
    videoRef, error: camError, scanning, cameraReady,
    startCamera, stopCamera, resetDetection, restart,
  } = useBarcodeScanner({ onDetected: onBarcodeDetected });

  stopCameraRef.current = stopCamera;

  useEffect(() => {
    if (flow === FLOW.BARCODE && !cameraReady && !camError) {
      startCamera();
    }
  }, [flow, cameraReady, camError, startCamera]);

  const lookupQuery = useQuery({

    queryKey: queryKeys.product(barcode),

    queryFn: async () => {

      console.log('[StilMacros:scan] lookup', barcode);

      const p = await fetchProductByBarcode(barcode);

      if (!isValidProduct(p)) throw new ProductNotFoundError(barcode);

      return p;

    },

    enabled: !!barcode && flow === FLOW.LOOKUP,

    retry: false,

    staleTime: Infinity,

  });



  useEffect(() => {
    if (!lookupQuery.isSuccess || !lookupQuery.data || !barcode) return;
    if (lookupHandledRef.current === barcode) return;

    lookupHandledRef.current = barcode;
    setProduct(lookupQuery.data);
    setFlow(FLOW.RESULT);
    setLookupError(null);
    setOverlay({ stage: 'barcode-found', progress: 1, message: 'Produs găsit!' });
    setTimeout(() => setOverlay(null), 2000);
  }, [lookupQuery.isSuccess, lookupQuery.data, barcode]);



  useEffect(() => {

    if (!lookupQuery.isError || !barcode) return;

    const err = lookupQuery.error;

    const msg = lookupErrorMessage(err);

    setLookupError(msg);

    console.warn('[StilMacros:scan] lookup failed', err);



    const isNotFound =

      err instanceof ProductNotFoundError ||

      err?.name === 'ProductNotFoundError' ||

      err?.code === 'NOT_FOUND';



    if (isNotFound) {

      setOverlay({ stage: 'barcode-missing', progress: 0, message: 'Necunoscut — deschide scan etichetă' });

      setTimeout(() => {

        setFlow(FLOW.LABEL);

        setOverlay({ stage: 'label-scan', progress: 0, message: 'Fotografiază tabelul nutrițional' });

      }, 1500);

    } else {

      setOverlay({ stage: 'barcode-missing', progress: 0, message: msg });

    }

  }, [lookupQuery.isError, lookupQuery.error, barcode]);



  const runClientLabelAnalysis = async (imageDataUrl) => {
    setOverlay({ stage: 'processing', progress: 0.2, message: 'Citesc eticheta pe telefon…' });
    const raw = await analyzeNutritionLabel(imageDataUrl, {
      barcode,
      onProgress: (p) => setOverlay({
        stage: 'processing',
        progress: p.progress || 0.5,
        message: p.message,
      }),
    });
    const saved = persistScannedProduct(raw);
    if (!isValidProduct(saved)) throw new Error('Nu am citit tabelul — încadrează „Declarație nutrițională” și reîncearcă.');
    return {
      saved,
      labelExtracted: saved,
      comparison: null,
      needsConfirmation: (saved.confidence ?? 1) < 0.8,
    };
  };

  const labelMutation = useMutation({
    mutationFn: async (imageDataUrl) => {
      setOverlay({ stage: 'processing', progress: 0.05, message: 'Procesez imaginea…' });
      let ocrText = '';
      try {
        const enhanced = await preprocessLabelImage(imageDataUrl);
        const ocr = await runOcr(enhanced);
        ocrText = ocr.text || '';
        console.log('[StilMacros:ocr] chars', ocrText.length);
      } catch (e) {
        console.warn('[StilMacros:ocr] failed', e);
      }

      if (isCloudEnabled()) {
        try {
          const res = await analyzeLabelOnCloud({
            barcode,
            imageBase64: imageDataUrl,
            ocrText,
            mode: verifyMode ? 'verify' : undefined,
          });
          const merged = res.product || res;
          if (!isValidProduct(merged)) throw new Error('PARSE_FAILED');
          return {
            saved: persistScannedProduct(merged),
            labelExtracted: res.labelExtracted || merged,
            comparison: res.comparison,
            needsConfirmation: res.needsConfirmation,
          };
        } catch (cloudErr) {
          console.warn('[StilMacros:scan] cloud label failed, client OCR', cloudErr);
          if (ocrText.length > 30) {
            return runClientLabelAnalysis(imageDataUrl);
          }
          throw cloudErr;
        }
      }

      return runClientLabelAnalysis(imageDataUrl);
    },
    onSuccess: (result) => {
      const { saved, labelExtracted, comparison: cmp, needsConfirmation } = result;
      setLookupError(null);
      setOverlay({ stage: 'macros-found', progress: 1, message: 'Etichetă analizată' });
      setTimeout(() => setOverlay(null), 2000);

      if (verifyMode && product) {
        setLabelPreview(labelExtracted);
        setComparison(cmp);
        setPendingConfirm(needsConfirmation || cmp?.mismatch);
        setProduct(product);
        setFlow(FLOW.RESULT);
        setVerifyMode(false);
        return;
      }

      setProduct(saved);
      setLabelPreview(null);
      setComparison(null);
      setPendingConfirm(needsConfirmation);
      setFlow(FLOW.RESULT);
    },
    onError: (err) => {
      console.error('[StilMacros:scan] label failed', err);
      const msg = sanitizeErrorMessage(err?.message || 'Analiza etichetei a eșuat');
      setLookupError(msg);
      setOverlay({ stage: 'barcode-missing', progress: 0, message: msg });
      setFlow(verifyMode ? FLOW.VERIFY_LABEL : FLOW.LABEL);
      setVerifyMode(false);
    },
  });



  const openBarcode = () => {
    resetDetection();
    processingRef.current = false;
    lookupHandledRef.current = null;
    addedBarcodeRef.current = null;
    setLookupError(null);
    setFlow(FLOW.BARCODE);
    setOverlay(null);
  };



  const openLabel = (code = barcode, forVerify = false) => {
    setBarcode(code);
    setLookupError(null);
    setVerifyMode(forVerify);
    setFlow(forVerify ? FLOW.VERIFY_LABEL : FLOW.LABEL);
    setOverlay({ stage: 'label-scan', progress: 0, message: forVerify ? 'Verifică tabelul nutrițional' : 'Fotografiază tabelul nutrițional' });
  };

  const handleConfirmLabel = async () => {
    const macros = labelPreview?.per100g ? labelPreview : product?.per100g;
    if (!barcode || !macros) return;
    try {
      const confirmed = await confirmLabelNutrition(barcode, {
        per100g: labelPreview?.per100g || macros,
        defaultGrams: labelPreview?.defaultGrams ?? product?.defaultGrams,
        servingSize: labelPreview?.servingSize ?? product?.servingSize,
      });
      const saved = persistScannedProduct(confirmed);
      setProduct(saved);
      setLabelPreview(null);
      setComparison(null);
      setPendingConfirm(false);
    } catch (e) {
      setLookupError(e.message);
    }
  };



  const handleLabelCapture = (imageDataUrl) => {

    setFlow(FLOW.PROCESSING);

    setOverlay({ stage: 'processing', progress: 0.1, message: 'Analizez eticheta…' });

    labelMutation.mutate(imageDataUrl);

  };



  const dismissAll = () => {
    resetDetection();
    processingRef.current = false;
    addedBarcodeRef.current = null;
    lookupHandledRef.current = null;
    setBarcode(null);
    setProduct(null);
    setLookupError(null);
    setFlow(FLOW.CHOOSER);
    setPaused(false);
    setOverlay(null);
    setLabelPreview(null);
    setComparison(null);
    setPendingConfirm(false);
    setVerifyMode(false);
  };

  const handleAdd = (entry) => {
    const code = entry.barcode ? String(entry.barcode).replace(/\D/g, '') : '';
    if (code && addedBarcodeRef.current === code) return;

    addedBarcodeRef.current = code || 'logged';
    if (logOnAdd) addEntry(entry);
    onSuccess?.(entry, product);
    dismissAll();
  };



  const submitManual = (e) => {

    e.preventDefault();

    const code = manualCode.replace(/\D/g, '');

    if (code.length >= 8) {
      if (processingRef.current) return;
      processingRef.current = true;
      stopCameraRef.current?.();
      resetDetection();
      processingRef.current = true;
      setBarcode(code);
      setLookupError(null);
      setFlow(FLOW.LOOKUP);
      setManualCode('');
    } else {

      setLookupError('Introdu minim 8 cifre (EAN)');

    }

  };



  useEffect(() => {

    const video = videoRef.current;

    const stream = video?.srcObject;

    if (!stream || !torch) return;

    const track = stream.getVideoTracks()[0];

    track?.applyConstraints?.({ advanced: [{ torch: true }] }).catch(() => {});

  }, [torch, cameraReady, videoRef]);



  if (flow === FLOW.CHOOSER) {

    return (

      <div className="h-full w-full flex flex-col justify-center gap-3 p-5 bg-surface-1 rounded-3xl overflow-y-auto">
        <h2 className="text-xl font-bold text-center">Cum adaugi?</h2>
        <Button size="lg" className="w-full" onClick={openBarcode}>
          <ScanLine className="w-5 h-5" /> Scanează cod de bare
        </Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={() => openLabel(null)}>
          <Camera className="w-5 h-5" /> Fotografiază eticheta
        </Button>
        <Link to="/ingredients" className="w-full">
          <Button size="lg" variant="secondary" className="w-full">
            <Search className="w-5 h-5" /> Caută ingredient
          </Button>
        </Link>
        <Link to="/log" className="w-full">
          <Button size="lg" variant="secondary" className="w-full">
            <MessageSquareText className="w-5 h-5" /> Descrie masa
          </Button>
        </Link>
      </div>

    );

  }



  if (flow === FLOW.LABEL || flow === FLOW.VERIFY_LABEL || flow === FLOW.PROCESSING) {

    return (

      <div className="relative h-full w-full">

        {(flow === FLOW.LABEL || flow === FLOW.VERIFY_LABEL) && (
          <LabelScanView
            barcode={barcode}
            onCapture={handleLabelCapture}
            onCancel={() => {
              if (flow === FLOW.VERIFY_LABEL && product) setFlow(FLOW.RESULT);
              else if (barcode) setFlow(FLOW.BARCODE);
              else setFlow(FLOW.CHOOSER);
              setVerifyMode(false);
            }}
          />
        )}

        {flow === FLOW.PROCESSING && (

          <div className="h-full w-full bg-black rounded-3xl flex items-center justify-center">

            <Card className="px-8 py-6 text-center space-y-4">

              <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto" />

              <p className="font-bold">{overlay?.message || 'Procesez…'}</p>

              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden w-48 mx-auto">

                <div

                  className="h-full bg-accent transition-all duration-300"

                  style={{ width: `${(overlay?.progress || 0.3) * 100}%` }}

                />

              </div>

            </Card>

          </div>

        )}

        {overlay && <ScanOverlay {...overlay} />}

        {lookupError && flow === FLOW.LABEL && (

          <div className="absolute bottom-4 inset-x-4 z-20">

            <Card className="p-3 flex gap-2 items-start text-sm text-red-400">

              <AlertCircle className="w-5 h-5 shrink-0" />

              <span>{lookupError}</span>

            </Card>

          </div>

        )}

      </div>

    );

  }



  const showCameraPrompt = flow === FLOW.BARCODE && !cameraReady && !camError;



  return (

    <div className="relative h-full w-full bg-black overflow-hidden rounded-3xl">

      {flow === FLOW.BARCODE && (

        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />

      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />



      {cameraReady && flow === FLOW.BARCODE && (

        <>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-8">

            <motion.div

              animate={{ opacity: [0.4, 1, 0.4] }}

              transition={{ duration: 2, repeat: Infinity }}

              className="w-full max-w-[280px] aspect-[1.6/1] rounded-2xl border-2 border-accent/90 shadow-[0_0_48px_rgba(255,107,74,0.35)]"

            />

            <motion.div

              className="absolute w-[72%] max-w-[240px] h-0.5 bg-accent shadow-lg shadow-accent/60"

              animate={{ y: [-40, 40, -40] }}

              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}

            />

          </div>

          <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-auto">

            <Card className="px-3 py-2.5 flex items-center gap-2 !rounded-xl !bg-black/55 backdrop-blur-md">

              <ScanLine className="w-4 h-4 text-accent shrink-0" />

              <span className="text-xs font-semibold">

                {lookupQuery.isFetching ? 'Caut în baze…' : scanning ? 'Scanez codul' : 'Încadrează codul'}

              </span>

            </Card>

            <button

              type="button"

              onClick={() => setTorch((t) => !t)}

              className="touch-target p-3 rounded-2xl bg-black/55 border border-white/10 backdrop-blur-md"

            >

              <Flashlight className={`w-5 h-5 ${torch ? 'text-yellow-400' : 'text-white'}`} />

            </button>

          </div>

        </>

      )}



      {overlay && flow !== FLOW.RESULT && <ScanOverlay {...overlay} />}



      {lookupQuery.isFetching && (

        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">

          <Card className="px-6 py-5 flex items-center gap-3">

            <Loader2 className="w-6 h-6 animate-spin text-accent" />

            <span className="font-semibold text-sm">Caut produsul…</span>

          </Card>

        </div>

      )}



      {lookupError && flow === FLOW.BARCODE && !lookupQuery.isFetching && (

        <div className="absolute top-20 inset-x-3 z-20 pointer-events-auto space-y-2">

          <Card className="p-3 flex gap-2 items-start text-sm text-red-400">

            <AlertCircle className="w-5 h-5 shrink-0" />

            <span>{lookupError}</span>

          </Card>

          <div className="flex gap-2">

            <Button size="sm" variant="secondary" className="flex-1" onClick={() => { setLookupError(null); resetDetection(); setBarcode(null); }}>

              <RefreshCw className="w-4 h-4" /> Rescan

            </Button>

            <Button size="sm" className="flex-1" onClick={() => openLabel(barcode)}>

              <Camera className="w-4 h-4" /> Etichetă

            </Button>

          </div>

        </div>

      )}



      {showCameraPrompt && (

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/90 pointer-events-auto">

          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-5">

            <Camera className="w-10 h-10 text-accent" />

          </div>

          <h2 className="text-xl font-bold text-center">Scanează codul de bare</h2>

          <p className="text-sm text-muted text-center mt-2 max-w-xs leading-relaxed">

            Găsit în cache/cloud → instant. Necunoscut → etichetă AI automat.

          </p>

          <Button size="lg" className="w-full max-w-xs mt-6" onClick={startCamera}>

            <Camera className="w-5 h-5" /> Pornește camera

          </Button>

          <Button size="md" variant="secondary" className="w-full max-w-xs mt-3" onClick={() => openLabel(null)}>

            Sau fotografiază eticheta

          </Button>

        </div>

      )}



      {camError && flow === FLOW.BARCODE && (

        <div className="absolute inset-0 flex items-center justify-center p-5 z-20 bg-black/85 pointer-events-auto">

          <Card className="p-5 text-center max-w-sm space-y-3">

            <p className="text-sm text-red-400 leading-relaxed">{camError}</p>

            <Button variant="secondary" size="md" onClick={restart} className="w-full">

              <RefreshCw className="w-4 h-4" /> Reîncearcă camera

            </Button>

            <Button size="md" className="w-full" onClick={() => openLabel(null)}>

              <Camera className="w-4 h-4" /> Fotografiază eticheta

            </Button>

            <p className="text-xs text-muted flex items-center justify-center gap-1">

              <Keyboard className="w-3 h-3" /> Sau introdu codul manual jos

            </p>

          </Card>

        </div>

      )}



      {flow === FLOW.BARCODE && !product && (

        <form

          onSubmit={submitManual}

          className="absolute inset-x-3 z-10 flex gap-2 pointer-events-auto"

          style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}

        >

          <input

            type="text"

            inputMode="numeric"

            placeholder="Cod manual (EAN)…"

            value={manualCode}

            onChange={(e) => setManualCode(e.target.value)}

            className="flex-1 px-4 py-3.5 rounded-2xl bg-black/65 border border-white/10 placeholder:text-muted backdrop-blur-md text-white"

          />

          <Button type="submit" size="md" disabled={manualCode.replace(/\D/g, '').length < 8} className="shrink-0">

            OK

          </Button>

        </form>

      )}



      {flow === FLOW.BARCODE && cameraReady && (

        <button

          type="button"

          onClick={() => openLabel(barcode)}

          className="absolute z-10 left-1/2 -translate-x-1/2 touch-target px-4 py-2 rounded-full bg-black/60 border border-white/10 text-xs font-semibold flex items-center gap-1.5 pointer-events-auto"

          style={{ bottom: 'max(4.5rem, calc(env(safe-area-inset-bottom) + 3.5rem))' }}

        >

          <Camera className="w-4 h-4" /> Etichetă (fallback)

        </button>

      )}



      <AnimatePresence>

        {product && flow === FLOW.RESULT && (
          <ProductResultSheet
            product={product}
            onAdd={handleAdd}
            onClose={dismissAll}
            onVerifyLabel={() => openLabel(barcode, true)}
            labelPreview={labelPreview}
            comparison={comparison}
            pendingConfirm={pendingConfirm}
            onConfirmLabel={handleConfirmLabel}
            onDismissCompare={() => {
              setLabelPreview(null);
              setComparison(null);
              setPendingConfirm(false);
            }}
          />
        )}

      </AnimatePresence>

    </div>

  );

}



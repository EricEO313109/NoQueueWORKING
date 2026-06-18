import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';

const hints = new Map([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.QR_CODE,
  ]],
  [DecodeHintType.TRY_HARDER, true],
]);

const CAMERA_CONSTRAINTS = [
  { video: { facingMode: { exact: 'environment' } }, audio: false },
  { video: { facingMode: 'environment' }, audio: false },
  { video: { facingMode: { ideal: 'environment' } }, audio: false },
  { video: true, audio: false },
];

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'];

function mapCameraError(e) {
  if (e?.name === 'NotAllowedError') {
    return 'Acces la cameră refuzat. Apasă „Permite” când browserul întreabă, sau activează camera în Setări → Safari/Chrome.';
  }
  if (e?.name === 'NotFoundError') {
    return 'Nicio cameră găsită pe acest dispozitiv.';
  }
  if (e?.name === 'NotReadableError') {
    return 'Camera e folosită de altă aplicație. Închide celelalte app-uri și reîncearcă.';
  }
  if (e?.name === 'OverconstrainedError') {
    return 'Camera nu suportă modul cerut. Reîncearcă.';
  }
  if (!window.isSecureContext) {
    return 'Camera necesită HTTPS. Deschide aplicația din link-ul Vercel (https://...).';
  }
  return e?.message || 'Camera indisponibilă.';
}

async function openCameraStream() {
  let lastErr;
  for (const constraints of CAMERA_CONSTRAINTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('Camera indisponibilă');
}

async function attachStream(video, stream) {
  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = true;
  await video.play();
}

function supportsBarcodeDetector() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export function useBarcodeScanner({ onDetected }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const lastCode = useRef('');
  const sessionLocked = useRef(false);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    controlsRef.current?.stop?.();
    controlsRef.current = null;
    readerRef.current?.reset?.();
    readerRef.current = null;
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
    setCameraReady(false);
  }, []);

  const handleCode = useCallback((code) => {
    const clean = String(code || '').replace(/\D/g, '');
    if (clean.length < 8) return;
    if (sessionLocked.current) return;
    if (clean === lastCode.current) return;

    sessionLocked.current = true;
    lastCode.current = clean;
    onDetectedRef.current?.(clean);
    navigator.vibrate?.(40);
  }, []);

  const startNativeDetector = useCallback(async (video, stream) => {
    let formats = BARCODE_FORMATS;
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      formats = BARCODE_FORMATS.filter((f) => supported.includes(f));
    } catch {
      /* use defaults */
    }
    const detector = new window.BarcodeDetector({ formats });
    runningRef.current = true;

    const loop = async () => {
      if (!runningRef.current) return;
      if (video.readyState >= video.HAVE_ENOUGH_DATA) {
        try {
          const codes = await detector.detect(video);
          if (codes?.[0]?.rawValue) handleCode(codes[0].rawValue);
        } catch {
          /* frame skip */
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    streamRef.current = stream;
    setScanning(true);
    setCameraReady(true);
  }, [handleCode]);

  const startZxing = useCallback(async (video, stream) => {
    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;
    const controls = await reader.decodeFromStream(stream, video, (result) => {
      if (result) handleCode(result.getText());
    });
    controlsRef.current = controls;
    streamRef.current = stream;
    setScanning(true);
    setCameraReady(true);
  }, [handleCode]);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Browserul nu suportă camera. Folosește Chrome sau Safari.');
      return;
    }

    setError(null);
    stop();

    try {
      const stream = await openCameraStream();
      await attachStream(videoRef.current, stream);

      if (supportsBarcodeDetector()) {
        await startNativeDetector(videoRef.current, stream);
      } else {
        await startZxing(videoRef.current, stream);
      }
    } catch (e) {
      setError(mapCameraError(e));
      stop();
    }
  }, [stop, startNativeDetector, startZxing]);

  const resetDetection = useCallback(() => {
    lastCode.current = '';
    sessionLocked.current = false;
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    videoRef,
    error,
    scanning,
    cameraReady,
    startCamera,
    stopCamera: stop,
    resetDetection,
    restart: startCamera,
  };
}

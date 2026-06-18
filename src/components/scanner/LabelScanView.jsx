import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, RefreshCw, Zap } from 'lucide-react';
import { Button, Card } from '@/components/ui/primitives';
import { useLabelCamera } from '@/hooks/useLabelCamera';

export default function LabelScanView({ barcode, onCapture, onCancel }) {
  const { videoRef, error, cameraReady, startCamera, capturePhoto } = useLabelCamera();
  const [capturing, setCapturing] = useState(false);
  const fileRef = useRef(null);

  const handleCapture = useCallback(async () => {
    setCapturing(true);
    try {
      const dataUrl = await capturePhoto();
      if (dataUrl) onCapture(dataUrl);
    } finally {
      setCapturing(false);
    }
  }, [capturePhoto, onCapture]);

  useEffect(() => {
    if (!cameraReady && !error) startCamera();
  }, [cameraReady, error, startCamera]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCapture(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden rounded-3xl">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* Label frame overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
        <motion.div
          animate={{ borderColor: ['rgba(34,211,238,0.5)', 'rgba(34,211,238,1)', 'rgba(34,211,238,0.5)'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-full max-w-[300px] aspect-[3/4] rounded-2xl border-2 border-cyan-400/80"
        >
          <div className="absolute -top-8 left-0 right-0 text-center">
            <span className="text-xs font-bold text-cyan-400 bg-black/60 px-3 py-1 rounded-full">
              Tabel nutrițional
            </span>
          </div>
        </motion.div>
      </div>

      {!cameraReady && !error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/90">
          <Zap className="w-12 h-12 text-cyan-400 mb-4" />
          <h2 className="text-lg font-bold text-center">Mod AI — scan etichetă</h2>
          <p className="text-sm text-muted text-center mt-2 max-w-xs">
            {barcode ? (
              <>Codul <span className="font-mono text-white">{barcode}</span> nu e în baza de date. </>
            ) : null}
            Fotografiază tabelul „Declarație nutrițională” — extragem caloriile automat.
          </p>
          <Button size="lg" className="w-full max-w-xs mt-6" onClick={startCamera}>
            <Camera className="w-5 h-5" /> Activează camera
          </Button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm text-muted mt-4 underline"
          >
            Sau încarcă poză din galerie
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <Card className="p-5 text-center space-y-3 max-w-sm">
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="secondary" onClick={startCamera} className="w-full">
              <RefreshCw className="w-4 h-4" /> Reîncearcă
            </Button>
          </Card>
        </div>
      )}

      {cameraReady && (
        <div
          className="absolute inset-x-0 bottom-0 z-20 p-4 flex flex-col gap-3"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleCapture}
            disabled={capturing}
            className="mx-auto w-20 h-20 rounded-full bg-cyan-400 border-4 border-white/30 flex items-center justify-center shadow-lg shadow-cyan-400/40"
          >
            <Camera className="w-8 h-8 text-black" />
          </motion.button>
          <p className="text-center text-xs text-muted">Apasă pentru a captura eticheta</p>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted">
            Anulează
          </Button>
        </div>
      )}
    </div>
  );
}

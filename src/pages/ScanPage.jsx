import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Zap } from 'lucide-react';
import BarcodeScannerView from '@/components/scanner/BarcodeScannerView';
import { setPendingScannedFood } from '@/lib/cache/frequentFoods';

export default function ScanPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get('mode') === 'label' ? 'label' : 'barcode';
  const target = params.get('target') || 'log';
  const returnTo = params.get('return') || '/';
  const [success, setSuccess] = useState(null);

  const onSuccess = (entry, product) => {
    if (target === 'recipe' && product) {
      setPendingScannedFood({ target, product });
    }
    setSuccess(entry);
    setTimeout(() => navigate(returnTo), 900);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black h-app overflow-hidden">
      <header className="relative z-20 flex items-center justify-between px-4 py-3 safe-top shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="touch-target p-2 -ml-2 rounded-xl bg-white/10 active:bg-white/20"
          aria-label="Înapoi"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center pointer-events-none">
          <p className="text-[10px] text-muted uppercase tracking-widest font-bold">StilMacros</p>
          <p className="font-bold text-sm">Scanează</p>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 min-h-0 px-2 pb-2">
        <BarcodeScannerView
          onSuccess={onSuccess}
          initialMode={initialMode}
          logOnAdd={target !== 'recipe'}
        />
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="text-center px-8"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                <Check className="w-12 h-12 text-emerald-400" />
              </div>
              <p className="text-xl font-bold leading-snug">{success.name}</p>
              <p className="text-4xl font-extrabold text-accent mt-2 tabular-nums">+{success.calories}</p>
              <p className="text-sm text-muted mt-1">kcal</p>
              <p className="text-sm text-muted mt-4 flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 text-accent" /> Adăugat instant
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

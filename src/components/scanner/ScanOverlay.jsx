import { motion } from 'framer-motion';
import { ScanLine, Sparkles, Camera, Check, Loader2, AlertCircle } from 'lucide-react';

const STAGES = {
  'scan-barcode': { icon: ScanLine, label: 'Scanez codul…', color: 'text-accent' },
  'barcode-found': { icon: Check, label: 'Produs găsit!', color: 'text-emerald-400' },
  'barcode-missing': { icon: AlertCircle, label: 'Necunoscut — scan etichetă', color: 'text-yellow-400' },
  'label-scan': { icon: Camera, label: 'Fotografiază tabelul nutrițional', color: 'text-cyan-400' },
  'processing': { icon: Loader2, label: 'AI extrage macro-uri…', color: 'text-accent', spin: true },
  'macros-found': { icon: Sparkles, label: 'Macro-uri detectate!', color: 'text-emerald-400' },
};

export default function ScanOverlay({ stage, progress = 0, message }) {
  const cfg = STAGES[stage] || STAGES['scan-barcode'];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-14 inset-x-3 z-20 pointer-events-none"
    >
      <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center ${cfg.color}`}>
            <Icon className={`w-5 h-5 ${cfg.spin ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${cfg.color}`}>{message || cfg.label}</p>
            {progress > 0 && stage === 'processing' && (
              <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

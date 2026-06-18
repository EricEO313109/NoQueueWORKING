import { motion } from 'framer-motion';
import { Sparkles, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui/primitives';

export default function CoachBanner({ insights }) {
  if (!insights?.length) return null;
  const top = insights[0];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="p-4 border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">AI Coach</p>
            <p className="text-sm leading-snug">{top.message}</p>
            {top.action === 'scan' && (
              <Link to="/scan">
                <Button size="sm" variant="secondary" className="mt-3 gap-1">
                  <ScanLine className="w-3.5 h-3.5" /> Scan now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

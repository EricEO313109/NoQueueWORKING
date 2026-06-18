import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanLine, Camera, Search, MessageSquareText, Package, UtensilsCrossed,
} from 'lucide-react';
import { Card } from '@/components/ui/primitives';

const ACTIONS = [
  { to: '/scan?mode=barcode', icon: ScanLine, label: 'Scanează cod', desc: 'Produse ambalate', color: 'bg-accent' },
  { to: '/scan?mode=label', icon: Camera, label: 'Foto etichetă', desc: 'Tabel nutrițional', color: 'bg-cyan-600' },
  { to: '/ingredients', icon: Search, label: 'Caută ingredient', desc: 'Pui, orez, ouă…', color: 'bg-emerald-600' },
  { to: '/log', icon: MessageSquareText, label: 'Descrie masa', desc: '100g pui, orez, mayo…', color: 'bg-violet-600' },
  { to: '/products', icon: Package, label: 'Produsele mele', desc: 'Scanate anterior', color: 'bg-surface-2' },
  { to: '/meals', icon: UtensilsCrossed, label: 'Mesele mele', desc: 'Rețete salvate', color: 'bg-surface-2' },
];

export default function AddHubPage() {
  return (
    <div className="px-4 pt-4 safe-top space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Adaugă aliment</h1>
        <p className="text-sm text-muted mt-1">Scan, ingredient sau descriere în cuvinte</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ to, icon: Icon, label, desc, color }) => (
          <Link key={to} to={to} className="touch-target">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Card className="p-4 h-full flex flex-col gap-3 hover:border-white/15 transition-colors">
                <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">{label}</p>
                  <p className="text-[10px] text-muted mt-0.5">{desc}</p>
                </div>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

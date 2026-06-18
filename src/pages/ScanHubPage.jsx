import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanLine, Camera, Search, MessageSquareText, History,
} from 'lucide-react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { PageHeader, Card } from '@/components/ui/primitives';
import SearchFoodRow from '@/components/app/SearchFoodRow';

const ACTIONS = [
  {
    to: '/scanner?mode=barcode',
    icon: ScanLine,
    label: 'Scan Barcode',
    desc: 'Packaged products · OpenFoodFacts',
    accent: 'bg-accent',
  },
  {
    to: '/scanner?mode=label',
    icon: Camera,
    label: 'Take Label Photo',
    desc: 'Nutrition facts OCR',
    accent: 'bg-macro-cal',
  },
  {
    to: '/ingredients',
    icon: Search,
    label: 'Search Ingredient',
    desc: 'Chicken, rice, eggs…',
    accent: 'bg-macro-carbs',
  },
  {
    to: '/log',
    icon: MessageSquareText,
    label: 'Describe Meal',
    desc: '200g beef, tortilla, cheese…',
    accent: 'bg-macro-protein',
  },
];

export default function ScanHubPage() {
  const { recentFoods, addEntry } = useNutritionStore();
  const scanned = recentFoods.filter((f) => f.barcode).slice(0, 6);

  return (
    <div className="px-4 pt-3 safe-top space-y-5 max-w-lg mx-auto">
      <PageHeader label="QUICK LOG" title="Scan" />

      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ to, icon: Icon, label, desc, accent }) => (
          <Link key={to} to={to} className="touch-target">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Card className="p-4 h-full min-h-[120px] flex flex-col gap-3 hover:border-white/12 transition-colors" elevated>
                <div className={`w-12 h-12 rounded-2xl ${accent} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">{label}</p>
                  <p className="text-[10px] text-muted mt-1 leading-snug">{desc}</p>
                </div>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <History className="w-4 h-4 text-muted" />
          <p className="text-sm font-bold">Scan History</p>
        </div>
        {scanned.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted">
            Scanned products appear here for quick re-logging
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            {scanned.map((food, i) => (
              <SearchFoodRow
                key={`${food.barcode}-${i}`}
                name={food.name}
                serving={food.barcode ? `Barcode ${food.barcode}` : '1 serving'}
                calories={food.calories}
                protein={food.protein}
                fat={food.fat}
                carbs={food.carbs}
                icon="📦"
                onQuickAdd={() => addEntry({ ...food, meal: 'snack' })}
              />
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

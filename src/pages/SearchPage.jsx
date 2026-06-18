import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ScanLine, MessageSquareText, Package, UtensilsCrossed, BookOpen } from 'lucide-react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { PageHeader, Input, Card, SectionHeader } from '@/components/ui/primitives';
import SearchFoodRow from '@/components/app/SearchFoodRow';

const SECTIONS = [
  { title: 'Quick actions', items: [
    { to: '/ingredients', icon: Search, label: 'Search ingredients', desc: 'USDA & verified DB' },
    { to: '/scanner?mode=barcode', icon: ScanLine, label: 'Scan barcode', desc: 'Packaged products' },
    { to: '/log', icon: MessageSquareText, label: 'Describe meal', desc: 'Natural language' },
    { to: '/my-foods', icon: Package, label: 'My Foods', desc: 'Catalog & favorites' },
  ]},
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { recentFoods, favorites, recipes, addEntry } = useNutritionStore();

  const filteredRecent = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recentFoods.slice(0, 8);
    return recentFoods.filter((f) => f.name?.toLowerCase().includes(q)).slice(0, 12);
  }, [recentFoods, query]);

  const filteredFavorites = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favorites.slice(0, 6);
    return favorites.filter((f) => f.name?.toLowerCase().includes(q));
  }, [favorites, query]);

  const goIngredientSearch = () => {
    if (query.trim().length >= 2) {
      navigate(`/ingredients?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="px-4 pt-3 safe-top space-y-5 max-w-lg mx-auto">
      <PageHeader label="LOG FOODS FASTER" title="Search" />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
        <Input
          className="pl-12 pr-24 h-12"
          placeholder="Search for a food"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && goIngredientSearch()}
        />
        {query.trim().length >= 2 && (
          <button
            type="button"
            onClick={goIngredientSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 rounded-full bg-white text-black text-xs font-bold"
          >
            Search
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
        {[
          { to: '/ingredients', label: 'Ingredients', icon: '🥗' },
          { to: '/products', label: 'Products', icon: '📦' },
          { to: '/meals', label: 'Meals', icon: '🍲' },
          { to: '/recipes', label: 'Recipes', icon: '📖' },
        ].map((chip) => (
          <Link
            key={chip.to}
            to={chip.to}
            className="shrink-0 flex flex-col items-center gap-1 w-16"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center text-2xl border border-white/[0.06]">
              {chip.icon}
            </div>
            <span className="text-[10px] font-medium text-muted text-center leading-tight">{chip.label}</span>
          </Link>
        ))}
      </div>

      {filteredRecent.length > 0 && (
        <section>
          <SectionHeader title="Recent Foods" />
          <Card className="overflow-hidden p-0">
            {filteredRecent.map((food, i) => (
              <SearchFoodRow
                key={`r-${i}`}
                name={food.name}
                serving={food.grams ? `${food.grams}g` : 'Recent'}
                calories={food.calories}
                protein={food.protein}
                fat={food.fat}
                carbs={food.carbs}
                onQuickAdd={() => addEntry({ ...food, meal: 'snack' })}
              />
            ))}
          </Card>
        </section>
      )}

      {filteredFavorites.length > 0 && (
        <section>
          <SectionHeader title="Saved Foods" />
          <Card className="overflow-hidden p-0">
            {filteredFavorites.map((food, i) => (
              <SearchFoodRow
                key={`f-${i}`}
                name={food.name}
                serving="Favorite"
                calories={food.calories}
                protein={food.protein}
                fat={food.fat}
                carbs={food.carbs}
                onQuickAdd={() => addEntry({ ...food, meal: 'snack' })}
              />
            ))}
          </Card>
        </section>
      )}

      <section>
        <SectionHeader title="Browse" />
        <Card className="overflow-hidden p-0 divide-y divide-white/[0.06]">
          {[
            { to: '/ingredients', icon: Search, label: 'Ingredients', sub: 'Raw, cooked, dry weights' },
            { to: '/products', icon: Package, label: 'Barcode Products', sub: 'Scanned & verified' },
            { to: '/meals', icon: UtensilsCrossed, label: 'Saved Meals', sub: 'Parsed meal templates' },
            { to: '/recipes', icon: BookOpen, label: 'Custom Foods & Recipes', sub: 'Build your own' },
            { to: '/my-foods', icon: Package, label: 'My Foods Catalog', sub: 'All saved items' },
          ].map(({ to, icon: Icon, label, sub }) => (
            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02]">
              <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
                <Icon className="w-5 h-5 text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-[10px] text-muted">{sub}</p>
              </div>
            </Link>
          ))}
        </Card>
      </section>
    </div>
  );
}

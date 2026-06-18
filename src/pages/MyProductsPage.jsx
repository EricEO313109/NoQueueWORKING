import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ScanLine, Clock, Loader2 } from 'lucide-react';
import { Card, Input, Button, PageHeader } from '@/components/ui/primitives';
import { fetchProductCatalog, searchProductCatalog } from '@/lib/products/productLookup';
import { productToLogEntry } from '@/lib/api/openFoodFacts';
import { useNutritionStore } from '@/store/useNutritionStore';

function MacroPills({ per100g }) {
  const p = per100g || {};
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <span className="text-xs px-2 py-1 rounded-lg bg-accent/15 text-accent font-semibold tabular-nums">
        {Math.round(p.calories || 0)} kcal
      </span>
      <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/15 text-blue-400 tabular-nums">P {p.protein ?? 0}g</span>
      <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/15 text-yellow-400 tabular-nums">C {p.carbs ?? 0}g</span>
      <span className="text-xs px-2 py-1 rounded-lg bg-pink-500/15 text-pink-400 tabular-nums">F {p.fat ?? 0}g</span>
    </div>
  );
}

export default function MyProductsPage() {
  const navigate = useNavigate();
  const addEntry = useNutritionStore((s) => s.addEntry);
  const [query, setQuery] = useState('');
  const [recentOnly, setRecentOnly] = useState(false);

  const catalogQuery = useQuery({
    queryKey: ['product-catalog', query],
    queryFn: () => (query.trim() ? searchProductCatalog(query) : fetchProductCatalog()),
    staleTime: 30_000,
  });

  const products = useMemo(() => {
    let list = catalogQuery.data || [];
    if (recentOnly) {
      list = [...list].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    }
    return list;
  }, [catalogQuery.data, recentOnly]);

  const logSavedProduct = (product) => {
    const entry = productToLogEntry(product, product.defaultGrams || 100, 'snack');
    addEntry(entry);
    navigate('/log');
  };

  return (
    <div className="px-4 pt-3 safe-top space-y-4 max-w-lg mx-auto">
      <PageHeader
        label="PRODUCTS"
        title="Barcode Products"
        right={
          <Button size="sm" variant="secondary" onClick={() => navigate('/scanner')}>
            <ScanLine className="w-4 h-4" /> Scan
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <Input
          className="pl-10"
          placeholder="Caută după nume sau cod…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={() => setRecentOnly((r) => !r)}
        className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl touch-target ${
          recentOnly ? 'bg-accent text-white' : 'bg-surface-2 text-muted'
        }`}
      >
        <Clock className="w-4 h-4" />
        Recent scanate
      </button>

      {catalogQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}

      {catalogQuery.isError && (
        <Card className="p-4 text-sm text-red-400">Nu am putut încărca catalogul. Verifică conexiunea.</Card>
      )}

      {!catalogQuery.isLoading && products.length === 0 && (
        <Card className="p-6 text-center text-muted text-sm">
          <p>Niciun produs salvat încă.</p>
          <p className="mt-2">Scanează un cod sau fotografiază o etichetă.</p>
          <Button className="mt-4 w-full" onClick={() => navigate('/scanner')}>
            <ScanLine className="w-4 h-4" /> Scanează acum
          </Button>
        </Card>
      )}

      <ul className="space-y-3">
        {products.map((p) => (
          <li key={p.barcode || p.name}>
            <button
              type="button"
              onClick={() => logSavedProduct(p)}
              className="w-full text-left touch-target"
            >
              <Card className="p-4 active:bg-surface-2 transition-colors">
                <p className="font-bold leading-snug line-clamp-2">{p.name}</p>
                {p.brand && <p className="text-xs text-muted mt-0.5">{p.brand}</p>}
                {p.barcode && (
                  <p className="text-[10px] text-muted mt-1 font-mono tabular-nums">{p.barcode}</p>
                )}
                <MacroPills per100g={p.per100g} />
              </Card>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

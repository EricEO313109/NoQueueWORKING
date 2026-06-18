import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { PageHeader, Input, Card, SectionHeader } from '@/components/ui/primitives';
import SearchFoodRow from '@/components/app/SearchFoodRow';

export default function MyFoodsPage() {
  const [query, setQuery] = useState('');
  const { recentFoods, favorites, recipes, addEntry } = useNutritionStore();

  const filter = (list) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((f) => f.name?.toLowerCase().includes(q));
  };

  const products = useMemo(
    () => filter(recentFoods.filter((f) => f.barcode)),
    [recentFoods, query],
  );
  const ingredients = useMemo(
    () => filter(recentFoods.filter((f) => f.ingredientId && !f.barcode)),
    [recentFoods, query],
  );
  const favs = useMemo(() => filter(favorites), [favorites, query]);

  return (
    <div className="px-4 pt-3 safe-top space-y-5 max-w-lg mx-auto">
      <PageHeader label="CATALOG" title="My Foods" />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <Input
          className="pl-12"
          placeholder="Search my foods…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {favs.length > 0 && (
        <section>
          <SectionHeader title="Favorites" action={<Star className="w-4 h-4 text-amber-400" />} />
          <Card className="overflow-hidden p-0">
            {favs.map((food, i) => (
              <SearchFoodRow
                key={`fav-${i}`}
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

      {products.length > 0 && (
        <section>
          <SectionHeader title="Scanned Products" />
          <Card className="overflow-hidden p-0">
            {products.map((food, i) => (
              <SearchFoodRow
                key={`p-${i}`}
                name={food.name}
                serving={food.barcode || 'Product'}
                calories={food.calories}
                protein={food.protein}
                fat={food.fat}
                carbs={food.carbs}
                icon="📦"
                onQuickAdd={() => addEntry({ ...food, meal: 'snack' })}
              />
            ))}
          </Card>
        </section>
      )}

      {ingredients.length > 0 && (
        <section>
          <SectionHeader title="Saved Ingredients" />
          <Card className="overflow-hidden p-0">
            {ingredients.map((food, i) => (
              <SearchFoodRow
                key={`i-${i}`}
                name={food.name}
                serving={food.grams ? `${food.grams}g` : 'Ingredient'}
                calories={food.calories}
                protein={food.protein}
                fat={food.fat}
                carbs={food.carbs}
                icon="🥗"
                onQuickAdd={() => addEntry({ ...food, meal: 'snack' })}
              />
            ))}
          </Card>
        </section>
      )}

      <section>
        <SectionHeader title="Saved Meals & Recipes" />
        <Card className="overflow-hidden p-0">
          {recipes.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">
              <Link to="/meals" className="text-white underline">Saved meals</Link>
              {' · '}
              <Link to="/recipes" className="text-white underline">Recipes</Link>
            </p>
          ) : (
            recipes.map((r) => (
              <SearchFoodRow
                key={r.id}
                to={`/recipes`}
                name={r.name}
                serving={`${r.servings || 1} servings`}
                calories={r.calories || 0}
                protein={r.protein || 0}
                fat={r.fat || 0}
                carbs={r.carbs || 0}
                icon="🍲"
              />
            ))
          )}
        </Card>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNutritionStore } from '@/store/useNutritionStore';

export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(() => useNutritionStore.persist.hasHydrated());

  useEffect(() => {
    if (useNutritionStore.persist.hasHydrated()) {
      setHydrated(true);
      return undefined;
    }
    return useNutritionStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  return hydrated;
}

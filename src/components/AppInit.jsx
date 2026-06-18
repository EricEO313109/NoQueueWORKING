import { useEffect } from 'react';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { useNutritionStore } from '@/store/useNutritionStore';

/** Applies default profile only after persisted state has rehydrated. */
export default function AppInit() {
  const hydrated = useStoreHydrated();

  useEffect(() => {
    if (!hydrated) return;
    useNutritionStore.getState().ensureDefaultProfile();
  }, [hydrated]);

  return null;
}
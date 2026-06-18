import { useEffect } from 'react';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { useNutritionStore } from '@/store/useNutritionStore';
import { scheduleCloudSync, pullCloudState, applyCloudState, mergeCloudEntries } from '@/lib/cloud/sync';
import { isCloudEnabled } from '@/lib/api/client';

export default function CloudSync() {
  const hydrated = useStoreHydrated();

  useEffect(() => {
    if (!hydrated || !isCloudEnabled()) return undefined;

    let cancelled = false;

    pullCloudState()
      .then((data) => {
        if (cancelled || !data) return;
        const patch = applyCloudState(data);
        if (!patch || !Object.keys(patch).length) return;

        useNutritionStore.setState((state) => {
          const entries = patch.entries
            ? mergeCloudEntries(state.entries, patch.entries, state.deletedEntryIds)
            : state.entries;
          return { ...state, ...patch, entries };
        });
      })
      .catch(() => {});

    const unsub = useNutritionStore.subscribe(() => {
      scheduleCloudSync(() => useNutritionStore.getState());
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [hydrated]);

  return null;
}

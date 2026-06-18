import { useStoreHydrated } from '@/hooks/useStoreHydrated';

export default function StoreHydrationGate({ children }) {
  const hydrated = useStoreHydrated();

  if (!hydrated) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[hsl(var(--bg))]" aria-busy="true" />
    );
  }

  return children;
}

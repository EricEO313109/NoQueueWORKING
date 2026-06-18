import { createContext, useContext } from 'react';
import { useCalorieTracker } from '@/hooks/useCalorieTracker';

const CalorieTrackerContext = createContext(null);

export function CalorieTrackerProvider({ children }) {
  const tracker = useCalorieTracker();
  return (
    <CalorieTrackerContext.Provider value={tracker}>
      {children}
    </CalorieTrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = useContext(CalorieTrackerContext);
  if (!ctx) throw new Error('useTracker must be used within CalorieTrackerProvider');
  return ctx;
}

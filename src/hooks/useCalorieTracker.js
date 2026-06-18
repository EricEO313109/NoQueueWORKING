import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  entriesForDate,
  loadState,
  saveState,
  sumMacros,
  todayKey,
  uid,
} from '@/lib/calorieStorage';

export function useCalorieTracker() {
  const [goal, setGoalState] = useState(2100);
  const [macroTargets, setMacroTargets] = useState({ protein: 160, carbs: 210, fat: 70 });
  const [expenditure, setExpenditure] = useState(2350);
  const [entries, setEntries] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [hydrated, setHydrated] = useState(false);
  const [plate, setPlate] = useState([]);

  useEffect(() => {
    const saved = loadState();
    setGoalState(saved.goal);
    setMacroTargets(saved.macroTargets);
    setExpenditure(saved.expenditure);
    setEntries(saved.entries);
    setFavorites(saved.favorites);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ goal, macroTargets, expenditure, entries, favorites });
  }, [goal, macroTargets, expenditure, entries, favorites, hydrated]);

  const dayEntries = useMemo(
    () => entriesForDate(entries, selectedDate),
    [entries, selectedDate]
  );

  const totals = useMemo(() => sumMacros(dayEntries), [dayEntries]);
  const plateTotals = useMemo(() => sumMacros(plate), [plate]);

  const remaining = {
    calories: goal - totals.calories,
    protein: macroTargets.protein - totals.protein,
    carbs: macroTargets.carbs - totals.carbs,
    fat: macroTargets.fat - totals.fat,
  };

  const addToPlate = useCallback((item) => {
    setPlate((prev) => [...prev, { ...item, tempId: item.tempId || uid() }]);
  }, []);

  const addManyToPlate = useCallback((items) => {
    setPlate((prev) => [...prev, ...items.map((i) => ({ ...i, tempId: i.tempId || uid() }))]);
  }, []);

  const removeFromPlate = useCallback((tempId) => {
    setPlate((prev) => prev.filter((p) => p.tempId !== tempId));
  }, []);

  const clearPlate = useCallback(() => setPlate([]), []);

  const logPlate = useCallback((meal) => {
    if (!plate.length) return;
    setEntries((prev) => [
      ...prev,
      ...plate.map((p) => ({
        id: uid(),
        name: p.name,
        calories: p.calories,
        protein: p.protein,
        carbs: p.carbs,
        fat: p.fat,
        meal,
        date: selectedDate,
      })),
    ]);
    setPlate([]);
  }, [plate, selectedDate]);

  const addEntry = useCallback((entry) => {
    setEntries((prev) => [
      ...prev,
      { ...entry, id: uid(), date: selectedDate },
    ]);
  }, [selectedDate]);

  const removeEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleFavorite = useCallback((food) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === food.id);
      if (exists) return prev.filter((f) => f.id !== food.id);
      return [...prev, food];
    });
  }, []);

  const setGoal = useCallback((value) => {
    setGoalState(Math.max(500, Math.min(10000, Number(value) || 2100)));
  }, []);

  const setTargets = useCallback((targets) => {
    setMacroTargets((prev) => ({ ...prev, ...targets }));
  }, []);

  const shiftDate = useCallback((days) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  }, [selectedDate]);

  const copyYesterday = useCallback(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const yKey = d.toISOString().slice(0, 10);
    const yesterday = entriesForDate(entries, yKey);
    if (!yesterday.length) return 0;
    setEntries((prev) => [
      ...prev,
      ...yesterday.map((e) => ({ ...e, id: uid(), date: selectedDate })),
    ]);
    return yesterday.length;
  }, [entries, selectedDate]);

  return {
    goal,
    setGoal,
    macroTargets,
    setTargets,
    expenditure,
    setExpenditure,
    selectedDate,
    setSelectedDate,
    shiftDate,
    entries,
    dayEntries,
    totals,
    remaining,
    plate,
    plateTotals,
    addToPlate,
    addManyToPlate,
    removeFromPlate,
    clearPlate,
    logPlate,
    addEntry,
    removeEntry,
    favorites,
    toggleFavorite,
    copyYesterday,
    hydrated,
    isToday: selectedDate === todayKey(),
  };
}

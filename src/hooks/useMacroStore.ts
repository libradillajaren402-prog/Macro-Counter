import { useCallback, useEffect, useState } from 'react';
import {
  CURATED_FOOD_CATALOG,
  DEFAULT_CALCULATOR_PROFILE,
  DEFAULT_MACRO_TARGETS,
  createInitialSeedLogs,
} from '../data/foodCatalog';
import {
  CalculatorProfile,
  DayLogsMap,
  FoodEntry,
  FoodLibraryItem,
  MacroTargets,
} from '../types/macros';
import { toISODateLocal } from '../utils/macroMath';

const STORAGE_KEYS = {
  logs: 'macroledger_logs_v1',
  targets: 'macroledger_targets_v1',
  profile: 'macroledger_profile_v1',
  customFoods: 'macroledger_custom_foods_v1',
};

function readStorage<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback();
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

export function useMacroStore() {
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toISODateLocal(),
  );
  const [logsByDate, setLogsByDate] = useState<DayLogsMap>(() =>
    readStorage(STORAGE_KEYS.logs, createInitialSeedLogs),
  );
  const [targets, setTargets] = useState<MacroTargets>(() =>
    readStorage(STORAGE_KEYS.targets, () => DEFAULT_MACRO_TARGETS),
  );
  const [profile, setProfile] = useState<CalculatorProfile>(() =>
    readStorage(STORAGE_KEYS.profile, () => DEFAULT_CALCULATOR_PROFILE),
  );
  const [customFoods, setCustomFoods] = useState<FoodLibraryItem[]>(() =>
    readStorage(STORAGE_KEYS.customFoods, () => []),
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logsByDate));
    } catch {
      // Ignore quota errors
    }
  }, [logsByDate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.targets, JSON.stringify(targets));
    } catch {
      // Ignore quota errors
    }
  }, [targets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
    } catch {
      // Ignore quota errors
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.customFoods,
        JSON.stringify(customFoods),
      );
    } catch {
      // Ignore quota errors
    }
  }, [customFoods]);

  const allFoods: FoodLibraryItem[] = [
    ...customFoods,
    ...CURATED_FOOD_CATALOG,
  ];

  const addEntry = useCallback(
    (date: string, entry: Omit<FoodEntry, 'id' | 'createdAt'>) => {
      const newEntry: FoodEntry = {
        ...entry,
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setLogsByDate((prev) => ({
        ...prev,
        [date]: [...(prev[date] ?? []), newEntry],
      }));
    },
    [],
  );

  const updateEntry = useCallback(
    (date: string, entryId: string, patch: Partial<FoodEntry>) => {
      setLogsByDate((prev) => ({
        ...prev,
        [date]: (prev[date] ?? []).map((item) =>
          item.id === entryId ? { ...item, ...patch } : item,
        ),
      }));
    },
    [],
  );

  const removeEntry = useCallback((date: string, entryId: string) => {
    setLogsByDate((prev) => ({
      ...prev,
      [date]: (prev[date] ?? []).filter((item) => item.id !== entryId),
    }));
  }, []);

  const clearDayLog = useCallback((date: string) => {
    setLogsByDate((prev) => ({
      ...prev,
      [date]: [],
    }));
  }, []);

  const copyFromPreviousDay = useCallback((targetDate: string, sourceDate: string) => {
    setLogsByDate((prev) => {
      const sourceEntries = prev[sourceDate] ?? [];
      if (sourceEntries.length === 0) return prev;
      const cloned: FoodEntry[] = sourceEntries.map((item, idx) => ({
        ...item,
        id: `copy-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      }));
      return {
        ...prev,
        [targetDate]: [...(prev[targetDate] ?? []), ...cloned],
      };
    });
  }, []);

  const addCustomFood = useCallback(
    (food: Omit<FoodLibraryItem, 'id' | 'isCustom'>) => {
      const item: FoodLibraryItem = {
        ...food,
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        isCustom: true,
      };
      setCustomFoods((prev) => [item, ...prev]);
      return item;
    },
    [],
  );

  const removeCustomFood = useCallback((foodId: string) => {
    setCustomFoods((prev) => prev.filter((item) => item.id !== foodId));
  }, []);

  const resetDemoData = useCallback(() => {
    setLogsByDate(createInitialSeedLogs());
    setTargets(DEFAULT_MACRO_TARGETS);
    setProfile(DEFAULT_CALCULATOR_PROFILE);
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    logsByDate,
    targets,
    setTargets,
    profile,
    setProfile,
    allFoods,
    customFoods,
    addEntry,
    updateEntry,
    removeEntry,
    clearDayLog,
    copyFromPreviousDay,
    addCustomFood,
    removeCustomFood,
    resetDemoData,
  };
}

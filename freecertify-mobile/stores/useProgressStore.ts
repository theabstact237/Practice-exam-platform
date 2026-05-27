/**
 * Progress store — tracks which units are complete, stars earned per unit.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UnitProgress {
  unitId: string;
  completed: boolean;
  stars: number;      // 0–3
  bestScore: number;  // 0–100 percentage
  completedAt: string | null;
}

interface ProgressState {
  units: Record<string, UnitProgress>; // key: unitId

  completeUnit: (unitId: string, score: number) => void;
  getUnitProgress: (unitId: string) => UnitProgress;
  isUnitUnlocked: (unitId: string, prerequisiteIds: string[]) => boolean;
  loadFromStorage: () => Promise<void>;
  reset: () => void;
}

const STORAGE_KEY = 'freecertify_progress';

const defaultUnit = (unitId: string): UnitProgress => ({
  unitId,
  completed: false,
  stars: 0,
  bestScore: 0,
  completedAt: null,
});

const scoreToStars = (score: number): number => {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  units: {},

  completeUnit: (unitId, score) => {
    const existing = get().units[unitId] || defaultUnit(unitId);
    const newStars = Math.max(existing.stars, scoreToStars(score));
    const newBest = Math.max(existing.bestScore, score);

    const updated: UnitProgress = {
      unitId,
      completed: true,
      stars: newStars,
      bestScore: newBest,
      completedAt: existing.completedAt || new Date().toISOString(),
    };

    set(state => ({
      units: { ...state.units, [unitId]: updated },
    }));

    // Persist
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        const current = raw ? JSON.parse(raw) : {};
        current[unitId] = updated;
        return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      })
      .catch(() => {});
  },

  getUnitProgress: (unitId) => {
    return get().units[unitId] || defaultUnit(unitId);
  },

  isUnitUnlocked: (unitId, prerequisiteIds) => {
    if (prerequisiteIds.length === 0) return true;
    const units = get().units;
    return prerequisiteIds.every(id => units[id]?.completed === true);
  },

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ units: JSON.parse(raw) });
      }
    } catch {
      // use defaults
    }
  },

  reset: () => {
    set({ units: {} });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));

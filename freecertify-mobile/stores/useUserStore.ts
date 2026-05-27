/**
 * Global user store — auth state, profile, XP, streak, and hearts.
 * Persisted via AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

interface UserState {
  user: UserProfile | null;
  xp: number;
  weeklyXp: number;
  streak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  hearts: number;
  maxHearts: number;
  gems: number;
  isPro: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  animationsReduced: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  addXP: (amount: number) => void;
  checkAndUpdateStreak: () => void;
  loseHeart: () => void;
  refillHearts: () => void;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  setPro: (value: boolean) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  reset: () => void;
}

const STORAGE_KEY = 'freecertify_user_state';

const initialState = {
  user: null,
  xp: 0,
  weeklyXp: 0,
  streak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  hearts: 5,
  maxHearts: 5,
  gems: 0,
  isPro: false,
  soundEnabled: true,
  hapticsEnabled: true,
  animationsReduced: false,
};

export const useUserStore = create<UserState>((set, get) => ({
  ...initialState,

  setUser: (user) => {
    set({ user });
    get().saveToStorage();
  },

  addXP: (amount) => {
    set(state => ({
      xp: state.xp + amount,
      weeklyXp: state.weeklyXp + amount,
    }));
    get().saveToStorage();
  },

  checkAndUpdateStreak: () => {
    const today = new Date().toISOString().split('T')[0];
    const state = get();

    if (state.lastStudyDate === today) return; // already studied today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const newStreak =
      state.lastStudyDate === yesterdayStr ? state.streak + 1 : 1;
    const newLongest = Math.max(newStreak, state.longestStreak);

    set({
      streak: newStreak,
      longestStreak: newLongest,
      lastStudyDate: today,
    });
    get().saveToStorage();
  },

  loseHeart: () => {
    set(state => ({
      hearts: Math.max(0, state.hearts - 1),
    }));
    get().saveToStorage();
  },

  refillHearts: () => {
    set(state => ({ hearts: state.maxHearts }));
    get().saveToStorage();
  },

  addGems: (amount) => {
    set(state => ({ gems: state.gems + amount }));
    get().saveToStorage();
  },

  spendGems: (amount) => {
    const state = get();
    if (state.gems < amount) return false;
    set(s => ({ gems: s.gems - amount }));
    get().saveToStorage();
    return true;
  },

  setPro: (value) => {
    set({ isPro: value, hearts: value ? 999 : 5, maxHearts: value ? 999 : 5 });
    get().saveToStorage();
  },

  toggleSound: () => {
    set(state => ({ soundEnabled: !state.soundEnabled }));
    get().saveToStorage();
  },

  toggleHaptics: () => {
    set(state => ({ hapticsEnabled: !state.hapticsEnabled }));
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set(saved);
      }
    } catch {
      // ignore — use defaults
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      const toSave = {
        xp: state.xp,
        weeklyXp: state.weeklyXp,
        streak: state.streak,
        longestStreak: state.longestStreak,
        lastStudyDate: state.lastStudyDate,
        hearts: state.hearts,
        maxHearts: state.maxHearts,
        gems: state.gems,
        isPro: state.isPro,
        soundEnabled: state.soundEnabled,
        hapticsEnabled: state.hapticsEnabled,
        animationsReduced: state.animationsReduced,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore storage errors silently
    }
  },

  reset: () => {
    set(initialState);
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));

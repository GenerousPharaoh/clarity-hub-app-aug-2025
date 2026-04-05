import type { StateCreator } from 'zustand';
import type { AppUser } from '../../types';
import { THEME_KEY } from '../../lib/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

const VALID_THEMES: ThemeMode[] = ['light', 'dark', 'system'];

function loadTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && VALID_THEMES.includes(stored as ThemeMode)) return stored as ThemeMode;
  } catch { /* localStorage unavailable */ }
  return 'system';
}

function saveTheme(mode: ThemeMode) {
  try { localStorage.setItem(THEME_KEY, mode); } catch { /* ignore */ }
}

export interface AuthSlice {
  user: AppUser | null;
  themeMode: ThemeMode;
  setUser: (user: AppUser | null) => void;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  themeMode: loadTheme(),
  setUser: (user) => set({ user }),
  toggleTheme: () =>
    set((state) => {
      const idx = VALID_THEMES.indexOf(state.themeMode);
      const next = VALID_THEMES[(idx + 1) % VALID_THEMES.length];
      saveTheme(next);
      return { themeMode: next };
    }),
  setTheme: (mode) => {
    saveTheme(mode);
    set({ themeMode: mode });
  },
});

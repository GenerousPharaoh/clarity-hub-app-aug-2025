import type { StateCreator } from 'zustand';
import type { AppUser } from '../../types';
import { THEME_KEY } from '../../lib/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AuthSlice {
  user: AppUser | null;
  themeMode: ThemeMode;
  setUser: (user: AppUser | null) => void;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  resolvedTheme: () => 'light' | 'dark';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  themeMode: (localStorage.getItem(THEME_KEY) as ThemeMode) || 'system',
  setUser: (user) => set({ user }),
  toggleTheme: () =>
    set((state) => {
      const cycle: ThemeMode[] = ['light', 'dark', 'system'];
      const idx = cycle.indexOf(state.themeMode);
      const next = cycle[(idx + 1) % cycle.length];
      localStorage.setItem(THEME_KEY, next);
      return { themeMode: next };
    }),
  setTheme: (mode) => {
    localStorage.setItem(THEME_KEY, mode);
    set({ themeMode: mode });
  },
  resolvedTheme: () => {
    const mode = get().themeMode;
    return mode === 'system' ? getSystemTheme() : mode;
  },
});

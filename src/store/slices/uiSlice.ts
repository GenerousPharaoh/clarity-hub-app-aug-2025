import type { StateCreator } from 'zustand';

export interface UISlice {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  focusMode: boolean;
  toggleFocusMode: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  focusMode: false,
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
});

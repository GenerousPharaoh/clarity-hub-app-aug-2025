import type { StateCreator } from 'zustand';

export interface UISlice {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
});

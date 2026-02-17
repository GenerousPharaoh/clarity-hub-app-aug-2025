import type { StateCreator } from 'zustand';

const PROCESS_ON_UPLOAD_KEY = 'clarity-hub-process-on-upload';

function loadProcessOnUpload(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PROCESS_ON_UPLOAD_KEY) === '1';
  } catch {
    return false;
  }
}

function saveProcessOnUpload(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROCESS_ON_UPLOAD_KEY, enabled ? '1' : '0');
  } catch {
    // ignore persistence failures
  }
}

export interface UISlice {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  focusMode: boolean;
  toggleFocusMode: () => void;
  showKeyboardShortcuts: boolean;
  setShowKeyboardShortcuts: (show: boolean) => void;
  showCommandPalette: boolean;
  setShowCommandPalette: (show: boolean) => void;
  processOnUpload: boolean;
  setProcessOnUpload: (enabled: boolean) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  focusMode: false,
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  showKeyboardShortcuts: false,
  setShowKeyboardShortcuts: (show) => set({ showKeyboardShortcuts: show }),
  showCommandPalette: false,
  setShowCommandPalette: (show) => set({ showCommandPalette: show }),
  processOnUpload: loadProcessOnUpload(),
  setProcessOnUpload: (enabled) => {
    saveProcessOnUpload(enabled);
    set({ processOnUpload: enabled });
  },
});

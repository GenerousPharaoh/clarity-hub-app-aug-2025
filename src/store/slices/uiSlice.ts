import type { StateCreator } from 'zustand';
import { AI_ENABLED_KEY } from '../../lib/constants';

const PROCESS_ON_UPLOAD_KEY = 'clarity-hub-process-on-upload';

function loadProcessOnUpload(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    // Default to ON — only disabled if explicitly set to '0'
    const stored = localStorage.getItem(PROCESS_ON_UPLOAD_KEY);
    return stored !== '0';
  } catch {
    return true;
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

function loadAIEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(AI_ENABLED_KEY);
    return stored !== '0';
  } catch {
    return true;
  }
}

function saveAIEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AI_ENABLED_KEY, enabled ? '1' : '0');
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
  aiEnabled: boolean;
  setAIEnabled: (enabled: boolean) => void;
  newNoteRequestNonce: number;
  requestNewNote: () => void;
  // Cross-panel communication for PDF annotation → brief/chronology
  pendingBriefInsertion: { text: string; fileId: string; fileName: string; page: number } | null;
  setPendingBriefInsertion: (data: { text: string; fileId: string; fileName: string; page: number } | null) => void;
  pendingChronologyEntry: { text: string; fileId: string; fileName: string; page: number; date?: string } | null;
  setPendingChronologyEntry: (data: { text: string; fileId: string; fileName: string; page: number; date?: string } | null) => void;
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
  aiEnabled: loadAIEnabled(),
  setAIEnabled: (enabled) => {
    saveAIEnabled(enabled);
    set({ aiEnabled: enabled });
  },
  newNoteRequestNonce: 0,
  requestNewNote: () =>
    set((state) => ({ newNoteRequestNonce: state.newNoteRequestNonce + 1 })),
  pendingBriefInsertion: null,
  setPendingBriefInsertion: (data) => set({ pendingBriefInsertion: data }),
  pendingChronologyEntry: null,
  setPendingChronologyEntry: (data) => set({ pendingChronologyEntry: data }),
});

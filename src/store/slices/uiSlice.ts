import type { StateCreator } from 'zustand';
import type { CenterTab } from './panelSlice';
import { AI_ENABLED_KEY, DENSITY_KEY } from '../../lib/constants';

export type DisplayDensity = 'compact' | 'comfortable' | 'spacious';

const PROCESS_ON_UPLOAD_KEY = 'clarity-hub-process-on-upload';
const PINNED_FILES_KEY = 'clarity-hub-pinned-files';
const RECENT_FILES_KEY = 'clarity-hub-recent-files';
const RECENT_FILES_MAX = 10;
const FILE_FILTERS_KEY = 'clarity-hub-file-filters';
const DEFAULT_TAB_KEY = 'clarity-hub-default-tab';

const VALID_CENTER_TABS: CenterTab[] = ['overview', 'editor', 'exhibits', 'timeline', 'drafts'];

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

function loadPinnedFiles(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(PINNED_FILES_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function savePinnedFiles(pinned: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PINNED_FILES_KEY, JSON.stringify(pinned));
  } catch {
    // ignore persistence failures
  }
}

function loadRecentFiles(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function saveRecentFiles(recent: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recent));
  } catch {
    // ignore persistence failures
  }
}

function loadDisplayDensity(): DisplayDensity {
  if (typeof window === 'undefined') return 'comfortable';
  try {
    const stored = localStorage.getItem(DENSITY_KEY);
    if (stored === 'compact' || stored === 'comfortable' || stored === 'spacious') {
      return stored;
    }
    return 'comfortable';
  } catch {
    return 'comfortable';
  }
}

function saveDisplayDensity(density: DisplayDensity) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DENSITY_KEY, density);
  } catch {
    // ignore persistence failures
  }
}

function loadFileTypeFilters(): Record<string, string | null> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(FILE_FILTERS_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string | null>) : {};
  } catch {
    return {};
  }
}

function saveFileTypeFilters(filters: Record<string, string | null>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FILE_FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // ignore persistence failures
  }
}

function loadDefaultCenterTab(): CenterTab {
  if (typeof window === 'undefined') return 'overview';
  try {
    const stored = localStorage.getItem(DEFAULT_TAB_KEY);
    if (stored && VALID_CENTER_TABS.includes(stored as CenterTab)) {
      return stored as CenterTab;
    }
  } catch {
    // ignore
  }
  return 'overview';
}

function saveDefaultCenterTab(tab: CenterTab) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEFAULT_TAB_KEY, tab);
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
  // Display density
  displayDensity: DisplayDensity;
  setDisplayDensity: (density: DisplayDensity) => void;
  // Pinned files — per-project
  pinnedFileIds: Record<string, string[]>;
  togglePinFile: (projectId: string, fileId: string) => void;
  // Recent files — per-project, most recent first, max 10
  recentFileIds: Record<string, string[]>;
  trackRecentFile: (projectId: string, fileId: string) => void;
  // Persistent file type filter — per-project
  fileTypeFilter: Record<string, string | null>;
  setFileTypeFilter: (projectId: string, filter: string | null) => void;
  // Default center tab preference
  defaultCenterTab: CenterTab;
  setDefaultCenterTab: (tab: CenterTab) => void;
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
  displayDensity: loadDisplayDensity(),
  setDisplayDensity: (density) => {
    saveDisplayDensity(density);
    set({ displayDensity: density });
  },
  pinnedFileIds: loadPinnedFiles(),
  togglePinFile: (projectId, fileId) =>
    set((state) => {
      const current = state.pinnedFileIds[projectId] ?? [];
      const next = current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId];
      const updated = { ...state.pinnedFileIds, [projectId]: next };
      savePinnedFiles(updated);
      return { pinnedFileIds: updated };
    }),
  recentFileIds: loadRecentFiles(),
  trackRecentFile: (projectId, fileId) =>
    set((state) => {
      const current = state.recentFileIds[projectId] ?? [];
      const deduped = current.filter((id) => id !== fileId);
      const next = [fileId, ...deduped].slice(0, RECENT_FILES_MAX);
      const updated = { ...state.recentFileIds, [projectId]: next };
      saveRecentFiles(updated);
      return { recentFileIds: updated };
    }),
  fileTypeFilter: loadFileTypeFilters(),
  setFileTypeFilter: (projectId, filter) =>
    set((state) => {
      const updated = { ...state.fileTypeFilter, [projectId]: filter };
      saveFileTypeFilters(updated);
      return { fileTypeFilter: updated };
    }),
  defaultCenterTab: loadDefaultCenterTab(),
  setDefaultCenterTab: (tab) => {
    saveDefaultCenterTab(tab);
    set({ defaultCenterTab: tab });
  },
});

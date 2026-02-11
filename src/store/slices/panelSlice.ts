import type { StateCreator } from 'zustand';

// localStorage key
const PANEL_STORAGE_KEY = 'clarity-hub-panels';

interface PersistedPanelState {
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
}

function loadPanelState(): PersistedPanelState {
  try {
    const raw = localStorage.getItem(PANEL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isLeftPanelOpen: parsed.isLeftPanelOpen ?? true,
        isRightPanelOpen: parsed.isRightPanelOpen ?? true,
      };
    }
  } catch { /* ignore */ }
  return { isLeftPanelOpen: true, isRightPanelOpen: true };
}

function savePanelState(state: PersistedPanelState) {
  try {
    localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export interface PanelSlice {
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanel: (open: boolean) => void;
  setRightPanel: (open: boolean) => void;
}

const initial = loadPanelState();

export const createPanelSlice: StateCreator<PanelSlice> = (set) => ({
  isLeftPanelOpen: initial.isLeftPanelOpen,
  isRightPanelOpen: initial.isRightPanelOpen,
  toggleLeftPanel: () =>
    set((s) => {
      const next = !s.isLeftPanelOpen;
      savePanelState({ isLeftPanelOpen: next, isRightPanelOpen: s.isRightPanelOpen });
      return { isLeftPanelOpen: next };
    }),
  toggleRightPanel: () =>
    set((s) => {
      const next = !s.isRightPanelOpen;
      savePanelState({ isLeftPanelOpen: s.isLeftPanelOpen, isRightPanelOpen: next });
      return { isRightPanelOpen: next };
    }),
  setLeftPanel: (open) =>
    set((s) => {
      savePanelState({ isLeftPanelOpen: open, isRightPanelOpen: s.isRightPanelOpen });
      return { isLeftPanelOpen: open };
    }),
  setRightPanel: (open) =>
    set((s) => {
      savePanelState({ isLeftPanelOpen: s.isLeftPanelOpen, isRightPanelOpen: open });
      return { isRightPanelOpen: open };
    }),
});

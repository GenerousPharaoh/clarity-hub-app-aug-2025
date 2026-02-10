import type { StateCreator } from 'zustand';

export interface PanelSlice {
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanel: (open: boolean) => void;
  setRightPanel: (open: boolean) => void;
}

export const createPanelSlice: StateCreator<PanelSlice> = (set) => ({
  isLeftPanelOpen: true,
  isRightPanelOpen: true,
  toggleLeftPanel: () => set((s) => ({ isLeftPanelOpen: !s.isLeftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ isRightPanelOpen: !s.isRightPanelOpen })),
  setLeftPanel: (open) => set({ isLeftPanelOpen: open }),
  setRightPanel: (open) => set({ isRightPanelOpen: open }),
});

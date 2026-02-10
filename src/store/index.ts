import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice';
import { createFileSlice, type FileSlice } from './slices/fileSlice';
import { createPanelSlice, type PanelSlice } from './slices/panelSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

export type AppStore = AuthSlice & ProjectSlice & FileSlice & PanelSlice & UISlice;

export const useAppStore = create<AppStore>()(
  devtools(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createProjectSlice(...a),
      ...createFileSlice(...a),
      ...createPanelSlice(...a),
      ...createUISlice(...a),
    }),
    { name: 'clarity-hub' }
  )
);

export default useAppStore;

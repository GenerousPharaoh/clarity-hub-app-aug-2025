import type { StateCreator } from 'zustand';
import type { FileRecord } from '../../types';

export interface FileSlice {
  files: FileRecord[];
  selectedFileId: string | null;
  setFiles: (files: FileRecord[]) => void;
  setSelectedFile: (id: string | null) => void;
  addFile: (file: FileRecord) => void;
  removeFile: (id: string) => void;
}

export const createFileSlice: StateCreator<FileSlice> = (set) => ({
  files: [],
  selectedFileId: null,
  setFiles: (files) => set({ files }),
  setSelectedFile: (id) => set({ selectedFileId: id }),
  addFile: (file) =>
    set((state) => ({ files: [file, ...state.files] })),
  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
      selectedFileId: state.selectedFileId === id ? null : state.selectedFileId,
    })),
});

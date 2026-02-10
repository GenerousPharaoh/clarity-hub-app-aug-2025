import type { StateCreator } from 'zustand';
import type { Project } from '../../types';

export interface ProjectSlice {
  projects: Project[];
  selectedProjectId: string | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (id: string | null) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  projects: [],
  selectedProjectId: null,
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    })),
});

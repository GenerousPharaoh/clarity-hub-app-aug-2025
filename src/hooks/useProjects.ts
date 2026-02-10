import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import useAppStore from '@/store';
import type { Project } from '@/types';
import type { TablesInsert } from '@/types/database';

const PROJECTS_KEY = ['projects'] as const;

/**
 * Fetches all projects owned by the current user, sorted by most recent.
 * Syncs results into Zustand store for cross-component access.
 */
export function useProjects() {
  const { user } = useAuth();
  const setProjects = useAppStore((s) => s.setProjects);

  return useQuery<Project[]>({
    queryKey: PROJECTS_KEY,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projects = data ?? [];
      setProjects(projects);
      return projects;
    },
    enabled: !!user,
  });
}

/**
 * Fetches the count of files for each project owned by the user.
 * Returns a map of projectId -> fileCount.
 */
export function useProjectFileCounts() {
  const { user } = useAuth();
  const projects = useAppStore((s) => s.projects);

  return useQuery<Record<string, number>>({
    queryKey: ['project-file-counts', projects.map((p) => p.id)],
    queryFn: async () => {
      if (!user || projects.length === 0) return {};

      const projectIds = projects.map((p) => p.id);

      const { data, error } = await supabase
        .from('files')
        .select('project_id')
        .in('project_id', projectIds)
        .is('is_deleted', false);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.project_id] = (counts[row.project_id] || 0) + 1;
      }
      return counts;
    },
    enabled: !!user && projects.length > 0,
  });
}

/**
 * Creates a new project for the current user.
 * Invalidates the projects query cache and adds to Zustand store.
 */
export function useCreateProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addProject = useAppStore((s) => s.addProject);

  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const insert: TablesInsert<'projects'> = {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        owner_id: user.id,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(insert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (project) => {
      addProject(project);
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

/**
 * Deletes a project by id.
 * Invalidates the projects query cache and removes from Zustand store.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const removeProject = useAppStore((s) => s.removeProject);

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      removeProject(projectId);
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

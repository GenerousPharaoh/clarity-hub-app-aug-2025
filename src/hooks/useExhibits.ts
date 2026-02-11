import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ExhibitMarker } from '@/types';
import type { TablesInsert } from '@/types/database';

const EXHIBITS_KEY = 'exhibits';

function exhibitsKey(projectId: string | null) {
  return [EXHIBITS_KEY, projectId] as const;
}

/**
 * Fetches all exhibit markers for a project, ordered by exhibit_id.
 */
export function useExhibits(projectId: string | null) {
  const { user } = useAuth();

  return useQuery<ExhibitMarker[]>({
    queryKey: exhibitsKey(projectId),
    queryFn: async () => {
      if (!projectId || !user) return [];

      const { data, error } = await supabase
        .from('exhibit_markers')
        .select('*')
        .eq('project_id', projectId)
        .order('exhibit_id', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId && !!user,
  });
}

/**
 * Creates a new exhibit marker.
 */
export function useCreateExhibit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      exhibitId,
      description,
      fileId,
    }: {
      projectId: string;
      exhibitId: string;
      description?: string;
      fileId?: string;
    }) => {
      const insert: TablesInsert<'exhibit_markers'> = {
        project_id: projectId,
        exhibit_id: exhibitId,
        description: description?.trim() || null,
        file_id: fileId || null,
      };

      const { data, error } = await supabase
        .from('exhibit_markers')
        .insert(insert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (exhibit) => {
      queryClient.invalidateQueries({
        queryKey: exhibitsKey(exhibit.project_id),
      });
    },
  });
}

/**
 * Updates an exhibit marker's description or linked file.
 */
export function useUpdateExhibit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      description,
      fileId,
      exhibitId,
    }: {
      id: string;
      projectId: string;
      description?: string;
      fileId?: string | null;
      exhibitId?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (description !== undefined) updates.description = description.trim() || null;
      if (fileId !== undefined) updates.file_id = fileId || null;
      if (exhibitId !== undefined) updates.exhibit_id = exhibitId;

      const { data, error } = await supabase
        .from('exhibit_markers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onMutate: async ({ id, projectId, description, fileId, exhibitId }) => {
      await queryClient.cancelQueries({ queryKey: exhibitsKey(projectId) });
      const previous = queryClient.getQueryData<ExhibitMarker[]>(
        exhibitsKey(projectId)
      );

      queryClient.setQueryData<ExhibitMarker[]>(
        exhibitsKey(projectId),
        (old) => {
          if (!old) return old;
          return old.map((e) => {
            if (e.id !== id) return e;
            return {
              ...e,
              ...(description !== undefined
                ? { description: description.trim() || null }
                : {}),
              ...(fileId !== undefined ? { file_id: fileId || null } : {}),
              ...(exhibitId !== undefined ? { exhibit_id: exhibitId } : {}),
            };
          });
        }
      );

      return { previous };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          exhibitsKey(variables.projectId),
          context.previous
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: exhibitsKey(variables.projectId),
      });
    },
  });
}

/**
 * Deletes an exhibit marker.
 */
export function useDeleteExhibit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
    }: {
      id: string;
      projectId: string;
    }) => {
      const { error } = await supabase
        .from('exhibit_markers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, projectId };
    },

    onMutate: async ({ id, projectId }) => {
      await queryClient.cancelQueries({ queryKey: exhibitsKey(projectId) });
      const previous = queryClient.getQueryData<ExhibitMarker[]>(
        exhibitsKey(projectId)
      );

      queryClient.setQueryData<ExhibitMarker[]>(
        exhibitsKey(projectId),
        (old) => (old ? old.filter((e) => e.id !== id) : old)
      );

      return { previous };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          exhibitsKey(variables.projectId),
          context.previous
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: exhibitsKey(variables.projectId),
      });
    },
  });
}

/**
 * Generate the next exhibit ID (e.g., "Exhibit A", "Exhibit B", etc.)
 */
export function getNextExhibitId(existingExhibits: ExhibitMarker[]): string {
  if (existingExhibits.length === 0) return 'Exhibit A';

  // Extract letters from existing exhibit IDs
  const letters = existingExhibits
    .map((e) => {
      const match = e.exhibit_id.match(/Exhibit\s+([A-Z]+)/i);
      return match ? match[1].toUpperCase() : null;
    })
    .filter(Boolean) as string[];

  if (letters.length === 0) return 'Exhibit A';

  // Find the highest letter and go to next
  const sorted = letters.sort();
  const last = sorted[sorted.length - 1];

  if (last.length === 1 && last < 'Z') {
    return `Exhibit ${String.fromCharCode(last.charCodeAt(0) + 1)}`;
  }

  // If we've gone past Z, use AA, AB, etc.
  return `Exhibit ${String.fromCharCode(65 + existingExhibits.length)}`;
}

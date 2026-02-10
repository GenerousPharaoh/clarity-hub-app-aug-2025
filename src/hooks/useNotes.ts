import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Note } from '@/types';
import type { TablesInsert } from '@/types/database';

const NOTES_KEY = 'notes';

function notesKey(projectId: string | null) {
  return [NOTES_KEY, projectId] as const;
}

/**
 * Fetches all notes for a given project, ordered by last_modified descending.
 */
export function useNotes(projectId: string | null) {
  const { user } = useAuth();

  return useQuery<Note[]>({
    queryKey: notesKey(projectId),
    queryFn: async () => {
      if (!projectId || !user) return [];

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .order('last_modified', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId && !!user,
  });
}

/**
 * Creates a new note within a project.
 * Returns the inserted note row.
 */
export function useCreateNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      title,
      content,
    }: {
      projectId: string;
      title?: string;
      content?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const insert: TablesInsert<'notes'> = {
        project_id: projectId,
        title: title?.trim() || 'Untitled',
        content: content ?? null,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('notes')
        .insert(insert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: notesKey(note.project_id) });
    },
  });
}

/**
 * Updates a note's title and/or content.
 * Uses optimistic updates so the UI feels instant.
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      title,
      content,
    }: {
      id: string;
      projectId: string;
      title?: string;
      content?: string;
    }) => {
      const updates: Record<string, unknown> = {
        last_modified: new Date().toISOString(),
      };
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;

      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Optimistic update: immediately reflect changes in the cache
    onMutate: async ({ id, projectId, title, content }) => {
      await queryClient.cancelQueries({ queryKey: notesKey(projectId) });
      const previous = queryClient.getQueryData<Note[]>(notesKey(projectId));

      queryClient.setQueryData<Note[]>(notesKey(projectId), (old) => {
        if (!old) return old;
        return old.map((note) => {
          if (note.id !== id) return note;
          return {
            ...note,
            ...(title !== undefined ? { title } : {}),
            ...(content !== undefined ? { content } : {}),
            last_modified: new Date().toISOString(),
          };
        });
      });

      return { previous };
    },

    onError: (_err, variables, context) => {
      // Roll back optimistic update on error
      if (context?.previous) {
        queryClient.setQueryData(notesKey(variables.projectId), context.previous);
      }
    },

    onSettled: (_data, _error, variables) => {
      // Always refetch after settle to ensure consistency
      queryClient.invalidateQueries({ queryKey: notesKey(variables.projectId) });
    },
  });
}

/**
 * Deletes a note by id.
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      return { id, projectId };
    },

    // Optimistic removal
    onMutate: async ({ id, projectId }) => {
      await queryClient.cancelQueries({ queryKey: notesKey(projectId) });
      const previous = queryClient.getQueryData<Note[]>(notesKey(projectId));

      queryClient.setQueryData<Note[]>(notesKey(projectId), (old) =>
        old ? old.filter((n) => n.id !== id) : old
      );

      return { previous };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notesKey(variables.projectId), context.previous);
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: notesKey(variables.projectId) });
    },
  });
}

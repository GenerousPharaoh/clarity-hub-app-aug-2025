import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { TimelineEvent } from '@/types';
import type { TablesInsert } from '@/types/database';

const TIMELINE_KEY = 'timeline-events';

function timelineKey(projectId: string | null) {
  return [TIMELINE_KEY, projectId] as const;
}

// Re-export for consumers that import from this module
export type { TimelineEvent };

/**
 * Fetches all visible timeline events for a project, ordered by date.
 */
export function useTimelineEvents(projectId: string | null) {
  const { user, isDemoMode } = useAuth();

  return useQuery<TimelineEvent[]>({
    queryKey: timelineKey(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      if (isDemoMode) return [];
      if (!user) return [];

      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_hidden', false)
        .order('date', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId && (isDemoMode || !!user),
  });
}

/**
 * Creates a new timeline event.
 */
export function useCreateTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      date,
      title,
      description,
      category,
      sourceFileId,
      sourceFileName,
      sourcePage,
      excerpt,
    }: {
      projectId: string;
      date: string;
      title: string;
      description?: string;
      category?: string;
      sourceFileId?: string;
      sourceFileName?: string;
      sourcePage?: number;
      excerpt?: string;
    }) => {
      const insert: TablesInsert<'timeline_events'> = {
        project_id: projectId,
        date,
        title,
        description: description?.trim() || null,
        category: category || null,
        confidence: 'medium',
        source_file_id: sourceFileId || null,
        source_file_name: sourceFileName || null,
        source_page: sourcePage ?? null,
        excerpt: excerpt?.trim() || null,
        is_verified: false,
        is_hidden: false,
      };

      const { data, error } = await supabase
        .from('timeline_events')
        .insert(insert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({
        queryKey: timelineKey(event.project_id),
      });
    },
  });
}

/**
 * Updates a timeline event.
 */
export function useUpdateTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      ...updates
    }: {
      id: string;
      projectId: string;
      date?: string;
      title?: string;
      description?: string;
      category?: string;
      is_verified?: boolean;
      is_hidden?: boolean;
    }) => {
      const updatePayload: Record<string, unknown> = {};
      if (updates.date !== undefined) updatePayload.date = updates.date;
      if (updates.title !== undefined) updatePayload.title = updates.title;
      if (updates.description !== undefined)
        updatePayload.description = updates.description.trim() || null;
      if (updates.category !== undefined) updatePayload.category = updates.category;
      if (updates.is_verified !== undefined) updatePayload.is_verified = updates.is_verified;
      if (updates.is_hidden !== undefined) updatePayload.is_hidden = updates.is_hidden;

      const { data, error } = await supabase
        .from('timeline_events')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onMutate: async ({ id, projectId, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: timelineKey(projectId) });
      const previous = queryClient.getQueryData<TimelineEvent[]>(timelineKey(projectId));

      queryClient.setQueryData<TimelineEvent[]>(timelineKey(projectId), (old) => {
        if (!old) return old;
        return old.map((e) => {
          if (e.id !== id) return e;
          return { ...e, ...updates };
        });
      });

      return { previous };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(timelineKey(variables.projectId), context.previous);
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: timelineKey(variables.projectId),
      });
    },
  });
}

/**
 * Deletes a timeline event.
 */
export function useDeleteTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, projectId };
    },

    onMutate: async ({ id, projectId }) => {
      await queryClient.cancelQueries({ queryKey: timelineKey(projectId) });
      const previous = queryClient.getQueryData<TimelineEvent[]>(timelineKey(projectId));

      queryClient.setQueryData<TimelineEvent[]>(timelineKey(projectId), (old) =>
        old ? old.filter((e) => e.id !== id) : old
      );

      return { previous };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(timelineKey(variables.projectId), context.previous);
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: timelineKey(variables.projectId),
      });
    },
  });
}

/**
 * Triggers AI extraction of timeline events from project files.
 */
export function useExtractTimeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      const response = await fetch('/api/extract-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || 'Failed to extract timeline');
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: timelineKey(variables.projectId),
      });
    },
  });
}

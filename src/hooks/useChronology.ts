/**
 * TanStack Query hooks for chronology entry CRUD.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ChronologyEntry } from '@/types/drafting';

function chronologyKey(projectId: string | null) {
  return ['chronology', projectId] as const;
}

/** All chronology entries for a project, ordered by date. */
export function useChronologyEntries(projectId: string | null) {
  return useQuery({
    queryKey: chronologyKey(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chronology_entries')
        .select('*')
        .eq('project_id', projectId!)
        .order('date_sort', { ascending: true, nullsFirst: false })
        .order('sort_order');
      if (error) throw error;
      return data as unknown as ChronologyEntry[];
    },
    enabled: !!projectId,
  });
}

/** Create a chronology entry. */
export function useCreateChronologyEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      date_display: string;
      date_sort?: string;
      description: string;
      source_description?: string;
      exhibit_ref?: string;
      category?: string;
      timeline_event_id?: string;
      annotation_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('chronology_entries')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChronologyEntry;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: chronologyKey(variables.project_id) });
    },
  });
}

/** Update a chronology entry. */
export function useUpdateChronologyEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<ChronologyEntry> & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('chronology_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, projectId } as unknown as ChronologyEntry & { projectId: string };
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: chronologyKey(variables.projectId) });
    },
  });
}

/** Delete a chronology entry. */
export function useDeleteChronologyEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('chronology_entries').delete().eq('id', id);
      if (error) throw error;
      return { id, projectId };
    },
    onMutate: async ({ id, projectId }) => {
      await queryClient.cancelQueries({ queryKey: chronologyKey(projectId) });
      const previous = queryClient.getQueryData<ChronologyEntry[]>(chronologyKey(projectId));
      queryClient.setQueryData<ChronologyEntry[]>(chronologyKey(projectId), (old) =>
        old ? old.filter((e) => e.id !== id) : old
      );
      return { previous };
    },
    onError: (_err, { projectId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(chronologyKey(projectId), context.previous);
      }
    },
    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: chronologyKey(projectId) });
    },
  });
}

/** Bulk import from timeline_events into chronology_entries. */
export function useImportFromTimeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      // Fetch existing chronology entries to check for duplicates
      const { data: existing } = await supabase
        .from('chronology_entries')
        .select('timeline_event_id')
        .eq('project_id', projectId)
        .not('timeline_event_id', 'is', null);

      const existingIds = new Set((existing ?? []).map((e) => e.timeline_event_id));

      // Fetch timeline events
      const { data: events, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('project_id', projectId)
        .order('event_date');

      if (error) throw error;
      if (!events || events.length === 0) return { imported: 0 };

      // Filter out already-imported events
      const newEvents = events.filter((e) => !existingIds.has(e.id));
      if (newEvents.length === 0) return { imported: 0 };

      // Create chronology entries
      const entries = newEvents.map((e, i) => ({
        project_id: projectId,
        timeline_event_id: e.id,
        date_display: e.date || 'Unknown',
        date_sort: e.date || null,
        description: `${e.title}${e.description ? ': ' + e.description : ''}`,
        source_description: e.description || null,
        category: e.category || null,
        sort_order: i,
      }));

      const { error: insertError } = await supabase
        .from('chronology_entries')
        .insert(entries);

      if (insertError) throw insertError;
      return { imported: entries.length };
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: chronologyKey(projectId) });
    },
  });
}

/**
 * TanStack Query hooks for brief draft CRUD.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BRIEF_TEMPLATES } from '@/types/drafting';
import type { BriefDraft, BriefSection } from '@/types/drafting';

function draftsKey(projectId: string | null) {
  return ['brief-drafts', projectId] as const;
}

/** All brief drafts for a project. */
export function useBriefDrafts(projectId: string | null) {
  return useQuery({
    queryKey: draftsKey(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brief_drafts')
        .select('*')
        .eq('project_id', projectId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BriefDraft[];
    },
    enabled: !!projectId,
  });
}

/** Create a new brief draft from a template. */
export function useCreateBriefDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      template_type: string;
      title?: string;
      court_name?: string;
      file_number?: string;
      case_name?: string;
      party_name?: string;
    }) => {
      const template = BRIEF_TEMPLATES.find((t) => t.slug === input.template_type);
      const sections: BriefSection[] = (template?.sections ?? []).map((s, i) => ({
        id: crypto.randomUUID(),
        key: s.key,
        heading: s.heading,
        content_html: '',
        sort_order: i,
        is_generated: false,
      }));

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('brief_drafts')
        .insert({
          ...input,
          title: input.title || template?.name || 'Untitled Draft',
          sections: JSON.parse(JSON.stringify(sections)),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as BriefDraft;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: draftsKey(variables.project_id) });
    },
  });
}

/** Update a brief draft (sections, title, metadata, status). */
export function useUpdateBriefDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: {
      id: string;
      projectId: string;
      title?: string;
      sections?: BriefSection[];
      court_name?: string;
      file_number?: string;
      case_name?: string;
      party_name?: string;
      status?: BriefDraft['status'];
      rendered_content?: string;
    }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) patch.title = updates.title;
      if (updates.sections !== undefined) patch.sections = JSON.parse(JSON.stringify(updates.sections));
      if (updates.court_name !== undefined) patch.court_name = updates.court_name;
      if (updates.file_number !== undefined) patch.file_number = updates.file_number;
      if (updates.case_name !== undefined) patch.case_name = updates.case_name;
      if (updates.party_name !== undefined) patch.party_name = updates.party_name;
      if (updates.status !== undefined) patch.status = updates.status;
      if (updates.rendered_content !== undefined) patch.rendered_content = updates.rendered_content;

      const { data, error } = await supabase
        .from('brief_drafts')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as BriefDraft;
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: draftsKey(variables.projectId) });
    },
  });
}

/** Delete a brief draft. */
export function useDeleteBriefDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('brief_drafts').delete().eq('id', id);
      if (error) throw error;
      return { id, projectId };
    },
    onMutate: async ({ id, projectId }) => {
      await queryClient.cancelQueries({ queryKey: draftsKey(projectId) });
      const previous = queryClient.getQueryData<BriefDraft[]>(draftsKey(projectId));
      queryClient.setQueryData<BriefDraft[]>(draftsKey(projectId), (old) =>
        old ? old.filter((d) => d.id !== id) : old
      );
      return { previous };
    },
    onError: (_err, { projectId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(draftsKey(projectId), context.previous);
      }
    },
    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: draftsKey(projectId) });
    },
  });
}

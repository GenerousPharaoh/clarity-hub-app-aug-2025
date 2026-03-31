/**
 * TanStack Query hooks for PDF annotation CRUD.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PdfAnnotation } from '@/types/annotations';

function annotationKey(fileId: string | null) {
  return ['annotations', fileId] as const;
}

function projectAnnotationKey(projectId: string | null) {
  return ['project-annotations', projectId] as const;
}

/** All annotations for a specific file. */
export function useFileAnnotations(fileId: string | null) {
  return useQuery({
    queryKey: annotationKey(fileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_annotations')
        .select('*')
        .eq('file_id', fileId!)
        .order('page_number')
        .order('created_at');
      if (error) throw error;
      return data as unknown as PdfAnnotation[];
    },
    enabled: !!fileId,
  });
}

/** All highlights across the entire project. */
export function useProjectHighlights(projectId: string | null) {
  return useQuery({
    queryKey: projectAnnotationKey(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_annotations')
        .select('*')
        .eq('project_id', projectId!)
        .not('selected_text', 'is', null)
        .order('page_number');
      if (error) throw error;
      return data as unknown as PdfAnnotation[];
    },
    enabled: !!projectId,
  });
}

/** Create a new annotation. */
export function useCreateAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      file_id: string;
      project_id: string;
      annotation_type?: string;
      page_number: number;
      position_data?: Record<string, unknown>;
      bounding_rect?: Record<string, unknown>;
      selected_text?: string;
      comment?: string;
      color?: string;
      label?: string;
      tags?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const row = {
        file_id: input.file_id,
        project_id: input.project_id,
        annotation_type: input.annotation_type ?? 'highlight',
        page_number: input.page_number,
        position_data: input.position_data ? JSON.parse(JSON.stringify(input.position_data)) : {},
        selected_text: input.selected_text,
        comment: input.comment,
        color: input.color,
        label: input.label,
        tags: input.tags,
        created_by: user?.id,
      };
      const { data, error } = await supabase
        .from('pdf_annotations')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PdfAnnotation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: annotationKey(data.file_id) });
      queryClient.invalidateQueries({ queryKey: projectAnnotationKey(data.project_id) });
    },
  });
}

/** Update an annotation. */
export function useUpdateAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<PdfAnnotation> & { id: string }) => {
      const { id, ...rest } = input;
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) patch[k] = v;
      }
      const { data, error } = await supabase
        .from('pdf_annotations')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PdfAnnotation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: annotationKey(data.file_id) });
      queryClient.invalidateQueries({ queryKey: projectAnnotationKey(data.project_id) });
    },
  });
}

/** Delete an annotation. */
export function useDeleteAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fileId, projectId }: { id: string; fileId: string; projectId: string }) => {
      const { error } = await supabase.from('pdf_annotations').delete().eq('id', id);
      if (error) throw error;
      return { id, fileId, projectId };
    },
    onMutate: async ({ id, fileId }) => {
      await queryClient.cancelQueries({ queryKey: annotationKey(fileId) });
      const previous = queryClient.getQueryData<PdfAnnotation[]>(annotationKey(fileId));
      queryClient.setQueryData<PdfAnnotation[]>(annotationKey(fileId), (old) =>
        old ? old.filter((a) => a.id !== id) : old
      );
      return { previous };
    },
    onError: (_err, { fileId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(annotationKey(fileId), context.previous);
      }
    },
    onSettled: (_data, _error, { fileId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: annotationKey(fileId) });
      queryClient.invalidateQueries({ queryKey: projectAnnotationKey(projectId) });
    },
  });
}

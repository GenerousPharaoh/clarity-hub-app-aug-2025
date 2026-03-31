/** PDF annotation types for highlights, comments, and bookmarks. */

import type { Highlight } from 'react-pdf-highlighter-extended-extended';

export interface PdfAnnotation {
  id: string;
  file_id: string;
  project_id: string;
  created_by: string;
  annotation_type: 'highlight' | 'comment' | 'bookmark';
  page_number: number;
  position_data: Record<string, unknown>;
  bounding_rect: Record<string, unknown> | null;
  selected_text: string | null;
  comment: string | null;
  color: string;
  label: string | null;
  tags: string[];
  added_to_brief: boolean;
  brief_draft_id: string | null;
  added_to_chronology: boolean;
  chronology_entry_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Extended highlight type that includes annotation metadata. */
export interface AnnotationHighlight extends Highlight {
  color: string;
  comment?: string;
  annotationType: PdfAnnotation['annotation_type'];
}

/** Available highlight colors with semantic labels. */
export const HIGHLIGHT_COLORS = [
  { value: '#FFEB3B', label: 'Important', name: 'yellow' },
  { value: '#66BB6A', label: 'Favorable', name: 'green' },
  { value: '#42A5F5', label: 'Neutral', name: 'blue' },
  { value: '#EF5350', label: 'Unfavorable', name: 'pink' },
] as const;

/** Convert a stored PdfAnnotation to a react-pdf-highlighter Highlight. */
export function annotationToHighlight(annotation: PdfAnnotation): AnnotationHighlight {
  return {
    id: annotation.id,
    content: {
      text: annotation.selected_text ?? undefined,
    },
    position: annotation.position_data as AnnotationHighlight['position'],
    color: annotation.color,
    comment: annotation.comment ?? undefined,
    annotationType: annotation.annotation_type,
  };
}

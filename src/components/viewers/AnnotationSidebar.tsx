import { useMemo, useCallback } from 'react';
import { X, Trash2, MessageSquare, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PdfAnnotation } from '@/types/annotations';
import type { AnnotationHighlight } from '@/types/annotations';

interface AnnotationSidebarProps {
  annotations: PdfAnnotation[];
  isOpen: boolean;
  onClose: () => void;
  onScrollTo: (highlight: AnnotationHighlight) => void;
  onDelete: (annotation: PdfAnnotation) => void;
}

export function AnnotationSidebar({
  annotations,
  isOpen,
  onClose,
  onScrollTo,
  onDelete,
}: AnnotationSidebarProps) {
  // Group annotations by page number
  const grouped = useMemo(() => {
    const map = new Map<number, PdfAnnotation[]>();
    for (const a of annotations) {
      const page = a.page_number;
      if (!map.has(page)) map.set(page, []);
      map.get(page)!.push(a);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [annotations]);

  const handleScrollTo = useCallback(
    (a: PdfAnnotation) => {
      const highlight: AnnotationHighlight = {
        id: `annot-${a.id}`,
        
        type: 'text',
        position: a.position_data as AnnotationHighlight['position'],
        color: a.color ?? 'yellow',
        annotationType: a.annotation_type as 'highlight' | 'comment' | 'bookmark',
        comment: a.comment ?? undefined,
      };
      onScrollTo(highlight);
    },
    [onScrollTo],
  );

  return (
    <div
      className={cn(
        'absolute right-0 top-0 z-20 flex h-full w-72 flex-col',
        'border-l border-surface-200 bg-white shadow-lg',
        'transition-transform duration-200 ease-out',
        'dark:border-surface-700 dark:bg-surface-900',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-surface-200 px-3 dark:border-surface-700">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-primary-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
            Annotations
          </span>
          <span className="ml-1 rounded-full bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
            {annotations.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md',
            'text-surface-400 transition-colors',
            'hover:bg-surface-100 hover:text-surface-600',
            'dark:hover:bg-surface-800 dark:hover:text-surface-300',
          )}
          aria-label="Close annotations"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {annotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
              <FileText className="h-5 w-5 text-surface-400" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-surface-400 dark:text-surface-500">
              No annotations yet. Select text in the PDF to create highlights.
            </p>
          </div>
        ) : (
          <div className="py-1">
            {grouped.map(([page, items]) => (
              <div key={page}>
                <div className="sticky top-0 z-10 bg-surface-50/95 px-3 py-1.5 backdrop-blur-sm dark:bg-surface-900/95">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                    Page {page}
                  </span>
                </div>
                <div className="space-y-0.5 px-1.5">
                  {items.map((a) => (
                    <AnnotationCard
                      key={a.id}
                      annotation={a}
                      onScrollTo={() => handleScrollTo(a)}
                      onDelete={() => onDelete(a)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnotationCard({
  annotation,
  onScrollTo,
  onDelete,
}: {
  annotation: PdfAnnotation;
  onScrollTo: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onScrollTo}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onScrollTo();
      }}
      className={cn(
        'group relative cursor-pointer rounded-lg px-2.5 py-2',
        'transition-colors hover:bg-surface-50',
        'dark:hover:bg-surface-800/60',
      )}
    >
      <div className="flex items-start gap-2">
        {/* Color dot */}
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: annotation.color.replace(/[\d.]+\)$/, '1)') }}
        />
        <div className="min-w-0 flex-1">
          {/* Selected text preview */}
          {annotation.selected_text && (
            <p className="line-clamp-2 text-xs leading-relaxed text-surface-600 dark:text-surface-300">
              {annotation.selected_text}
            </p>
          )}
          {/* Comment */}
          {annotation.comment && (
            <p className="mt-1 line-clamp-2 text-[11px] italic leading-relaxed text-surface-400 dark:text-surface-500">
              {annotation.comment}
            </p>
          )}
        </div>
      </div>

      {/* Delete button — visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={cn(
          'absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded',
          'text-surface-300 opacity-0 transition-all',
          'hover:bg-red-50 hover:text-red-500',
          'group-hover:opacity-100',
          'dark:text-surface-600 dark:hover:bg-red-900/20 dark:hover:text-red-400',
        )}
        aria-label="Delete annotation"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

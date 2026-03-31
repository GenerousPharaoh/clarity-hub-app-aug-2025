import { useMemo, useCallback, useState } from 'react';
import { X, Trash2, MessageSquare, FileText, Copy, Download, Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUpdateAnnotation } from '@/hooks/useAnnotations';
import { HIGHLIGHT_COLORS } from '@/types/annotations';
import type { PdfAnnotation } from '@/types/annotations';
import type { AnnotationHighlight } from '@/types/annotations';

interface AnnotationSidebarProps {
  annotations: PdfAnnotation[];
  isOpen: boolean;
  onClose: () => void;
  onScrollTo: (highlight: AnnotationHighlight) => void;
  onDelete: (annotation: PdfAnnotation) => void;
  /** Name of the file being annotated, included in exports for context. */
  fileName?: string;
}

export function AnnotationSidebar({
  annotations,
  isOpen,
  onClose,
  onScrollTo,
  onDelete,
  fileName,
}: AnnotationSidebarProps) {
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  const filtered = useMemo(
    () => colorFilter ? annotations.filter((a) => a.color === colorFilter) : annotations,
    [annotations, colorFilter]
  );

  // Group annotations by page number
  const grouped = useMemo(() => {
    const map = new Map<number, PdfAnnotation[]>();
    for (const a of filtered) {
      const page = a.page_number;
      if (!map.has(page)) map.set(page, []);
      map.get(page)!.push(a);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filtered]);

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

  const handleExportAll = useCallback(() => {
    if (annotations.length === 0) return;

    const groupedByPage = new Map<number, PdfAnnotation[]>();
    for (const a of annotations) {
      if (!groupedByPage.has(a.page_number)) groupedByPage.set(a.page_number, []);
      groupedByPage.get(a.page_number)!.push(a);
    }

    const getColorLabel = (color: string): string => {
      const match = HIGHLIGHT_COLORS.find((c) => c.value === color);
      return match ? match.label : 'Highlight';
    };

    const dateStr = new Date().toLocaleDateString('en-CA');
    let md = '# Highlights & Notes\n\n';
    if (fileName) {
      md += `**File:** ${fileName}\n`;
    }
    md += `**Exported:** ${dateStr}\n`;
    md += `**Total annotations:** ${annotations.length}\n\n`;

    // Summary counts by color
    const colorCounts = HIGHLIGHT_COLORS.map((c) => ({
      label: c.label,
      count: annotations.filter((a) => a.color === c.value).length,
    })).filter((c) => c.count > 0);

    if (colorCounts.length > 0) {
      md += colorCounts.map((c) => `- ${c.label}: ${c.count}`).join('\n') + '\n\n';
    }

    md += '---\n\n';

    for (const [page, items] of Array.from(groupedByPage.entries()).sort(([a], [b]) => a - b)) {
      md += `## Page ${page}\n\n`;
      for (const a of items) {
        const colorLabel = getColorLabel(a.color);
        const typeLabel = a.annotation_type === 'bookmark' ? 'Bookmark' : colorLabel;
        md += `**[${typeLabel}]**`;
        if (a.label) md += ` *${a.label}*`;
        md += '\n\n';

        if (a.selected_text) {
          md += `> ${a.selected_text}\n\n`;
        }
        if (a.comment) {
          md += `**Note:** ${a.comment}\n\n`;
        }
        if (a.tags && a.tags.length > 0) {
          md += `Tags: ${a.tags.join(', ')}\n\n`;
        }
        md += '---\n\n';
      }
    }

    navigator.clipboard.writeText(md).then(() => {
      toast.success('All highlights copied to clipboard');
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([md], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'highlights.md';
      a.click();
      toast.success('Highlights exported');
    });
  }, [annotations, fileName]);

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
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {annotations.length > 0 && (
            <button
              onClick={handleExportAll}
              className="flex h-6 w-6 items-center justify-center rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
              title="Export all highlights"
            >
              <Download className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Color filter */}
      {annotations.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-surface-100 px-3 py-2 dark:border-surface-800">
          <button
            onClick={() => setColorFilter(null)}
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-medium transition-all',
              !colorFilter
                ? 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200'
                : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
            )}
          >
            All
          </button>
          {HIGHLIGHT_COLORS.map((c) => {
            const count = annotations.filter((a) => a.color === c.value).length;
            if (count === 0) return null;
            return (
              <button
                key={c.name}
                onClick={() => setColorFilter(colorFilter === c.value ? null : c.value)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-all',
                  colorFilter === c.value
                    ? 'ring-2 ring-primary-400 ring-offset-1'
                    : 'hover:ring-1 hover:ring-surface-300'
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.value }} />
                {count}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
              <FileText className="h-5 w-5 text-surface-400" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-surface-400 dark:text-surface-500">
              {colorFilter ? 'No annotations with this color.' : 'No annotations yet. Select text in the PDF to create highlights.'}
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
  const [editing, setEditing] = useState(false);
  const [editComment, setEditComment] = useState(annotation.comment ?? '');
  const [copied, setCopied] = useState(false);
  const updateAnnotation = useUpdateAnnotation();

  const handleSaveComment = useCallback(() => {
    updateAnnotation.mutate({
      id: annotation.id,
      comment: editComment.trim() || null,
    });
    setEditing(false);
  }, [annotation.id, editComment, updateAnnotation]);

  const handleCopyText = useCallback(() => {
    if (!annotation.selected_text) return;
    navigator.clipboard.writeText(annotation.selected_text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [annotation.selected_text]);

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-transparent px-2.5 py-2.5',
        'transition-all hover:border-surface-200 hover:bg-surface-50 hover:shadow-sm',
        'dark:hover:border-surface-700 dark:hover:bg-surface-800/60',
      )}
    >
      <div className="flex items-start gap-2">
        {/* Color dot — click to scroll */}
        <button onClick={onScrollTo} className="mt-0.5 shrink-0" title="Jump to highlight">
          <span
            className="block h-3 w-3 rounded-full ring-1 ring-surface-200 transition-transform hover:scale-125 dark:ring-surface-700"
            style={{ backgroundColor: annotation.color ?? '#FFEB3B' }}
          />
        </button>
        <div className="min-w-0 flex-1">
          {/* Selected text */}
          {annotation.selected_text && (
            <p
              onClick={onScrollTo}
              className="cursor-pointer line-clamp-3 text-xs leading-relaxed text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
            >
              "{annotation.selected_text}"
            </p>
          )}

          {/* Comment — editable, visually distinct */}
          {editing ? (
            <div className="mt-1.5">
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="w-full resize-none rounded-lg border border-primary-200 bg-primary-50/50 px-2.5 py-1.5 text-xs text-surface-700 dark:border-primary-700 dark:bg-primary-900/20 dark:text-surface-200"
                rows={2}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveComment(); }
                  if (e.key === 'Escape') setEditing(false);
                }}
              />
              <div className="mt-1 flex justify-end gap-1">
                <button onClick={() => setEditing(false)} className="rounded px-2 py-0.5 text-[10px] text-surface-400 hover:bg-surface-100">Cancel</button>
                <button onClick={handleSaveComment} className="rounded bg-primary-600 px-2 py-0.5 text-[10px] text-white hover:bg-primary-700">Save</button>
              </div>
            </div>
          ) : annotation.comment ? (
            <div
              onClick={() => setEditing(true)}
              className="mt-1.5 cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:bg-blue-900/30"
              title="Click to edit"
            >
              <div className="flex items-center gap-1 mb-0.5">
                <MessageSquare className="h-2.5 w-2.5 text-blue-500" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-500">Note</span>
              </div>
              <p className="line-clamp-3 text-xs leading-relaxed text-blue-900 dark:text-blue-200">
                {annotation.comment}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="mt-1.5 flex items-center gap-1.5 rounded-md border border-dashed border-surface-200 px-2 py-1 text-[10px] text-surface-400 transition-colors hover:border-primary-300 hover:text-primary-500 dark:border-surface-700 dark:hover:border-primary-600 dark:hover:text-primary-400"
            >
              <Pencil className="h-2.5 w-2.5" />
              Add note
            </button>
          )}
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div className={cn(
        'absolute right-1 top-1 flex items-center gap-0.5',
        'opacity-0 transition-all group-hover:opacity-100',
      )}>
        {annotation.selected_text && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCopyText(); }}
            className="flex h-5 w-5 items-center justify-center rounded text-surface-300 hover:bg-surface-100 hover:text-surface-500 dark:hover:bg-surface-800"
            title="Copy text"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex h-5 w-5 items-center justify-center rounded text-surface-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

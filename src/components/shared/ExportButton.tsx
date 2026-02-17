import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, FileText, FileType, FileDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  exportToMarkdown,
  exportToPlainText,
  exportToPdf,
  exportToDocx,
  exportChatToMarkdown,
  downloadBlob,
  downloadText,
} from '@/lib/export-utils';

type ExportType = 'note' | 'chat';

interface ExportButtonProps {
  content: string;
  title: string;
  type: ExportType;
  /** Chat messages for chat export (only used when type='chat') */
  chatMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    model?: string;
    timestamp?: Date;
  }>;
  className?: string;
}

interface ExportFormat {
  id: string;
  label: string;
  icon: React.ElementType;
  extension: string;
}

const FORMATS: ExportFormat[] = [
  { id: 'pdf', label: 'PDF', icon: FileText, extension: 'pdf' },
  { id: 'docx', label: 'DOCX', icon: FileType, extension: 'docx' },
  { id: 'md', label: 'Markdown', icon: FileDown, extension: 'md' },
  { id: 'txt', label: 'Plain Text', icon: FileDown, extension: 'txt' },
];

export function ExportButton({
  content,
  title,
  type,
  chatMessages,
  className,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleExport = useCallback(
    async (formatId: string) => {
      setExporting(formatId);

      try {
        const safeTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'export';
        const format = FORMATS.find((f) => f.id === formatId);
        if (!format) return;

        const filename = `${safeTitle}.${format.extension}`;

        switch (formatId) {
          case 'pdf': {
            const pdfContent = type === 'chat' && chatMessages
              ? exportChatToMarkdown(chatMessages, title)
              : content;
            const blob = await exportToPdf(pdfContent, title);
            downloadBlob(blob, filename);
            break;
          }
          case 'docx': {
            const docxContent = type === 'chat' && chatMessages
              ? exportChatToMarkdown(chatMessages, title)
              : content;
            const blob = await exportToDocx(docxContent, title);
            downloadBlob(blob, filename);
            break;
          }
          case 'md': {
            const md = type === 'chat' && chatMessages
              ? exportChatToMarkdown(chatMessages, title)
              : exportToMarkdown(content, title);
            downloadText(md, filename, 'text/markdown');
            break;
          }
          case 'txt': {
            const txt = type === 'chat' && chatMessages
              ? exportChatToMarkdown(chatMessages, title)
              : exportToPlainText(content, title);
            downloadText(txt, filename, 'text/plain');
            break;
          }
        }
      } catch (err) {
        console.error('Export failed:', err);
      } finally {
        setExporting(null);
        setOpen(false);
      }
    },
    [content, title, type, chatMessages]
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-1 rounded-lg px-2 py-1.5',
          'text-xs font-medium text-surface-500 dark:text-surface-400',
          'transition-colors hover:bg-surface-100 hover:text-surface-700',
          'dark:hover:bg-surface-800 dark:hover:text-surface-200',
          className
        )}
        title="Export"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl',
            'border border-surface-200 bg-white shadow-lg',
            'dark:border-surface-700 dark:bg-surface-850',
            'animate-in fade-in-0 zoom-in-95 duration-100'
          )}
        >
          {FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              onClick={() => handleExport(format.id)}
              disabled={exporting !== null}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-xs',
                'transition-colors hover:bg-surface-50 dark:hover:bg-surface-800',
                'text-surface-600 dark:text-surface-300',
                'disabled:opacity-50'
              )}
            >
              {exporting === format.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <format.icon className="h-3.5 w-3.5" />
              )}
              {format.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

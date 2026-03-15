import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FileText,
  Image,
  Music,
  Video,
  FileSpreadsheet,
  File,
  Trash2,
  MoreVertical,
  Zap,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatDate, getFileExtension, getFileTypeFromExtension } from '@/lib/utils';
import { FILE_TYPE_COLORS } from '@/lib/constants';
import useAppStore from '@/store';
import { useDeleteFile } from '@/hooks/useFiles';
import type { FileRecord } from '@/types';

interface FileListItemProps {
  file: FileRecord;
  onProcess?: (fileId: string) => void;
  processingState?: { isProcessing: boolean; error: string | null };
  showBatchSelector?: boolean;
  isBatchSelected?: boolean;
  onToggleBatchSelection?: (fileId: string) => void;
}

const typeIconMap: Record<string, React.ElementType> = {
  pdf: FileText,
  image: Image,
  audio: Music,
  video: Video,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  text: FileText,
  other: File,
};

function getFileSummary(file: FileRecord) {
  if (file.processing_status === 'failed' && file.processing_error) {
    return file.processing_error;
  }

  if (file.ai_summary) {
    return file.ai_summary;
  }

  if (file.content) {
    return file.content.replace(/\s+/g, ' ').trim();
  }

  return 'No summary available';
}

function getProcessingBadge(
  file: FileRecord,
  processingState?: { isProcessing: boolean; error: string | null }
) {
  if (processingState?.isProcessing || file.processing_status === 'processing') {
    return {
      label: 'Indexing',
      className:
        'border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-900/40 dark:bg-accent-900/20 dark:text-accent-300',
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    };
  }

  if (file.processing_status === 'completed') {
    return {
      label: 'AI-ready',
      className:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300',
      icon: <CheckCircle2 className="h-3 w-3" />,
    };
  }

  if (file.processing_status === 'failed') {
    return {
      label: 'Retry needed',
      className:
        'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300',
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  }

  return {
    label: 'Pending',
    className:
      'border-surface-200 bg-surface-50 text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300',
    icon: <Zap className="h-3 w-3" />,
  };
}

export function FileListItem({
  file,
  onProcess,
  processingState,
  showBatchSelector = false,
  isBatchSelected = false,
  onToggleBatchSelection,
}: FileListItemProps) {
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const deleteFile = useDeleteFile();
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedFileId === file.id;
  const ext = getFileExtension(file.name);
  const fileType = file.file_type || getFileTypeFromExtension(ext);
  const IconComponent = typeIconMap[fileType] || File;
  const colorClass = FILE_TYPE_COLORS[fileType] || FILE_TYPE_COLORS.other;
  const canProcess =
    !file.processing_status ||
    file.processing_status === 'pending' ||
    file.processing_status === 'failed';
  const statusBadge = getProcessingBadge(file, processingState);
  const summary = getFileSummary(file);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowConfirm(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setShowConfirm(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const setMobileTab = useAppStore((s) => s.setMobileTab);

  const handleClick = useCallback(() => {
    setSelectedFile(file.id);
    // Desktop: open right panel + viewer tab
    setRightPanel(true);
    setRightTab('viewer');
    // Mobile: navigate to viewer tab
    setMobileTab('viewer');
  }, [file.id, setSelectedFile, setRightPanel, setRightTab, setMobileTab]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setShowMenu(true);
    },
    []
  );

  const handleMenuToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMenu((prev) => !prev);
      setShowConfirm(false);
    },
    []
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!showConfirm) {
        setShowConfirm(true);
        return;
      }
      setShowMenu(false);
      setShowConfirm(false);
      deleteFile.mutate(file);
    },
    [showConfirm, file, deleteFile]
  );

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          'group flex w-full items-start gap-3 rounded-[22px] border px-3 py-3 text-left shadow-sm transition-all duration-150',
          isSelected
            ? 'border-primary-400 bg-white/94 shadow-[0_18px_38px_-26px_rgba(30,43,57,0.34)] ring-1 ring-primary-500/10 dark:border-primary-700 dark:bg-surface-900/88 dark:ring-primary-400/15'
            : 'border-translucent bg-white/80 interactive-lift hover:bg-white dark:bg-surface-900/70 dark:hover:bg-surface-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900'
        )}
      >
        {/* Batch select checkbox */}
        {showBatchSelector && onToggleBatchSelection && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBatchSelection(file.id);
            }}
            className={cn(
              'mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
              isBatchSelected
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-surface-300 bg-white text-transparent hover:border-primary-400 dark:border-surface-600 dark:bg-surface-800'
            )}
            aria-label={isBatchSelected ? `Deselect ${file.name}` : `Select ${file.name}`}
            title={isBatchSelected ? 'Deselect file' : 'Select file'}
          >
            <span className="text-[10px] leading-none">✓</span>
          </button>
        )}

        {/* File type icon */}
        <div
          className={cn(
            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
            isSelected
              ? 'bg-primary-100/85 dark:bg-primary-900/35'
              : 'bg-surface-100 dark:bg-surface-800/70'
          )}
        >
          <IconComponent className={cn('h-4 w-4', colorClass)} />
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm font-semibold truncate',
                  isSelected
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-surface-800 dark:text-surface-100'
                )}
                title={file.name}
              >
                {file.name}
              </p>
              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 overflow-hidden max-h-7">
                {file.added_at && (
                  <span className="rounded-full bg-surface-100 px-2 py-1 text-[10px] font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                    {formatDate(file.added_at)}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
                    statusBadge.className
                  )}
                  title={file.ai_summary || file.processing_error || statusBadge.label}
                >
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
              </div>
            </div>

            <div className="flex min-w-0 shrink-0 items-center gap-1">
              {onProcess && canProcess && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProcess(file.id);
                  }}
                  disabled={processingState?.isProcessing}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-medium transition-all',
                    processingState?.isProcessing
                      ? 'border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-900/40 dark:bg-accent-900/20 dark:text-accent-300'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:border-accent-800 dark:hover:bg-accent-900/20 dark:hover:text-accent-300',
                    !processingState?.isProcessing && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                  )}
                  title={file.processing_status === 'failed' ? 'Retry processing' : 'Index'}
                  aria-label={`Process ${file.name}`}
                >
                  {processingState?.isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{file.processing_status === 'failed' ? 'Retry' : 'Index'}</span>
                </button>
              )}
              {file.processing_status === 'processing' && !processingState?.isProcessing && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              )}

              {/* Menu button (shows on hover or when menu is open) */}
              <button
                type="button"
                onClick={handleMenuToggle}
                aria-haspopup="true"
                aria-expanded={showMenu}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                  showMenu
                    ? 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
                    : 'text-surface-400 max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-surface-100 dark:hover:bg-surface-800',
                  'focus-visible:opacity-100 focus-visible:outline-none'
                )}
                title="File actions"
                aria-label={`Actions for ${file.name}`}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-surface-500 dark:text-surface-400">
            {summary}
          </p>
        </div>
      </div>

      {/* Context menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className={cn(
            'absolute right-3 top-[calc(100%-0.35rem)] z-50 min-w-[160px] overflow-hidden rounded-2xl',
            'border border-surface-200 bg-white shadow-lg shadow-surface-900/10',
            'dark:border-surface-700 dark:bg-surface-800 dark:shadow-surface-950/30',
            'animate-in fade-in-0 zoom-in-95 duration-100'
          )}
        >
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors',
              showConfirm
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700'
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {showConfirm ? 'Click again to confirm' : 'Delete file'}
          </button>
        </div>
      )}
    </div>
  );
}

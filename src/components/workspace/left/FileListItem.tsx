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
  estimatedTokenLabel?: string;
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

export function FileListItem({
  file,
  onProcess,
  processingState,
  showBatchSelector = false,
  isBatchSelected = false,
  onToggleBatchSelection,
  estimatedTokenLabel,
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
      <button
        type="button"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          'group flex w-full items-center gap-2.5 px-3 py-2 text-left transition-all duration-150',
          isSelected
            ? 'border-l-2 border-l-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-l-2 border-l-transparent hover:bg-surface-50 dark:hover:bg-surface-800/50',
          'focus-visible:outline-none focus-visible:bg-surface-100 dark:focus-visible:bg-surface-700'
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
              'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
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
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            isSelected
              ? 'bg-primary-100 dark:bg-primary-800/40'
              : 'bg-surface-100 dark:bg-surface-700/60'
          )}
        >
          <IconComponent className={cn('h-4 w-4', colorClass)} />
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm font-medium',
              isSelected
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-surface-700 dark:text-surface-200'
            )}
            title={file.name}
          >
            {file.name}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {/* Extension badge */}
            {ext && (
              <span
                className={cn(
                  'inline-block rounded px-1 py-px text-[10px] font-semibold uppercase leading-tight',
                  isSelected
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-800/40 dark:text-primary-400'
                    : 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                )}
              >
                {ext}
              </span>
            )}
            {/* Estimated token usage */}
            {estimatedTokenLabel && canProcess && (
              <span className="rounded px-1 py-px text-[10px] font-medium text-accent-600 dark:text-accent-400">
                {estimatedTokenLabel}
              </span>
            )}
            {/* Date */}
            {file.added_at && (
              <span className="text-[11px] text-surface-400 dark:text-surface-500">
                {formatDate(file.added_at)}
              </span>
            )}
            {/* Processing status badge */}
            {file.processing_status === 'completed' && (
              <span title={file.ai_summary || 'Processed'}>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              </span>
            )}
            {file.processing_status === 'failed' && (
              <span title={file.processing_error || 'Processing failed'}>
                <AlertTriangle className="h-3 w-3 text-red-400" />
              </span>
            )}
          </div>
        </div>

        {/* Process button */}
        {onProcess && canProcess && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProcess(file.id);
            }}
            disabled={processingState?.isProcessing}
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors',
              processingState?.isProcessing
                ? 'text-accent-500'
                : 'text-surface-400 hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-900/20 dark:hover:text-accent-400'
            )}
            title={file.processing_status === 'failed' ? 'Retry processing' : 'Process file for AI search'}
            aria-label={`Process ${file.name}`}
          >
            {processingState?.isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        {file.processing_status === 'processing' && !processingState?.isProcessing && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-500" />
          </div>
        )}

        {/* Menu button (shows on hover or when menu is open) */}
        <button
          type="button"
          onClick={handleMenuToggle}
          aria-haspopup="true"
          aria-expanded={showMenu}
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors',
            showMenu
              ? 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
              : 'text-surface-400 max-md:opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:bg-surface-200 dark:hover:bg-surface-600',
            'focus-visible:opacity-100 focus-visible:outline-none'
          )}
          title="File actions"
          aria-label={`Actions for ${file.name}`}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </button>

      {/* Context menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className={cn(
            'absolute right-2 top-full z-50 min-w-[140px] overflow-hidden rounded-lg',
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

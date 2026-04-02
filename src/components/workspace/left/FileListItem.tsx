import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Trash2,
  MoreVertical,
  Zap,
  Loader2,
  Info,
  X,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatDate, getFileExtension } from '@/lib/utils';
import { getDocumentTypeLabel, getDocumentTypeCategoryLabel } from '@/lib/documentTypes';
import useAppStore from '@/store';
import { useDeleteFile } from '@/hooks/useFiles';
import type { FileRecord } from '@/types';

// ── Extension badge colors ──────────────────────────────────────────
function getExtStyle(ext: string): string {
  switch (ext) {
    case 'pdf':
      return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400';
    case 'doc':
    case 'docx':
      return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
      return 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400';
    case 'mp3':
    case 'wav':
    case 'm4a':
    case 'ogg':
    case 'flac':
      return 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400';
    case 'mp4':
    case 'mov':
    case 'webm':
    case 'avi':
      return 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400';
    case 'csv':
    case 'xls':
    case 'xlsx':
      return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
    case 'txt':
    case 'md':
    case 'rtf':
      return 'bg-surface-500/10 text-surface-600 dark:bg-surface-500/15 dark:text-surface-400';
    default:
      return 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400';
  }
}

// ── Document type accent text colors ────────────────────────────────
const DOC_TYPE_TEXT: Record<string, string> = {
  court: 'text-blue-600 dark:text-blue-400',
  employment: 'text-amber-600 dark:text-amber-400',
  financial: 'text-emerald-600 dark:text-emerald-400',
  regulatory: 'text-violet-600 dark:text-violet-400',
  correspondence: 'text-surface-500 dark:text-surface-400',
  medical: 'text-rose-600 dark:text-rose-400',
};

// ── Processing status ───────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  completed: 'bg-emerald-500',
  processing: 'bg-amber-400 animate-pulse',
  failed: 'bg-red-500',
  pending: 'bg-surface-300 dark:bg-surface-600',
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'Indexed',
  processing: 'Indexing...',
  failed: 'Failed',
  pending: 'Not indexed',
};

function getProcessingFailureInfo(error: string | null | undefined) {
  const technical = error?.trim() || null;
  if (!technical) {
    return {
      summary:
        'AI indexing failed. Retry to include this file in search, timeline, and drafting.',
      technical: null,
    };
  }
  if (/unsupported Unicode escape sequence/i.test(technical)) {
    return {
      summary:
        'AI indexing hit malformed text. Retry to bring it back into workflows.',
      technical,
    };
  }
  if (/budget reached/i.test(technical)) {
    return {
      summary: 'Daily indexing limits reached. Retry later.',
      technical,
    };
  }
  return {
    summary:
      'AI indexing failed. Retry to include this file in search, timeline, and drafting.',
    technical,
  };
}

// ── Component ───────────────────────────────────────────────────────
interface FileListItemProps {
  file: FileRecord;
  onProcess?: (fileId: string) => void;
  processingState?: { isProcessing: boolean; error: string | null };
  compact?: boolean;
  showBatchSelector?: boolean;
  isBatchSelected?: boolean;
  onToggleBatchSelection?: (fileId: string) => void;
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
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const setMobileTab = useAppStore((s) => s.setMobileTab);
  const deleteFile = useDeleteFile();

  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedFileId === file.id;
  const ext = getFileExtension(file.name);
  const isProcessing =
    processingState?.isProcessing || file.processing_status === 'processing';
  const status = isProcessing
    ? 'processing'
    : file.processing_status || 'pending';
  const canProcess =
    !isProcessing &&
    (!file.processing_status ||
      file.processing_status === 'pending' ||
      file.processing_status === 'failed');
  const isFailed = file.processing_status === 'failed';
  const failureInfo = isFailed
    ? getProcessingFailureInfo(file.processing_error)
    : null;

  const docType = file.document_type;
  const docTypeLabel =
    docType && docType !== 'other' ? getDocumentTypeLabel(docType) : null;
  const docCategoryLabel = docType
    ? getDocumentTypeCategoryLabel(docType)
    : null;
  const confidence = file.classification_confidence;

  const summary =
    file.ai_summary ||
    (file.content
      ? file.content.replace(/\s+/g, ' ').trim().slice(0, 200)
      : null);

  const tooltip = failureInfo
    ? `${file.name}\n${failureInfo.summary}`
    : summary
      ? `${file.name}\n${summary}`
      : file.name;

  // ── Click-outside & Escape ──────────────────────────────────────
  useEffect(() => {
    if (!showMenu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowConfirm(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setShowConfirm(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!showDetails) return;
    const onClick = (e: MouseEvent) => {
      if (
        detailsRef.current &&
        !detailsRef.current.contains(e.target as Node)
      ) {
        setShowDetails(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDetails(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showDetails]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    setSelectedFile(file.id);
    setRightPanel(true);
    setRightTab('viewer');
    setMobileTab('viewer');
  }, [file.id, setSelectedFile, setRightPanel, setRightTab, setMobileTab]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  }, []);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((p) => !p);
    setShowConfirm(false);
  }, []);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
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
    <div className="relative border-b border-surface-100 dark:border-surface-800/50">
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
          'group relative flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors duration-75',
          isSelected
            ? 'bg-primary-50/70 dark:bg-primary-900/15'
            : 'hover:bg-surface-50 dark:hover:bg-surface-800/40',
          isFailed && !isSelected && 'bg-red-50/30 dark:bg-red-950/8',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500'
        )}
        title={tooltip}
        aria-label={`Open ${file.name}`}
      >
        {/* Selected accent bar */}
        {isSelected && (
          <div className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-primary-500" />
        )}

        {/* Batch checkbox */}
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
                : 'border-surface-300 bg-white hover:border-primary-400 dark:border-surface-600 dark:bg-surface-800'
            )}
            aria-label={
              isBatchSelected
                ? `Deselect ${file.name}`
                : `Select ${file.name}`
            }
          >
            <span className="text-[10px] leading-none">&#10003;</span>
          </button>
        )}

        {/* Extension badge with status dot */}
        <div className="relative mt-0.5 shrink-0">
          <div
            className={cn(
              'flex h-6 items-center justify-center rounded px-1.5 text-[10px] font-bold uppercase leading-none tracking-wider',
              getExtStyle(ext)
            )}
          >
            {ext.slice(0, 4) || '?'}
          </div>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-[6px] w-[6px] rounded-full ring-[1.5px]',
              isSelected
                ? 'ring-primary-50 dark:ring-[hsl(222,20%,12%)]'
                : isFailed && !isSelected
                  ? 'ring-red-50 dark:ring-[hsl(0,20%,8%)]'
                  : 'ring-white dark:ring-surface-900',
              STATUS_DOT[status] || STATUS_DOT.pending
            )}
            title={STATUS_LABEL[status] || 'Not indexed'}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Line 1: name + actions */}
          <div className="flex items-center gap-1">
            <p
              className={cn(
                'min-w-0 flex-1 truncate text-[13px] font-medium leading-5',
                isSelected
                  ? 'text-primary-700 dark:text-primary-200'
                  : isFailed
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-surface-800 dark:text-surface-100'
              )}
              title={file.name}
            >
              {file.name}
            </p>

            {/* Always-visible processing spinner */}
            {isProcessing && (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center text-amber-500">
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            )}

            {/* Hover action buttons */}
            <div
              className={cn(
                'flex shrink-0 items-center transition-opacity duration-75',
                showMenu || showDetails
                  ? 'opacity-100'
                  : 'max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100'
              )}
            >
              {/* Details toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails((p) => !p);
                }}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded transition-colors',
                  showDetails
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300'
                )}
                title="File details"
                aria-label="Details"
                aria-expanded={showDetails}
              >
                <Info className="h-3 w-3" />
              </button>

              {/* Index / Retry button */}
              {onProcess && canProcess && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProcess(file.id);
                  }}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded transition-colors',
                    isFailed
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-surface-400 hover:bg-surface-100 hover:text-accent-600 dark:hover:bg-surface-700 dark:hover:text-accent-400'
                  )}
                  title={isFailed ? 'Retry indexing' : 'Index for AI'}
                  aria-label={isFailed ? 'Retry' : 'Index'}
                >
                  <Zap className="h-3 w-3" />
                </button>
              )}

              {/* Menu */}
              <button
                type="button"
                onClick={handleMenuToggle}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded transition-colors',
                  showMenu
                    ? 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
                    : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                )}
                title="Actions"
                aria-label="Actions"
                aria-haspopup="true"
                aria-expanded={showMenu}
              >
                <MoreVertical className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Line 2: metadata */}
          <div className="mt-0.5 flex items-center gap-1 text-[11px] leading-4">
            {docTypeLabel && (
              <>
                <span
                  className={cn(
                    'max-w-[140px] truncate font-medium',
                    DOC_TYPE_TEXT[docType!] || 'text-surface-500'
                  )}
                  title={
                    docCategoryLabel
                      ? `${docTypeLabel} (${docCategoryLabel})`
                      : docTypeLabel
                  }
                >
                  {docTypeLabel}
                </span>
                {file.added_at && (
                  <span className="text-surface-300 dark:text-surface-600">
                    &middot;
                  </span>
                )}
              </>
            )}
            {file.added_at && (
              <span
                className="text-surface-400 dark:text-surface-500"
                title={file.added_at}
              >
                {formatDate(file.added_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Details popover ───────────────────────────────────── */}
      {showDetails && (
        <div
          ref={detailsRef}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute left-2 right-2 top-full z-50 mt-1 overflow-hidden rounded-xl',
            'border border-surface-200 bg-white shadow-lg shadow-surface-900/8',
            'dark:border-surface-700 dark:bg-surface-900 dark:shadow-surface-950/25'
          )}
        >
          <div className="flex items-center justify-between border-b border-surface-100 px-3 py-1.5 dark:border-surface-700/60">
            <span className="text-[11px] font-semibold text-surface-600 dark:text-surface-300">
              Details
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700"
              title="Close"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2.5 px-3 py-2.5 text-xs">
            {/* AI Summary / Failure */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                {failureInfo ? 'Issue' : 'AI Summary'}
              </span>
              <p className="mt-0.5 leading-relaxed text-surface-600 dark:text-surface-300">
                {failureInfo?.summary || summary || 'No summary available'}
              </p>
              {failureInfo?.technical && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-red-50 px-2 py-1.5 dark:bg-red-950/30">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500 dark:text-red-400" />
                  <p
                    className="text-[10px] leading-relaxed text-red-600 [overflow-wrap:anywhere] dark:text-red-300"
                    title={failureInfo.technical}
                  >
                    {failureInfo.technical}
                  </p>
                </div>
              )}
            </div>

            {/* Document type */}
            {docTypeLabel && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  Type
                </span>
                <p className="mt-0.5 text-surface-600 dark:text-surface-300">
                  {docTypeLabel}
                  {docCategoryLabel && (
                    <span className="text-surface-400 dark:text-surface-500">
                      {' '}
                      ({docCategoryLabel})
                    </span>
                  )}
                </p>
                {typeof confidence === 'number' && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-surface-100 dark:bg-surface-700">
                      <div
                        className={cn(
                          'h-1 rounded-full',
                          confidence >= 0.7
                            ? 'bg-emerald-500'
                            : confidence >= 0.4
                              ? 'bg-amber-500'
                              : 'bg-red-400'
                        )}
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-surface-400">
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Processing status */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Status
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    STATUS_DOT[status] || STATUS_DOT.pending
                  )}
                />
                <span className="text-surface-600 dark:text-surface-300">
                  {STATUS_LABEL[status] || 'Not indexed'}
                </span>
              </div>
              {file.processed_at && (
                <p className="mt-0.5 text-[10px] text-surface-400">
                  Processed: {formatDate(file.processed_at)}
                </p>
              )}
            </div>

            {/* Chunks */}
            {typeof file.chunk_count === 'number' && file.chunk_count > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  Index
                </span>
                <p className="mt-0.5 text-surface-600 dark:text-surface-300">
                  {file.chunk_count} chunk
                  {file.chunk_count !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* File info */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                File
              </span>
              <p className="mt-0.5 text-surface-600 dark:text-surface-300">
                {ext ? `.${ext}` : 'Unknown'}
                {file.added_at && ` · Added ${formatDate(file.added_at)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Context menu ──────────────────────────────────────── */}
      {showMenu && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute right-2 top-full z-50 mt-0.5 min-w-[140px] overflow-hidden rounded-lg',
            'border border-surface-200 bg-white shadow-lg shadow-surface-900/8',
            'dark:border-surface-700 dark:bg-surface-900 dark:shadow-surface-950/25'
          )}
        >
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
              showConfirm
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700/60'
            )}
          >
            <Trash2 className="h-3 w-3" />
            {showConfirm ? 'Confirm delete' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}

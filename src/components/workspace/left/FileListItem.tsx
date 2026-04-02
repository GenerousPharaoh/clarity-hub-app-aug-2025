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
  Info,
  X,
} from 'lucide-react';
import { cn, formatDate, getFileExtension, getFileTypeFromExtension } from '@/lib/utils';
import { FILE_TYPE_COLORS } from '@/lib/constants';
import { getDocumentTypeLabel, getDocumentTypeCategoryLabel } from '@/lib/documentTypes';
import useAppStore from '@/store';
import { useDeleteFile } from '@/hooks/useFiles';
import type { FileRecord } from '@/types';

// ── Document type badge colors ──────────────────────────────────────
const DOC_TYPE_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  court: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-900/40',
  },
  employment: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900/40',
  },
  financial: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-900/40',
  },
  regulatory: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-900/40',
  },
  correspondence: {
    bg: 'bg-gray-50 dark:bg-gray-800/40',
    text: 'text-gray-600 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  },
  medical: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-900/40',
  },
};

function getDocTypeBadgeStyle(docType: string) {
  return DOC_TYPE_BADGE_COLORS[docType] || DOC_TYPE_BADGE_COLORS.correspondence;
}

// ── Processing status dot colors ────────────────────────────────────
const STATUS_DOT_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500',
  processing: 'bg-amber-400 animate-pulse',
  failed: 'bg-red-500',
  pending: 'bg-surface-300 dark:bg-surface-600',
};

function getStatusDotColor(status: string | null, isProcessing?: boolean) {
  if (isProcessing) return STATUS_DOT_COLORS.processing;
  return STATUS_DOT_COLORS[status || 'pending'] || STATUS_DOT_COLORS.pending;
}

function getStatusLabel(status: string | null, isProcessing?: boolean): string {
  if (isProcessing) return 'Processing (indexing for AI search)';
  switch (status) {
    case 'completed':
      return 'Completed (AI-ready)';
    case 'processing':
      return 'Processing (indexing for AI search)';
    case 'failed':
      return 'Failed (retry needed)';
    default:
      return 'Pending (not yet indexed)';
  }
}

// ── File type icon background colors ────────────────────────────────
const FILE_TYPE_ICON_BG: Record<string, string> = {
  pdf: 'bg-red-100 dark:bg-red-900/30',
  image: 'bg-blue-100 dark:bg-blue-900/30',
  audio: 'bg-purple-100 dark:bg-purple-900/30',
  video: 'bg-orange-100 dark:bg-orange-900/30',
  document: 'bg-sky-100 dark:bg-sky-900/30',
  spreadsheet: 'bg-green-100 dark:bg-green-900/30',
  text: 'bg-slate-100 dark:bg-slate-800/50',
  other: 'bg-surface-100 dark:bg-surface-800/70',
};

interface FileListItemProps {
  file: FileRecord;
  onProcess?: (fileId: string) => void;
  processingState?: { isProcessing: boolean; error: string | null };
  compact?: boolean;
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

function getProcessingFailureInfo(error: string | null | undefined) {
  const technical = error?.trim() || null;

  if (!technical) {
    return {
      summary: 'AI indexing failed. Retry to include this file in search, timeline, and drafting workflows.',
      technical: null,
    };
  }

  if (/unsupported Unicode escape sequence/i.test(technical)) {
    return {
      summary: 'AI indexing hit malformed text in this file. Retry indexing to bring it back into search, timeline, and exhibit workflows.',
      technical,
    };
  }

  if (/budget reached/i.test(technical)) {
    return {
      summary: 'Daily indexing limits were reached. Retry later to make this file available to AI workflows.',
      technical,
    };
  }

  return {
    summary: 'AI indexing failed. Retry to include this file in search, timeline, and drafting workflows.',
    technical,
  };
}

function getFileSummary(file: FileRecord) {
  if (file.processing_status === 'failed' && file.processing_error) {
    return getProcessingFailureInfo(file.processing_error).summary;
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
        'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900/40 dark:bg-primary-950/30 dark:text-primary-300',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    };
  }

  if (file.processing_status === 'completed') {
    return {
      label: 'AI-ready',
      className:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    };
  }

  if (file.processing_status === 'failed') {
    return {
      label: 'Retry needed',
      className:
        'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    };
  }

  return {
    label: 'Pending',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300',
    icon: <Zap className="h-3.5 w-3.5" />,
  };
}

export function FileListItem({
  file,
  onProcess,
  processingState,
  compact = false,
  showBatchSelector = false,
  isBatchSelected = false,
  onToggleBatchSelection,
}: FileListItemProps) {
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const deleteFile = useDeleteFile();
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const detailsBtnRef = useRef<HTMLButtonElement>(null);

  const isSelected = selectedFileId === file.id;
  const ext = getFileExtension(file.name);
  const fileType = file.file_type || getFileTypeFromExtension(ext);
  const IconComponent = typeIconMap[fileType] || File;
  const colorClass = FILE_TYPE_COLORS[fileType] || FILE_TYPE_COLORS.other;
  const iconBgClass = FILE_TYPE_ICON_BG[fileType] || FILE_TYPE_ICON_BG.other;
  const canProcess =
    !file.processing_status ||
    file.processing_status === 'pending' ||
    file.processing_status === 'failed';
  const statusBadge = getProcessingBadge(file, processingState);
  const summary = getFileSummary(file);
  const statusDotColor = getStatusDotColor(file.processing_status, processingState?.isProcessing);
  const statusTooltip = getStatusLabel(file.processing_status, processingState?.isProcessing);
  const failureInfo =
    file.processing_status === 'failed'
      ? getProcessingFailureInfo(file.processing_error)
      : null;
  const showUtilityButtons = compact;
  const hoverPreview = failureInfo
    ? `${file.name}\n\n${failureInfo.summary}${failureInfo.technical ? `\n\nTechnical detail: ${failureInfo.technical}` : ''}`
    : `${file.name}\n\n${summary}`;

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

  // Close details popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!showDetails) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        detailsRef.current &&
        !detailsRef.current.contains(e.target as Node) &&
        detailsBtnRef.current &&
        !detailsBtnRef.current.contains(e.target as Node)
      ) {
        setShowDetails(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowDetails(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDetails]);

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

  const handleDetailsToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDetails((prev) => !prev);
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

  // Build detail items for the popover
  const docType = file.document_type;
  const confidence = file.classification_confidence;
  const docTypeLabel = docType ? getDocumentTypeLabel(docType) : null;
  const docCategoryLabel = docType ? getDocumentTypeCategoryLabel(docType) : null;

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
        aria-label={`Open ${file.name}`}
        title={hoverPreview}
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
            <span className="text-xs leading-none">&#10003;</span>
          </button>
        )}

        {/* File type icon with distinct color per type */}
        <div className="relative mt-0.5 shrink-0">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl',
              isSelected
                ? 'bg-primary-100/85 dark:bg-primary-900/35'
                : iconBgClass
            )}
            title={`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} file`}
          >
            <IconComponent className={cn('h-4 w-4', colorClass)} />
          </div>
          {/* Status dot overlay */}
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-surface-900',
              statusDotColor
            )}
            title={statusTooltip}
          />
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'line-clamp-2 font-semibold leading-5 [overflow-wrap:anywhere]',
                  compact ? 'text-[13px]' : 'text-sm',
                  isSelected
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-surface-800 dark:text-surface-100'
                )}
                title={file.name}
              >
                {file.name}
              </p>
              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                {/* Document type badge */}
                {(() => {
                  if (docType && docType !== 'other') {
                    const style = getDocTypeBadgeStyle(docType);
                    const isUncertain = typeof confidence === 'number' && confidence < 0.7;
                    const fullLabel = getDocumentTypeLabel(docType);
                    const tooltipText = isUncertain
                      ? `${fullLabel} (low confidence: ${Math.round((confidence ?? 0) * 100)}%)`
                      : `${fullLabel} - ${docCategoryLabel ?? 'Unknown category'}`;
                    return (
                      <span
                        className={cn(
                          'max-w-full rounded-full px-2 py-1 text-xs font-medium',
                          style.bg,
                          style.text,
                          isUncertain && `border ${style.border} border-dashed`
                        )}
                        title={tooltipText}
                      >
                        {fullLabel}
                      </span>
                    );
                  }
                  return null;
                })()}
                {file.added_at && (
                  <span
                    className="rounded-full bg-surface-100 px-2 py-1 text-xs font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400"
                    title={`Added: ${file.added_at}`}
                  >
                    {formatDate(file.added_at)}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em]',
                    statusBadge.className
                  )}
                  title={statusTooltip}
                >
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
              </div>
            </div>

            <div className="flex min-w-0 shrink-0 items-center gap-1">
              {/* Info/details toggle button */}
              <button
                ref={detailsBtnRef}
                type="button"
                onClick={handleDetailsToggle}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                  showDetails
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                    : showUtilityButtons
                      ? 'text-surface-400 opacity-100 hover:bg-surface-100 dark:hover:bg-surface-800'
                      : 'text-surface-400 max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-surface-100 dark:hover:bg-surface-800',
                  'focus-visible:opacity-100 focus-visible:outline-none'
                )}
                title="View file details"
                aria-label={`Details for ${file.name}`}
                aria-expanded={showDetails}
              >
                <Info className="h-3.5 w-3.5" />
              </button>

              {onProcess && canProcess && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProcess(file.id);
                  }}
                  disabled={processingState?.isProcessing}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-sm font-medium transition-all',
                    compact && 'px-2 text-xs',
                    processingState?.isProcessing
                      ? 'border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-900/40 dark:bg-accent-900/20 dark:text-accent-300'
                      : file.processing_status === 'failed'
                        ? 'border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950/50'
                        : 'border-surface-200 bg-white text-surface-600 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:border-accent-800 dark:hover:bg-accent-900/20 dark:hover:text-accent-300',
                    !processingState?.isProcessing &&
                      file.processing_status !== 'failed' &&
                      !showUtilityButtons &&
                      'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                  )}
                  title={file.processing_status === 'failed' ? 'Retry indexing' : 'Index'}
                  aria-label={`Process ${file.name}`}
                >
                  {processingState?.isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  <span className={cn(compact ? 'hidden' : 'hidden sm:inline')}>
                    {file.processing_status === 'failed' ? 'Retry' : 'Index'}
                  </span>
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
                    : showUtilityButtons
                      ? 'text-surface-400 opacity-100 hover:bg-surface-100 dark:hover:bg-surface-800'
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

          {failureInfo ? (
            <div className="mt-3 rounded-2xl border border-red-200/80 bg-red-50/75 px-3 py-2.5 dark:border-red-900/40 dark:bg-red-950/25">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500 dark:text-red-400" />
                <div className="min-w-0">
                  <p
                    className="text-xs font-medium leading-5 text-red-700 dark:text-red-300"
                    title={failureInfo.summary}
                  >
                    {failureInfo.summary}
                  </p>
                  {failureInfo.technical && (
                    <p
                      className="mt-1 line-clamp-2 text-[10px] leading-4 text-red-500/85 [overflow-wrap:anywhere] dark:text-red-400/80"
                      title={failureInfo.technical}
                    >
                      Technical detail: {failureInfo.technical}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p
              className="mt-3 line-clamp-3 text-xs leading-5 text-surface-500 [overflow-wrap:anywhere] dark:text-surface-400"
              title={summary}
            >
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* ── Details popover ──────────────────────────────────── */}
      {showDetails && (
        <div
          ref={detailsRef}
          className={cn(
            'absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden rounded-2xl',
            'border border-surface-200 bg-white shadow-lg shadow-surface-900/10',
            'dark:border-surface-700 dark:bg-surface-800 dark:shadow-surface-950/30',
            'transition-all duration-100'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-100 px-3 py-2 dark:border-surface-700">
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">
              File Details
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
              title="Close details"
              aria-label="Close details"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2 px-3 py-2.5">
            {/* AI Summary */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                {failureInfo ? 'Indexing Note' : 'AI Summary'}
              </span>
              <p className="mt-0.5 text-xs leading-relaxed text-surface-600 dark:text-surface-300">
                {failureInfo?.summary || file.ai_summary || 'No summary available'}
              </p>
            </div>

            {/* Document Type & Classification */}
            {docType && docType !== 'other' && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  Document Type
                </span>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs font-medium text-surface-700 dark:text-surface-200">
                    {docTypeLabel}
                  </span>
                  {docCategoryLabel && (
                    <span className="text-xs text-surface-400 dark:text-surface-500">
                      ({docCategoryLabel})
                    </span>
                  )}
                </div>
                {typeof confidence === 'number' && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-surface-100 dark:bg-surface-700">
                      <div
                        className={cn(
                          'h-1 rounded-full transition-all',
                          confidence >= 0.7
                            ? 'bg-emerald-500'
                            : confidence >= 0.4
                              ? 'bg-amber-500'
                              : 'bg-red-400'
                        )}
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-surface-400 dark:text-surface-500">
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Processing Status */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Processing Status
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    'inline-block h-2 w-2 rounded-full',
                    statusDotColor
                  )}
                />
                <span className="text-xs text-surface-600 dark:text-surface-300">
                  {statusTooltip}
                </span>
              </div>
              {file.processed_at && (
                <p className="mt-0.5 text-[10px] text-surface-400 dark:text-surface-500">
                  Processed: {formatDate(file.processed_at)}
                </p>
              )}
              {failureInfo?.technical && (
                <p
                  className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] leading-relaxed text-red-600 dark:bg-red-950/30 dark:text-red-300"
                  title={failureInfo.technical}
                >
                  Technical detail: {failureInfo.technical}
                </p>
              )}
            </div>

            {/* Chunk Count */}
            {typeof file.chunk_count === 'number' && file.chunk_count > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  Chunks
                </span>
                <p className="mt-0.5 text-xs text-surface-600 dark:text-surface-300">
                  {file.chunk_count} indexed chunk{file.chunk_count !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* File type & extension */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                File Type
              </span>
              <p className="mt-0.5 text-xs text-surface-600 dark:text-surface-300">
                {fileType.charAt(0).toUpperCase() + fileType.slice(1)}
                {ext ? ` (.${ext})` : ''}
              </p>
            </div>

            {/* Date added */}
            {file.added_at && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  Added
                </span>
                <p className="mt-0.5 text-xs text-surface-600 dark:text-surface-300">
                  {formatDate(file.added_at)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className={cn(
            'absolute right-3 top-[calc(100%-0.35rem)] z-50 min-w-[160px] overflow-hidden rounded-2xl',
            'border border-surface-200 bg-white shadow-lg shadow-surface-900/10',
            'dark:border-surface-700 dark:bg-surface-800 dark:shadow-surface-950/30',
            'transition-all duration-100'
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

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { ChevronLeft, FolderOpen, Search, X, FileText, AlertCircle, RefreshCw, Loader2, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn, formatFileSize } from '@/lib/utils';
import useAppStore from '@/store';
import type { FileRecord } from '@/types';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useFiles } from '@/hooks/useFiles';
import { useProcessFile } from '@/hooks/useProcessFile';
import {
  PROCESSING_DAILY_FILE_LIMIT,
  PROCESSING_DAILY_MB_LIMIT_BYTES,
  checkProcessingBudget,
  checkProcessingBudgetBatch,
  estimateFileBytesByType,
  estimateProcessingCost,
} from '@/lib/processingBudget';
import { FileListItem } from './FileListItem';
import { FileUploadZone } from './FileUploadZone';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { toast } from 'sonner';

function isProcessable(file: FileRecord): boolean {
  return (
    !file.processing_status ||
    file.processing_status === 'pending' ||
    file.processing_status === 'failed'
  );
}

function formatTokenEstimate(tokens: number): string {
  if (tokens >= 10_000) return `~${Math.round(tokens / 1000)}k tok`;
  if (tokens >= 1000) return `~${(tokens / 1000).toFixed(1)}k tok`;
  return `~${tokens} tok`;
}

export function LeftPanel() {
  const toggleLeft = useAppStore((s) => s.toggleLeftPanel);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const isMobile = useIsMobile();
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  // Track panel width for responsive layout
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPanelWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = panelWidth > 0 && panelWidth < 280;
  const ultraCompact = panelWidth > 0 && panelWidth < 220;

  const { data: files = [], isLoading, isError, refetch } = useFiles(selectedProjectId);
  const { processFile, getState: getProcessState } = useProcessFile();
  const [processConfirmFileId, setProcessConfirmFileId] = useState<string | null>(null);
  const [batchSelectionMode, setBatchSelectionMode] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  const processableFiles = useMemo(() => files.filter(isProcessable), [files]);
  const processedCount = useMemo(
    () => files.filter((file) => file.processing_status === 'completed').length,
    [files]
  );
  const processingCount = useMemo(
    () =>
      files.filter((file) => {
        const state = getProcessState(file.id);
        return state.isProcessing || file.processing_status === 'processing';
      }).length,
    [files, getProcessState]
  );

  const perFileEstimates = useMemo(() => {
    const map = new Map<
      string,
      {
        bytes: number;
        totalTokens: number;
        embeddingChunks: number;
      }
    >();

    for (const file of processableFiles) {
      const bytes = estimateFileBytesByType(file.file_type);
      const estimate = estimateProcessingCost(bytes);
      map.set(file.id, {
        bytes,
        totalTokens: estimate.totalTokens,
        embeddingChunks: estimate.embeddingChunks,
      });
    }

    return map;
  }, [processableFiles]);

  useEffect(() => {
    const validIds = new Set(processableFiles.map((f) => f.id));
    setSelectedBatchIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [processableFiles]);

  const handleProcess = useCallback(
    (fileId: string) => {
      if (!selectedProjectId) return;
      const estimatedBytes = perFileEstimates.get(fileId)?.bytes ?? estimateFileBytesByType(null);
      const budget = checkProcessingBudget(estimatedBytes);
      if (!budget.allowed) {
        toast.error('Processing budget reached', {
          description: budget.reason,
        });
        return;
      }
      setProcessConfirmFileId(fileId);
    },
    [selectedProjectId, perFileEstimates]
  );

  const fileToProcess = processConfirmFileId
    ? files.find((f) => f.id === processConfirmFileId) ?? null
    : null;

  const singleEstimate = useMemo(() => {
    if (!fileToProcess) return null;
    return perFileEstimates.get(fileToProcess.id) ?? {
      bytes: estimateFileBytesByType(fileToProcess.file_type),
      ...estimateProcessingCost(estimateFileBytesByType(fileToProcess.file_type)),
    };
  }, [fileToProcess, perFileEstimates]);

  const handleProcessConfirm = useCallback(() => {
    if (!selectedProjectId || !fileToProcess) return;

    const estimatedBytes =
      perFileEstimates.get(fileToProcess.id)?.bytes ??
      estimateFileBytesByType(fileToProcess.file_type);

    void processFile(fileToProcess.id, selectedProjectId, {
      fileSizeBytes: estimatedBytes,
      source: 'manual',
    })
      .then(() => {
        toast.success('File processed for AI search');
      })
      .catch((err) => {
        toast.error('Processing failed', {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      });

    setProcessConfirmFileId(null);
  }, [selectedProjectId, fileToProcess, perFileEstimates, processFile]);

  const selectedBatchIdSet = useMemo(() => new Set(selectedBatchIds), [selectedBatchIds]);

  const selectedBatchFiles = useMemo(
    () => processableFiles.filter((file) => selectedBatchIdSet.has(file.id)),
    [processableFiles, selectedBatchIdSet]
  );

  const batchEstimate = useMemo(() => {
    let totalBytes = 0;
    let totalTokens = 0;
    let totalChunks = 0;

    for (const file of selectedBatchFiles) {
      const estimate = perFileEstimates.get(file.id);
      if (!estimate) continue;
      totalBytes += estimate.bytes;
      totalTokens += estimate.totalTokens;
      totalChunks += estimate.embeddingChunks;
    }

    return { totalBytes, totalTokens, totalChunks };
  }, [selectedBatchFiles, perFileEstimates]);

  const handleToggleBatchSelection = useCallback((fileId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  }, []);

  const handleOpenBatchConfirm = useCallback(() => {
    if (selectedBatchFiles.length === 0) {
      toast.error('Select at least one file to process');
      return;
    }

    const budget = checkProcessingBudgetBatch(
      selectedBatchFiles.length,
      batchEstimate.totalBytes
    );
    if (!budget.allowed) {
      toast.error('Processing budget reached', {
        description: budget.reason,
      });
      return;
    }

    setBatchConfirmOpen(true);
  }, [selectedBatchFiles, batchEstimate.totalBytes]);

  const handleBatchProcessConfirm = useCallback(() => {
    if (!selectedProjectId || selectedBatchFiles.length === 0) return;

    const filesToProcess = [...selectedBatchFiles];
    setBatchConfirmOpen(false);

    void (async () => {
      let successCount = 0;
      let failureCount = 0;

      for (const file of filesToProcess) {
        try {
          const estimatedBytes =
            perFileEstimates.get(file.id)?.bytes ?? estimateFileBytesByType(file.file_type);
          await processFile(file.id, selectedProjectId, {
            fileSizeBytes: estimatedBytes,
            source: 'manual',
          });
          successCount += 1;
        } catch {
          failureCount += 1;
        }
      }

      if (successCount > 0) {
        toast.success(`Processed ${successCount} file${successCount === 1 ? '' : 's'} for AI search`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} file${failureCount === 1 ? '' : 's'} failed to process`);
      }

      setSelectedBatchIds([]);
      setBatchSelectionMode(false);
    })();
  }, [selectedProjectId, selectedBatchFiles, perFileEstimates, processFile]);

  // Debounced search: input updates immediately, filtering deferred by 150ms
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Client-side filtering uses debounced query
  const filteredFiles = useMemo(() => {
    if (!debouncedQuery.trim()) return files;
    const q = debouncedQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.file_type && f.file_type.toLowerCase().includes(q))
    );
  }, [files, debouncedQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, [setSearchQuery]);

  return (
    <div ref={containerRef} className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-surface-50/70 dark:bg-surface-900 surface-grain">
      <div className="shrink-0 border-b border-surface-200/80 px-3 py-3 dark:border-surface-800">
        <div className="rounded-[26px] border border-translucent bg-white/90 p-3 shadow-sm dark:bg-surface-900/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-surface-200/80 bg-surface-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-500 dark:border-surface-700 dark:bg-surface-800/80 dark:text-surface-400">
                <FolderOpen className="h-3.5 w-3.5 text-primary-500 dark:text-primary-400" />
                Evidence lane
              </div>
              {!ultraCompact && (
                <p className="mt-3 text-sm font-semibold text-surface-900 dark:text-surface-100">
                  Source records and AI indexing
                </p>
              )}
              {!compact && (
                <p className="mt-1 text-[11px] leading-5 text-surface-500 dark:text-surface-400">
                  Review the incoming record, queue files for search, and keep the evidence set tight.
                </p>
              )}
            </div>
            {!isMobile && (
              <button
                onClick={toggleLeft}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                  'text-surface-400 transition-all',
                  'hover:bg-surface-100 hover:text-surface-600',
                  'dark:hover:bg-surface-800 dark:hover:text-surface-300'
                )}
                title="Collapse panel"
                aria-label="Collapse file browser"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {!compact && (
            <div className="mt-4 flex flex-wrap gap-2">
              <RailChip label={`${files.length} ${files.length === 1 ? 'record' : 'records'}`} />
              <RailChip label={`${processedCount} AI-ready`} tone="primary" />
              {processingCount > 0 && <RailChip label={`${processingCount} indexing`} tone="accent" />}
            </div>
          )}

          <div className="mt-4">
            <div
              className={cn(
                'flex h-10 items-center gap-2 rounded-2xl border px-3',
                'border-surface-200 bg-surface-50/80 shadow-sm transition-all',
                'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15',
                'dark:border-surface-700 dark:bg-surface-950/40',
                'dark:focus-within:border-primary-400 dark:focus-within:ring-primary-400/20'
              )}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by file name or type"
                className="h-full w-full bg-transparent text-xs text-surface-700 placeholder:text-surface-400 focus:outline-none dark:text-surface-200 dark:placeholder:text-surface-500"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.1 }}
                    type="button"
                    onClick={clearSearch}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-200 text-surface-500 transition-colors hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600"
                    title="Clear search"
                  >
                    <X className="h-2.5 w-2.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {selectedProjectId && (
            <div className="mt-4">
              <FileUploadZone projectId={selectedProjectId} />
            </div>
          )}

          {selectedProjectId && processableFiles.length > 1 && (
            <div className="mt-4 rounded-[22px] border border-surface-200/80 bg-surface-50/75 p-3 dark:border-surface-800 dark:bg-surface-950/35">
              {!batchSelectionMode ? (
                <button
                  onClick={() => setBatchSelectionMode(true)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-white/70 dark:hover:bg-surface-900/70"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-surface-700 dark:text-surface-200">
                      {compact ? 'Batch index' : 'Batch index records'}
                    </p>
                    {!compact && (
                      <p className="mt-1 text-[11px] leading-5 text-surface-500 dark:text-surface-400">
                        Queue multiple files for AI search in one pass.
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-500 shadow-sm dark:bg-surface-900 dark:text-surface-400">
                    {processableFiles.length} ready
                  </span>
                </button>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-surface-700 dark:text-surface-200">
                        {selectedBatchFiles.length} selected
                      </p>
                      {!compact && (
                        <p className="mt-1 text-[11px] leading-5 text-surface-500 dark:text-surface-400">
                          ~{batchEstimate.totalTokens.toLocaleString()} tokens across ~{batchEstimate.totalChunks} chunks ({formatFileSize(batchEstimate.totalBytes)}).
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBatchIds(processableFiles.map((f) => f.id))}
                        className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-surface-500 transition-colors hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-400 dark:hover:bg-surface-800"
                      >
                        All
                      </button>
                      <button
                        onClick={() => setSelectedBatchIds([])}
                        className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-surface-500 transition-colors hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-400 dark:hover:bg-surface-800"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setBatchSelectionMode(false);
                        setSelectedBatchIds([]);
                      }}
                      className="rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-surface-500 transition-colors hover:bg-white dark:text-surface-400 dark:hover:bg-surface-900"
                      title="Cancel selection"
                    >
                      {compact ? <X className="h-3.5 w-3.5" /> : 'Cancel'}
                    </button>
                    <button
                      onClick={handleOpenBatchConfirm}
                      disabled={selectedBatchFiles.length === 0}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors',
                        selectedBatchFiles.length === 0
                          ? 'cursor-not-allowed bg-surface-200 text-surface-400 dark:bg-surface-800 dark:text-surface-500'
                          : 'bg-surface-950 text-white hover:bg-surface-800 dark:bg-white dark:text-surface-950 dark:hover:bg-surface-100'
                      )}
                      title="Process selected files"
                    >
                      {processingCount > 0 && <Loader2 className="h-3 w-3 animate-spin" />}
                      {compact ? (
                        <>
                          <Zap className="h-3 w-3" />
                          {selectedBatchFiles.length}
                        </>
                      ) : (
                        'Process selected'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── File list ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          // Skeleton loading
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-[22px] border border-surface-200/80 bg-white/80 p-3 dark:border-surface-800 dark:bg-surface-900/70">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                    <div className="h-2.5 w-full animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                    <div className="h-2.5 w-2/3 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-red-200/80 bg-red-50/70 px-4 py-12 dark:border-red-900/40 dark:bg-red-950/20">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="mt-2 text-center text-xs font-medium text-red-700 dark:text-red-300">
              Failed to load files
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-red-600 transition-colors hover:bg-white/80 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        ) : filteredFiles.length === 0 ? (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-dashed border-surface-300 bg-white/80 px-4 py-12 text-center dark:border-surface-700 dark:bg-surface-900/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
              <FileText className="h-5 w-5 text-surface-400 dark:text-surface-500" />
            </div>
            <p className="mt-3 text-center text-xs font-semibold text-surface-700 dark:text-surface-200">
              {searchQuery
                ? 'No files match your search'
                : 'Upload files to get started'}
            </p>
            {!searchQuery && (
              <p className="mt-1 text-center text-[11px] leading-snug text-surface-500 dark:text-surface-400">
                PDFs, images, documents, audio, and video files are supported
              </p>
            )}
          </div>
        ) : (
          // File list
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filteredFiles.map((file) => {
                const estimate = perFileEstimates.get(file.id);
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <FileListItem
                      file={file}
                      onProcess={handleProcess}
                      processingState={getProcessState(file.id)}
                      showBatchSelector={batchSelectionMode && isProcessable(file)}
                      isBatchSelected={selectedBatchIdSet.has(file.id)}
                      onToggleBatchSelection={handleToggleBatchSelection}
                      estimatedTokenLabel={estimate ? formatTokenEstimate(estimate.totalTokens) : undefined}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Footer file count ─────────────────────────────── */}
      {files.length > 0 && (
        <div className="flex shrink-0 items-center justify-between border-t border-surface-200/80 px-3 py-2 text-[11px] dark:border-surface-800">
          <span className="text-[11px] text-surface-400 dark:text-surface-500">
            {searchQuery
              ? `${filteredFiles.length} of ${files.length} files`
              : `${files.length} file${files.length !== 1 ? 's' : ''}`}
          </span>
          {batchSelectionMode && (
            <span className="text-[11px] text-surface-400 dark:text-surface-500">
              {selectedBatchFiles.length} selected
            </span>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!fileToProcess}
        title="Process File for AI Search?"
        message={
          fileToProcess && singleEstimate
            ? `This will analyze "${fileToProcess.name}" and generate embeddings. Estimated usage: ~${singleEstimate.totalTokens.toLocaleString()} tokens across ~${singleEstimate.embeddingChunks} chunks (${formatFileSize(singleEstimate.bytes)} input size estimate). Safety limits: ${PROCESSING_DAILY_FILE_LIMIT} files/day and ${Math.round(PROCESSING_DAILY_MB_LIMIT_BYTES / (1024 * 1024))}MB/day (tracked locally).`
            : ''
        }
        confirmLabel="Process"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleProcessConfirm}
        onCancel={() => setProcessConfirmFileId(null)}
      />

      <ConfirmDialog
        open={batchConfirmOpen}
        title={`Process ${selectedBatchFiles.length} Selected File${selectedBatchFiles.length === 1 ? '' : 's'}?`}
        message={`This will analyze ${selectedBatchFiles.length} files and generate embeddings. Estimated usage: ~${batchEstimate.totalTokens.toLocaleString()} tokens across ~${batchEstimate.totalChunks} chunks (${formatFileSize(batchEstimate.totalBytes)} input size estimate). Safety limits: ${PROCESSING_DAILY_FILE_LIMIT} files/day and ${Math.round(PROCESSING_DAILY_MB_LIMIT_BYTES / (1024 * 1024))}MB/day (tracked locally).`}
        confirmLabel={`Process ${selectedBatchFiles.length}`}
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleBatchProcessConfirm}
        onCancel={() => setBatchConfirmOpen(false)}
      />
    </div>
  );
}

function RailChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'primary' | 'accent';
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900/40 dark:bg-primary-900/20 dark:text-primary-300'
      : tone === 'accent'
        ? 'border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-900/40 dark:bg-accent-900/20 dark:text-accent-300'
        : 'border-surface-200 bg-white text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300';

  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', toneClass)}>
      {label}
    </span>
  );
}

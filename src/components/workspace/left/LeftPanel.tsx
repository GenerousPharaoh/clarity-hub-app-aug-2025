import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search, X, FileText, AlertCircle, AlertTriangle, RefreshCw, Loader2, Zap, Pin } from 'lucide-react';
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

export function LeftPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleLeft = useAppStore((s) => s.toggleLeftPanel);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const isMobile = useIsMobile();
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const pinnedFileIds = useAppStore((s) => s.pinnedFileIds);

  const { data: files = [], isLoading, isError, refetch } = useFiles(selectedProjectId);
  const { processFile, getState: getProcessState } = useProcessFile();
  const [processConfirmFileId, setProcessConfirmFileId] = useState<string | null>(null);
  const [batchSelectionMode, setBatchSelectionMode] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const fileTypeFilterMap = useAppStore((s) => s.fileTypeFilter);
  const setFileTypeFilterStore = useAppStore((s) => s.setFileTypeFilter);
  const typeFilter = selectedProjectId ? (fileTypeFilterMap[selectedProjectId] ?? null) : null;
  const setTypeFilter = useCallback(
    (filter: string | null) => {
      if (selectedProjectId) setFileTypeFilterStore(selectedProjectId, filter);
    },
    [selectedProjectId, setFileTypeFilterStore]
  );
  const [panelWidth, setPanelWidth] = useState(0);

  const processableFiles = useMemo(() => files.filter(isProcessable), [files]);
  const failedFiles = useMemo(
    () => files.filter((file) => file.processing_status === 'failed'),
    [files]
  );
  const failedCount = failedFiles.length;
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
    const el = panelRef.current;
    if (!el) return;

    const update = () => setPanelWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const handleRetryFailedFiles = useCallback(() => {
    if (!selectedProjectId || failedFiles.length === 0) return;

    if (failedFiles.length === 1) {
      handleProcess(failedFiles[0].id);
      return;
    }

    const totalBytes = failedFiles.reduce((sum, file) => {
      return sum + (perFileEstimates.get(file.id)?.bytes ?? estimateFileBytesByType(file.file_type));
    }, 0);

    const budget = checkProcessingBudgetBatch(failedFiles.length, totalBytes);
    if (!budget.allowed) {
      toast.error('Processing budget reached', {
        description: budget.reason,
      });
      return;
    }

    setSelectedBatchIds(failedFiles.map((file) => file.id));
    setBatchConfirmOpen(true);
  }, [selectedProjectId, failedFiles, handleProcess, perFileEstimates]);

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

  // Clear search when the selected project changes
  useEffect(() => {
    setSearchQuery('');
  }, [selectedProjectId, setSearchQuery]);

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

  // Client-side filtering uses debounced query + document type filter
  const filteredFiles = useMemo(() => {
    let result = files;

    // Apply document type filter
    if (typeFilter) {
      result = result.filter((f) => {
        const docType = f.document_type;
        if (typeFilter === 'other') {
          return !docType || docType === 'other';
        }
        return docType === typeFilter;
      });
    }

    // Apply search query filter
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.file_type && f.file_type.toLowerCase().includes(q))
      );
    }

    return result;
  }, [files, debouncedQuery, typeFilter]);

  const pinnedSet = useMemo(() => {
    if (!selectedProjectId) return new Set<string>();
    return new Set(pinnedFileIds[selectedProjectId] ?? []);
  }, [selectedProjectId, pinnedFileIds]);

  const pinnedFiles = useMemo(
    () => filteredFiles.filter((f) => pinnedSet.has(f.id)),
    [filteredFiles, pinnedSet]
  );
  const unpinnedFiles = useMemo(
    () => filteredFiles.filter((f) => !pinnedSet.has(f.id)),
    [filteredFiles, pinnedSet]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, [setSearchQuery]);

  const compactPanel = panelWidth > 0 && panelWidth < 320;

  return (
    <div ref={panelRef} className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-white dark:bg-surface-900">
      <div
        className={cn(
          'shrink-0 border-b border-surface-200/80 dark:border-surface-800',
          compactPanel ? 'px-3 py-2.5' : 'px-3 py-3'
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-surface-900 dark:text-surface-100">Files</p>
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
        {files.length > 0 && (
          <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500">
            {files.length} file{files.length !== 1 ? 's' : ''} · {processedCount} indexed
          </p>
        )}
        {processingCount > 0 && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-primary-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing {processingCount} file{processingCount !== 1 ? 's' : ''}...
          </p>
        )}
        {failedCount > 0 && (
          <button
            onClick={handleRetryFailedFiles}
            className="mt-2 flex w-full items-center gap-2 rounded-lg bg-red-50/75 px-2.5 py-1.5 text-left transition-colors hover:bg-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-950/35"
          >
            <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
            <span className="flex-1 text-[11px] font-medium text-red-700 dark:text-red-300">
              {failedCount} failed — retry
            </span>
            <Zap className="h-3 w-3 shrink-0 text-red-500" />
          </button>
        )}

        <div className="mt-2.5">
          <div
            className={cn(
              'flex h-8 items-center gap-2 rounded-lg border px-2.5',
              'border-surface-200 bg-surface-50/80 transition-all',
              'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15',
              'dark:border-surface-700 dark:bg-surface-950/40',
              'dark:focus-within:border-primary-400 dark:focus-within:ring-primary-400/20'
            )}
          >
            <Search className="h-3 w-3 shrink-0 text-surface-400 dark:text-surface-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
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
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface-200 text-surface-500 transition-colors hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600"
                  title="Clear search"
                >
                  <X className="h-2.5 w-2.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Document type filter chips */}
        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {([
              { key: null, label: 'All' },
              { key: 'court', label: 'Court' },
              { key: 'employment', label: 'Employment' },
              { key: 'financial', label: 'Financial' },
              { key: 'correspondence', label: 'Correspondence' },
              { key: 'other', label: 'Other' },
            ] as const).map(({ key, label }) => (
              <button
                key={label}
                onClick={() => setTypeFilter(key)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                  typeFilter === key
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                    : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {selectedProjectId && (
          <div className="mt-2">
            <FileUploadZone projectId={selectedProjectId} />
          </div>
        )}

        {selectedProjectId && processableFiles.length > 0 && (
          <div className="mt-2">
            {!batchSelectionMode ? (
              <button
                onClick={() => setBatchSelectionMode(true)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-[11px] transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <span className="font-medium text-surface-500 dark:text-surface-400">
                  Batch index
                </span>
                <span className="text-surface-400 dark:text-surface-500">
                  {processableFiles.length} ready
                </span>
              </button>
            ) : (
              <div className="rounded-lg border border-surface-200 bg-surface-50/60 p-2 dark:border-surface-700 dark:bg-surface-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-surface-700 dark:text-surface-200">
                    {selectedBatchFiles.length} selected
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      onClick={() => setSelectedBatchIds(processableFiles.map((f) => f.id))}
                      className="font-medium text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedBatchIds([])}
                      className="font-medium text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setBatchSelectionMode(false);
                      setSelectedBatchIds([]);
                    }}
                    className="rounded-md px-2 py-1 text-[11px] font-medium text-surface-500 transition-colors hover:bg-surface-200 dark:text-surface-400 dark:hover:bg-surface-700"
                    title="Cancel selection"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOpenBatchConfirm}
                    disabled={selectedBatchFiles.length === 0}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                      selectedBatchFiles.length === 0
                        ? 'bg-surface-200 text-surface-400 dark:bg-surface-700 dark:text-surface-500'
                        : 'bg-surface-900 text-white hover:bg-surface-700 dark:bg-white dark:text-surface-900 dark:hover:bg-surface-200'
                    )}
                    title="Process selected files"
                  >
                    {processingCount > 0 && <Loader2 className="h-3 w-3 animate-spin" />}
                    Process
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── File list ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Skeleton loading — compact rows
          <div>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{ padding: 'var(--density-py) var(--density-px)', gap: 'var(--density-gap)' }}
                className="flex items-center border-b border-surface-100 dark:border-surface-800/50"
              >
                <div className="h-6 w-8 shrink-0 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                  <div className="h-2.5 w-2/5 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-red-200/80 bg-red-50/70 px-4 py-12 dark:border-red-900/40 dark:bg-red-950/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="mt-3 text-center text-xs font-semibold text-red-700 dark:text-red-300">
              Failed to load files
            </h3>
            <p className="mt-1 text-center text-xs text-red-600/80 dark:text-red-400/70">
              Check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        ) : filteredFiles.length === 0 ? (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 px-4 py-12 text-center dark:border-surface-700 dark:bg-surface-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
              <FileText className="h-5 w-5 text-surface-400 dark:text-surface-500" />
            </div>
            <h3 className="mt-3 text-center text-xs font-semibold text-surface-700 dark:text-surface-200">
              {searchQuery
                ? 'No files match your search'
                : 'No files yet'}
            </h3>
            <p className="mt-1 text-center text-xs text-surface-400 dark:text-surface-500">
              {searchQuery
                ? 'Try a different search term.'
                : 'Upload files to get started.'}
            </p>
          </div>
        ) : (
          // File list — tight rows, no gaps
          <div>
            {/* Pinned files section */}
            {pinnedFiles.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 px-3 pb-1 pt-2">
                  <Pin className="h-3 w-3 text-surface-400 dark:text-surface-500" />
                  <span className="text-[11px] font-semibold text-surface-400 dark:text-surface-500">
                    Pinned
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  {pinnedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <FileListItem
                        file={file}
                        compact={compactPanel}
                        onProcess={handleProcess}
                        processingState={getProcessState(file.id)}
                        showBatchSelector={batchSelectionMode && isProcessable(file)}
                        isBatchSelected={selectedBatchIdSet.has(file.id)}
                        onToggleBatchSelection={handleToggleBatchSelection}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {unpinnedFiles.length > 0 && (
                  <div className="mx-3 border-t border-surface-200/60 dark:border-surface-700/50" />
                )}
              </>
            )}

            {/* Unpinned files */}
            <AnimatePresence initial={false}>
              {unpinnedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                >
                  <FileListItem
                    file={file}
                    compact={compactPanel}
                    onProcess={handleProcess}
                    processingState={getProcessState(file.id)}
                    showBatchSelector={batchSelectionMode && isProcessable(file)}
                    isBatchSelected={selectedBatchIdSet.has(file.id)}
                    onToggleBatchSelection={handleToggleBatchSelection}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Footer file count ─────────────────────────────── */}
      {files.length > 0 && (
        <div className="flex shrink-0 items-center justify-between border-t border-surface-200/80 px-3 py-1.5 dark:border-surface-800">
          <span className="text-[11px] text-surface-400 dark:text-surface-500">
            {searchQuery
              ? `${filteredFiles.length} of ${files.length} files`
              : `${files.length} file${files.length !== 1 ? 's' : ''}`}
          </span>
          {batchSelectionMode && (
            <span className="text-xs text-surface-400 dark:text-surface-500">
              {selectedBatchFiles.length} selected
            </span>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!fileToProcess}
        title="Index this file?"
        message={
          fileToProcess && singleEstimate
            ? `Index "${fileToProcess.name}"? Estimated: ~${singleEstimate.totalTokens.toLocaleString()} tokens.`
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

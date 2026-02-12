import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { ChevronLeft, FolderOpen, Search, X, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import useAppStore from '@/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useFiles } from '@/hooks/useFiles';
import { FileListItem } from './FileListItem';
import { FileUploadZone } from './FileUploadZone';

export function LeftPanel() {
  const toggleLeft = useAppStore((s) => s.toggleLeftPanel);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const isMobile = useIsMobile();
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  const { data: files = [], isLoading, isError, refetch } = useFiles(selectedProjectId);

  // Debounced search: input updates immediately, filtering deferred by 150ms
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
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
    <div className="flex h-full w-full flex-col bg-surface-50 dark:bg-surface-900">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-surface-200 bg-surface-50/80 px-3 dark:border-surface-800 dark:bg-surface-850/50">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-surface-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
            Files
          </span>
        </div>
        {!isMobile && (
          <button
            onClick={toggleLeft}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md',
              'text-surface-400 transition-all',
              'hover:bg-surface-100 hover:text-surface-600',
              'dark:hover:bg-surface-800 dark:hover:text-surface-300'
            )}
            title="Collapse panel"
            aria-label="Collapse file browser"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Search bar ────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-2">
        <div
          className={cn(
            'flex h-8 items-center gap-2 rounded-lg border px-2.5',
            'border-surface-200 bg-surface-50',
            'transition-all',
            'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
            'dark:border-surface-700 dark:bg-surface-800/50',
            'dark:focus-within:border-primary-400 dark:focus-within:ring-primary-400/20'
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-surface-400" />
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

      {/* ── Upload zone ───────────────────────────────────── */}
      {selectedProjectId && (
        <FileUploadZone projectId={selectedProjectId} />
      )}

      {/* ── File list ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Skeleton loading
          <div className="space-y-1 px-3 py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-surface-100 dark:bg-surface-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="mt-2 text-center text-xs font-medium text-surface-500 dark:text-surface-400">
              Failed to load files
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        ) : filteredFiles.length === 0 ? (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
              <FileText className="h-5 w-5 text-surface-400 dark:text-surface-500" />
            </div>
            <p className="mt-3 text-center text-xs font-medium text-surface-500 dark:text-surface-400">
              {searchQuery
                ? 'No files match your search'
                : 'Upload files to get started'}
            </p>
            {!searchQuery && (
              <p className="mt-1 text-center text-[11px] leading-snug text-surface-400 dark:text-surface-500">
                PDFs, images, documents, audio, and video files are supported
              </p>
            )}
          </div>
        ) : (
          // File list
          <div className="py-1">
            <AnimatePresence initial={false}>
              {filteredFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  <FileListItem file={file} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Footer file count ─────────────────────────────── */}
      {files.length > 0 && (
        <div className="flex shrink-0 items-center justify-between border-t border-surface-200 px-3 py-1.5 dark:border-surface-800">
          <span className="text-[11px] text-surface-400 dark:text-surface-500">
            {searchQuery
              ? `${filteredFiles.length} of ${files.length} files`
              : `${files.length} file${files.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}
    </div>
  );
}

import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  Plus,
  Sparkles,
  Trash2,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar,
  X,
  Table2,
  Download,
  Import,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildTextTable } from '@/lib/export-utils';
import { estimateFileBytesByType } from '@/lib/processingBudget';
import useAppStore from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ProcessingRecoveryBanner } from '@/components/workspace/ProcessingRecoveryBanner';
import { toast } from 'sonner';
import {
  useTimelineEvents,
  useCreateTimelineEvent,
  useUpdateTimelineEvent,
  useDeleteTimelineEvent,
  useExtractTimeline,
  useDeleteAllTimelineEvents,
} from '@/hooks/useTimeline';
import type { TimelineEvent } from '@/hooks/useTimeline';
import { useChronologyEntries, useImportFromTimeline, useDeleteChronologyEntry, useCreateChronologyEntry, useUpdateChronologyEntry } from '@/hooks/useChronology';
import { useProcessFile } from '@/hooks/useProcessFile';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { FileRecord } from '@/types';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  employment: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900/40',
  },
  court: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-900/40',
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
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  },
  medical: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-900/40',
  },
};

function getCategoryStyle(category: string | null) {
  if (!category) return CATEGORY_COLORS.correspondence;
  const key = category.toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.correspondence;
}

function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getConfidenceLabel(confidence: number | string | null): string {
  if (typeof confidence === 'number') {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.4) return 'Medium';
    return 'Low';
  }
  // Legacy string values
  if (confidence === 'high') return 'High';
  if (confidence === 'low') return 'Low';
  return 'Medium';
}

export function TimelineTab() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const files = useAppStore((s) => s.files);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const setLeftPanel = useAppStore((s) => s.setLeftPanel);
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const setMobileTab = useAppStore((s) => s.setMobileTab);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const {
    data: events,
    isLoading,
    isError,
    refetch,
  } = useTimelineEvents(selectedProjectId);
  const createEvent = useCreateTimelineEvent();
  const updateEvent = useUpdateTimelineEvent();
  const deleteEvent = useDeleteTimelineEvent();
  const deleteAllEvents = useDeleteAllTimelineEvents();
  const extractTimeline = useExtractTimeline();
  const { processFile, getState: getProcessState } = useProcessFile();

  const [viewMode, setViewMode] = useState<'events' | 'chronology'>('events');
  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const projectFiles = useMemo(
    () => files.filter((file) => file.project_id === selectedProjectId && !file.is_deleted),
    [files, selectedProjectId]
  );
  const aiReadyFiles = useMemo(
    () => projectFiles.filter((file) => file.processing_status === 'completed'),
    [projectFiles]
  );
  const failedFiles = useMemo(
    () => projectFiles.filter((file) => file.processing_status === 'failed'),
    [projectFiles]
  );

  const handleExtract = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const result = await extractTimeline.mutateAsync({ projectId: selectedProjectId });
      const count = result?.totalEventsExtracted ?? result?.total ?? 0;
      const dupes = result?.duplicatesRemoved ?? 0;
      if (count > 0) {
        const dupeNote = dupes > 0 ? ` (${dupes} duplicate${dupes !== 1 ? 's' : ''} removed)` : '';
        toast.success(`Extracted ${count} timeline event${count !== 1 ? 's' : ''}${dupeNote}`);
      } else {
        toast.success('Timeline extraction complete — no new events found');
      }
    } catch (err) {
      toast.error('Failed to extract timeline', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [selectedProjectId, extractTimeline]);

  const handleCreate = useCallback(async () => {
    if (!selectedProjectId || !user || !newDate.trim() || !newTitle.trim()) {
      toast.error('Date and title are required to create an event.');
      return;
    }

    try {
      await createEvent.mutateAsync({
        projectId: selectedProjectId,
        date: newDate,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        category: newCategory || undefined,
      });
      toast.success('Event added');
      setNewDate('');
      setNewTitle('');
      setNewDescription('');
      setNewCategory('');
      setShowAddForm(false);
    } catch (err) {
      toast.error('Failed to create event', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [selectedProjectId, user, newDate, newTitle, newDescription, newCategory, createEvent]);

  const handleToggleVerified = useCallback(
    (event: TimelineEvent) => {
      if (!selectedProjectId) return;
      updateEvent.mutate({
        id: event.id,
        projectId: selectedProjectId,
        is_verified: !event.is_verified,
      });
    },
    [selectedProjectId, updateEvent]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!eventToDelete || !selectedProjectId) return;
    deleteEvent.mutate(
      { id: eventToDelete.id, projectId: selectedProjectId },
      {
        onSuccess: () => toast.success('Event deleted'),
        onError: (err) =>
          toast.error('Failed to delete event', {
            description: err instanceof Error ? err.message : 'Unknown error',
          }),
      }
    );
    setEventToDelete(null);
  }, [eventToDelete, selectedProjectId, deleteEvent]);

  const handleSourceClick = useCallback(
    (fileId: string) => {
      setSelectedFile(fileId);
      setRightPanel(true);
      setRightTab('viewer');
      setMobileTab('viewer');
    },
    [setSelectedFile, setRightPanel, setRightTab, setMobileTab]
  );

  const handleOpenFiles = useCallback(() => {
    if (isMobile) {
      setMobileTab('files');
      return;
    }

    setLeftPanel(true);
  }, [isMobile, setLeftPanel, setMobileTab]);

  const handleRetryFile = useCallback(
    async (file: FileRecord) => {
      if (!selectedProjectId) return;

      try {
        await processFile(file.id, selectedProjectId, {
          fileSizeBytes: estimateFileBytesByType(file.file_type),
          source: 'manual',
        });
        toast.success('File indexed for timeline extraction');
      } catch (err) {
        toast.error('Retry failed', {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    [processFile, selectedProjectId]
  );

  // --- No project selected ---
  if (!selectedProjectId) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
          <Clock className="h-5 w-5 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          No Project Selected
        </h3>
        <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          Select a project to view its timeline.
        </p>
      </div>
    );
  }

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-3 border-b border-translucent px-3 py-3 sm:px-4">
          <div className="h-4 w-20 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="ml-auto flex gap-1.5">
            <div className="h-8 w-28 animate-pulse rounded-xl bg-surface-100 dark:bg-surface-800" />
            <div className="h-8 w-24 animate-pulse rounded-xl bg-surface-100 dark:bg-surface-800" />
          </div>
        </div>
        <div className="flex-1 space-y-4 px-4 py-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-translucent bg-white p-4 dark:bg-surface-900"
            >
              <div className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                <div className="h-3 w-full animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Error ---
  if (isError) {
    return (
      <div className="flex h-full w-full min-w-0 flex-1 flex-col items-center justify-center px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 shadow-sm dark:bg-red-950/60">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="mt-3 font-heading text-sm font-bold text-red-700 dark:text-red-300">
          Failed to load timeline
        </h3>
        <p className="mt-1 max-w-xs text-center text-xs leading-relaxed text-red-600/80 dark:text-red-400/80">
          Check your connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 active:scale-[0.98] dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const eventCount = events?.length ?? 0;
  const verifiedCount = events?.filter((e) => e.is_verified).length ?? 0;
  const firstFailedFile = failedFiles[0] ?? null;
  const isRetryingFailedFile = firstFailedFile
    ? getProcessState(firstFailedFile.id).isProcessing
    : false;

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-translucent bg-surface-50 px-3 py-2 dark:bg-surface-900 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 p-0.5 dark:border-surface-700 dark:bg-surface-800">
              <button
                onClick={() => setViewMode('events')}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                  viewMode === 'events'
                    ? 'bg-white text-surface-700 shadow-sm dark:bg-surface-700 dark:text-surface-200'
                    : 'text-surface-400 hover:text-surface-600 dark:text-surface-500'
                )}
              >
                <Clock className="h-3 w-3" />
                Events
              </button>
              <button
                onClick={() => setViewMode('chronology')}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                  viewMode === 'chronology'
                    ? 'bg-white text-surface-700 shadow-sm dark:bg-surface-700 dark:text-surface-200'
                    : 'text-surface-400 hover:text-surface-600 dark:text-surface-500'
                )}
              >
                <Table2 className="h-3 w-3" />
                Chronology
              </button>
            </div>
            <div className="flex flex-nowrap gap-2 overflow-hidden">
              <span className="shrink-0 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                {eventCount} event{eventCount !== 1 ? 's' : ''}
              </span>
              {verifiedCount > 0 && (
                <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-400">
                  {verifiedCount} verified
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={handleExtract}
              disabled={extractTimeline.isPending}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium',
                'border-surface-200 bg-white text-surface-600 transition-colors hover:bg-surface-50',
                'dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              title="Extract timeline events from project files using AI"
            >
              {extractTimeline.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Extract Timeline
            </button>

            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium',
                showAddForm
                  ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'border-surface-200 bg-white text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
              )}
              title="Add event manually"
            >
              {showAddForm ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {showAddForm ? 'Cancel' : 'Add Event'}
            </button>

            {eventCount > 0 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:border-red-200 dark:border-surface-700 dark:bg-surface-800 dark:hover:bg-red-950/20 dark:hover:border-red-800"
                title="Delete all timeline events"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {firstFailedFile && (
        <div className="shrink-0 border-b border-translucent px-3 py-3 sm:px-4">
          <ProcessingRecoveryBanner
            title={`${failedFiles.length} file${failedFiles.length === 1 ? '' : 's'} still need AI indexing`}
            description="Retry indexing to extract timeline events from these files."
            failedCount={failedFiles.length}
            fileName={firstFailedFile.name}
            isRetrying={isRetryingFailedFile}
            onOpenFile={() => handleSourceClick(firstFailedFile.id)}
            onRetry={() => void handleRetryFile(firstFailedFile)}
          />
        </div>
      )}

      {/* Add event form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 overflow-hidden border-b border-translucent"
          >
            <div className="space-y-3 px-3 py-4 sm:px-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-surface-500 dark:text-surface-400">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className={cn(
                      'h-10 w-full rounded-xl border px-3 text-xs',
                      'border-surface-200 bg-surface-50/80 text-surface-700',
                      'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15',
                      'dark:border-surface-700 dark:bg-surface-800/70 dark:text-surface-200'
                    )}
                  />
                </div>
                <div className="flex-[2]">
                  <label className="mb-1 block text-sm font-medium text-surface-500 dark:text-surface-400">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Event title..."
                    className={cn(
                      'h-10 w-full rounded-xl border px-3 text-xs',
                      'border-surface-200 bg-surface-50/80 text-surface-700 placeholder:text-surface-400',
                      'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15',
                      'dark:border-surface-700 dark:bg-surface-800/70 dark:text-surface-200 dark:placeholder:text-surface-500'
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-[2]">
                  <label className="mb-1 block text-sm font-medium text-surface-500 dark:text-surface-400">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional description..."
                    className={cn(
                      'h-10 w-full rounded-xl border px-3 text-xs',
                      'border-surface-200 bg-surface-50/80 text-surface-700 placeholder:text-surface-400',
                      'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15',
                      'dark:border-surface-700 dark:bg-surface-800/70 dark:text-surface-200 dark:placeholder:text-surface-500'
                    )}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-surface-500 dark:text-surface-400">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={cn(
                      'h-10 w-full rounded-xl border px-3 text-xs',
                      'border-surface-200 bg-surface-50/80 text-surface-700',
                      'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15',
                      'dark:border-surface-700 dark:bg-surface-800/70 dark:text-surface-200'
                    )}
                  >
                    <option value="">Select...</option>
                    <option value="employment">Employment</option>
                    <option value="court">Court Filing</option>
                    <option value="financial">Financial</option>
                    <option value="regulatory">Regulatory</option>
                    <option value="correspondence">Correspondence</option>
                    <option value="medical">Medical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCreate}
                  disabled={createEvent.isPending || !newDate.trim() || !newTitle.trim()}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-700',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {createEvent.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Add Event
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chronology view */}
      {viewMode === 'chronology' && (
        <ChronologyView projectId={selectedProjectId} eventCount={eventCount} />
      )}

      {/* Timeline events list */}
      {viewMode === 'events' && <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {eventCount === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full rounded-2xl border border-dashed border-surface-300 bg-white px-5 py-12 text-center shadow-sm dark:border-surface-700 dark:bg-surface-900/70">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
                <Calendar className="h-5 w-5 text-surface-400 dark:text-surface-500" />
              </div>
              <h3 className="mt-4 text-center font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
                No timeline events yet
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-surface-500 dark:text-surface-400">
                {projectFiles.length === 0
                  ? 'Upload case materials from the files rail, or start your chronology manually while the record is still thin.'
                  : aiReadyFiles.length > 0
                    ? `You already have ${aiReadyFiles.length} AI-ready file${aiReadyFiles.length === 1 ? '' : 's'}. Extract a first pass, then refine the sequence manually.`
                    : 'Your files are uploaded, but none are AI-ready yet. Retry indexing or add key events manually so the timeline can start taking shape.'}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                  {projectFiles.length} file{projectFiles.length === 1 ? '' : 's'} uploaded
                </span>
                {aiReadyFiles.length > 0 && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-400">
                    {aiReadyFiles.length} AI-ready
                  </span>
                )}
                {failedFiles.length > 0 && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                    {failedFiles.length} need retry
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={handleExtract}
                  disabled={extractTimeline.isPending || aiReadyFiles.length === 0}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-700',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {extractTimeline.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Extract Timeline
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Event Manually
                </button>
                {(projectFiles.length === 0 || aiReadyFiles.length === 0) && (
                  <button
                    onClick={handleOpenFiles}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Open Files
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-surface-200 dark:bg-surface-700" />

            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {events!.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, delay: index * 0.02 }}
                  >
                    <TimelineEventCard
                      event={event}
                      onToggleVerified={handleToggleVerified}
                      onDelete={setEventToDelete}
                      onSourceClick={handleSourceClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>}

      <ConfirmDialog
        open={eventToDelete !== null}
        title="Delete timeline event"
        message={`Are you sure you want to delete "${eventToDelete?.title || 'this event'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setEventToDelete(null)}
      />
      <ConfirmDialog
        open={showDeleteAllConfirm}
        title="Delete all timeline events"
        message={`This will permanently delete all ${eventCount} timeline event${eventCount !== 1 ? 's' : ''} for this project, including both AI-extracted and manually created events. This cannot be undone.`}
        confirmLabel="Delete All"
        variant="danger"
        onConfirm={async () => {
          if (!selectedProjectId) return;
          try {
            await deleteAllEvents.mutateAsync({ projectId: selectedProjectId });
            toast.success('All timeline events deleted');
          } catch {
            toast.error('Failed to delete events');
          }
          setShowDeleteAllConfirm(false);
        }}
        onCancel={() => setShowDeleteAllConfirm(false)}
      />
    </div>
  );
}

/* ── Single event card ─────────────────────────────────── */

function TimelineEventCard({
  event,
  onToggleVerified,
  onDelete,
  onSourceClick,
}: {
  event: TimelineEvent;
  onToggleVerified: (event: TimelineEvent) => void;
  onDelete: (event: TimelineEvent) => void;
  onSourceClick: (fileId: string) => void;
}) {
  const categoryStyle = getCategoryStyle(event.category);
  const files = useAppStore((s) => s.files);
  const sourceFileName = event.source_file_id
    ? files.find((f) => f.id === event.source_file_id)?.name ?? null
    : null;

  return (
    <div className="group relative flex gap-3 pl-1">
      {/* Timeline dot */}
      <div className="relative z-10 mt-4 flex h-[10px] w-[10px] shrink-0 items-center justify-center">
        <div
          className={cn(
            'h-2.5 w-2.5 rounded-full border-2 transition-colors',
            event.is_verified
              ? 'border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400'
              : 'border-surface-300 bg-white dark:border-surface-600 dark:bg-surface-900'
          )}
        />
      </div>

      {/* Card */}
      <div
        className={cn(
          'mb-2 min-w-0 flex-1 rounded-xl border px-4 py-3 transition-all',
          'border-translucent bg-white shadow-sm',
          'hover:shadow-md',
          'dark:bg-surface-900'
        )}
      >
        {/* Date + title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-surface-400 dark:text-surface-500">
              {formatEventDate(event.date)}
            </p>
            <h4 className="mt-0.5 font-heading text-sm font-semibold text-surface-800 dark:text-surface-100">
              {event.title}
            </h4>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={() => onToggleVerified(event)}
              className={cn(
                'flex h-7 items-center gap-1 rounded-lg px-2 text-sm font-medium transition-colors',
                event.is_verified
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
                  : 'bg-surface-50 text-surface-500 hover:bg-surface-100 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'
              )}
              title={event.is_verified ? 'Mark as unverified' : 'Mark as verified'}
            >
              {event.is_verified ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {event.is_verified ? 'Verified' : 'Verify'}
            </button>

            <button
              onClick={() => onDelete(event)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Delete event"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Metadata badges */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {event.category && (
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-1 text-sm font-medium capitalize',
                categoryStyle.bg,
                categoryStyle.text,
                categoryStyle.border
              )}
            >
              {event.category}
            </span>
          )}

          {/* Source badge — AI-extracted (has source_file) vs manual */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium',
              event.source_file_id
                ? 'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                : 'bg-surface-100 text-surface-500 border border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700'
            )}
          >
            {event.source_file_id ? (
              <><Sparkles className="h-2.5 w-2.5" /> AI</>
            ) : (
              'Manual'
            )}
          </span>

          {event.confidence && (
            <span className="rounded-full bg-surface-100 px-2 py-1 text-sm font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
              {getConfidenceLabel(event.confidence)}
            </span>
          )}

          {sourceFileName ? (
            <button
              onClick={() => event.source_file_id && onSourceClick(event.source_file_id)}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
              title={`Open ${sourceFileName}`}
            >
              <FileText className="h-2.5 w-2.5" />
              {sourceFileName}
              {event.page_reference != null && ` p.${event.page_reference}`}
            </button>
          ) : event.extraction_method === 'ai' ? (
            <span className="rounded-full bg-accent-50 px-2 py-1 text-sm font-medium text-accent-600 dark:bg-accent-900/20 dark:text-accent-400">
              AI extracted
            </span>
          ) : (
            <span className="rounded-full bg-surface-100 px-2 py-1 text-sm font-medium text-surface-400 dark:bg-surface-800 dark:text-surface-500">
              Manual
            </span>
          )}
        </div>

        {/* Description / source quote */}
        {(event.description || event.source_quote) && (
          <div className="mt-2">
            {event.source_quote && (
              <p className="text-xs italic leading-relaxed text-surface-500 dark:text-surface-400">
                "{event.source_quote}"
              </p>
            )}
            {event.description && !event.source_quote && (
              <p className="text-xs leading-relaxed text-surface-500 dark:text-surface-400">
                {event.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Chronology view ──────────────────────────────────── */

function ChronologyView({ projectId, eventCount }: { projectId: string; eventCount: number }) {
  const { data: entries, isLoading } = useChronologyEntries(projectId);
  const importTimeline = useImportFromTimeline();
  const deleteEntry = useDeleteChronologyEntry();
  const createEntry = useCreateChronologyEntry();
  const updateEntry = useUpdateChronologyEntry();
  const pendingEntry = useAppStore((s) => s.pendingChronologyEntry);
  const clearPendingEntry = useAppStore((s) => s.setPendingChronologyEntry);

  const handleImport = useCallback(async () => {
    try {
      const result = await importTimeline.mutateAsync({ projectId });
      toast.success(`Imported ${result.imported} events`);
    } catch {
      toast.error('Could not import timeline events. Ensure events exist in the Events tab.');
    }
  }, [projectId, importTimeline]);

  const handleExportCSV = useCallback(() => {
    if (!entries?.length) return;
    const included = entries.filter((e) => e.is_included);
    const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const header = ['No.', 'Date', 'Event', 'Source', 'Exhibit Ref.', 'Category', 'Included'].map(csvEscape).join(',');
    const rows = included.map((e, i) =>
      [
        String(i + 1),
        e.date_display,
        e.description,
        e.source_description || '',
        e.exhibit_ref || '',
        e.category || '',
        e.is_included ? 'Yes' : 'No',
      ].map(csvEscape).join(',')
    ).join('\n');
    const blob = new Blob([`${header}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chronology.csv';
    a.click();
    toast.success('Chronology exported as CSV');
  }, [entries]);

  const handleCopyAsTable = useCallback(() => {
    if (!entries?.length) return;
    const included = entries.filter((e) => e.is_included);
    const headers = ['No.', 'Date', 'Event', 'Source', 'Exhibit'];
    const rows = included.map((e, i) => [
      String(i + 1),
      e.date_display,
      e.description,
      e.source_description || '',
      e.exhibit_ref || '',
    ]);
    const table = buildTextTable(headers, rows);
    navigator.clipboard.writeText(table).then(() => {
      toast.success('Chronology table copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  }, [entries]);

  const handleAddPendingEntry = useCallback(async () => {
    if (!pendingEntry) return;
    try {
      await createEntry.mutateAsync({
        project_id: projectId,
        date_display: pendingEntry.date || 'Unknown date',
        description: pendingEntry.text,
        source_description: `Page ${pendingEntry.page}`,
      });
      clearPendingEntry(null);
      toast.success('Added to chronology');
    } catch {
      toast.error('Could not add chronology entry. Check your connection and try again.');
    }
  }, [pendingEntry, projectId, createEntry, clearPendingEntry]);

  const handleCreateEntry = useCallback(() => {
    createEntry.mutate({
      project_id: projectId,
      date_display: new Date().toLocaleDateString('en-CA'),
      description: 'New entry',
    });
  }, [createEntry, projectId]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Pending entry from PDF viewer */}
      {pendingEntry && (
        <div className="shrink-0 border-b border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                Add to chronology (page {pendingEntry.page})
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-emerald-700 dark:text-emerald-300">
                "{pendingEntry.text}"
              </p>
            </div>
            <div className="ml-2 flex items-center gap-1">
              <button
                onClick={handleAddPendingEntry}
                className="flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
              <button
                onClick={() => clearPendingEntry(null)}
                className="rounded-md p-1 text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-surface-200 px-4 py-2 dark:border-surface-700">
        <button onClick={handleImport} disabled={importTimeline.isPending}
          className="flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300">
          {importTimeline.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Import className="h-3 w-3" />}
          Import from Timeline
        </button>
        <button onClick={handleExportCSV} disabled={!entries?.length}
          className="flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 disabled:opacity-50">
          <Download className="h-3 w-3" /> Export CSV
        </button>
        <button onClick={handleCopyAsTable} disabled={!entries?.length}
          className="flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 disabled:opacity-50">
          <Copy className="h-3 w-3" /> Copy Table
        </button>
        <button
          onClick={handleCreateEntry}
          className="flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300"
        >
          <Plus className="h-3 w-3" /> Add Entry
        </button>
        <span className="ml-auto text-xs text-surface-400">{entries?.filter((e) => e.is_included).length ?? 0} entries</span>
      </div>
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-surface-400" /></div>
        ) : !entries?.length ? (
          <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
              <Table2 className="h-5 w-5 text-surface-400 dark:text-surface-500" />
            </div>
            <h3 className="mt-3 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
              Chronology is empty
            </h3>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-surface-400 dark:text-surface-500">
              {eventCount > 0
                ? `Import ${eventCount} timeline event${eventCount === 1 ? '' : 's'} to create a filing-ready chronology, or add a manual entry for facts that are not document-backed yet.`
                : 'Create events first or add a manual chronology entry to start structuring the case narrative.'}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={handleImport}
                disabled={importTimeline.isPending || eventCount === 0}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-4 py-2',
                  'bg-primary-600 text-sm font-medium text-white',
                  'transition-colors hover:bg-primary-700',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {importTimeline.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Import className="h-3.5 w-3.5" />
                )}
                Import from Timeline
              </button>
              <button
                onClick={handleCreateEntry}
                className="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Entry
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800">
                <th className="px-3 py-2 text-left text-xs font-semibold text-surface-500">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-surface-500">Event</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-surface-500">Source</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-surface-500">Exhibit</th>
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className={cn('border-b border-surface-100 hover:bg-surface-50 dark:border-surface-800 group', !entry.is_included && 'opacity-40')}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-surface-700 dark:text-surface-200">
                    <input
                      defaultValue={entry.date_display}
                      onBlur={(e) => {
                        if (e.target.value !== entry.date_display) {
                          updateEntry.mutate({ id: entry.id, projectId, date_display: e.target.value });
                        }
                      }}
                      className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary-300 focus:rounded px-1 -mx-1 dark:focus:bg-surface-800"
                    />
                  </td>
                  <td className="px-3 py-2 text-xs text-surface-600 dark:text-surface-300">
                    <input
                      defaultValue={entry.description}
                      onBlur={(e) => {
                        if (e.target.value !== entry.description) {
                          updateEntry.mutate({ id: entry.id, projectId, description: e.target.value });
                        }
                      }}
                      className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary-300 focus:rounded px-1 -mx-1 dark:focus:bg-surface-800"
                    />
                  </td>
                  <td className="px-3 py-2 text-xs text-surface-400">
                    <input
                      defaultValue={entry.source_description || ''}
                      placeholder="—"
                      onBlur={(e) => {
                        if (e.target.value !== (entry.source_description || '')) {
                          updateEntry.mutate({ id: entry.id, projectId, source_description: e.target.value || undefined });
                        }
                      }}
                      className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary-300 focus:rounded px-1 -mx-1 dark:focus:bg-surface-800"
                    />
                  </td>
                  <td className="px-3 py-2 text-xs text-surface-400">
                    <input
                      defaultValue={entry.exhibit_ref || ''}
                      placeholder="—"
                      onBlur={(e) => {
                        if (e.target.value !== (entry.exhibit_ref || '')) {
                          updateEntry.mutate({ id: entry.id, projectId, exhibit_ref: e.target.value || undefined });
                        }
                      }}
                      className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-primary-300 focus:rounded px-1 -mx-1 dark:focus:bg-surface-800"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => deleteEntry.mutate({ id: entry.id, projectId })}
                      className="rounded p-1 text-surface-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-opacity">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

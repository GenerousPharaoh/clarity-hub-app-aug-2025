import { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppStore from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { toast } from 'sonner';
import {
  useTimelineEvents,
  useCreateTimelineEvent,
  useUpdateTimelineEvent,
  useDeleteTimelineEvent,
  useExtractTimeline,
} from '@/hooks/useTimeline';
import type { TimelineEvent } from '@/hooks/useTimeline';

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

function getConfidenceLabel(confidence: string | null): string {
  switch (confidence) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Medium';
  }
}

export function TimelineTab() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const setMobileTab = useAppStore((s) => s.setMobileTab);
  const { user } = useAuth();

  const {
    data: events,
    isLoading,
    isError,
    refetch,
  } = useTimelineEvents(selectedProjectId);
  const createEvent = useCreateTimelineEvent();
  const updateEvent = useUpdateTimelineEvent();
  const deleteEvent = useDeleteTimelineEvent();
  const extractTimeline = useExtractTimeline();

  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleExtract = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      await extractTimeline.mutateAsync({ projectId: selectedProjectId });
      toast.success('Timeline extraction started');
    } catch (err) {
      toast.error('Failed to extract timeline', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [selectedProjectId, extractTimeline]);

  const handleCreate = useCallback(async () => {
    if (!selectedProjectId || !user || !newDate.trim() || !newTitle.trim()) {
      toast.error('Date and title are required');
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
              className="rounded-[22px] border border-translucent bg-white/88 p-4 dark:bg-surface-900/78"
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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <h3 className="mt-3 font-heading text-sm font-semibold text-red-700 dark:text-red-300">
          Failed to load timeline
        </h3>
        <p className="mt-1 max-w-xs text-center text-xs leading-relaxed text-red-600/80 dark:text-red-400/80">
          Check your connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const eventCount = events?.length ?? 0;
  const verifiedCount = events?.filter((e) => e.is_verified).length ?? 0;

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-translucent bg-white/90 px-3 py-3 backdrop-blur dark:bg-surface-900/90 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
              Timeline
            </h2>
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
                'inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium',
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
                'inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium',
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
          </div>
        </div>
      </div>

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
                  <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">
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
                  <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">
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
                  <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">
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
                  <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">
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
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors',
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

      {/* Timeline events list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {eventCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-dashed border-surface-300 bg-white/80 px-4 py-12 text-center surface-grain dark:border-surface-700 dark:bg-surface-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
              <Calendar className="h-5 w-5 text-surface-400 dark:text-surface-500" />
            </div>
            <h3 className="mt-3 text-center font-heading text-xs font-semibold text-surface-700 dark:text-surface-200">
              No timeline events
            </h3>
            <p className="mt-1 max-w-xs text-center text-xs text-surface-400 dark:text-surface-500">
              Add events manually or extract from files with AI.
            </p>
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
      </div>

      <ConfirmDialog
        open={eventToDelete !== null}
        title="Delete timeline event"
        message={`Are you sure you want to delete "${eventToDelete?.title || 'this event'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setEventToDelete(null)}
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
          'mb-2 min-w-0 flex-1 rounded-[22px] border px-4 py-3 transition-all',
          'border-translucent bg-white/88 shadow-sm',
          'hover:shadow-md',
          'dark:bg-surface-900/78'
        )}
      >
        {/* Date + title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-surface-400 dark:text-surface-500">
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
                'flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors',
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
                'inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium capitalize',
                categoryStyle.bg,
                categoryStyle.text,
                categoryStyle.border
              )}
            >
              {event.category}
            </span>
          )}

          {event.confidence && (
            <span className="rounded-full bg-surface-100 px-2 py-1 text-xs font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
              {getConfidenceLabel(event.confidence)}
            </span>
          )}

          {event.source_file_name ? (
            <button
              onClick={() => event.source_file_id && onSourceClick(event.source_file_id)}
              className="interactive-lift inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
              title={`Open ${event.source_file_name}`}
            >
              <FileText className="h-2.5 w-2.5" />
              {event.source_file_name}
              {event.source_page != null && ` p.${event.source_page}`}
            </button>
          ) : (
            <span className="rounded-full bg-surface-100 px-2 py-1 text-xs font-medium text-surface-400 dark:bg-surface-800 dark:text-surface-500">
              Manual entry
            </span>
          )}
        </div>

        {/* Description / excerpt */}
        {(event.description || event.excerpt) && (
          <div className="mt-2">
            {event.excerpt && (
              <p className="text-xs italic leading-relaxed text-surface-500 dark:text-surface-400">
                "{event.excerpt}"
              </p>
            )}
            {event.description && !event.excerpt && (
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

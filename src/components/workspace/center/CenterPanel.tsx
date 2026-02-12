import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils';
import useAppStore from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes, useCreateNote, useDeleteNote, useUpdateNote } from '@/hooks/useNotes';
import { ProjectOverview } from './ProjectOverview';
import { TipTapEditor } from './editor/TipTapEditor';
import { ExhibitsTab } from './ExhibitsTab';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  LayoutList,
  NotebookPen,
  Tag,
  Plus,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Note } from '@/types';

type Tab = 'overview' | 'notes' | 'exhibits';

export function CenterPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-surface-900">
      {/* Tab bar — fixed 40px header */}
      <div className="flex h-10 shrink-0 items-center border-b border-surface-200 bg-surface-50/50 dark:border-surface-800 dark:bg-surface-850/50">
        <div className="flex h-full items-center gap-0 px-1" role="tablist" aria-label="Content tabs">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<LayoutList className="h-3.5 w-3.5" />}
            label="Overview"
            controls="panel-overview"
          />
          <TabButton
            active={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
            icon={<NotebookPen className="h-3.5 w-3.5" />}
            label="Notes"
            controls="panel-notes"
          />
          <TabButton
            active={activeTab === 'exhibits'}
            onClick={() => setActiveTab('exhibits')}
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Exhibits"
            controls="panel-exhibits"
          />
        </div>
      </div>

      {/* Content area */}
      <div className="relative flex flex-1 overflow-hidden" role="tabpanel" id={`panel-${activeTab}`} aria-label={activeTab}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex h-full w-full"
          >
            {activeTab === 'overview' ? (
              <ProjectOverview onSwitchTab={(tab) => setActiveTab(tab as Tab)} />
            ) : activeTab === 'notes' ? (
              <NotesTab />
            ) : (
              <ExhibitsTab />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Tab button ──────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  icon,
  label,
  controls,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  controls?: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        'relative flex h-full items-center gap-1.5 px-3 text-xs font-medium transition-colors',
        active
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
      )}
    >
      {icon}
      {label}
      {active && (
        <motion.div
          layoutId="center-tab-indicator"
          className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary-600 dark:bg-primary-400"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
}

/* ── Notes Tab — unified master-detail (no sidebar split) ── */

function NotesTab() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { user } = useAuth();
  const { data: notes, isLoading, isError, refetch } = useNotes(selectedProjectId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    };
  }, []);

  // If active note gets deleted, go back to list
  useEffect(() => {
    if (!notes || notes.length === 0) {
      setActiveNoteId(null);
      setShowEditor(false);
      return;
    }
    if (activeNoteId && !notes.find((n) => n.id === activeNoteId)) {
      setActiveNoteId(null);
      setShowEditor(false);
    }
  }, [notes, activeNoteId]);

  const activeNote = notes?.find((n) => n.id === activeNoteId) ?? null;

  const handleCreate = useCallback(async () => {
    if (!selectedProjectId || !user) return;
    const result = await createNote.mutateAsync({
      projectId: selectedProjectId,
      title: 'Untitled',
    });
    setActiveNoteId(result.id);
    setShowEditor(true);
    setTimeout(() => titleInputRef.current?.focus(), 150);
  }, [selectedProjectId, user, createNote]);

  const handleNoteSelect = useCallback((noteId: string) => {
    setActiveNoteId(noteId);
    setShowEditor(true);
  }, []);

  const handleBack = useCallback(() => {
    setShowEditor(false);
  }, []);

  const handleDeleteRequest = useCallback((note: Note) => {
    setNoteToDelete(note);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!noteToDelete || !selectedProjectId) return;
    deleteNote.mutate({ id: noteToDelete.id, projectId: selectedProjectId });
    setNoteToDelete(null);
  }, [noteToDelete, selectedProjectId, deleteNote]);

  const handleDeleteCancel = useCallback(() => {
    setNoteToDelete(null);
  }, []);

  const handleTitleChange = useCallback(
    (value: string) => {
      if (!activeNote || !selectedProjectId) return;
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = setTimeout(() => {
        updateNote.mutate({
          id: activeNote.id,
          projectId: selectedProjectId,
          title: value || 'Untitled',
        });
      }, 500);
    },
    [activeNote, selectedProjectId, updateNote]
  );

  if (!selectedProjectId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-surface-400">Select a project first</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between px-4 py-3">
          <div className="h-3 w-20 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="h-6 w-24 animate-pulse rounded-md bg-surface-100 dark:bg-surface-800" />
        </div>
        <div className="space-y-1 px-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-100 dark:bg-surface-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="mt-3 text-sm font-medium text-surface-600 dark:text-surface-300">
          Failed to load notes
        </p>
        <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
          Check your connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className={cn(
            'mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5',
            'text-xs font-medium text-primary-600',
            'transition-colors hover:bg-primary-50',
            'dark:text-primary-400 dark:hover:bg-primary-900/20'
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  // ── Editor view — full width with back button ──────────
  if (showEditor && activeNote) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-surface-200 bg-white px-2 dark:border-surface-800 dark:bg-surface-900">
          <button
            onClick={handleBack}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1.5',
              'text-xs font-medium text-primary-600 dark:text-primary-400',
              'transition-colors hover:bg-primary-50 active:bg-primary-50',
              'dark:hover:bg-primary-900/20 dark:active:bg-primary-900/20'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Notes
          </button>
          <button
            onClick={() => handleDeleteRequest(activeNote)}
            className={cn(
              'ml-auto rounded-lg p-1.5 text-surface-400 transition-colors',
              'hover:bg-red-50 hover:text-red-500 active:bg-red-50 active:text-red-500',
              'dark:hover:bg-red-900/20 dark:hover:text-red-400',
              'dark:active:bg-red-900/20 dark:active:text-red-400'
            )}
            title="Delete note"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <TipTapEditor
            key={activeNote.id}
            noteId={activeNote.id}
            projectId={activeNote.project_id}
            initialContent={activeNote.content || ''}
            title={activeNote.title || ''}
            onTitleChange={handleTitleChange}
            titleInputRef={titleInputRef}
          />
        </div>
        <ConfirmDialog
          open={noteToDelete !== null}
          title="Delete Note"
          message={`Are you sure you want to delete "${noteToDelete?.title || 'Untitled'}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    );
  }

  // ── Note list — full width ────────────────────────────
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-surface-800">
        <span className="text-xs font-semibold text-surface-500 dark:text-surface-400">
          {notes?.length ?? 0} Notes
        </span>
        <button
          onClick={handleCreate}
          disabled={createNote.isPending}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
            'text-xs font-medium text-primary-600 dark:text-primary-400',
            'transition-colors hover:bg-primary-50 active:bg-primary-50',
            'dark:hover:bg-primary-900/20 dark:active:bg-primary-900/20',
            'disabled:opacity-50'
          )}
        >
          {createNote.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          New Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {(!notes || notes.length === 0) ? (
          <div className="flex flex-col items-center justify-center px-8 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-700">
              <NotebookPen className="h-6 w-6 text-surface-400 dark:text-surface-500" />
            </div>
            <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
              No Notes Yet
            </h3>
            <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
              Create your first note to start organizing your case analysis.
            </p>
            <button
              onClick={handleCreate}
              disabled={createNote.isPending}
              className={cn(
                'mt-4 flex items-center gap-1.5 rounded-lg px-4 py-2',
                'bg-primary-600 text-xs font-medium text-white',
                'transition-colors hover:bg-primary-700 active:bg-primary-700',
                'disabled:opacity-50'
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Note
            </button>
          </div>
        ) : (
          notes.map((note) => (
            <button
              key={note.id}
              onClick={() => handleNoteSelect(note.id)}
              className={cn(
                'flex w-full items-center gap-3 border-b border-surface-100 px-4 py-3 text-left',
                'transition-colors hover:bg-surface-50 active:bg-surface-50',
                'dark:border-surface-800 dark:hover:bg-surface-800/50 dark:active:bg-surface-800/50'
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-700">
                <FileText className="h-4 w-4 text-surface-400 dark:text-surface-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-surface-700 dark:text-surface-200">
                  {note.title || 'Untitled'}
                </p>
                <p className="mt-0.5 text-[11px] text-surface-400 dark:text-surface-500">
                  {formatRelativeDate(note.last_modified ?? note.created_at)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-surface-300 dark:text-surface-600" />
            </button>
          ))
        )}
      </div>

      <ConfirmDialog
        open={noteToDelete !== null}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title || 'Untitled'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

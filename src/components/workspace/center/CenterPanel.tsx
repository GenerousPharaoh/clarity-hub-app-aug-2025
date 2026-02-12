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
  PenLine,
  Tag,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Check,
  NotebookPen,
} from 'lucide-react';
import type { Note } from '@/types';

type Tab = 'overview' | 'editor' | 'exhibits';

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
            active={activeTab === 'editor'}
            onClick={() => setActiveTab('editor')}
            icon={<PenLine className="h-3.5 w-3.5" />}
            label="Editor"
            controls="panel-editor"
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
            ) : activeTab === 'editor' ? (
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

/* ── Notes Tab — editor-first with note dropdown ───────── */

function NotesTab() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { user } = useAuth();
  const { data: notes, isLoading, isError, refetch } = useNotes(selectedProjectId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    };
  }, []);

  // Auto-select first note when notes load (or if active note is deleted)
  useEffect(() => {
    if (!notes || notes.length === 0) {
      setActiveNoteId(null);
      return;
    }
    if (!activeNoteId || !notes.find((n) => n.id === activeNoteId)) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const activeNote = notes?.find((n) => n.id === activeNoteId) ?? null;

  const handleCreate = useCallback(async () => {
    if (!selectedProjectId || !user) return;
    const result = await createNote.mutateAsync({
      projectId: selectedProjectId,
      title: 'Untitled',
    });
    setActiveNoteId(result.id);
    setDropdownOpen(false);
    setTimeout(() => titleInputRef.current?.focus(), 150);
  }, [selectedProjectId, user, createNote]);

  const handleNoteSelect = useCallback((noteId: string) => {
    setActiveNoteId(noteId);
    setDropdownOpen(false);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!noteToDelete || !selectedProjectId) return;
    deleteNote.mutate({ id: noteToDelete.id, projectId: selectedProjectId });
    setNoteToDelete(null);
  }, [noteToDelete, selectedProjectId, deleteNote]);

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
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-surface-200 px-3 dark:border-surface-800">
          <div className="h-5 w-32 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="ml-auto h-6 w-20 animate-pulse rounded-md bg-surface-100 dark:bg-surface-800" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-surface-300" />
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

  // ── Empty state — no notes yet ──────────────────────────
  if (!notes || notes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-700">
          <PenLine className="h-6 w-6 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          Start Building Your Case
        </h3>
        <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          Create your first document to organize arguments, draft submissions, and build your case.
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
          {createNote.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Create Document
        </button>
      </div>
    );
  }

  // ── Editor-first layout — always visible ────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Header bar: note selector dropdown + actions */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-surface-200 bg-white px-2 dark:border-surface-800 dark:bg-surface-900">
        {/* Note selector dropdown */}
        <div className="relative min-w-0 flex-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={cn(
              'flex max-w-[260px] items-center gap-1.5 rounded-lg px-2 py-1.5',
              'text-xs font-medium text-surface-700 dark:text-surface-200',
              'transition-colors hover:bg-surface-100 active:bg-surface-100',
              'dark:hover:bg-surface-800 dark:active:bg-surface-800'
            )}
          >
            <span className="truncate">{activeNote?.title || 'Untitled'}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-surface-400 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {/* Dropdown list */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  'absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl',
                  'border border-surface-200 bg-white shadow-lg',
                  'dark:border-surface-700 dark:bg-surface-850'
                )}
              >
                <div className="max-h-64 overflow-y-auto py-1">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => handleNoteSelect(note.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs',
                        'transition-colors hover:bg-surface-50 dark:hover:bg-surface-800',
                        note.id === activeNoteId && 'bg-primary-50 dark:bg-primary-900/20'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-surface-700 dark:text-surface-200">
                          {note.title || 'Untitled'}
                        </p>
                        <p className="mt-0.5 text-[10px] text-surface-400 dark:text-surface-500">
                          {formatRelativeDate(note.last_modified ?? note.created_at)}
                        </p>
                      </div>
                      {note.id === activeNoteId && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary-600 dark:text-primary-400" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-surface-100 p-1 dark:border-surface-700">
                  <button
                    onClick={handleCreate}
                    disabled={createNote.isPending}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
                      'text-primary-600 transition-colors hover:bg-primary-50',
                      'dark:text-primary-400 dark:hover:bg-primary-900/20',
                      'disabled:opacity-50'
                    )}
                  >
                    {createNote.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    New Document
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New document shortcut */}
        <button
          onClick={handleCreate}
          disabled={createNote.isPending}
          className={cn(
            'flex items-center gap-1 rounded-lg px-2 py-1.5',
            'text-xs font-medium text-primary-600 dark:text-primary-400',
            'transition-colors hover:bg-primary-50 active:bg-primary-50',
            'dark:hover:bg-primary-900/20 dark:active:bg-primary-900/20',
            'disabled:opacity-50'
          )}
          title="New document"
        >
          {createNote.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Delete current note */}
        {activeNote && (
          <button
            onClick={() => setNoteToDelete(activeNote)}
            className={cn(
              'rounded-lg p-1.5 text-surface-400 transition-colors',
              'hover:bg-red-50 hover:text-red-500 active:bg-red-50 active:text-red-500',
              'dark:hover:bg-red-900/20 dark:hover:text-red-400',
              'dark:active:bg-red-900/20 dark:active:text-red-400'
            )}
            title="Delete note"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Full-width editor — takes all remaining space */}
      {activeNote ? (
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
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-surface-300" />
        </div>
      )}

      <ConfirmDialog
        open={noteToDelete !== null}
        title="Delete document"
        message={`Are you sure you want to delete "${noteToDelete?.title || 'Untitled'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
}

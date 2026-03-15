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
import { ExportButton } from '@/components/shared/ExportButton';
import { readWorkspaceSession, saveWorkspaceNote, saveWorkspaceView } from '@/lib/workspaceSession';
import { toast } from 'sonner';
import type { CenterTab } from '@/store/slices/panelSlice';
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

export function CenterPanel() {
  const activeTab = useAppStore((s) => s.centerTab);
  const setActiveTab = useAppStore((s) => s.setCenterTab);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPanelWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = panelWidth > 0 && panelWidth < 400;
  const ultraCompact = panelWidth > 0 && panelWidth < 300;

  useEffect(() => {
    if (!selectedProjectId) return;
    saveWorkspaceView({ projectId: selectedProjectId, centerTab: activeTab });
  }, [activeTab, selectedProjectId]);

  return (
    <div ref={containerRef} className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-white dark:bg-surface-900">
      {/* Tab bar */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-surface-200/80 bg-surface-50/70 px-3 py-3 dark:border-surface-800 dark:bg-surface-850/70 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400 dark:text-surface-500">
            Workspace content
          </p>
          {!compact && (
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              Move between briefing, drafting, and exhibit prep without losing context.
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 rounded-2xl border border-surface-200/80 bg-white/85 p-1 shadow-sm dark:border-surface-700 dark:bg-surface-900/80',
            ultraCompact && 'px-0.5'
          )}
          role="tablist"
          aria-label="Content tabs"
        >
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<LayoutList className="h-3.5 w-3.5" />}
            label="Overview"
            controls="panel-overview"
            showLabel={!ultraCompact}
            compact={ultraCompact}
          />
          <TabButton
            active={activeTab === 'editor'}
            onClick={() => setActiveTab('editor')}
            icon={<PenLine className="h-3.5 w-3.5" />}
            label="Documents"
            controls="panel-editor"
            showLabel={!ultraCompact}
            compact={ultraCompact}
          />
          <TabButton
            active={activeTab === 'exhibits'}
            onClick={() => setActiveTab('exhibits')}
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Exhibits"
            controls="panel-exhibits"
            showLabel={!ultraCompact}
            compact={ultraCompact}
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
            className="flex h-full w-full min-w-0"
          >
            {activeTab === 'overview' ? (
              <ProjectOverview onSwitchTab={(tab) => setActiveTab(tab as CenterTab)} />
            ) : activeTab === 'editor' ? (
              <NotesTab compact={compact} />
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
  showLabel = true,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  controls?: string;
  showLabel?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        'relative flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all',
        compact ? 'px-1.5' : 'px-3.5',
        active
          ? 'text-primary-700 dark:text-primary-300'
          : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200'
      )}
      title={label}
    >
      {active && (
        <motion.span
          layoutId="center-tab-pill"
          className="absolute inset-0 -z-10 rounded-xl bg-white/92 shadow-sm ring-1 ring-surface-200/70 dark:bg-surface-800 dark:ring-surface-700/60"
        />
      )}
      {icon}
      {showLabel && <span className="truncate">{label}</span>}
    </button>
  );
}

/* ── Notes Tab — editor-first with note dropdown ───────── */

function NotesTab({ compact = false }: { compact?: boolean }) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const newNoteRequestNonce = useAppStore((s) => s.newNoteRequestNonce);
  const { user } = useAuth();
  const { data: notes, isLoading, isError, refetch } = useNotes(selectedProjectId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handledNewNoteRequest = useRef(newNoteRequestNonce);

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

    const session = selectedProjectId ? readWorkspaceSession() : null;
    const preferredNoteId =
      session?.projectId === selectedProjectId ? session.noteId : null;

    if (
      preferredNoteId &&
      (!activeNoteId || !notes.find((note) => note.id === activeNoteId)) &&
      notes.find((note) => note.id === preferredNoteId)
    ) {
      setActiveNoteId(preferredNoteId);
      return;
    }

    if (!activeNoteId || !notes.find((n) => n.id === activeNoteId)) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId, selectedProjectId]);

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
  const noteCount = notes?.length ?? 0;

  useEffect(() => {
    if (!activeNote) return;
    saveWorkspaceNote(activeNote);
  }, [activeNote]);

  useEffect(() => {
    setTitleDraft(activeNote?.title || 'Untitled');
  }, [activeNote?.id, activeNote?.title]);

  const handleCreate = useCallback(async () => {
    if (!selectedProjectId || !user) return;
    try {
      const result = await createNote.mutateAsync({
        projectId: selectedProjectId,
        title: 'Untitled',
      });
      setActiveNoteId(result.id);
      setTitleDraft('Untitled');
      setDropdownOpen(false);
    } catch (err) {
      console.error('[NotesTab] Failed to create note:', err);
      toast.error('Failed to create document');
    }
  }, [selectedProjectId, user, createNote]);

  useEffect(() => {
    if (newNoteRequestNonce === handledNewNoteRequest.current) return;
    handledNewNoteRequest.current = newNoteRequestNonce;
    if (!selectedProjectId || createNote.isPending) return;
    void handleCreate();
  }, [createNote.isPending, handleCreate, newNoteRequestNonce, selectedProjectId]);

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

  const commitTitleChange = useCallback(() => {
    if (!activeNote || !selectedProjectId) return;
    const nextTitle = titleDraft.trim() || 'Untitled';
    if ((activeNote.title || 'Untitled') === nextTitle) return;
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    updateNote.mutate({
      id: activeNote.id,
      projectId: selectedProjectId,
      title: nextTitle,
    });
    setTitleDraft(nextTitle);
  }, [activeNote, selectedProjectId, titleDraft, updateNote]);

  const resetTitleDraft = useCallback(() => {
    setTitleDraft(activeNote?.title || 'Untitled');
  }, [activeNote?.title]);

  if (!selectedProjectId) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <p className="text-xs text-surface-400">Select a project first</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-surface-200 px-3 dark:border-surface-800">
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
      <div className="flex h-full w-full min-w-0 flex-1 flex-col items-center justify-center px-8">
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
      <div className="flex h-full w-full min-w-0 flex-1 flex-col items-center justify-center px-8">
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
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* Header bar: note selector dropdown + actions */}
      <div className="shrink-0 border-b border-surface-200/80 bg-white/90 px-3 py-3 backdrop-blur dark:border-surface-800 dark:bg-surface-900/90 sm:px-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                <NotebookPen className="h-4.5 w-4.5 text-surface-500 dark:text-surface-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400 dark:text-surface-500">
                  Drafting lane
                </p>
                <p className="mt-1 text-sm font-semibold text-surface-900 dark:text-surface-100">
                  Documents and working theories
                </p>
                <div className="mt-2 flex flex-nowrap gap-2 overflow-hidden">
                  <span className="shrink-0 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                    {noteCount} {noteCount === 1 ? 'document' : 'documents'}
                  </span>
                  {activeNote && (
                    <span className="min-w-0 truncate rounded-full border border-surface-200 bg-white px-3 py-1 text-[10px] font-medium text-surface-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400">
                      Edited {formatRelativeDate(activeNote.last_modified ?? activeNote.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start xl:self-auto">
              <button
                onClick={handleCreate}
                disabled={createNote.isPending}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium',
                  'border-surface-200 bg-white text-surface-600 transition-colors hover:bg-surface-50',
                  'dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
                title="Create document"
              >
                {createNote.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {!compact && 'New document'}
              </button>

              {activeNote && (
                <ExportButton
                  content={activeNote.content || ''}
                  title={activeNote.title || 'Untitled'}
                  type="note"
                  className="rounded-xl border border-surface-200 bg-white px-3 py-2 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:hover:bg-surface-700"
                />
              )}

              {activeNote && (
                <button
                  onClick={() => setNoteToDelete(activeNote)}
                  className={cn(
                    'rounded-xl border border-transparent p-2 text-surface-400 transition-colors',
                    'hover:border-red-200 hover:bg-red-50 hover:text-red-500',
                    'dark:hover:border-red-900/40 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                  )}
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Note selector dropdown */}
          <div className="relative min-w-0 max-w-full flex-1" ref={dropdownRef}>
            <div
              className={cn(
                'flex h-11 w-full items-center rounded-2xl border',
                'border-surface-200 bg-surface-50/80 text-sm font-medium text-surface-700 shadow-sm',
                'transition-colors hover:border-surface-300 hover:bg-white',
                'dark:border-surface-700 dark:bg-surface-800/70 dark:text-surface-200',
                'dark:hover:border-surface-600 dark:hover:bg-surface-800'
              )}
            >
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => {
                  setTitleDraft(e.target.value);
                  handleTitleChange(e.target.value);
                }}
                onBlur={commitTitleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitTitleChange();
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    resetTitleDraft();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-surface-700 outline-none placeholder:text-surface-400 dark:text-surface-200 dark:placeholder:text-surface-500"
                placeholder="Untitled"
                aria-label="Document title"
              />
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="mr-1.5 flex h-8 w-8 items-center justify-center rounded-xl text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                title="Document list"
                aria-label="Open document list"
              >
                <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', dropdownOpen && 'rotate-180')} />
              </button>
            </div>

            {/* Dropdown list */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    'absolute left-0 top-full z-50 mt-2 max-h-[70vh] min-w-[18rem] max-w-[28rem] overflow-hidden rounded-[22px]',
                    'border border-surface-200 bg-white shadow-lg shadow-surface-900/10',
                    'dark:border-surface-700 dark:bg-surface-850 dark:shadow-surface-950/30'
                  )}
                >
                  <div className="max-h-64 overflow-y-auto p-2">
                    {notes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => handleNoteSelect(note.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left',
                          'transition-colors hover:bg-surface-50 dark:hover:bg-surface-800',
                          note.id === activeNoteId && 'bg-primary-50 dark:bg-primary-900/20'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-surface-700 dark:text-surface-200">
                            {note.title || 'Untitled'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-surface-400 dark:text-surface-500">
                            {formatRelativeDate(note.last_modified ?? note.created_at)}
                          </p>
                        </div>
                        {note.id === activeNoteId && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary-600 dark:text-primary-400" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-surface-100 p-2 dark:border-surface-700">
                    <button
                      onClick={handleCreate}
                      disabled={createNote.isPending}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium',
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
        </div>
      </div>

      {/* Full-width editor — takes all remaining space */}
      {activeNote ? (
        <div className="flex-1 overflow-hidden">
          <TipTapEditor
            key={activeNote.id}
            noteId={activeNote.id}
            projectId={activeNote.project_id}
            initialContent={activeNote.content || ''}
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

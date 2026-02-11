import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils';
import useAppStore from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes, useCreateNote, useDeleteNote, useUpdateNote } from '@/hooks/useNotes';
import { ProjectOverview } from './ProjectOverview';
import { TipTapEditor } from './editor/TipTapEditor';
import { ExhibitsTab } from './ExhibitsTab';
import { FadeIn } from '@/components/shared/FadeIn';
import {
  LayoutList,
  NotebookPen,
  Tag,
  Plus,
  FileText,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { Note } from '@/types';

type Tab = 'overview' | 'notes' | 'exhibits';

export function CenterPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-surface-900">
      {/* Tab bar — fixed 40px header */}
      <div className="flex h-10 shrink-0 items-center border-b border-surface-200 bg-surface-50/50 dark:border-surface-800 dark:bg-surface-850/50">
        <div className="flex h-full items-center gap-0 px-1">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<LayoutList className="h-3.5 w-3.5" />}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
            icon={<NotebookPen className="h-3.5 w-3.5" />}
            label="Notes"
          />
          <TabButton
            active={activeTab === 'exhibits'}
            onClick={() => setActiveTab('exhibits')}
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Exhibits"
          />
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'overview' ? (
          <ProjectOverview />
        ) : activeTab === 'notes' ? (
          <NotesTab />
        ) : (
          <ExhibitsTab />
        )}
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
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
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
        <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary-600 dark:bg-primary-400" />
      )}
    </button>
  );
}

/* ── Notes Tab ───────────────────────────────────────────── */

function NotesTab() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { user } = useAuth();
  const { data: notes, isLoading } = useNotes(selectedProjectId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-select the first note when notes load (or when active note is deleted)
  useEffect(() => {
    if (!notes || notes.length === 0) {
      setActiveNoteId(null);
      return;
    }
    // If no active note, or active note no longer exists, select first
    if (!activeNoteId || !notes.find((n) => n.id === activeNoteId)) {
      setActiveNoteId(notes[0].id);
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
    // Focus the title input after creation
    setTimeout(() => titleInputRef.current?.focus(), 150);
  }, [selectedProjectId, user, createNote]);

  const handleDelete = useCallback(
    (note: Note) => {
      if (!selectedProjectId) return;
      const confirmed = window.confirm(
        `Delete "${note.title || 'Untitled'}"? This cannot be undone.`
      );
      if (!confirmed) return;
      deleteNote.mutate({ id: note.id, projectId: selectedProjectId });
    },
    [selectedProjectId, deleteNote]
  );

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
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-surface-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Note list sidebar ──────────────────────────────── */}
      <div className="flex w-52 shrink-0 flex-col border-r border-surface-200 bg-surface-50/80 dark:border-surface-800 dark:bg-surface-850/80">
        {/* New note button */}
        <div className="shrink-0 p-2">
          <button
            onClick={handleCreate}
            disabled={createNote.isPending}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5',
              'text-xs font-medium text-primary-600 dark:text-primary-400',
              'transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20',
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

        {/* Note items */}
        <div className="flex-1 overflow-y-auto">
          {(!notes || notes.length === 0) && (
            <div className="px-4 py-8 text-center">
              <FileText className="mx-auto h-5 w-5 text-surface-300 dark:text-surface-500" />
              <p className="mt-2 text-[11px] text-surface-400 dark:text-surface-500">
                No notes yet
              </p>
            </div>
          )}

          {notes?.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              onClick={() => setActiveNoteId(note.id)}
              onDelete={() => handleDelete(note)}
            />
          ))}
        </div>
      </div>

      {/* ── Editor area ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeNote ? (
          <FadeIn key={activeNote.id} direction="none" duration={0.15}>
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Title input */}
              <div className="shrink-0 px-6 pt-5 pb-1">
                <input
                  ref={titleInputRef}
                  type="text"
                  defaultValue={activeNote.title || ''}
                  key={activeNote.id} // reset defaultValue when switching notes
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled"
                  className={cn(
                    'w-full bg-transparent font-heading text-xl font-semibold',
                    'text-surface-900 dark:text-surface-50',
                    'placeholder:text-surface-300 dark:placeholder:text-surface-600',
                    'border-none outline-none focus:outline-none focus:ring-0'
                  )}
                />
              </div>

              {/* TipTap editor */}
              <div className="flex-1 overflow-hidden">
                <TipTapEditor
                  key={activeNote.id}
                  noteId={activeNote.id}
                  projectId={activeNote.project_id}
                  initialContent={activeNote.content || ''}
                />
              </div>
            </div>
          </FadeIn>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-700">
              <NotebookPen className="h-6 w-6 text-surface-400 dark:text-surface-500" />
            </div>
            <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
              {notes && notes.length > 0 ? 'Select a Note' : 'No Notes Yet'}
            </h3>
            <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
              {notes && notes.length > 0
                ? 'Choose a note from the sidebar to start editing.'
                : 'Create your first note to start organizing your case analysis.'}
            </p>
            {(!notes || notes.length === 0) && (
              <button
                onClick={handleCreate}
                disabled={createNote.isPending}
                className={cn(
                  'mt-4 flex items-center gap-1.5 rounded-lg px-4 py-2',
                  'bg-primary-600 text-xs font-medium text-white',
                  'transition-colors hover:bg-primary-700',
                  'disabled:opacity-50'
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Create Note
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Note list item ──────────────────────────────────────── */

function NoteListItem({
  note,
  isActive,
  onClick,
  onDelete,
}: {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            'line-clamp-1 text-xs font-medium',
            isActive
              ? 'text-primary-700 dark:text-primary-300'
              : 'text-surface-700 dark:text-surface-300'
          )}
        >
          {note.title || 'Untitled'}
        </span>

        {/* Delete button — visible on hover or when active */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            'shrink-0 rounded p-0.5 text-surface-400 transition-all',
            'hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400',
            isActive
              ? 'opacity-60 hover:opacity-100'
              : 'opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100'
          )}
          title="Delete note"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <span className="text-[10px] text-surface-400 dark:text-surface-500">
        {formatRelativeDate(note.last_modified ?? note.created_at)}
      </span>
    </button>
  );
}

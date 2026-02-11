import { useState, useCallback, useRef } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  FileText,
  Loader2,
  Link2,
  Unlink,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppStore from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import {
  useExhibits,
  useCreateExhibit,
  useUpdateExhibit,
  useDeleteExhibit,
  getNextExhibitId,
} from '@/hooks/useExhibits';
import type { ExhibitMarker, FileRecord } from '@/types';

export function ExhibitsTab() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const files = useAppStore((s) => s.files);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const { user } = useAuth();

  const { data: exhibits, isLoading } = useExhibits(selectedProjectId);
  const createExhibit = useCreateExhibit();
  const updateExhibit = useUpdateExhibit();
  const deleteExhibit = useDeleteExhibit();

  const projectFiles = files.filter(
    (f) => f.project_id === selectedProjectId && !f.is_deleted
  );

  const handleCreate = useCallback(async () => {
    if (!selectedProjectId || !user) return;
    const nextId = getNextExhibitId(exhibits ?? []);
    await createExhibit.mutateAsync({
      projectId: selectedProjectId,
      exhibitId: nextId,
    });
  }, [selectedProjectId, user, exhibits, createExhibit]);

  const handleDelete = useCallback(
    (exhibit: ExhibitMarker) => {
      if (!selectedProjectId) return;
      const confirmed = window.confirm(
        `Delete "${exhibit.exhibit_id}"? This cannot be undone.`
      );
      if (!confirmed) return;
      deleteExhibit.mutate({ id: exhibit.id, projectId: selectedProjectId });
    },
    [selectedProjectId, deleteExhibit]
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
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-700">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          Exhibit Markers ({exhibits?.length ?? 0})
        </h2>
        <button
          onClick={handleCreate}
          disabled={createExhibit.isPending}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
            'text-xs font-medium text-primary-600 dark:text-primary-400',
            'transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20',
            'disabled:opacity-50'
          )}
        >
          {createExhibit.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Add Exhibit
        </button>
      </div>

      {/* Exhibit list */}
      <div className="flex-1 overflow-y-auto p-4">
        {(!exhibits || exhibits.length === 0) ? (
          <EmptyState onCreateFirst={handleCreate} isCreating={createExhibit.isPending} />
        ) : (
          <div className="space-y-3">
            {exhibits.map((exhibit) => (
              <ExhibitCard
                key={exhibit.id}
                exhibit={exhibit}
                projectId={selectedProjectId}
                files={projectFiles}
                onDelete={() => handleDelete(exhibit)}
                onUpdate={(updates) =>
                  updateExhibit.mutate({
                    id: exhibit.id,
                    projectId: selectedProjectId,
                    ...updates,
                  })
                }
                onFileClick={(fileId) => setSelectedFile(fileId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Empty State ──────────────────────────────────────────── */

function EmptyState({
  onCreateFirst,
  isCreating,
}: {
  onCreateFirst: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-700">
        <Tag className="h-6 w-6 text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
        No Exhibits Yet
      </h3>
      <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
        Create exhibit markers to organize and reference your evidence files.
      </p>
      <button
        onClick={onCreateFirst}
        disabled={isCreating}
        className={cn(
          'mt-4 flex items-center gap-1.5 rounded-lg px-4 py-2',
          'bg-primary-600 text-xs font-medium text-white',
          'transition-colors hover:bg-primary-700',
          'disabled:opacity-50'
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        Create First Exhibit
      </button>
    </div>
  );
}

/* ── Exhibit Card ─────────────────────────────────────────── */

function ExhibitCard({
  exhibit,
  projectId,
  files,
  onDelete,
  onUpdate,
  onFileClick,
}: {
  exhibit: ExhibitMarker;
  projectId: string;
  files: FileRecord[];
  onDelete: () => void;
  onUpdate: (updates: { description?: string; fileId?: string | null }) => void;
  onFileClick: (fileId: string) => void;
}) {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState(exhibit.description ?? '');
  const [showFilePicker, setShowFilePicker] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const linkedFile = exhibit.file_id
    ? files.find((f) => f.id === exhibit.file_id) ?? null
    : null;

  const saveDesc = useCallback(() => {
    onUpdate({ description: editDesc.trim() });
    setIsEditingDesc(false);
  }, [editDesc, onUpdate]);

  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-surface-600 dark:bg-surface-800">
      <div className="flex items-start justify-between gap-2">
        {/* Exhibit badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {exhibit.exhibit_id}
          </span>
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="flex h-6 w-6 items-center justify-center rounded text-surface-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          title="Delete exhibit"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Description */}
      <div className="mt-2">
        {isEditingDesc ? (
          <div>
            <textarea
              ref={descRef}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              autoFocus
              rows={2}
              placeholder="Describe this exhibit..."
              className="w-full resize-none rounded border border-surface-200 bg-transparent px-2 py-1.5 text-xs text-surface-600 outline-none focus:border-primary-400 dark:border-surface-600 dark:text-surface-300"
            />
            <div className="mt-1 flex gap-1">
              <button
                onClick={saveDesc}
                className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={() => {
                  setEditDesc(exhibit.description ?? '');
                  setIsEditingDesc(false);
                }}
                className="rounded p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              setEditDesc(exhibit.description ?? '');
              setIsEditingDesc(true);
            }}
            className="group flex cursor-pointer items-start gap-1"
          >
            {exhibit.description ? (
              <p className="text-xs leading-relaxed text-surface-600 dark:text-surface-300">
                {exhibit.description}
              </p>
            ) : (
              <p className="text-xs italic text-surface-400 dark:text-surface-500">
                No description — click to add
              </p>
            )}
            <Pencil className="mt-0.5 h-2.5 w-2.5 shrink-0 text-surface-300 opacity-0 group-hover:opacity-100" />
          </div>
        )}
      </div>

      {/* Linked file */}
      <div className="mt-3 flex items-center gap-2">
        {linkedFile ? (
          <>
            <button
              onClick={() => onFileClick(linkedFile.id)}
              className="flex items-center gap-1.5 rounded-md bg-surface-50 px-2 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50 dark:bg-surface-700 dark:text-primary-400 dark:hover:bg-primary-900/20"
            >
              <FileText className="h-3 w-3" />
              <span className="max-w-[180px] truncate">{linkedFile.name}</span>
            </button>
            <button
              onClick={() => onUpdate({ fileId: null })}
              className="flex h-5 w-5 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700"
              title="Unlink file"
            >
              <Unlink className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowFilePicker(!showFilePicker)}
              className="flex items-center gap-1 text-[10px] text-surface-400 transition-colors hover:text-surface-600 dark:hover:text-surface-300"
            >
              <Link2 className="h-3 w-3" />
              Link a file
            </button>

            {showFilePicker && (
              <FilePicker
                files={files}
                onSelect={(fileId) => {
                  onUpdate({ fileId });
                  setShowFilePicker(false);
                }}
                onClose={() => setShowFilePicker(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── File Picker Dropdown ─────────────────────────────────── */

function FilePicker({
  files,
  onSelect,
  onClose,
}: {
  files: FileRecord[];
  onSelect: (fileId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-surface-200 bg-white p-2 shadow-lg dark:border-surface-600 dark:bg-surface-800">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          autoFocus
          className="mb-2 w-full rounded border border-surface-200 bg-transparent px-2 py-1 text-xs text-surface-700 outline-none focus:border-primary-400 dark:border-surface-600 dark:text-surface-200"
        />

        <div className="max-h-40 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-[10px] text-surface-400">
              No files found
            </p>
          ) : (
            filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelect(f.id)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                <FileText className="h-3 w-3 shrink-0 text-surface-400" />
                <span className="truncate">{f.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

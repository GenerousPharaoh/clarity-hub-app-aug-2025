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
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
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
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const setMobileTab = useAppStore((s) => s.setMobileTab);
  const { user } = useAuth();

  const { data: exhibits, isLoading, isError, refetch } = useExhibits(selectedProjectId);
  const createExhibit = useCreateExhibit();
  const updateExhibit = useUpdateExhibit();
  const deleteExhibit = useDeleteExhibit();
  const [exhibitToDelete, setExhibitToDelete] = useState<ExhibitMarker | null>(null);

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

  const handleDeleteRequest = useCallback((exhibit: ExhibitMarker) => {
    setExhibitToDelete(exhibit);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!exhibitToDelete || !selectedProjectId) return;
    deleteExhibit.mutate({ id: exhibitToDelete.id, projectId: selectedProjectId });
    setExhibitToDelete(null);
  }, [exhibitToDelete, selectedProjectId, deleteExhibit]);

  const handleDeleteCancel = useCallback(() => {
    setExhibitToDelete(null);
  }, []);

  if (!selectedProjectId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-surface-400">Select a project first</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-800">
          <div className="h-3 w-32 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="h-6 w-24 animate-pulse rounded-md bg-surface-100 dark:bg-surface-800" />
        </div>
        <div className="space-y-3 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 animate-pulse rounded-md bg-primary-100 dark:bg-primary-900/30" />
              </div>
              <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
              <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
              <div className="mt-3 flex items-center gap-2">
                <div className="h-6 w-32 animate-pulse rounded-md bg-surface-50 dark:bg-surface-700" />
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
          Failed to load exhibits
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-800">
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
                files={projectFiles}
                onDelete={() => handleDeleteRequest(exhibit)}
                onUpdate={(updates) =>
                  updateExhibit.mutate({
                    id: exhibit.id,
                    projectId: selectedProjectId,
                    ...updates,
                  })
                }
                onFileClick={(fileId) => {
                  setSelectedFile(fileId);
                  setRightPanel(true);
                  setRightTab('viewer');
                  setMobileTab('viewer');
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={exhibitToDelete !== null}
        title="Delete Exhibit"
        message={`Are you sure you want to delete "${exhibitToDelete?.exhibit_id}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
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
  files,
  onDelete,
  onUpdate,
  onFileClick,
}: {
  exhibit: ExhibitMarker;
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
    <div className="rounded-lg border border-surface-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-surface-700 dark:bg-surface-800">
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
              className={cn(
                'w-full resize-none rounded-lg border px-2 py-1.5 text-xs transition-colors',
                'border-surface-200 bg-white text-surface-600',
                'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300',
                'dark:focus:border-primary-400 dark:focus:ring-primary-400/20'
              )}
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

      <div
        className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-surface-200 bg-white p-2 shadow-lg dark:border-surface-700 dark:bg-surface-800"
        role="listbox"
        aria-label="Select a file"
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
          placeholder="Search files..."
          autoFocus
          className={cn(
            'mb-2 w-full rounded-lg border px-2 py-1.5 text-xs transition-colors',
            'border-surface-200 bg-white text-surface-700',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200',
            'dark:focus:border-primary-400 dark:focus:ring-primary-400/20'
          )}
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

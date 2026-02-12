import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FolderOpen,
  FileText,
  NotebookPen,
  Clock,
  Calendar,
  Upload,
  Pencil,
  Check,
  X,
  FileImage,
  FileAudio,
  FileVideo,
  File,
  Tag,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import useAppStore from '@/store';
import { useNotes } from '@/hooks/useNotes';
import { useUpdateProject } from '@/hooks/useProjects';
import { useUploadFile } from '@/hooks/useFiles';
import { useExhibits } from '@/hooks/useExhibits';
import { formatDate, formatRelativeDate, getFileTypeFromExtension, getFileExtension } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/shared/FadeIn';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/constants';

interface ProjectOverviewProps {
  onSwitchTab?: (tab: string) => void;
}

export function ProjectOverview({ onSwitchTab }: ProjectOverviewProps = {}) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useAppStore((s) => s.projects);
  const files = useAppStore((s) => s.files);

  const project = projects.find((p) => p.id === selectedProjectId) ?? null;
  const { data: notes } = useNotes(selectedProjectId);
  const { data: exhibits } = useExhibits(selectedProjectId);

  const projectFiles = files.filter(
    (f) => f.project_id === selectedProjectId && !f.is_deleted
  );
  const fileCount = projectFiles.length;
  const noteCount = notes?.length ?? 0;
  const exhibitCount = exhibits?.length ?? 0;

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-700">
          <FolderOpen className="h-6 w-6 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          No Project Selected
        </h3>
        <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          Select a project from the dashboard to view its overview.
        </p>
      </div>
    );
  }

  return (
    <FadeIn className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-5 p-4 md:space-y-6 md:p-6">
        {/* Editable Project Header */}
        <EditableProjectHeader project={project} />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<FileText className="h-4 w-4" />}
            label="Files"
            value={fileCount}
            color="primary"
          />
          <StatCard
            icon={<NotebookPen className="h-4 w-4" />}
            label="Notes"
            value={noteCount}
            color="accent"
          />
          <StatCard
            icon={<Tag className="h-4 w-4" />}
            label="Exhibits"
            value={exhibitCount}
            color="emerald"
          />
        </div>

        {/* File Type Breakdown */}
        {fileCount > 0 && <FileTypeBreakdown files={projectFiles} />}

        {/* Recent Activity */}
        <RecentActivity
          files={projectFiles}
          notes={notes ?? []}
        />

        {/* Metadata */}
        <div className="space-y-3 border-t border-surface-100 pt-4 dark:border-surface-700">
          <MetadataRow
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Created"
            value={formatDate(project.created_at)}
          />
          <MetadataRow
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Last updated"
            value={
              project.updated_at
                ? formatRelativeDate(project.updated_at)
                : formatRelativeDate(project.created_at)
            }
          />
          {project.goal_type && (
            <MetadataRow
              icon={<FolderOpen className="h-3.5 w-3.5" />}
              label="Type"
              value={project.goal_type}
            />
          )}
        </div>

        {/* Quick Actions */}
        <QuickActions onSwitchTab={onSwitchTab} />
      </div>
    </FadeIn>
  );
}

/* ── Editable Project Header ──────────────────────────────── */

function EditableProjectHeader({
  project,
}: {
  project: { id: string; name: string; description: string | null };
}) {
  const updateProject = useUpdateProject();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDesc, setEditDesc] = useState(project.description ?? '');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditName(project.name);
    setEditDesc(project.description ?? '');
  }, [project.name, project.description]);

  const saveName = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== project.name) {
      updateProject.mutate(
        { id: project.id, name: trimmed },
        { onSuccess: () => toast.success('Project name updated') }
      );
    } else {
      setEditName(project.name);
    }
    setIsEditingName(false);
  }, [editName, project, updateProject]);

  const saveDesc = useCallback(() => {
    const trimmed = editDesc.trim();
    if (trimmed !== (project.description ?? '')) {
      updateProject.mutate(
        { id: project.id, description: trimmed },
        { onSuccess: () => toast.success('Description updated') }
      );
    }
    setIsEditingDesc(false);
  }, [editDesc, project, updateProject]);

  return (
    <div>
      {/* Name */}
      {isEditingName ? (
        <div className="flex items-center gap-2">
          <input
            ref={nameInputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveName();
              if (e.key === 'Escape') {
                setEditName(project.name);
                setIsEditingName(false);
              }
            }}
            disabled={updateProject.isPending}
            autoFocus
            className="flex-1 border-b-2 border-primary-400 bg-transparent font-heading text-xl font-semibold text-surface-900 outline-none disabled:opacity-50 dark:text-surface-50"
          />
          <button
            onClick={saveName}
            disabled={updateProject.isPending}
            aria-label="Save name"
            className="flex h-6 w-6 items-center justify-center rounded text-green-600 hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-900/20"
          >
            {updateProject.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => {
              setEditName(project.name);
              setIsEditingName(false);
            }}
            disabled={updateProject.isPending}
            aria-label="Cancel editing"
            className="flex h-6 w-6 items-center justify-center rounded text-surface-400 hover:bg-surface-100 disabled:opacity-50 dark:hover:bg-surface-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="group flex items-center gap-2">
          <h1 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-50">
            {project.name}
          </h1>
          <button
            onClick={() => {
              setIsEditingName(true);
              setTimeout(() => nameInputRef.current?.focus(), 50);
            }}
            aria-label="Edit project name"
            className="flex h-6 w-6 items-center justify-center rounded text-surface-300 transition-opacity hover:bg-surface-100 hover:text-surface-500 group-hover:opacity-100 dark:hover:bg-surface-700 max-md:opacity-60 md:opacity-0"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Description */}
      {isEditingDesc ? (
        <div className="mt-2">
          <textarea
            ref={descInputRef}
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            autoFocus
            rows={2}
            disabled={updateProject.isPending}
            placeholder="Add a project description..."
            className={cn(
              'w-full resize-none rounded-lg border px-2 py-1.5 text-sm transition-colors',
              'border-surface-200 bg-white text-surface-600',
              'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              'disabled:opacity-50',
              'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300',
              'dark:focus:border-primary-400 dark:focus:ring-primary-400/20'
            )}
          />
          <div className="mt-1 flex items-center gap-1">
            <button
              onClick={saveDesc}
              disabled={updateProject.isPending}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-50 dark:hover:bg-primary-900/20"
            >
              {updateProject.isPending && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
              Save
            </button>
            <button
              onClick={() => {
                setEditDesc(project.description ?? '');
                setIsEditingDesc(false);
              }}
              disabled={updateProject.isPending}
              className="rounded px-2 py-0.5 text-[10px] font-medium text-surface-400 hover:bg-surface-100 disabled:opacity-50 dark:hover:bg-surface-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="group mt-2">
          {project.description ? (
            <p
              onClick={() => setIsEditingDesc(true)}
              className="cursor-pointer text-sm leading-relaxed text-surface-500 transition-colors hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
            >
              {project.description}
            </p>
          ) : (
            <button
              onClick={() => setIsEditingDesc(true)}
              className="text-xs text-surface-400 transition-colors hover:text-surface-600 dark:hover:text-surface-300"
            >
              + Add description
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── File Type Breakdown ──────────────────────────────────── */

function FileTypeBreakdown({
  files,
}: {
  files: { name: string; file_type: string | null }[];
}) {
  const breakdown: Record<string, number> = {};
  for (const f of files) {
    const ext = getFileExtension(f.name);
    const type = getFileTypeFromExtension(ext);
    breakdown[type] = (breakdown[type] || 0) + 1;
  }

  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const total = files.length;

  const iconMap: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-3 w-3 text-red-500" />,
    image: <FileImage className="h-3 w-3 text-blue-500" />,
    audio: <FileAudio className="h-3 w-3 text-purple-500" />,
    video: <FileVideo className="h-3 w-3 text-pink-500" />,
    document: <File className="h-3 w-3 text-amber-500" />,
    text: <FileText className="h-3 w-3 text-green-500" />,
    spreadsheet: <File className="h-3 w-3 text-emerald-500" />,
    other: <File className="h-3 w-3 text-surface-400" />,
  };

  const colorMap: Record<string, string> = {
    pdf: 'bg-red-400',
    image: 'bg-blue-400',
    audio: 'bg-purple-400',
    video: 'bg-pink-400',
    document: 'bg-amber-400',
    text: 'bg-green-400',
    spreadsheet: 'bg-emerald-400',
    other: 'bg-surface-400',
  };

  return (
    <div className="rounded-lg border border-surface-100 p-4 dark:border-surface-700">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
        File Types
      </h3>
      <div className="space-y-2">
        {entries.map(([type, count]) => (
          <div key={type} className="flex items-center gap-2">
            {iconMap[type] || iconMap.other}
            <span className="w-20 text-xs font-medium capitalize text-surface-600 dark:text-surface-300">
              {type}
            </span>
            <div className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
                <div
                  className={cn('h-full rounded-full', colorMap[type] || colorMap.other)}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            </div>
            <span className="w-6 text-right text-[10px] font-medium text-surface-500">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Recent Activity ──────────────────────────────────────── */

function RecentActivity({
  files,
  notes,
}: {
  files: { name: string; added_at: string | null; last_modified: string | null }[];
  notes: { title: string | null; last_modified: string | null; created_at: string | null }[];
}) {
  const recentFiles = [...files]
    .sort(
      (a, b) =>
        new Date(b.added_at ?? 0).getTime() -
        new Date(a.added_at ?? 0).getTime()
    )
    .slice(0, 5);

  const recentNotes = [...notes]
    .sort(
      (a, b) =>
        new Date(b.last_modified ?? b.created_at ?? 0).getTime() -
        new Date(a.last_modified ?? a.created_at ?? 0).getTime()
    )
    .slice(0, 5);

  if (recentFiles.length === 0 && recentNotes.length === 0) return null;

  return (
    <div className="rounded-lg border border-surface-100 p-4 dark:border-surface-700">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
        Recent Activity
      </h3>
      <div className="space-y-1.5">
        {recentFiles.map((f, i) => (
          <div key={`f-${i}`} className="flex items-center gap-2 text-xs">
            <Upload className="h-3 w-3 shrink-0 text-primary-400" />
            <span className="flex-1 truncate text-surface-600 dark:text-surface-300">
              {f.name}
            </span>
            <span className="shrink-0 text-[10px] text-surface-400">
              {formatRelativeDate(f.added_at)}
            </span>
          </div>
        ))}
        {recentNotes.map((n, i) => (
          <div key={`n-${i}`} className="flex items-center gap-2 text-xs">
            <NotebookPen className="h-3 w-3 shrink-0 text-accent-400" />
            <span className="flex-1 truncate text-surface-600 dark:text-surface-300">
              {n.title || 'Untitled'}
            </span>
            <span className="shrink-0 text-[10px] text-surface-400">
              {formatRelativeDate(n.last_modified ?? n.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Quick Actions ────────────────────────────────────────── */

function QuickActions({ onSwitchTab }: { onSwitchTab?: (tab: string) => void }) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !selectedProjectId) return;

      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File too large: ${file.name}`);
          continue;
        }
        try {
          await uploadFile.mutateAsync({ file, projectId: selectedProjectId });
          toast.success(`Uploaded ${file.name}`);
        } catch {
          toast.error(`Failed: ${file.name}`);
        }
      }
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [selectedProjectId, uploadFile]
  );

  // Build accept string from ACCEPTED_FILE_TYPES
  const acceptStr = Object.keys(ACCEPTED_FILE_TYPES).join(',');

  return (
    <div className="rounded-lg border border-surface-100 p-4 dark:border-surface-700">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
        Quick Actions
      </h3>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptStr}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-wrap gap-2">
        <QuickAction
          icon={<Upload className="h-3.5 w-3.5" />}
          label="Upload File"
          hint="Select files to upload"
          onClick={() => fileInputRef.current?.click()}
        />
        <QuickAction
          icon={<NotebookPen className="h-3.5 w-3.5" />}
          label="New Note"
          hint="Switch to Notes tab"
          onClick={onSwitchTab ? () => onSwitchTab('notes') : undefined}
        />
        <QuickAction
          icon={<Tag className="h-3.5 w-3.5" />}
          label="Exhibits"
          hint="Manage exhibit markers"
          onClick={onSwitchTab ? () => onSwitchTab('exhibits') : undefined}
        />
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick?: () => void;
}) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50',
        onClick && 'cursor-pointer transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20'
      )}
    >
      <span className={cn(
        'text-primary-500 dark:text-primary-400',
        onClick && 'group-hover:text-primary-600 dark:group-hover:text-primary-300'
      )}>
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium text-surface-700 dark:text-surface-200">
          {label}
        </p>
        <p className="text-[10px] text-surface-400 dark:text-surface-500">
          {hint}
        </p>
      </div>
    </Component>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'primary' | 'accent' | 'emerald';
}) {
  const styles = {
    primary: {
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      icon: 'text-primary-600 dark:text-primary-400',
    },
    accent: {
      bg: 'bg-accent-50 dark:bg-accent-900/20',
      icon: 'text-accent-600 dark:text-accent-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
  };

  const s = styles[color];

  return (
    <div className={cn('rounded-lg p-3 md:p-4', s.bg)}>
      <div className={cn('mb-1.5 md:mb-2', s.icon)}>{icon}</div>
      <p className="font-heading text-xl font-semibold text-surface-900 md:text-2xl dark:text-surface-50">
        {value}
      </p>
      <p className="text-[11px] font-medium text-surface-500 md:text-xs dark:text-surface-400">
        {label}
      </p>
    </div>
  );
}

function MetadataRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-surface-400 dark:text-surface-500">{icon}</span>
      <span className="w-24 shrink-0 font-medium text-surface-500 dark:text-surface-400">
        {label}
      </span>
      <span className="text-surface-700 dark:text-surface-300">{value}</span>
    </div>
  );
}

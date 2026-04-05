import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  Loader2,
  NotebookPen,
  Pencil,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useAppStore from '@/store';
import { useNotes } from '@/hooks/useNotes';
import { useUpdateProject } from '@/hooks/useProjects';
import { useUploadFile, useFiles } from '@/hooks/useFiles';
import { useExhibits } from '@/hooks/useExhibits';
import { useTimelineEvents } from '@/hooks/useTimeline';
import {
  formatDate,
  formatRelativeDate,
  getFileExtension,
  getFileTypeFromExtension,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
// FadeIn removed — instant render, no unnecessary animation
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectOverviewProps {
  onSwitchTab?: (tab: string) => void;
}

type MatterStageTone = 'primary' | 'amber' | 'emerald';

function getMatterStage({
  fileCount,
  noteCount,
  exhibitCount,
  processedCount,
}: {
  fileCount: number;
  noteCount: number;
  exhibitCount: number;
  processedCount: number;
}): {
  label: string;
  description: string;
  tone: MatterStageTone;
} {
  if (fileCount === 0) {
    return {
      label: 'Build the record',
      description: 'Attach core evidence.',
      tone: 'amber',
    };
  }

  if (noteCount === 0) {
    return {
      label: 'Draft the theory',
      description: 'Capture issues and leverage.',
      tone: 'primary',
    };
  }

  if (exhibitCount === 0) {
    return {
      label: 'Curate exhibits',
      description: 'Tag key records.',
      tone: 'primary',
    };
  }

  if (processedCount < fileCount) {
    return {
      label: 'Finish AI prep',
      description: 'Process remaining files.',
      tone: 'amber',
    };
  }

  return {
    label: 'Ready for briefing',
    description: 'All materials ready.',
    tone: 'emerald',
  };
}

export function ProjectOverview({ onSwitchTab }: ProjectOverviewProps = {}) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useAppStore((s) => s.projects);
  const files = useAppStore((s) => s.files);

  const project = projects.find((p) => p.id === selectedProjectId) ?? null;
  const { isLoading: filesLoading } = useFiles(selectedProjectId);
  const { data: notes, isLoading: notesLoading } = useNotes(selectedProjectId);
  const { data: exhibits } = useExhibits(selectedProjectId);
  const { data: timelineEvents } = useTimelineEvents(selectedProjectId);
  const isInitialLoad = filesLoading || notesLoading;

  const projectFiles = files.filter(
    (file) => file.project_id === selectedProjectId && !file.is_deleted
  );
  const fileCount = projectFiles.length;
  const noteCount = notes?.length ?? 0;
  const exhibitCount = exhibits?.length ?? 0;
  const processedCount = projectFiles.filter((file) => file.processing_status === 'completed').length;
  const timelineCount = timelineEvents?.length ?? 0;
  const verifiedCount = timelineEvents?.filter((e) => e.is_verified).length ?? 0;
  const stage = getMatterStage({ fileCount, noteCount, exhibitCount, processedCount });
  const readinessPercent = fileCount === 0 ? 0 : Math.round((processedCount / fileCount) * 100);

  const latestFile = useMemo(
    () =>
      [...projectFiles].sort(
        (a, b) =>
          new Date(b.last_modified ?? b.added_at ?? 0).getTime() -
          new Date(a.last_modified ?? a.added_at ?? 0).getTime()
      )[0] ?? null,
    [projectFiles]
  );

  const latestNote = useMemo(
    () =>
      [...(notes ?? [])].sort(
        (a, b) =>
          new Date(b.last_modified ?? b.created_at ?? 0).getTime() -
          new Date(a.last_modified ?? a.created_at ?? 0).getTime()
      )[0] ?? null,
    [notes]
  );

  const nextSteps = useMemo(() => {
    const items: Array<{
      title: string;
      detail: string;
      actionLabel?: string;
      action?: () => void;
    }> = [];

    if (fileCount === 0) {
      items.push({
        title: 'Attach source evidence',
        detail: 'Upload key records first.',
      });
    } else if (processedCount < fileCount) {
      items.push({
        title: 'Finish AI preparation',
        detail: `${fileCount - processedCount} file${fileCount - processedCount === 1 ? '' : 's'} still need processing.`,
      });
    }

    if (noteCount === 0) {
      items.push({
        title: 'Create a strategy note',
        detail: 'Write issues and draft position.',
        actionLabel: 'Open documents',
        action: onSwitchTab ? () => onSwitchTab('editor') : undefined,
      });
    } else {
      items.push({
        title: 'Refine the working draft',
        detail: `${noteCount} doc${noteCount === 1 ? '' : 's'} exist. Tighten into briefing.`,
        actionLabel: 'Review documents',
        action: onSwitchTab ? () => onSwitchTab('editor') : undefined,
      });
    }

    if (exhibitCount === 0) {
      items.push({
        title: 'Promote the best records to exhibits',
        detail: 'Mark strongest records as exhibits.',
        actionLabel: 'Open exhibits',
        action: onSwitchTab ? () => onSwitchTab('exhibits') : undefined,
      });
    } else {
      items.push({
        title: 'Stress-test exhibit coverage',
        detail: `${exhibitCount} exhibit${exhibitCount === 1 ? '' : 's'} marked. Check coverage.`,
        actionLabel: 'Review exhibits',
        action: onSwitchTab ? () => onSwitchTab('exhibits') : undefined,
      });
    }

    return items.slice(0, 3);
  }, [exhibitCount, fileCount, noteCount, onSwitchTab, processedCount]);

  const navigate = useNavigate();

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
          <FolderOpen className="h-5 w-5 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          No Project Selected
        </h3>
        <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          Select a project from the dashboard to view its overview.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          &larr; Back to dashboard
        </button>
      </div>
    );
  }

  // Skeleton while files/notes are loading — prevents flash of 0s
  if (isInitialLoad) {
    return (
      <div className="flex-1 overflow-y-auto bg-surface-50/60 dark:bg-surface-950/30">
        <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
          {/* Header skeleton */}
          <div className="rounded-2xl border border-surface-200/80 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
            <div className="flex gap-2">
              <div className="h-5 w-20 animate-pulse rounded-full bg-surface-100 dark:bg-surface-800" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-surface-100 dark:bg-surface-800" />
            </div>
            <div className="mt-4 h-8 w-48 animate-pulse rounded-lg bg-surface-100 dark:bg-surface-800" />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl border border-surface-200/80 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-950/40">
                  <div className="h-3 w-12 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
                  <div className="mt-3 h-7 w-8 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
                </div>
              ))}
            </div>
          </div>
          {/* Card skeletons */}
          <div className="grid gap-5 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-surface-200/80 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
                <div className="h-4 w-28 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface-50/60 @container dark:bg-surface-950/30">
      <div className="mx-auto max-w-5xl space-y-5 p-4 @lg:p-6">
        <div className="space-y-5">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900 @lg:p-6">
            <div className="min-w-0">
              <div className="flex min-w-0 max-w-full flex-wrap items-start gap-2">
                <OverviewBadge tone={stage.tone}>{stage.label}</OverviewBadge>
                <OverviewBadge tone="neutral">{readinessPercent}% indexed</OverviewBadge>
              </div>

              <div className="mt-4">
                <EditableProjectHeader project={project} />
              </div>

              <div className="mt-5 grid grid-cols-2 items-stretch gap-3 @md:grid-cols-5">
                <OverviewMetricCard
                  icon={<FileText className="h-4 w-4" />}
                  label="Files"
                  value={fileCount}
                  detail={fileCount === 1 ? 'record' : 'records'}
                />
                <OverviewMetricCard
                  icon={<NotebookPen className="h-4 w-4" />}
                  label="Docs"
                  value={noteCount}
                  detail={noteCount === 1 ? 'draft' : 'drafts'}
                  onClick={onSwitchTab ? () => onSwitchTab('editor') : undefined}
                />
                <OverviewMetricCard
                  icon={<Tag className="h-4 w-4" />}
                  label="Exhibits"
                  value={exhibitCount}
                  detail={exhibitCount === 1 ? 'marked' : 'marked'}
                  onClick={onSwitchTab ? () => onSwitchTab('exhibits') : undefined}
                />
                <OverviewMetricCard
                  icon={<Clock className="h-4 w-4" />}
                  label="Events"
                  value={timelineCount}
                  detail={verifiedCount > 0 ? `${verifiedCount} verified` : 'events'}
                  onClick={onSwitchTab ? () => onSwitchTab('timeline') : undefined}
                />
                <OverviewMetricCard
                  icon={<Sparkles className="h-4 w-4" />}
                  label="Processed"
                  value={processedCount}
                  detail={processedCount === fileCount && fileCount > 0 ? 'all indexed' : 'indexed'}
                />
              </div>

              <div className="mt-5 grid items-stretch gap-3 @md:grid-cols-2">
                <AnchorCard
                  eyebrow="Latest evidence"
                  title={latestFile?.name ?? 'No files yet'}
                  detail={
                    latestFile
                      ? `Added ${formatRelativeDate(latestFile.added_at ?? latestFile.last_modified)}`
                      : 'Upload first file.'
                  }
                  icon={<Upload className="h-4 w-4" />}
                  onClick={
                    latestFile
                      ? () => {
                          useAppStore.getState().setSelectedFile(latestFile.id);
                          useAppStore.getState().setRightPanel(true);
                          useAppStore.getState().setRightTab('viewer');
                        }
                      : undefined
                  }
                />
                <AnchorCard
                  eyebrow="Lead document"
                  title={latestNote?.title || 'No strategy document yet'}
                  detail={
                    latestNote
                      ? `Edited ${formatRelativeDate(latestNote.last_modified ?? latestNote.created_at)}`
                      : 'Start drafting.'
                  }
                  icon={<NotebookPen className="h-4 w-4" />}
                  onClick={onSwitchTab ? () => onSwitchTab('editor') : undefined}
                />
              </div>
            </div>
          </section>

          <div className="grid items-stretch gap-4 @md:grid-cols-2">
            <MatterStageCard
              stage={stage}
              readinessPercent={readinessPercent}
              processedCount={processedCount}
              fileCount={fileCount}
              exhibitCount={exhibitCount}
            />
            <QuickActions />
          </div>
        </div>

        <div className="grid items-stretch gap-4 @md:grid-cols-2">
          <NextStepsCard actions={nextSteps} />
          <RecentActivity
            files={projectFiles}
            notes={notes ?? []}
            onFileClick={(fileId) => {
              useAppStore.getState().setSelectedFile(fileId);
              useAppStore.getState().setRightPanel(true);
              useAppStore.getState().setRightTab('viewer');
            }}
            onNoteClick={onSwitchTab ? () => onSwitchTab('editor') : undefined}
          />
        </div>

        {/* Case Analysis */}
        {processedCount >= 2 && (
          <CaseAnalysisCard projectId={selectedProjectId} fileCount={processedCount} />
        )}

        {/* Highlights Summary */}
        <HighlightsSummaryCard projectId={selectedProjectId} />

        <div className="grid items-stretch gap-4 @md:grid-cols-2">
          {fileCount > 0 ? (
            <FileTypeBreakdown files={projectFiles} />
          ) : (
            <SignalEmptyState
              title="No evidence profile yet"
              description="Upload files to see breakdown."
            />
          )}
          <MatterDetailsCard
            project={project}
            processedCount={processedCount}
            fileCount={fileCount}
            noteCount={noteCount}
            exhibitCount={exhibitCount}
          />
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    setEditName(project.name);
    setEditDesc(project.description ?? '');
  }, [project.description, project.name]);

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
      {isEditingName ? (
        <div className="flex flex-col gap-2 @sm:flex-row @sm:items-center">
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
            className="min-w-0 flex-1 rounded-2xl border border-primary-300 bg-white px-3 py-2 font-heading text-2xl font-semibold tracking-tight text-surface-950 outline-none focus:ring-2 focus:ring-primary-500/25 disabled:opacity-50 dark:border-primary-700 dark:bg-surface-900 dark:text-surface-50"
          />
          <div className="flex items-center gap-2 self-end @sm:self-auto">
            <button
              onClick={saveName}
              disabled={updateProject.isPending}
              aria-label="Save name"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-900/20"
            >
              {updateProject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => {
                setEditName(project.name);
                setIsEditingName(false);
              }}
              disabled={updateProject.isPending}
              aria-label="Cancel editing"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-surface-400 hover:bg-surface-100 disabled:opacity-50 dark:hover:bg-surface-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="group flex min-w-0 items-start gap-2">
          <h1 className="min-w-0 truncate font-heading text-3xl font-semibold tracking-tight text-surface-950 dark:text-surface-50" title={project.name}>
            {project.name}
          </h1>
          <button
            onClick={() => {
              setIsEditingName(true);
              setTimeout(() => nameInputRef.current?.focus(), 50);
            }}
            aria-label="Edit project name"
            className="mt-1 flex h-7 w-7 items-center justify-center rounded-xl text-surface-300 transition-opacity hover:bg-surface-100 hover:text-surface-500 group-hover:opacity-100 dark:hover:bg-surface-700 max-md:opacity-60 md:opacity-0"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {isEditingDesc ? (
        <div className="mt-3">
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            autoFocus
            rows={3}
            disabled={updateProject.isPending}
            placeholder="Add a matter summary..."
            className={cn(
              'w-full resize-none rounded-2xl border px-3 py-2 text-sm leading-6 transition-colors',
              'border-surface-200 bg-white text-surface-700',
              'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              'disabled:opacity-50',
              'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300',
              'dark:focus:border-primary-400 dark:focus:ring-primary-400/20'
            )}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={saveDesc}
              disabled={updateProject.isPending}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
            >
              {updateProject.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Save summary
            </button>
            <button
              onClick={() => {
                setEditDesc(project.description ?? '');
                setIsEditingDesc(false);
              }}
              disabled={updateProject.isPending}
              className="rounded-xl px-3 py-1.5 text-sm font-medium text-surface-500 hover:bg-surface-100 disabled:opacity-50 dark:hover:bg-surface-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="group mt-3">
          {project.description ? (
            <p
              onClick={() => setIsEditingDesc(true)}
              className="cursor-pointer break-words text-sm leading-7 text-surface-600 transition-colors hover:text-surface-800 dark:text-surface-300 dark:hover:text-surface-100"
            >
              {project.description}
            </p>
          ) : (
            <button
              onClick={() => setIsEditingDesc(true)}
              className="text-sm text-surface-400 transition-colors hover:text-surface-600 dark:hover:text-surface-300"
            >
              + Add summary
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function OverviewBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: MatterStageTone | 'neutral';
}) {
  const toneClasses =
    tone === 'primary'
      ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-primary-300'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300'
        : tone === 'emerald'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
          : 'border-surface-200 bg-surface-50 text-surface-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400';

  return (
    <span className={cn('max-w-full truncate rounded-full border px-3 py-1 text-sm font-medium', toneClasses)} title={typeof children === 'string' ? children : undefined}>
      {children}
    </span>
  );
}

function OverviewMetricCard({
  icon,
  label,
  value,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
  onClick?: () => void;
}) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex h-full min-w-0 flex-col rounded-xl border border-surface-200/80 bg-white p-4 text-left shadow-sm dark:border-surface-800 dark:bg-surface-950/50',
        onClick && 'transition-all hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md dark:hover:border-primary-600'
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-surface-500 dark:text-surface-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-surface-950 dark:text-surface-50">
        {value}
      </p>
      <p className="mt-2 line-clamp-1 text-xs text-surface-500 dark:text-surface-400">
        {detail}
      </p>
    </Component>
  );
}

function AnchorCard({
  title,
  detail,
  onClick,
}: {
  eyebrow?: string;
  title: string;
  detail: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex h-full min-w-0 flex-col rounded-xl border border-surface-200/80 bg-white px-4 py-3 text-left dark:border-surface-800 dark:bg-surface-950/50',
        onClick && 'transition-colors hover:border-primary-300 dark:hover:border-primary-700'
      )}
    >
      <p className="line-clamp-2 text-sm font-medium text-surface-900 dark:text-surface-100">
        {title}
      </p>
      <p className="mt-1 line-clamp-1 text-xs text-surface-500 dark:text-surface-400">
        {detail}
      </p>
    </Component>
  );
}

function MatterStageCard({
  stage,
  readinessPercent,
  processedCount,
  fileCount,
  exhibitCount,
}: {
  stage: { label: string; description: string; tone: MatterStageTone };
  readinessPercent: number;
  processedCount: number;
  fileCount: number;
  exhibitCount: number;
}) {
  const toneClasses =
    stage.tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50/85 dark:border-emerald-900/50 dark:bg-emerald-950/20'
      : stage.tone === 'amber'
        ? 'border-amber-200 bg-amber-50/85 dark:border-amber-900/50 dark:bg-amber-950/20'
        : 'border-primary-200 bg-primary-50/85 dark:border-primary-900/50 dark:bg-primary-950/20';

  const barClass =
    stage.tone === 'emerald'
      ? 'bg-emerald-500'
      : stage.tone === 'amber'
        ? 'bg-amber-500'
        : 'bg-primary-500';

  return (
    <div className={cn('rounded-2xl border p-5 shadow-sm', toneClasses)}>
      <div className="flex items-center gap-2 text-sm font-medium text-surface-500 dark:text-surface-400">
        <ShieldCheck className="h-4 w-4" />
        Status
      </div>
      <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-surface-950 dark:text-surface-50">
        {stage.label}
      </h3>
      <p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-300">
        {stage.description}
      </p>

      <div className="mt-5 rounded-xl border border-white/60 bg-surface-50 p-4 dark:border-white/5 dark:bg-surface-950/35">
        <div className="flex flex-col gap-1 text-xs text-surface-500 dark:text-surface-400 sm:flex-row sm:items-center sm:justify-between">
          <span>indexed coverage</span>
          <span>{readinessPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
          <div className={cn('h-full rounded-full transition-all', barClass)} style={{ width: `${readinessPercent}%` }} />
        </div>
      </div>
    </div>
  );
}

function NextStepsCard({
  actions,
}: {
  actions: Array<{
    title: string;
    detail: string;
    actionLabel?: string;
    action?: () => void;
  }>;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-surface-200/80 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center gap-2 text-sm font-medium text-surface-500 dark:text-surface-500">
        <Sparkles className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Next steps
      </div>
      <div className="mt-4 flex flex-1 flex-col space-y-3">
        {actions.map((action) => (
          <div key={action.title} className="flex flex-col rounded-xl border border-surface-200/80 bg-surface-50/75 p-4 dark:border-surface-800 dark:bg-surface-950/35">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {action.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-surface-500 dark:text-surface-400">
              {action.detail}
            </p>
            {action.action && action.actionLabel && (
              <button
                onClick={action.action}
                className="mt-auto inline-flex items-center gap-1.5 self-start rounded-xl px-3 py-2 pt-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
              >
                {action.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FileTypeBreakdown({
  files,
}: {
  files: { name: string; file_type: string | null }[];
}) {
  const breakdown: Record<string, number> = {};
  for (const file of files) {
    const ext = getFileExtension(file.name);
    const type = getFileTypeFromExtension(ext);
    breakdown[type] = (breakdown[type] || 0) + 1;
  }

  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const total = files.length;

  const iconMap: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-3.5 w-3.5 text-red-500" />,
    image: <FileImage className="h-3.5 w-3.5 text-blue-500" />,
    audio: <FileAudio className="h-3.5 w-3.5 text-violet-500" />,
    video: <FileVideo className="h-3.5 w-3.5 text-pink-500" />,
    document: <File className="h-3.5 w-3.5 text-amber-500" />,
    text: <FileText className="h-3.5 w-3.5 text-emerald-500" />,
    spreadsheet: <File className="h-3.5 w-3.5 text-green-500" />,
    other: <File className="h-3.5 w-3.5 text-surface-400" />,
  };

  const barMap: Record<string, string> = {
    pdf: 'bg-red-500',
    image: 'bg-blue-500',
    audio: 'bg-violet-500',
    video: 'bg-pink-500',
    document: 'bg-amber-500',
    text: 'bg-emerald-500',
    spreadsheet: 'bg-green-500',
    other: 'bg-surface-400',
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-surface-200/80 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center gap-2 text-sm font-medium text-surface-500 dark:text-surface-500">
        <FileText className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Evidence profile
      </div>
      <div className="mt-4 flex-1 space-y-3">
        {entries.map(([type, count]) => (
          <div key={type} className="rounded-xl border border-surface-200/80 bg-surface-50/75 p-4 dark:border-surface-800 dark:bg-surface-950/35">
            <div className="flex items-center gap-2">
              {iconMap[type] || iconMap.other}
              <span className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-surface-700 dark:text-surface-200" title={type}>
                {type}
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500">
                {count}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
              <div
                className={cn('h-full rounded-full', barMap[type] || barMap.other)}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({
  files,
  notes,
  onFileClick,
  onNoteClick,
}: {
  files: { id: string; name: string; added_at: string | null; last_modified: string | null }[];
  notes: { id: string; title: string | null; last_modified: string | null; created_at: string | null }[];
  onFileClick?: (fileId: string) => void;
  onNoteClick?: () => void;
}) {
  const items = [
    ...files.map((file) => ({
      id: `file-${file.id}`,
      label: file.name,
      meta: formatRelativeDate(file.added_at ?? file.last_modified),
      kind: 'Evidence added',
      icon: <Upload className="h-3.5 w-3.5 text-primary-500 dark:text-primary-400" />,
      onClick: () => onFileClick?.(file.id),
      timestamp: new Date(file.added_at ?? file.last_modified ?? 0).getTime(),
    })),
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      label: note.title || 'Untitled',
      meta: formatRelativeDate(note.last_modified ?? note.created_at),
      kind: 'Document updated',
      icon: <NotebookPen className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />,
      onClick: () => onNoteClick?.(),
      timestamp: new Date(note.last_modified ?? note.created_at ?? 0).getTime(),
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);

  if (items.length === 0) {
    return (
      <SignalEmptyState
        title="No recent activity yet"
        description="As files and drafting work appear, the overview will turn into a live matter timeline."
      />
    );
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-surface-200/80 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center gap-2 text-sm font-medium text-surface-500 dark:text-surface-500">
        <Clock className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Recent activity
      </div>
      <div className="mt-4 flex-1 space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="flex w-full flex-col gap-2 rounded-xl border border-surface-200/80 bg-surface-50/75 px-4 py-3 text-left transition-colors hover:border-primary-300 dark:border-surface-800 dark:bg-surface-950/35 dark:hover:border-primary-700 sm:flex-row sm:items-start"
          >
            <span className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 shrink-0">{item.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-surface-400 dark:text-surface-500" title={item.kind}>
                  {item.kind}
                </span>
                <span className="mt-1 block truncate text-sm font-medium text-surface-800 dark:text-surface-100" title={item.label}>
                  {item.label}
                </span>
              </span>
            </span>
            <span className="pl-7 text-xs text-surface-400 dark:text-surface-500 sm:shrink-0 sm:pl-0">
              {item.meta}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MatterDetailsCard({
  project,
}: {
  project: {
    created_at: string | null;
    updated_at: string | null;
    goal_type: string | null;
  };
  processedCount: number;
  fileCount: number;
  noteCount: number;
  exhibitCount: number;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-surface-200/80 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center gap-2 text-sm font-medium text-surface-500 dark:text-surface-500">
        <FolderOpen className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Matter details
      </div>
      <div className="mt-4 space-y-2 text-sm text-surface-600 dark:text-surface-300">
        <p>
          <span className="font-medium text-surface-500 dark:text-surface-400">Created:</span>{' '}
          {formatDate(project.created_at)}
          <span className="mx-2 text-surface-300 dark:text-surface-600">&middot;</span>
          <span className="font-medium text-surface-500 dark:text-surface-400">Updated:</span>{' '}
          {formatRelativeDate(project.updated_at ?? project.created_at)}
        </p>
        <p>
          <span className="font-medium text-surface-500 dark:text-surface-400">Type:</span>{' '}
          {project.goal_type ?? 'General matter'}
        </p>
      </div>
    </div>
  );
}


function SignalEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-dashed border-surface-300 bg-white p-6 text-center shadow-sm dark:border-surface-700 dark:bg-surface-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
        <FileText className="h-5 w-5 text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
        {title}
      </h3>
      <p className="mt-1.5 break-words text-xs leading-relaxed text-surface-500 dark:text-surface-400">
        {description}
      </p>
    </div>
  );
}

function QuickActions() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { isDemoMode } = useAuth();
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
      e.target.value = '';
    },
    [selectedProjectId, uploadFile]
  );

  const acceptStr = Object.keys(ACCEPTED_FILE_TYPES).join(',');

  return (
    <div className="rounded-2xl border border-surface-200/80 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptStr}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-2 text-sm font-medium text-surface-500 dark:text-surface-500">
        <Upload className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Quick actions
      </div>

      <button
        onClick={() => {
          if (!isDemoMode) fileInputRef.current?.click();
        }}
        className={cn(
          'mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
          isDemoMode
            ? 'cursor-not-allowed border border-surface-200 bg-surface-100 text-surface-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-500'
            : 'bg-surface-950 text-white hover:-translate-y-0.5 hover:bg-surface-800 dark:bg-white dark:text-surface-950 dark:hover:bg-surface-100'
        )}
        disabled={isDemoMode}
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">{isDemoMode ? 'Uploads require sign-in' : 'Upload files'}</span>
      </button>

      <div className="mt-4 rounded-xl border border-surface-200/80 bg-surface-50/75 p-4 text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-950/35 dark:text-surface-400">
        {isDemoMode
          ? 'Demo: view, draft, and manage exhibits.'
          : ''}
      </div>
    </div>
  );
}

/**
 * Case Analysis Card — AI-powered structured case theory generation.
 * Analyzes all processed files to produce a comprehensive case assessment.
 */
function CaseAnalysisCard({
  projectId,
  fileCount,
}: {
  projectId: string | null;
  fileCount: number;
}) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [analyzedFileCount, setAnalyzedFileCount] = useState<number>(0);

  // Detect if analysis is stale (more files now than when last analyzed)
  const isStale = analysis && !analysisError && analyzedFileCount > 0 && fileCount > analyzedFileCount;

  const handleAnalyze = useCallback(async () => {
    if (!projectId || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    setAnalysisError(false);

    try {
      const { supabase } = await import('@/lib/supabase');

      // Fetch all processed files with summaries and extracted text
      const { data: files } = await supabase
        .from('files')
        .select('name, file_type, document_type, ai_summary, extracted_text')
        .eq('project_id', projectId)
        .eq('processing_status', 'completed')
        .is('is_deleted', false);

      if (!files || files.length === 0) {
        setAnalysis('No processed files available for analysis.');
        return;
      }

      // Build evidence summary — use ai_summary for all files, full text only for top 3
      const evidenceSummary = files.map((f, i) => {
        const docType = f.document_type ? ` [${f.document_type.replace(/_/g, ' ')}]` : '';
        const text = i < 3 && f.extracted_text
          ? f.extracted_text.slice(0, 1500)
          : f.ai_summary || 'No content available';
        return `=== ${f.name}${docType} ===\n${text}`;
      }).join('\n\n');

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      // Send to AI with structured case analysis prompt
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: `You are analyzing a legal case file containing ${files.length} documents. Produce a structured case analysis with these sections:

## Parties & Roles
Identify all parties mentioned across the documents and their roles (plaintiff, defendant, employer, employee, regulatory body, etc.)

## Key Facts
List the most important facts established by the documentary evidence, in chronological order. Cite which document each fact comes from.

## Timeline
A concise chronological timeline of key events with dates.

## Legal Issues
Identify the legal issues raised by the facts (e.g., wrongful dismissal, human rights violation, breach of contract, etc.)

## Strengths
What aspects of the evidence are strongest? What facts/documents support the case?

## Weaknesses & Risks
What gaps exist in the evidence? What could the opposing side argue? What are the litigation risks?

## Recommended Next Steps
Based on the evidence, what should be done next? (e.g., obtain missing documents, file a specific motion, seek a specific remedy)

Base your analysis ONLY on the documents provided. Do not fabricate facts. If information is unclear, say so.`,
          caseContext: evidenceSummary,
          effortLevel: 'deep',
          legalContext: '',
        }),
      });

      if (!response.ok) throw new Error('Analysis request failed');

      const result = await response.json();
      setAnalysis(result.response);
      setAnalyzedFileCount(files.length);
      setExpanded(true);
    } catch (err) {
      setAnalysisError(true);
      setAnalysis(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, isAnalyzing]);

  const handleCopy = useCallback(() => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [analysis]);

  return (
    <div className="rounded-2xl border border-surface-200/80 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-200">
              Case Analysis
            </h3>
            <p className="text-xs text-surface-400 dark:text-surface-500">
              {analyzedFileCount > 0 && analysis && !analysisError
                ? `Analyzed ${analyzedFileCount} of ${fileCount} document${fileCount !== 1 ? 's' : ''}`
                : `AI-powered assessment across ${fileCount} document${fileCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button
          onClick={analysis && !analysisError ? () => setExpanded(!expanded) : handleAnalyze}
          disabled={isAnalyzing}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all min-h-[36px]',
            isAnalyzing
              ? 'bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500'
              : analysis && !analysisError
                ? 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
                : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
          )}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing...
            </>
          ) : analysis && !analysisError ? (
            expanded ? 'Collapse' : 'Expand'
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {analysisError ? 'Retry Analysis' : 'Analyze Case'}
            </>
          )}
        </button>
      </div>

      {/* Skeleton loading state */}
      {isAnalyzing && (
        <div className="mt-4 rounded-2xl border border-surface-100 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-32 rounded bg-purple-100 dark:bg-purple-900/30" />
            <div className="h-3 w-full rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-3 w-5/6 rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-3 w-4/6 rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-4 w-28 mt-2 rounded bg-purple-100 dark:bg-purple-900/30" />
            <div className="h-3 w-full rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-3 w-3/4 rounded bg-surface-200 dark:bg-surface-700" />
          </div>
          <p className="mt-3 text-xs text-surface-400 dark:text-surface-500">
            Deep analysis in progress. This may take 15-30 seconds...
          </p>
        </div>
      )}

      {/* Error state */}
      {analysisError && analysis && !isAnalyzing && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Analysis failed</p>
              <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">{analysis}</p>
              <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                Check your connection and try again, or ensure files are processed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success state with animated expand */}
      <AnimatePresence initial={false}>
        {expanded && analysis && !analysisError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl border border-surface-100 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
              {/* Staleness warning */}
              {isStale && (
                <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {fileCount - analyzedFileCount} new file{fileCount - analyzedFileCount !== 1 ? 's' : ''} added since last analysis
                    </p>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="shrink-0 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
                  >
                    Re-analyze
                  </button>
                </div>
              )}
              <div className="prose-chat max-h-[500px] overflow-y-auto text-sm leading-relaxed text-surface-700 dark:text-surface-200">
                <AnalysisRenderer content={analysis} />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleAnalyze}
                  className="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                >
                  Re-analyze
                </button>
                <button
                  onClick={handleCopy}
                  className="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                >
                  {copied ? 'Copied' : 'Copy to clipboard'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Simple markdown-ish renderer for analysis text */
function AnalysisRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="mb-2 mt-4 font-heading text-sm font-bold text-surface-800 dark:text-surface-100 first:mt-0">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="mb-1 mt-3 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className="ml-4 list-disc text-[13px]">{line.slice(2)}</li>;
        }
        if (line.match(/^\d+\.\s/)) {
          return <li key={i} className="ml-4 list-decimal text-[13px]">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="mb-1 font-semibold text-[13px]">{line.slice(2, -2)}</p>;
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return <p key={i} className="mb-1 text-[13px]">{line}</p>;
      })}
    </div>
  );
}

/** Highlights summary card on the overview — shows annotation count across all files. */
function HighlightsSummaryCard({ projectId }: { projectId: string | null }) {
  const [highlights, setHighlights] = useState<Array<{ selected_text: string | null; comment: string | null; color: string | null; page_number: number; file_name?: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    import('@/lib/supabase').then(({ supabase }) => {
      supabase
        .from('pdf_annotations')
        .select('selected_text, comment, color, page_number')
        .eq('project_id', projectId)
        .not('selected_text', 'is', null)
        .order('page_number')
        .then(({ data }) => {
          setHighlights((data ?? []) as typeof highlights);
          setLoading(false);
        });
    });
  }, [projectId]);

  if (loading || highlights.length === 0) return null;

  const handleCopyAll = () => {
    const md = highlights.map((h) => {
      let line = `> ${h.selected_text}`;
      if (h.comment) line += `\n**Note:** ${h.comment}`;
      return line;
    }).join('\n\n---\n\n');
    navigator.clipboard.writeText(md).catch(() => {});
  };

  return (
    <div className="rounded-2xl border border-surface-200/80 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
            <Tag className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-200">
              Highlights
            </h3>
            <p className="text-xs text-surface-400 dark:text-surface-500">
              {highlights.length} passage{highlights.length !== 1 ? 's' : ''} highlighted across your files
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 rounded-full bg-surface-100 px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
        >
          Copy all
        </button>
      </div>

      {/* Preview of recent highlights */}
      <div className="mt-3 space-y-2">
        {highlights.slice(0, 3).map((h, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-800/50">
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: h.color ?? '#FFEB3B' }} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs text-surface-600 dark:text-surface-300">"{h.selected_text}"</p>
              {h.comment && (
                <p className="mt-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">{h.comment}</p>
              )}
            </div>
          </div>
        ))}
        {highlights.length > 3 && (
          <p className="text-center text-xs text-surface-400">+{highlights.length - 3} more</p>
        )}
      </div>
    </div>
  );
}

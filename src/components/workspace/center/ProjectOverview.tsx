import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
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
import { toast } from 'sonner';
import useAppStore from '@/store';
import { useNotes } from '@/hooks/useNotes';
import { useUpdateProject } from '@/hooks/useProjects';
import { useUploadFile } from '@/hooks/useFiles';
import { useExhibits } from '@/hooks/useExhibits';
import {
  formatDate,
  formatRelativeDate,
  getFileExtension,
  getFileTypeFromExtension,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/shared/FadeIn';
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
      description: 'Start by attaching the core evidence that anchors the matter.',
      tone: 'amber',
    };
  }

  if (noteCount === 0) {
    return {
      label: 'Draft the theory',
      description: 'Evidence is present. Capture issues, leverage points, and your working position.',
      tone: 'primary',
    };
  }

  if (exhibitCount === 0) {
    return {
      label: 'Curate exhibits',
      description: 'Tag the strongest records so the file is ready for briefing and drafting.',
      tone: 'primary',
    };
  }

  if (processedCount < fileCount) {
    return {
      label: 'Finish AI prep',
      description: 'A few records still need processing before the AI lane is fully ready.',
      tone: 'amber',
    };
  }

  return {
    label: 'Ready for briefing',
    description: 'The matter has evidence, working drafts, exhibits, and processed material in place.',
    tone: 'emerald',
  };
}

export function ProjectOverview({ onSwitchTab }: ProjectOverviewProps = {}) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useAppStore((s) => s.projects);
  const files = useAppStore((s) => s.files);

  const project = projects.find((p) => p.id === selectedProjectId) ?? null;
  const { data: notes } = useNotes(selectedProjectId);
  const { data: exhibits } = useExhibits(selectedProjectId);

  const projectFiles = files.filter(
    (file) => file.project_id === selectedProjectId && !file.is_deleted
  );
  const fileCount = projectFiles.length;
  const noteCount = notes?.length ?? 0;
  const exhibitCount = exhibits?.length ?? 0;
  const processedCount = projectFiles.filter((file) => file.processing_status === 'completed').length;
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
        detail: 'Upload the key records that define the matter before drafting against assumptions.',
      });
    } else if (processedCount < fileCount) {
      items.push({
        title: 'Finish AI preparation',
        detail: `${fileCount - processedCount} file${fileCount - processedCount === 1 ? '' : 's'} still need processing for stronger search and reasoning coverage.`,
      });
    }

    if (noteCount === 0) {
      items.push({
        title: 'Create a strategy note',
        detail: 'Open the documents lane and write the issues, leverage points, and draft position.',
        actionLabel: 'Open documents',
        action: onSwitchTab ? () => onSwitchTab('editor') : undefined,
      });
    } else {
      items.push({
        title: 'Refine the working draft',
        detail: `${noteCount} document${noteCount === 1 ? '' : 's'} already exist. Tighten the lead note into a clear briefing or demand structure.`,
        actionLabel: 'Review documents',
        action: onSwitchTab ? () => onSwitchTab('editor') : undefined,
      });
    }

    if (exhibitCount === 0) {
      items.push({
        title: 'Promote the best records to exhibits',
        detail: 'Mark the strongest records so they stay visible when you move into briefing and drafting.',
        actionLabel: 'Open exhibits',
        action: onSwitchTab ? () => onSwitchTab('exhibits') : undefined,
      });
    } else {
      items.push({
        title: 'Stress-test exhibit coverage',
        detail: `${exhibitCount} exhibit${exhibitCount === 1 ? '' : 's'} already marked. Check whether the key timeline and damages records are represented.`,
        actionLabel: 'Review exhibits',
        action: onSwitchTab ? () => onSwitchTab('exhibits') : undefined,
      });
    }

    return items.slice(0, 3);
  }, [exhibitCount, fileCount, noteCount, onSwitchTab, processedCount]);

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
    <FadeIn className="flex-1 overflow-y-auto bg-surface-50/60 dark:bg-surface-950/30">
      <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
        <div className="grid gap-5 2xl:grid-cols-[1.6fr_0.85fr]">
          <section className="relative min-w-0 overflow-hidden rounded-[28px] border border-surface-200/80 bg-white/90 p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900/78 md:p-7">
            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(77,99,121,0.11),rgba(255,255,255,0)_44%,rgba(135,95,51,0.07))] dark:bg-[linear-gradient(140deg,rgba(77,99,121,0.2),rgba(9,9,11,0)_44%,rgba(165,116,63,0.08))]" />
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-white/80 blur-3xl dark:bg-primary-400/8" />

            <div className="relative min-w-0">
              <div className="flex min-w-0 max-w-full flex-wrap items-start gap-2">
                <OverviewBadge tone="neutral">{project.goal_type ?? 'Matter overview'}</OverviewBadge>
                <OverviewBadge tone={stage.tone}>{stage.label}</OverviewBadge>
                <OverviewBadge tone="neutral">{readinessPercent}% AI-ready</OverviewBadge>
              </div>

              <div className="mt-4">
                <EditableProjectHeader project={project} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                <OverviewMetricCard
                  icon={<FileText className="h-4 w-4" />}
                  label="Files"
                  value={fileCount}
                  detail={fileCount === 1 ? 'record attached' : 'records attached'}
                />
                <OverviewMetricCard
                  icon={<NotebookPen className="h-4 w-4" />}
                  label="Documents"
                  value={noteCount}
                  detail={noteCount === 1 ? 'working draft' : 'working drafts'}
                  onClick={onSwitchTab ? () => onSwitchTab('editor') : undefined}
                />
                <OverviewMetricCard
                  icon={<Tag className="h-4 w-4" />}
                  label="Exhibits"
                  value={exhibitCount}
                  detail={exhibitCount === 1 ? 'marked exhibit' : 'marked exhibits'}
                  onClick={onSwitchTab ? () => onSwitchTab('exhibits') : undefined}
                />
                <OverviewMetricCard
                  icon={<Sparkles className="h-4 w-4" />}
                  label="Processed"
                  value={processedCount}
                  detail={processedCount === fileCount && fileCount > 0 ? 'all indexed' : 'AI-search ready'}
                />
              </div>

              <div className="mt-6 grid gap-3 2xl:grid-cols-2">
                <AnchorCard
                  eyebrow="Latest evidence"
                  title={latestFile?.name ?? 'No files yet'}
                  detail={
                    latestFile
                      ? `Added ${formatRelativeDate(latestFile.added_at ?? latestFile.last_modified)}`
                      : 'Attach the first source record to anchor the matter.'
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
                      : 'Open the documents tab to capture issues, risks, and next moves.'
                  }
                  icon={<NotebookPen className="h-4 w-4" />}
                  onClick={onSwitchTab ? () => onSwitchTab('editor') : undefined}
                />
              </div>
            </div>
          </section>

          <div className="min-w-0 space-y-5">
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

        <div className="grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
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

        <div className="grid gap-5 2xl:grid-cols-[0.95fr_1.05fr]">
          {fileCount > 0 ? (
            <FileTypeBreakdown files={projectFiles} />
          ) : (
            <SignalEmptyState
              title="No evidence profile yet"
              description="Once source files are attached, Clarity Hub will show the evidence mix and processing coverage here."
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
    </FadeIn>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
            className="min-w-0 flex-1 rounded-2xl border border-primary-300 bg-white/90 px-3 py-2 font-heading text-2xl font-semibold tracking-tight text-surface-950 outline-none focus:ring-2 focus:ring-primary-500/25 disabled:opacity-50 dark:border-primary-700 dark:bg-surface-900 dark:text-surface-50"
          />
          <div className="flex items-center gap-2 self-end sm:self-auto">
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
          <h1 className="min-w-0 truncate font-heading text-3xl font-semibold tracking-tight text-surface-950 dark:text-surface-50">
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
              'border-surface-200 bg-white/90 text-surface-700',
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
              className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
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
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-surface-500 hover:bg-surface-100 disabled:opacity-50 dark:hover:bg-surface-700"
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
              + Add a short matter summary
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
          : 'border-surface-200 bg-white/80 text-surface-500 dark:border-surface-700 dark:bg-surface-900/60 dark:text-surface-400';

  return (
    <span className={cn('max-w-full truncate rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', toneClasses)}>
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
        'min-w-0 rounded-[22px] border border-surface-200/80 bg-white/78 p-4 text-left shadow-sm dark:border-surface-800 dark:bg-surface-950/45',
        onClick && 'transition-all hover:-translate-y-0.5 hover:border-primary-300 dark:hover:border-primary-700'
      )}
    >
      <div className="flex flex-nowrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-400 dark:text-surface-500">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-3 truncate font-heading text-3xl font-semibold tracking-tight text-surface-950 dark:text-surface-50">
        {value}
      </p>
      <p className="mt-2 truncate text-xs text-surface-500 dark:text-surface-400">
        {detail}
      </p>
    </Component>
  );
}

function AnchorCard({
  eyebrow,
  title,
  detail,
  icon,
  onClick,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'min-w-0 rounded-[22px] border border-surface-200/80 bg-white/76 p-4 text-left shadow-sm dark:border-surface-800 dark:bg-surface-950/45',
        onClick && 'transition-all hover:-translate-y-0.5 hover:border-primary-300 dark:hover:border-primary-700'
      )}
    >
      <div className="flex flex-nowrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-400 dark:text-surface-500">
        <span className="shrink-0 text-primary-500 dark:text-primary-400">{icon}</span>
        <span className="truncate">{eyebrow}</span>
      </div>
      <p className="mt-3 truncate font-heading text-lg font-semibold tracking-tight text-surface-950 dark:text-surface-50">
        {title}
      </p>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
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
    <div className={cn('rounded-[28px] border p-5 shadow-sm', toneClasses)}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400">
        <ShieldCheck className="h-4 w-4" />
        Matter posture
      </div>
      <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-surface-950 dark:text-surface-50">
        {stage.label}
      </h3>
      <p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-300">
        {stage.description}
      </p>

      <div className="mt-5 rounded-[22px] border border-white/60 bg-white/70 p-4 dark:border-white/5 dark:bg-surface-950/35">
        <div className="flex flex-col gap-1 text-xs text-surface-500 dark:text-surface-400 sm:flex-row sm:items-center sm:justify-between">
          <span>AI-ready coverage</span>
          <span>{readinessPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
          <div className={cn('h-full rounded-full transition-all', barClass)} style={{ width: `${readinessPercent}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-surface-500 dark:text-surface-400 sm:grid-cols-2">
          <div className="rounded-2xl bg-surface-100/80 px-3 py-3 dark:bg-surface-900/60">
            <p className="font-medium text-surface-700 dark:text-surface-200">{processedCount}/{fileCount || 0}</p>
            <p className="mt-1">processed records</p>
          </div>
          <div className="rounded-2xl bg-surface-100/80 px-3 py-3 dark:bg-surface-900/60">
            <p className="font-medium text-surface-700 dark:text-surface-200">{exhibitCount}</p>
            <p className="mt-1">marked exhibits</p>
          </div>
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
    <div className="rounded-[28px] border border-surface-200/80 bg-white/88 p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900/76">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400 dark:text-surface-500">
        <Sparkles className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Next steps
      </div>
      <div className="mt-4 space-y-3">
        {actions.map((action) => (
          <div key={action.title} className="rounded-[22px] border border-surface-200/80 bg-surface-50/75 p-4 dark:border-surface-800 dark:bg-surface-950/35">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-500 dark:text-primary-400" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-100">
                  {action.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-surface-500 dark:text-surface-400">
                  {action.detail}
                </p>
                {action.action && action.actionLabel && (
                  <button
                    onClick={action.action}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
                  >
                    {action.actionLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
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
    <div className="rounded-[28px] border border-surface-200/80 bg-white/88 p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900/76">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400 dark:text-surface-500">
        <FileText className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Evidence profile
      </div>
      <div className="mt-4 space-y-3">
        {entries.map(([type, count]) => (
          <div key={type} className="rounded-[22px] border border-surface-200/80 bg-surface-50/75 p-4 dark:border-surface-800 dark:bg-surface-950/35">
            <div className="flex items-center gap-2">
              {iconMap[type] || iconMap.other}
              <span className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-surface-700 dark:text-surface-200">
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
    <div className="rounded-[28px] border border-surface-200/80 bg-white/88 p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900/76">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400 dark:text-surface-500">
        <Clock className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Recent activity
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="flex w-full flex-col gap-2 rounded-[22px] border border-surface-200/80 bg-surface-50/75 px-4 py-3 text-left transition-colors hover:border-primary-300 dark:border-surface-800 dark:bg-surface-950/35 dark:hover:border-primary-700 sm:flex-row sm:items-start"
          >
            <span className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 shrink-0">{item.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-400 dark:text-surface-500">
                  {item.kind}
                </span>
                <span className="mt-1 block truncate text-sm font-medium text-surface-800 dark:text-surface-100">
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
  processedCount,
  fileCount,
  noteCount,
  exhibitCount,
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
    <div className="rounded-[28px] border border-surface-200/80 bg-white/88 p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900/76">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400 dark:text-surface-500">
        <FolderOpen className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Matter details
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <DetailCard label="Created" value={formatDate(project.created_at)} icon={<Calendar className="h-4 w-4" />} />
        <DetailCard
          label="Last updated"
          value={formatRelativeDate(project.updated_at ?? project.created_at)}
          icon={<Clock className="h-4 w-4" />}
        />
        <DetailCard label="Type" value={project.goal_type ?? 'General matter'} icon={<ShieldCheck className="h-4 w-4" />} />
        <DetailCard
          label="Coverage"
          value={`${processedCount}/${fileCount || 0} processed`}
          icon={<Sparkles className="h-4 w-4" />}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniSignal label="Files" value={fileCount} />
        <MiniSignal label="Drafts" value={noteCount} />
        <MiniSignal label="Exhibits" value={exhibitCount} />
      </div>
    </div>
  );
}

function DetailCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-surface-200/80 bg-surface-50/75 p-4 dark:border-surface-800 dark:bg-surface-950/35">
      <div className="flex flex-nowrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-400 dark:text-surface-500">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-3 truncate text-sm font-medium text-surface-800 dark:text-surface-100">
        {value}
      </p>
    </div>
  );
}

function MiniSignal({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[22px] border border-surface-200/80 bg-surface-50/75 p-4 text-center dark:border-surface-800 dark:bg-surface-950/35">
      <p className="font-heading text-2xl font-semibold text-surface-950 dark:text-surface-50">
        {value}
      </p>
      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
        {label}
      </p>
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
    <div className="rounded-[28px] border border-dashed border-surface-300 bg-white/82 p-6 text-center shadow-sm dark:border-surface-700 dark:bg-surface-900/60">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
        <FileText className="h-5 w-5 text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
        {title}
      </h3>
      <p className="mt-2 break-words text-sm leading-6 text-surface-500 dark:text-surface-400">
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
    <div className="rounded-[28px] border border-surface-200/80 bg-white/88 p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900/76">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptStr}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400 dark:text-surface-500">
        <Upload className="h-4 w-4 text-primary-500 dark:text-primary-400" />
        Intake lane
      </div>
      <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-surface-950 dark:text-surface-50">
        Keep the matter moving.
      </h3>
      <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
        Bring in evidence when the record is still thin, or use the existing drafts and exhibits to push deeper into briefing.
      </p>

      <button
        onClick={() => {
          if (!isDemoMode) fileInputRef.current?.click();
        }}
        className={cn(
          'mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
          isDemoMode
            ? 'cursor-not-allowed border border-surface-200 bg-surface-100 text-surface-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-500'
            : 'bg-surface-950 text-white hover:-translate-y-0.5 hover:bg-surface-800 dark:bg-white dark:text-surface-950 dark:hover:bg-surface-100'
        )}
        disabled={isDemoMode}
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">{isDemoMode ? 'Uploads require sign-in' : 'Upload files'}</span>
      </button>

      <div className="mt-4 rounded-[22px] border border-surface-200/80 bg-surface-50/75 p-4 text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-950/35 dark:text-surface-400">
        {isDemoMode
          ? 'Demo mode is read-only for ingestion. The seeded record still supports viewing, drafting, and exhibit management.'
          : 'Accepted formats include PDFs, documents, images, audio, video, and plain text.'}
      </div>
    </div>
  );
}

import { FolderOpen, FileText, NotebookPen, Clock, Calendar } from 'lucide-react';
import useAppStore from '@/store';
import { useNotes } from '@/hooks/useNotes';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { FadeIn } from '@/components/shared/FadeIn';

export function ProjectOverview() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useAppStore((s) => s.projects);
  const files = useAppStore((s) => s.files);

  const project = projects.find((p) => p.id === selectedProjectId) ?? null;
  const { data: notes } = useNotes(selectedProjectId);

  const fileCount = files.filter(
    (f) => f.project_id === selectedProjectId && !f.is_deleted
  ).length;
  const noteCount = notes?.length ?? 0;

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
    <FadeIn className="flex flex-col gap-6 p-6">
      {/* Project header */}
      <div>
        <h1 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-50">
          {project.name}
        </h1>
        {project.description && (
          <p className="mt-2 text-sm leading-relaxed text-surface-500 dark:text-surface-400">
            {project.description}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
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
      </div>

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
    </FadeIn>
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
  color: 'primary' | 'accent';
}) {
  const bg = color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-accent-50 dark:bg-accent-900/20';
  const iconColor = color === 'primary' ? 'text-primary-600 dark:text-primary-400' : 'text-accent-600 dark:text-accent-400';

  return (
    <div className={`rounded-lg ${bg} p-4`}>
      <div className={`${iconColor} mb-2`}>{icon}</div>
      <p className="font-heading text-2xl font-semibold text-surface-900 dark:text-surface-50">
        {value}
      </p>
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{label}</p>
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

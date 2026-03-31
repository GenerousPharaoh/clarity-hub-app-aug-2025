import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  Briefcase,
  Clock3,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Scale,
  Search,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FadeIn } from '@/components/shared/FadeIn';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProjectCard } from './ProjectCard';
import { CreateProjectDialog } from './CreateProjectDialog';
import {
  useProjects,
  useProjectFileCounts,
  useCreateProject,
  useDeleteProject,
} from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import { readWorkspaceSession } from '@/lib/workspaceSession';

function getFirstName(user: { user_metadata?: Record<string, unknown>; email?: string } | null): string {
  if (!user) return '';
  const fullName = user.user_metadata?.full_name as string | undefined;
  if (fullName) return fullName.split(' ')[0];
  const email = user.email ?? '';
  return email.split('@')[0];
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white/85 p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900/70">
      <div className="h-1.5 w-24 animate-pulse rounded-full bg-surface-100 dark:bg-surface-800" />
      <div className="mt-5 flex items-start gap-3">
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="h-3 w-full animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="h-16 animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800" />
        <div className="h-16 animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projects, isLoading, isFetching, error } = useProjects();
  const { data: fileCounts } = useProjectFileCounts();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectQuery, setProjectQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'files'>('recent');

  useDocumentTitle('Dashboard');

  const firstName = getFirstName(user);
  const hasProjects = (projects?.length ?? 0) > 0;
  const workspaceSession = readWorkspaceSession();
  const resumeProject =
    workspaceSession && projects
      ? projects.find((project) => project.id === workspaceSession.projectId) ?? null
      : null;

  const totalFiles = useMemo(
    () => Object.values(fileCounts ?? {}).reduce((sum, count) => sum + count, 0),
    [fileCounts]
  );

  const recentUpdate = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    return [...projects].sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
        new Date(a.updated_at ?? a.created_at ?? 0).getTime()
    )[0];
  }, [projects]);

  const visibleProjects = useMemo(() => {
    const query = projectQuery.trim().toLowerCase();
    const filtered = (projects ?? []).filter((project) => {
      if (!query) return true;
      return (
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase()?.includes(query) === true ||
        project.goal_type?.toLowerCase()?.includes(query) === true
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'files') {
        return (fileCounts?.[b.id] ?? 0) - (fileCounts?.[a.id] ?? 0);
      }
      return (
        new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
        new Date(a.updated_at ?? a.created_at ?? 0).getTime()
      );
    });
  }, [fileCounts, projectQuery, projects, sortBy]);

  const handleCreate = (data: { name: string; description?: string; goal_type?: string }) => {
    createProject.mutate(data, {
      onSuccess: (project) => {
        setDialogOpen(false);
        toast.success(`"${project.name}" created`);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to create project');
      },
    });
  };

  const handleDelete = (id: string) => {
    const project = projects?.find((p) => p.id === id);
    deleteProject.mutate(id, {
      onSuccess: () => {
        toast.success(`"${project?.name ?? 'Project'}" deleted`);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to delete project');
      },
    });
  };

  return (
    <div className="surface-grain relative min-h-full overflow-hidden bg-surface-50 dark:bg-surface-950">

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <FadeIn>
          <section
            className={cn(
              'relative overflow-hidden rounded-2xl border p-5 sm:p-6',
              'border-primary-200/50 bg-gradient-to-br from-primary-50 via-white to-accent-50/30',
              'shadow-[0_28px_80px_-48px_rgba(99,102,241,0.25)]',
              'dark:border-primary-900/40 dark:from-primary-950/40 dark:via-surface-900 dark:to-surface-900',
              'dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.7)]'
            )}
          >
            {/* Subtle gradient orb */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/5" />

            <div className="relative min-w-0">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 max-w-2xl">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary-500 dark:text-primary-400">
                    Case Management
                  </p>
                  <h1 className="font-heading text-2xl font-semibold tracking-tight text-surface-950 [overflow-wrap:anywhere] dark:text-surface-50 sm:text-3xl">
                    {firstName ? `${firstName}'s matters` : 'Your matters'}
                  </h1>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {resumeProject && (
                    <button
                      onClick={() => navigate(`/project/${resumeProject.id}`)}
                      className="focus-accent inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 sm:py-2.5 text-sm font-medium text-white shadow-sm shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-500/30 dark:bg-primary-500 dark:hover:bg-primary-400"
                    >
                      Resume
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-3 sm:py-2.5 text-sm font-medium text-surface-700 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:border-primary-600 dark:hover:text-primary-300"
                  >
                    <Plus className="h-4 w-4" />
                    New matter
                  </button>
                </div>
              </div>

            </div>
          </section>

          <div className="mt-3 grid items-stretch gap-3 grid-cols-1 sm:grid-cols-3">
            <MetricCard
              icon={<Briefcase className="h-4 w-4" />}
              label="Active matters"
              value={projects?.length ?? 0}
              detail="Open records"
              tone="primary"
            />
            <MetricCard
              icon={<FileText className="h-4 w-4" />}
              label="Source files"
              value={totalFiles}
              detail="Uploaded evidence"
              tone="emerald"
            />
            <MetricCard
              icon={<Clock3 className="h-4 w-4" />}
              label="Latest update"
              value={
                recentUpdate
                  ? new Date(recentUpdate.updated_at ?? recentUpdate.created_at ?? Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '--'
              }
              detail={recentUpdate ? recentUpdate.name : 'No activity yet'}
              tone="neutral"
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.06}>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                Portfolio
              </h2>
              {isFetching && !isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-surface-400 dark:text-surface-500" />
              )}
              <span className="text-xs text-surface-400 dark:text-surface-500">
                {visibleProjects.length} of {projects?.length ?? 0}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
                <input
                  value={projectQuery}
                  onChange={(e) => setProjectQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-44 rounded-xl border border-surface-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-surface-700 shadow-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-surface-700 dark:bg-surface-950/80 dark:text-surface-100 dark:focus:border-primary-400 dark:focus:ring-primary-400/20"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 px-2.5 py-2 text-xs text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'files')}
                  className="bg-transparent font-medium outline-none dark:text-surface-300 [&_option]:dark:bg-surface-800 [&_option]:dark:text-surface-200"
                >
                  <option value="recent">Recent</option>
                  <option value="name">Name</option>
                  <option value="files">Files</option>
                </select>
              </div>
            </div>
          </div>
        </FadeIn>

        {error && (
          <FadeIn>
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-5 dark:border-red-800/50 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Failed to load matters
                  </p>
                  <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/70">
                    Check your connection and try again.
                  </p>
                </div>
              </div>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </FadeIn>
        )}

        {isLoading && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!isLoading && !error && !hasProjects && (
          <FadeIn delay={0.1}>
            <div className="mt-4 rounded-2xl border border-dashed border-surface-300 bg-white/85 py-6 shadow-sm dark:border-surface-700 dark:bg-surface-900/55">
              <EmptyState
                icon={<Scale className="h-6 w-6" />}
                title="No matters yet"
                description="Create a matter to get started."
                action={
                  <>
                    <p className="text-xs text-surface-400 mt-1 mb-3">A matter is a case or legal issue you&apos;re working on.</p>
                    <button
                      onClick={() => setDialogOpen(true)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md dark:bg-primary-500 dark:hover:bg-primary-400"
                    >
                      <Plus className="h-4 w-4" />
                      New matter
                    </button>
                  </>
                }
              />
            </div>
          </FadeIn>
        )}

        {!isLoading && !error && hasProjects && (
          <div className="mt-4">
            {visibleProjects.length === 0 ? (
              <FadeIn delay={0.1}>
                <div className="rounded-2xl border border-dashed border-surface-300 bg-white/80 px-6 py-10 text-center shadow-sm dark:border-surface-700 dark:bg-surface-900/55">
                  <Search className="mx-auto h-5 w-5 text-surface-400 dark:text-surface-500" />
                  <h3 className="mt-3 text-sm font-semibold text-surface-700 dark:text-surface-200">
                    No matters match that search
                  </h3>
                  <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                    Try different keywords.
                  </p>
                  <button
                    onClick={() => setProjectQuery('')}
                    className="mt-4 rounded-xl border border-surface-200 px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
                  >
                    Clear search
                  </button>
                </div>
              </FadeIn>
            ) : (
              <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    fileCount={fileCounts?.[project.id]}
                    index={index}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        isLoading={createProject.isPending}
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-translucent bg-white/90 p-4 shadow-sm dark:bg-surface-900/70">
      <div className="flex items-center gap-2 text-sm font-medium text-current/80">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 font-heading text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
        {value}
      </p>
      <p className="mt-auto text-xs leading-5 text-current/70 [overflow-wrap:anywhere]">
        {detail}
      </p>
    </div>
  );
}


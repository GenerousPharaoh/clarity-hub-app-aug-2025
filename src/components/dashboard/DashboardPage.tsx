import { useState } from 'react';
import { Plus, Briefcase, Scale, RefreshCw, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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

function getFirstName(user: { user_metadata?: Record<string, unknown>; email?: string } | null): string {
  if (!user) return '';
  const fullName = user.user_metadata?.full_name as string | undefined;
  if (fullName) return fullName.split(' ')[0];
  const email = user.email ?? '';
  return email.split('@')[0];
}

/* ── Skeleton card for loading state ─────────────────── */
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
      <div className="h-1 w-full animate-pulse bg-surface-200 dark:bg-surface-800" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start gap-3">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-surface-100 dark:bg-surface-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          </div>
        </div>
        <div className="mb-4 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
        </div>
        <div className="mt-auto border-t border-surface-100 pt-3 dark:border-surface-800">
          <div className="h-3 w-24 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard Page ─────────────────────────────── */
export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: projects, isLoading, isFetching, error } = useProjects();
  const { data: fileCounts } = useProjectFileCounts();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [dialogOpen, setDialogOpen] = useState(false);

  useDocumentTitle('Dashboard');

  const firstName = getFirstName(user);
  const hasProjects = projects && projects.length > 0;

  const handleCreate = (data: { name: string; description?: string }) => {
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
    <div className="relative min-h-full bg-surface-50 dark:bg-surface-950">
      {/* Ambient background glow for dark mode */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[400px] left-1/4 h-[800px] w-[800px] rounded-full bg-primary-500/[0.03] blur-[120px] dark:bg-primary-500/[0.06]" />
        <div className="absolute -bottom-[300px] right-1/4 h-[600px] w-[600px] rounded-full bg-accent-500/[0.02] blur-[100px] dark:bg-accent-500/[0.04]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
        {/* Header section */}
        <FadeIn>
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-3xl">
              {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
            </h1>
            <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">
              Manage your cases, evidence, and legal arguments.
            </p>
          </div>
        </FadeIn>

        {/* Section header with action button */}
        <FadeIn delay={0.05}>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold text-surface-800 dark:text-surface-200">
                Your Projects
              </h2>
              {isFetching && !isLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-surface-400 dark:text-surface-500" />
              )}
            </div>
            <button
              onClick={() => setDialogOpen(true)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5',
                'bg-primary-600 text-sm font-medium text-white',
                'shadow-sm transition-all duration-200',
                'hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/25',
                'active:scale-[0.97] active:bg-primary-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-offset-surface-950'
              )}
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        </FadeIn>

        {/* Error state */}
        {error && (
          <FadeIn>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/30">
              <p className="text-sm text-red-700 dark:text-red-400">
                Failed to load projects.
              </p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          </FadeIn>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && !hasProjects && (
          <FadeIn delay={0.1}>
            <div className="rounded-xl border border-dashed border-surface-300 bg-white py-4 dark:border-surface-700 dark:bg-surface-900/50">
              <EmptyState
                icon={<Scale className="h-6 w-6" />}
                title="No projects yet"
                description="Create your first project to start organizing evidence, building arguments, and managing exhibits."
                action={
                  <button
                    onClick={() => setDialogOpen(true)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-4 py-2.5',
                      'bg-primary-600 text-sm font-medium text-white',
                      'shadow-sm transition-all duration-200',
                      'hover:bg-primary-500 hover:shadow-md hover:shadow-primary-500/25',
                      'active:scale-[0.98]'
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    Create your first project
                  </button>
                }
              />
            </div>
          </FadeIn>
        )}

        {/* Project cards grid */}
        {!isLoading && !error && hasProjects && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
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

        {/* Quick stats footer */}
        {!isLoading && hasProjects && (
          <FadeIn delay={0.15}>
            <div className="mt-8 flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
              <Briefcase className="h-3.5 w-3.5" />
              <span>
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>
          </FadeIn>
        )}
      </div>

      {/* Create project dialog */}
      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        isLoading={createProject.isPending}
      />
    </div>
  );
}

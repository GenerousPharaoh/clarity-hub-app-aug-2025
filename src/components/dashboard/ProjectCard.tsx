import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Download,
  FolderOpen,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from '@/types';
import { cn, formatRelativeDate } from '@/lib/utils';
import { useUpdateProject } from '@/hooks/useProjects';
import { downloadProjectExport } from '@/services/projectExport';

interface ProjectCardProps {
  project: Project;
  fileCount?: number;
  index: number;
  onDelete: (id: string) => void;
  isLastOpened?: boolean;
}

function getMatterStatus(fileCount?: number) {
  if (!fileCount) {
    return {
      label: 'Intake',
      chip: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
    };
  }

  if (fileCount >= 3) {
    return {
      label: 'Developed',
      chip: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
    };
  }

  return {
    label: 'In review',
    chip: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-primary-300',
  };
}

export function ProjectCard({ project, fileCount, index, onDelete, isLastOpened }: ProjectCardProps) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (exporting) return;
      setMenuOpen(false);
      setExporting(true);
      const toastId = toast.loading('Preparing export…');
      try {
        await downloadProjectExport({
          projectId: project.id,
          projectName: project.name,
          includeFileBinaries: true,
          onProgress: (progress) => {
            toast.loading(progress.message, { id: toastId });
          },
        });
        toast.success('Export downloaded', { id: toastId });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Export failed',
          { id: toastId }
        );
      } finally {
        setExporting(false);
      }
    },
    [exporting, project.id, project.name]
  );

  useEffect(() => {
    if (!menuOpen) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleCardClick = () => {
    if (renaming) return;
    navigate(`/project/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(project.id);
      setMenuOpen(false);
      setConfirmDelete(false);
      return;
    }
    setConfirmDelete(true);
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setRenameValue(project.name);
    setRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 50);
  };

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== project.name) {
      updateProject.mutate({ id: project.id, name: trimmed });
    }
    setRenaming(false);
  }, [project.id, project.name, renameValue, updateProject]);

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    }
    if (e.key === 'Escape') {
      setRenameValue(project.name);
      setRenaming(false);
    }
  };

  // Muted solid accent colors — no gradients, no neon
  const accentColors = [
    'bg-primary-500',
    'bg-accent-500',
    'bg-surface-500',
    'bg-primary-600',
    'bg-accent-600',
    'bg-surface-600',
  ];
  const accent = accentColors[index % accentColors.length];
  const status = getMatterStatus(fileCount);
  const updatedLabel = formatRelativeDate(project.updated_at ?? project.created_at);
  const goalType = project.goal_type ?? 'General matter';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.36,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="h-full"
    >
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className={cn(
          'group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border px-5 pb-4 pt-5',
          'border-surface-200 bg-white',
          'shadow-sm transition-all duration-300',
          'hover:shadow-lg hover:shadow-surface-200/50 hover:-translate-y-0.5 hover:border-surface-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
          'dark:border-surface-800 dark:bg-surface-900',
          'dark:hover:shadow-lg dark:hover:shadow-surface-950/40 dark:hover:border-surface-700',
          isLastOpened && 'border-l-[3px] border-l-accent-500'
        )}
      >
        <div className={cn('absolute inset-x-0 top-0 h-0.5', accent)} />

        <div className="relative flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                <FolderOpen className="h-4 w-4 text-surface-500 dark:text-surface-400" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-start gap-1.5">
                  <span title={goalType} className="max-w-full truncate rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-xs font-medium text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                    {goalType}
                  </span>
                  <span title={status.label} className={cn('max-w-full rounded-full border px-2 py-0.5 text-xs font-medium', status.chip)}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-2">
                  {renaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={handleRenameKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'w-full rounded-xl border border-primary-300 bg-white px-2.5 py-1',
                        'font-heading text-lg font-bold tracking-tight text-surface-900',
                        'outline-none focus:ring-2 focus:ring-primary-500/25',
                        'dark:border-primary-700 dark:bg-surface-800 dark:text-surface-100'
                      )}
                    />
                  ) : (
                    <h3 title={project.name} className="line-clamp-2 font-heading text-lg font-bold tracking-tight text-surface-900 [overflow-wrap:anywhere] dark:text-surface-100">
                      {project.name}
                    </h3>
                  )}
                </div>
              </div>
            </div>

            <div ref={menuRef} className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                  setConfirmDelete(false);
                }}
                className={cn(
                  'flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-xl',
                  'text-surface-400 transition-all hover:bg-surface-100 hover:text-surface-600',
                  'dark:hover:bg-surface-800 dark:hover:text-surface-300',
                  'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100',
                  menuOpen && 'bg-surface-100 !opacity-100 dark:bg-surface-800'
                )}
                aria-label="Project options"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className={cn(
                    'absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl',
                    'border border-surface-200 bg-white py-1 shadow-lg',
                    'dark:border-surface-700 dark:bg-surface-800'
                  )}
                >
                  <button
                    role="menuitem"
                    onClick={handleStartRename}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleExport}
                    disabled={exporting}
                    title="Download a ZIP archive of this matter (files + JSON metadata)"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 disabled:cursor-wait disabled:opacity-60 dark:text-surface-300 dark:hover:bg-surface-700"
                  >
                    {exporting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {exporting ? 'Exporting…' : 'Export matter'}
                  </button>
                  <div className="my-1 h-px bg-surface-100 dark:bg-surface-700" />
                  <button
                    role="menuitem"
                    onClick={handleDelete}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                      confirmDelete
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                        : 'text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700'
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmDelete ? 'Confirm delete?' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <p
            title={project.description || ''}
            className={cn(
              'mt-3 line-clamp-2 text-sm leading-relaxed [overflow-wrap:anywhere]',
              project.description
                ? 'text-surface-600 dark:text-surface-400'
                : 'italic text-surface-400 dark:text-surface-500'
            )}
          >
            {project.description || 'No description yet'}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-surface-100 pt-3 dark:border-surface-800">
            <div className="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
              <span className="font-medium">
                {fileCount ?? 0} {fileCount === 1 ? 'file' : 'files'}
              </span>
              <span className="text-surface-300 dark:text-surface-600">&middot;</span>
              <span>{updatedLabel}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1 text-xs font-semibold text-surface-600 shadow-sm transition-all group-hover:bg-accent-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-accent-500/20 dark:bg-surface-800 dark:text-surface-300 dark:group-hover:bg-accent-500 dark:group-hover:text-white">
              Open
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  FileText,
  FolderOpen,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Project } from '@/types';
import { cn, formatDate, formatRelativeDate } from '@/lib/utils';
import { useUpdateProject } from '@/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  fileCount?: number;
  index: number;
  onDelete: (id: string) => void;
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

export function ProjectCard({ project, fileCount, index, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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

  const accentGradients = [
    'from-primary-700 via-primary-600 to-primary-500',
    'from-primary-700 via-primary-600 to-accent-500',
    'from-surface-800 via-primary-700 to-primary-500',
    'from-accent-700 via-accent-600 to-primary-500',
    'from-primary-800 via-primary-700 to-accent-600',
    'from-surface-700 via-surface-600 to-primary-500',
  ];

  const accent = accentGradients[index % accentGradients.length];
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
          'group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[26px] border p-5',
          'border-translucent bg-white/88 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.42)]',
          'interactive-lift surface-grain',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-950',
          'dark:bg-surface-900/78 dark:shadow-[0_20px_60px_-40px_rgba(0,0,0,0.6)]'
        )}
      >
        <div className={cn('absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r', accent)} />
        <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-white/70 blur-3xl dark:bg-surface-700/20" />

        <div className="relative flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className={cn(
                'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                'bg-gradient-to-br text-white shadow-sm',
                accent
              )}>
                <FolderOpen className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="max-w-full rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-500 [overflow-wrap:anywhere] dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                    {goalType}
                  </span>
                  <span className={cn('max-w-full rounded-full border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] [overflow-wrap:anywhere]', status.chip)}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-3">
                  {renaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={handleRenameKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'w-full rounded-xl border border-primary-300 bg-white px-3 py-2',
                        'font-heading text-lg font-semibold tracking-tight text-surface-900',
                        'outline-none focus:ring-2 focus:ring-primary-500/25',
                        'dark:border-primary-700 dark:bg-surface-800 dark:text-surface-100'
                      )}
                    />
                  ) : (
                    <h3 className="line-clamp-2 font-heading text-xl font-semibold tracking-tight text-surface-950 [overflow-wrap:anywhere] dark:text-surface-50">
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
                  className={cn(
                    'absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-2xl',
                    'border border-surface-200 bg-white py-1 shadow-lg',
                    'dark:border-surface-700 dark:bg-surface-800'
                  )}
                >
                  <button
                    onClick={handleStartRename}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={handleDelete}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                      confirmDelete
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                        : 'text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700'
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmDelete ? 'Confirm' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-6 text-surface-600 [overflow-wrap:anywhere] dark:text-surface-400">
            {project.description || 'No summary'}
          </p>

          <div className="mt-auto grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-surface-200/80 bg-surface-50/80 px-3.5 py-3 dark:border-surface-800 dark:bg-surface-950/40">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-400 dark:text-surface-500">
                <FileText className="h-3.5 w-3.5" />
                Evidence
              </div>
              <p className="mt-2 font-heading text-2xl font-semibold text-surface-950 dark:text-surface-100">
                {fileCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                {fileCount === 1 ? 'file' : 'files'}
              </p>
            </div>

            <div className="rounded-2xl border border-surface-200/80 bg-surface-50/80 px-3.5 py-3 dark:border-surface-800 dark:bg-surface-950/40">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-400 dark:text-surface-500">
                <Calendar className="h-3.5 w-3.5" />
                Activity
              </div>
              <p className="mt-2 font-heading text-lg font-semibold text-surface-950 dark:text-surface-100">
                {updatedLabel}
              </p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                Opened {formatDate(project.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-surface-100 pt-4 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-end">
            <span className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary-700 transition-all sm:text-surface-700 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:text-primary-700 dark:text-primary-300 sm:dark:text-surface-200 sm:dark:group-hover:text-primary-300">
              Open
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

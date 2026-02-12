import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoreVertical, Trash2, Pencil, FolderOpen, Calendar, FileText } from 'lucide-react';
import type { Project } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { useUpdateProject } from '@/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  fileCount?: number;
  index: number;
  onDelete: (id: string) => void;
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

  // Close menu on outside click or Escape
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
    if (renaming) return; // Don't navigate while renaming
    navigate(`/project/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(project.id);
      setMenuOpen(false);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
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
  }, [renameValue, project.id, project.name, updateProject]);

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    }
    if (e.key === 'Escape') {
      setRenaming(false);
    }
  };

  // Accent color stripe — gradient pairs for visual variety
  const accentGradients = [
    'from-primary-500 to-primary-600',
    'from-accent-500 to-accent-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
  ];
  const accent = accentGradients[index % accentGradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
        className={cn(
          'group relative flex cursor-pointer flex-col overflow-hidden',
          'rounded-xl border border-surface-200 bg-white',
          'shadow-sm transition-all duration-200',
          'hover:shadow-lg hover:shadow-primary-500/5 hover:border-surface-300 hover:-translate-y-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-950',
          'dark:border-surface-800 dark:bg-surface-900',
          'dark:hover:border-surface-700 dark:hover:shadow-lg dark:hover:shadow-primary-500/[0.08]'
        )}
      >
        {/* Accent stripe — gradient */}
        <div className={cn('h-1 w-full bg-gradient-to-r', accent)} />

        {/* Card body */}
        <div className="flex flex-1 flex-col p-5">
          {/* Header: icon + title + menu */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                <FolderOpen className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                {renaming ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleRenameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'w-full rounded-md border border-primary-300 bg-white px-2 py-0.5',
                      'font-heading text-[15px] font-semibold leading-snug text-surface-900',
                      'outline-none focus:ring-2 focus:ring-primary-500/30',
                      'dark:border-primary-600 dark:bg-surface-800 dark:text-surface-100'
                    )}
                  />
                ) : (
                  <h3 className="font-heading text-[15px] font-semibold leading-snug text-surface-900 dark:text-surface-100 truncate">
                    {project.name}
                  </h3>
                )}
              </div>
            </div>

            {/* Context menu */}
            <div ref={menuRef} className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                  setConfirmDelete(false);
                }}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  'text-surface-400 transition-all',
                  'hover:bg-surface-100 hover:text-surface-600',
                  'dark:hover:bg-surface-800 dark:hover:text-surface-300',
                  'max-md:opacity-60 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100',
                  menuOpen && 'opacity-100 bg-surface-100 dark:bg-surface-800'
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
                    'absolute right-0 top-full z-50 mt-1 w-44',
                    'rounded-xl border border-surface-200 bg-white py-1 shadow-lg',
                    'dark:border-surface-700 dark:bg-surface-800'
                  )}
                >
                  <button
                    onClick={handleStartRename}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename project
                  </button>
                  <button
                    onClick={handleDelete}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                      confirmDelete
                        ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30'
                        : 'text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700'
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmDelete ? 'Confirm — deletes all data' : 'Delete project'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {project.description ? (
            <p className="mb-4 text-sm leading-relaxed text-surface-500 dark:text-surface-400 line-clamp-2">
              {project.description}
            </p>
          ) : (
            <p className="mb-4 text-sm italic text-surface-400 dark:text-surface-500">
              No description
            </p>
          )}

          {/* Footer */}
          <div className="mt-auto flex items-center gap-4 border-t border-surface-100 pt-3 dark:border-surface-800">
            <div className="flex items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(project.created_at)}</span>
            </div>
            {typeof fileCount === 'number' && (
              <div className="flex items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500">
                <FileText className="h-3.5 w-3.5" />
                <span>
                  {fileCount} {fileCount === 1 ? 'file' : 'files'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

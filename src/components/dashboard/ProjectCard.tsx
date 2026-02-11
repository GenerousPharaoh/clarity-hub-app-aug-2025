import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoreVertical, Trash2, FolderOpen, Calendar, FileText } from 'lucide-react';
import type { Project } from '@/types';
import { cn, formatDate } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  fileCount?: number;
  index: number;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, fileCount, index, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleCardClick = () => {
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
        onClick={handleCardClick}
        className={cn(
          'group relative flex cursor-pointer flex-col overflow-hidden',
          'rounded-xl border border-surface-200 bg-white',
          'shadow-sm transition-all duration-200',
          'hover:shadow-lg hover:shadow-primary-500/5 hover:border-surface-300 hover:-translate-y-0.5',
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
                <h3 className="font-heading text-[15px] font-semibold leading-snug text-surface-900 dark:text-surface-100 truncate">
                  {project.name}
                </h3>
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
                  'opacity-0 group-hover:opacity-100 focus:opacity-100',
                  menuOpen && 'opacity-100 bg-surface-100 dark:bg-surface-800'
                )}
                aria-label="Project options"
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
                    onClick={handleDelete}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                      confirmDelete
                        ? 'text-error bg-red-50 dark:bg-red-950/30'
                        : 'text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700'
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmDelete ? 'Click again to confirm' : 'Delete project'}
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

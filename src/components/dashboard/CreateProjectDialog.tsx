import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  isLoading?: boolean;
}

export function CreateProjectDialog({
  open,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      // Focus after animation
      setTimeout(() => nameInputRef.current?.focus(), 150);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isLoading) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isLoading) return;
    onSubmit({ name: trimmed, description: description.trim() || undefined });
  };

  const isValid = name.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => !isLoading && onClose()}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-10 w-full max-w-md',
              'rounded-xl border border-surface-200 bg-white shadow-2xl',
              'dark:border-surface-700 dark:bg-surface-800'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4 dark:border-surface-700">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <h2 className="font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                  New Project
                </h2>
              </div>
              <button
                onClick={() => !isLoading && onClose()}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md',
                  'text-surface-400 transition-colors',
                  'hover:bg-surface-100 hover:text-surface-600',
                  'dark:hover:bg-surface-700 dark:hover:text-surface-300'
                )}
                aria-label="Close dialog"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5">
              {/* Name field */}
              <div className="mb-4">
                <label
                  htmlFor="project-name"
                  className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                  Project name <span className="text-error">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Employment Dispute 2026"
                  disabled={isLoading}
                  className={cn(
                    'w-full rounded-lg border border-surface-300 px-3.5 py-2.5',
                    'text-sm text-surface-900 placeholder:text-surface-400',
                    'transition-colors',
                    'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100',
                    'dark:placeholder:text-surface-500 dark:focus:border-primary-400',
                    'dark:focus:ring-primary-400/20'
                  )}
                  maxLength={120}
                  autoComplete="off"
                />
              </div>

              {/* Description field */}
              <div className="mb-6">
                <label
                  htmlFor="project-description"
                  className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                  Description{' '}
                  <span className="font-normal text-surface-400 dark:text-surface-500">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="project-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of the case or project"
                  disabled={isLoading}
                  rows={3}
                  className={cn(
                    'w-full resize-none rounded-lg border border-surface-300 px-3.5 py-2.5',
                    'text-sm text-surface-900 placeholder:text-surface-400',
                    'transition-colors',
                    'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100',
                    'dark:placeholder:text-surface-500 dark:focus:border-primary-400',
                    'dark:focus:ring-primary-400/20'
                  )}
                  maxLength={500}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !isLoading && onClose()}
                  disabled={isLoading}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium',
                    'text-surface-600 transition-colors',
                    'hover:bg-surface-100 hover:text-surface-800',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    'dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-200'
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium',
                    'bg-primary-600 text-white transition-all',
                    'hover:bg-primary-700 active:bg-primary-800',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'shadow-sm hover:shadow'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

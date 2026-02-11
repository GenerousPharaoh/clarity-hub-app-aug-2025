import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const isMac =
  typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

function formatKey(key: string): string {
  if (key === 'Cmd') return isMac ? '\u2318' : 'Ctrl';
  if (key === 'Shift') return isMac ? '\u21E7' : 'Shift';
  return key;
}

export function KeyboardShortcutsHelp({
  open,
  onClose,
}: KeyboardShortcutsHelpProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-labelledby="shortcuts-title"
            className={cn(
              'relative z-10 w-full max-w-sm',
              'rounded-xl border border-surface-200 bg-white shadow-2xl',
              'dark:border-surface-700 dark:bg-surface-800'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-100 px-5 py-3.5 dark:border-surface-700">
              <div className="flex items-center gap-2.5">
                <Keyboard className="h-4 w-4 text-primary-500" />
                <h2
                  id="shortcuts-title"
                  className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100"
                >
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="space-y-0 px-5 py-3">
              {SHORTCUTS.map((shortcut, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="text-xs text-surface-600 dark:text-surface-300">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, j) => (
                      <span key={j}>
                        {j > 0 && (
                          <span className="mx-0.5 text-[10px] text-surface-300 dark:text-surface-600">
                            +
                          </span>
                        )}
                        <kbd
                          className={cn(
                            'inline-flex min-w-[20px] items-center justify-center rounded',
                            'border border-surface-200 bg-surface-50 px-1.5 py-0.5',
                            'font-mono text-[10px] font-medium text-surface-600',
                            'dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300'
                          )}
                        >
                          {formatKey(key)}
                        </kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-surface-100 px-5 py-3 dark:border-surface-700">
              <p className="text-[10px] text-surface-400 dark:text-surface-500">
                {isMac ? 'Use Cmd' : 'Use Ctrl'} as the modifier key
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

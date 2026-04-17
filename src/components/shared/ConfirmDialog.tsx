import { useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the cancel button when dialog opens (safer default for destructive actions)
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => cancelRef.current?.focus());
    }
  }, [open]);

  // Lock body scroll while the dialog is open so backdrop clicks don't scroll
  // the page underneath and gestures don't bleed through the modal.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      // Focus trap — keep Tab cycling within dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onCancel]
  );

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-surface-950/20 dark:bg-surface-950/50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[360px] -translate-x-1/2 -translate-y-1/2',
          'rounded-xl border border-surface-200 bg-white p-5 shadow-overlay',
          'dark:border-surface-700 dark:bg-surface-800',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        <div className="flex gap-3.5">
          {/* Icon */}
          {isDanger && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
              <AlertTriangle className="h-4.5 w-4.5 text-red-500 dark:text-red-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                id="confirm-dialog-title"
                className="font-heading text-sm font-semibold text-surface-800 dark:text-surface-100"
              >
                {title}
              </h3>
              <button
                onClick={onCancel}
                aria-label="Close dialog"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p
              id="confirm-dialog-message"
              className="mt-1.5 text-xs leading-relaxed text-surface-500 dark:text-surface-400"
            >
              {message}
            </p>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-end gap-2 pt-1">
              <button
                ref={cancelRef}
                onClick={onCancel}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-surface-500 transition-all hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400/40 active:scale-[0.98] dark:text-surface-400 dark:hover:bg-surface-700 dark:focus-visible:ring-surface-500/40"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800',
                  isDanger
                    ? 'bg-red-600 shadow-sm shadow-red-500/20 hover:bg-red-700 hover:shadow-md focus-visible:ring-red-500/60 dark:bg-red-600 dark:hover:bg-red-500'
                    : 'bg-primary-600 shadow-sm shadow-primary-500/20 hover:bg-primary-700 hover:shadow-md focus-visible:ring-primary-500/60'
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

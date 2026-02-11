import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptDialogProps {
  open: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  /** If true, submitting an empty string is allowed (used for "unset link") */
  allowEmpty?: boolean;
}

export function PromptDialog({
  open,
  title,
  placeholder,
  initialValue = '',
  onSubmit,
  onCancel,
  allowEmpty = false,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value and focus when dialog opens
  useEffect(() => {
    if (open) {
      setValue(initialValue);
      // Small delay to allow render
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [open, initialValue]);

  const handleSubmit = useCallback(() => {
    if (!allowEmpty && !value.trim()) return;
    onSubmit(value.trim());
  }, [value, allowEmpty, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-surface-950/20 dark:bg-surface-950/50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-label={title}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[340px] -translate-x-1/2 -translate-y-1/2',
          'rounded-xl border border-surface-200 bg-white p-4 shadow-overlay',
          'dark:border-surface-700 dark:bg-surface-800',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="flex h-6 w-6 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <input
          ref={inputRef}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border px-3 py-2.5 text-sm transition-colors',
            'border-surface-200 bg-white text-surface-900',
            'placeholder:text-surface-400',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100',
            'dark:placeholder:text-surface-500',
            'dark:focus:border-primary-400 dark:focus:ring-primary-400/20'
          )}
        />

        <div className="mt-3 flex items-center justify-end gap-2">
          {initialValue && (
            <button
              onClick={() => onSubmit('')}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Remove
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-surface-500 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allowEmpty && !value.trim()}
            className={cn(
              'rounded-lg px-4 py-1.5 text-xs font-medium text-white transition-colors',
              'bg-primary-600 hover:bg-primary-700',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

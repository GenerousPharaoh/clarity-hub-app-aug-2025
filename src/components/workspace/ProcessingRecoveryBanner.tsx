import { AlertCircle, FileText, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingRecoveryBannerProps {
  title: string;
  description: string;
  failedCount: number;
  fileName: string;
  isRetrying?: boolean;
  onOpenFile?: () => void;
  onRetry: () => void;
}

export function ProcessingRecoveryBanner({
  title,
  description,
  failedCount,
  fileName,
  isRetrying = false,
  onOpenFile,
  onRetry,
}: ProcessingRecoveryBannerProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4 shadow-sm',
        'border-amber-200/80 bg-gradient-to-br from-amber-50/95 to-white',
        'dark:border-amber-900/40 dark:from-amber-950/30 dark:to-surface-900/90'
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              {title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800/85 dark:text-amber-200/80">
              {description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 font-medium text-amber-700 dark:border-amber-800/60 dark:bg-surface-900/70 dark:text-amber-200">
                <FileText className="h-3 w-3" />
                <span className="max-w-[240px] truncate" title={fileName}>{fileName}</span>
              </span>
              {failedCount > 1 && (
                <span className="rounded-full border border-amber-200 bg-white/70 px-2.5 py-1 font-medium text-amber-700 dark:border-amber-800/60 dark:bg-surface-900/70 dark:text-amber-200">
                  +{failedCount - 1} more
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {onOpenFile && (
            <button
              type="button"
              onClick={onOpenFile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white/90 px-3 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 dark:border-amber-800/60 dark:bg-surface-900/80 dark:text-amber-200 dark:hover:bg-amber-950/20"
            >
              <FileText className="h-3.5 w-3.5" />
              Open File
            </button>
          )}
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRetrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isRetrying ? 'Retrying...' : 'Retry Indexing'}
          </button>
        </div>
      </div>
    </div>
  );
}

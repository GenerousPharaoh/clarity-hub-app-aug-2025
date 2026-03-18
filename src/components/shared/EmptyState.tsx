import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Compact mode reduces vertical padding */
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? 'py-10' : 'py-16'}`}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500">
          {icon}
        </div>
      )}
      <h3 className="mb-1 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-xs text-xs leading-relaxed text-surface-500 dark:text-surface-400">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Standardized error state with red-tinted container and retry button */
export function ErrorState({
  message = 'Something went wrong',
  description,
  onRetry,
  icon,
}: {
  message?: string;
  description?: string;
  onRetry?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
        {icon ?? (
          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        )}
      </div>
      <h3 className="mt-3 font-heading text-sm font-semibold text-red-700 dark:text-red-300">
        {message}
      </h3>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-red-600/80 dark:text-red-400/80">
          {description}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
        >
          <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Retry
        </button>
      )}
    </div>
  );
}

/** Skeleton placeholder line for loading states */
export function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return <div className={`${width} ${height} animate-pulse rounded bg-surface-100 dark:bg-surface-800`} />;
}

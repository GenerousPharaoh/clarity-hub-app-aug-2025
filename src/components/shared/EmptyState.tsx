import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500">
          {icon}
        </div>
      )}
      <h3 className="mb-1 font-heading text-base font-semibold text-surface-700 dark:text-surface-200">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-surface-500 dark:text-surface-400">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

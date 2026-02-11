import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CollapsedStripProps {
  children: ReactNode;
  side: 'left' | 'right';
  visible: boolean;
}

/**
 * Thin icon strip shown when a side panel is collapsed.
 * Lives outside the PanelGroup so it's always visible at 0-width collapse.
 */
export function CollapsedStrip({ children, side, visible }: CollapsedStripProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'flex w-10 shrink-0 flex-col items-center gap-1 py-2',
        'bg-white dark:bg-surface-900',
        side === 'left'
          ? 'border-r border-surface-200 dark:border-surface-800'
          : 'border-l border-surface-200 dark:border-surface-800'
      )}
    >
      {children}
    </div>
  );
}

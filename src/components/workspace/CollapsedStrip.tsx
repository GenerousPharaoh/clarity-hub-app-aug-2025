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
 * Always rendered in the DOM (with w-0 when hidden) to prevent layout jumps.
 */
export function CollapsedStrip({ children, side, visible }: CollapsedStripProps) {
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden transition-[width] duration-150 ease-out',
        visible ? 'w-10' : 'w-0',
        'flex flex-col items-center gap-1 py-2',
        'bg-surface-50 dark:bg-surface-900',
        side === 'left'
          ? 'border-r border-surface-200 dark:border-surface-800'
          : 'border-l border-surface-200 dark:border-surface-800'
      )}
    >
      {children}
    </div>
  );
}

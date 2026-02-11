import { PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface PanelGripProps {
  className?: string;
  id?: string;
}

export function PanelGrip({ className, id }: PanelGripProps) {
  return (
    <PanelResizeHandle
      id={id}
      className={cn(
        'group relative flex w-2 items-center justify-center',
        'hover:w-2 active:w-2',
        'transition-colors duration-100',
        className
      )}
    >
      {/* Wider invisible hit area — extends beyond the visible line */}
      <div className="absolute inset-y-0 -left-1 -right-1 z-10" />

      {/* Visible track — 1px default, 2px on hover/active */}
      <div
        className={cn(
          'absolute inset-y-0 left-1/2 -translate-x-1/2',
          'w-px bg-surface-200 dark:bg-surface-800',
          'transition-all duration-100',
          'group-hover:w-[2px] group-hover:bg-primary-400 dark:group-hover:bg-primary-500',
          'group-data-[resize-handle-state=drag]:w-[2px] group-data-[resize-handle-state=drag]:bg-primary-500 dark:group-data-[resize-handle-state=drag]:bg-primary-400'
        )}
      />

      {/* Grip dots — visible on hover/drag */}
      <div
        className={cn(
          'relative z-20 flex h-6 w-3 items-center justify-center rounded-sm',
          'bg-surface-100 dark:bg-surface-800',
          'border border-surface-200 dark:border-surface-700',
          'opacity-0 transition-opacity duration-100',
          'group-hover:opacity-100',
          'group-data-[resize-handle-state=drag]:opacity-100'
        )}
      >
        <GripVertical className="h-3 w-3 text-surface-400 dark:text-surface-400" />
      </div>
    </PanelResizeHandle>
  );
}

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
      aria-label="Resize panels"
      hitAreaMargins={{ coarse: 18, fine: 10 }}
      className={cn(
        'group relative z-10 flex w-3 cursor-col-resize touch-none items-center justify-center',
        'transition-[background-color,opacity,width] duration-150',
        'focus-visible:outline-none',
        className
      )}
    >
      {/* Wider invisible hit area so narrow panel resizing stays usable. */}
      <div className="absolute inset-y-0 -left-2 -right-2 z-10" />

      {/* Visible track */}
      <div
        className={cn(
          'absolute inset-y-0 left-1/2 -translate-x-1/2',
          'w-px bg-surface-200/90 dark:bg-surface-700/90',
          'transition-all duration-150',
          'group-hover:w-[2px] group-hover:bg-primary-400 dark:group-hover:bg-primary-500',
          'group-focus-visible:w-[2px] group-focus-visible:bg-primary-400 dark:group-focus-visible:bg-primary-500',
          'group-data-[resize-handle-state=drag]:w-[3px] group-data-[resize-handle-state=drag]:bg-primary-500 dark:group-data-[resize-handle-state=drag]:bg-primary-400'
        )}
      />

      {/* Grip pill */}
      <div
        className={cn(
          'relative z-20 flex h-8 w-4 items-center justify-center rounded-full',
          'border border-surface-200/80 bg-white/92 shadow-sm dark:border-surface-700 dark:bg-surface-900/92',
          'opacity-0 transition-all duration-150',
          'group-hover:opacity-100 group-focus-visible:opacity-100',
          'group-data-[resize-handle-state=drag]:opacity-100 group-data-[resize-handle-state=drag]:scale-105'
        )}
      >
        <GripVertical className="h-3 w-3 text-surface-400 dark:text-surface-400" />
      </div>
    </PanelResizeHandle>
  );
}

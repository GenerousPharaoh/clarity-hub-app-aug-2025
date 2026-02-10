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
      className={cn('group relative flex w-[3px] items-center justify-center', className)}
    >
      {/* Background track */}
      <div className="absolute inset-0 bg-surface-200 transition-colors duration-150 group-hover:bg-primary-400 group-data-[resize-handle-active]:bg-primary-500 dark:bg-surface-700 dark:group-hover:bg-primary-500 dark:group-data-[resize-handle-active]:bg-primary-400" />

      {/* Grip icon - appears on hover */}
      <div className="relative z-10 flex h-8 w-4 items-center justify-center rounded-sm bg-surface-200 opacity-0 shadow-sm transition-all duration-150 group-hover:opacity-100 group-data-[resize-handle-active]:opacity-100 dark:bg-surface-600">
        <GripVertical className="h-3.5 w-3.5 text-surface-500 dark:text-surface-300" />
      </div>
    </PanelResizeHandle>
  );
}

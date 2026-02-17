import { cn } from '@/lib/utils';
import { Zap, Search, Brain, GitBranchPlus } from 'lucide-react';
import type { EffortLevel } from '@/types';

const EFFORT_LEVELS: {
  level: EffortLevel;
  label: string;
  description: string;
  icon: typeof Zap;
}[] = [
  { level: 'quick', label: 'Quick', description: 'Fast answer, minimal search', icon: Zap },
  { level: 'standard', label: 'Standard', description: 'Balanced speed and depth', icon: Search },
  { level: 'thorough', label: 'Thorough', description: 'Deeper analysis, more context', icon: Brain },
  { level: 'deep', label: 'Deep', description: 'Maximum reasoning for complex questions', icon: GitBranchPlus },
];

interface EffortSelectorProps {
  value: EffortLevel;
  onChange: (level: EffortLevel) => void;
  variant?: 'compact' | 'full';
  disabled?: boolean;
  wrap?: boolean;
}

export function EffortSelector({
  value,
  onChange,
  variant = 'full',
  disabled = false,
  wrap = false,
}: EffortSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="AI reasoning effort level"
      className={cn(
        'flex items-center gap-1',
        wrap && 'flex-wrap',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      {EFFORT_LEVELS.map(({ level, label, description, icon: Icon }) => {
        const selected = value === level;
        return (
          <button
            key={level}
            role="radio"
            aria-checked={selected}
            aria-label={`${label}: ${description}`}
            title={description}
            onClick={() => onChange(level)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-medium transition-all',
              selected
                ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'border-transparent text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700',
              variant === 'compact' && 'px-1.5 py-0.5'
            )}
          >
            <Icon className={cn('h-3 w-3', variant === 'compact' && 'h-3.5 w-3.5')} />
            {variant === 'full' && label}
          </button>
        );
      })}
    </div>
  );
}

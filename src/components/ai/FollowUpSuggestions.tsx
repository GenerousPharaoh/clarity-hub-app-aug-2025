import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
  className?: string;
}

export function FollowUpSuggestions({
  suggestions,
  onSelect,
  className,
}: FollowUpSuggestionsProps) {
  if (!suggestions.length) return null;

  const displayed = suggestions.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex flex-wrap gap-1.5', className)}
    >
      {displayed.map((text, i) => {
        const truncated = text.length > 60 ? text.slice(0, 57) + '...' : text;
        return (
          <button
            key={i}
            onClick={() => onSelect(text)}
            className="flex items-center gap-1 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-600 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
          >
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span className="truncate">{truncated}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

/** Full-page loading screen for route transitions and initial app load */
export function LoadingScreen({ message = 'Loading your workspace...' }: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-screen items-center justify-center bg-surface-50 dark:bg-surface-950"
      aria-live="polite"
      role="status"
    >
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary-600" />
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
          {message}
        </p>
      </div>
    </motion.div>
  );
}

/** Inline loading indicator for panels/sections -- centered spinner with optional message */
export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-12" role="status" aria-live="polite">
      <div className="text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-surface-300 dark:text-surface-600" />
        {message && (
          <p className="mt-2 text-xs text-surface-400 dark:text-surface-500">{message}</p>
        )}
      </div>
    </div>
  );
}

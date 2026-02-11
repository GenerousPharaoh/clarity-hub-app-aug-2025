import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
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

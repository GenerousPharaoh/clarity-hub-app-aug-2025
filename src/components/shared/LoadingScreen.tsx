import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

/** Full-page loading screen for auth checking on initial load */
export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-surface-50 dark:bg-surface-950"
      aria-live="polite"
      role="status"
    >
      <div className="text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-surface-300 dark:text-surface-600" />
        <p className="mt-2 text-xs text-surface-400 dark:text-surface-500">
          {message}
        </p>
      </div>
    </div>
  );
}

/** Inline loading indicator for panels/sections */
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

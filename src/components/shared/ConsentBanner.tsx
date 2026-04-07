import { useState, useCallback } from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { CONSENT_KEY } from '@/lib/constants';
import { cn } from '@/lib/utils';

function hasConsented(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) !== null;
  } catch {
    return false;
  }
}

function recordConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, new Date().toISOString());
  } catch {
    // proceed even if storage fails
  }
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(() => !hasConsented());

  const handleAccept = useCallback(() => {
    recordConsent();
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Privacy consent"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[9999]',
        'border-t border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900',
        'shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]',
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4 sm:gap-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40">
          <ShieldCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs leading-relaxed text-surface-600 dark:text-surface-400">
            Your data is stored in Canada. AI features send content to third-party APIs (OpenAI, Gemini, Mistral) under enterprise agreements.
            By continuing you consent to this processing.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/privacy"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
          >
            Details
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

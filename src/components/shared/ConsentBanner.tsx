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
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40">
          <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
            Data processing disclosure
          </h2>

          <div className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-surface-600 dark:text-surface-400">
            <p>
              Your files and data are stored on Supabase infrastructure in Canada
              (AWS ca-central-1).
            </p>
            <p>
              AI features send document content to third-party APIs (OpenAI,
              Google Gemini, Mistral, Cohere, Voyage AI) with servers in the US
              and EU. These providers operate under API/enterprise agreements and
              do not use your data to train their models.
            </p>
            <p>
              By continuing, you consent to this processing. You can disable AI
              features at any time in Settings.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleAccept}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              Accept &amp; Continue
            </button>
            <a
              href="/privacy"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
            >
              Learn More
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

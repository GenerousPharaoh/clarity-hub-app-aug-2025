import { useEffect } from 'react';
import { ShieldAlert, X, ExternalLink, Check } from 'lucide-react';
import useAppStore from '@/store';
import { cn } from '@/lib/utils';

/**
 * Consent dialog shown before a user's first file upload (or first AI
 * interaction that sends matter material to third-party sub-processors).
 *
 * Surfaces the cross-border processing disclosure that PIPEDA and LSO Rule
 * 3.3-1 commentary both point toward: the user has to be told, and for a
 * lawyer their client has to be told, that content may leave Canada for
 * AI processing.
 *
 * One-time. Acknowledgment persists in localStorage. Can be reset from
 * Settings if the user changes their mind.
 */
export function AIProcessingConsentDialog() {
  const open = useAppStore((s) => s.aiProcessingConsentPending);
  const accept = useAppStore((s) => s.acceptAIProcessingConsent);
  const decline = useAppStore((s) => s.declineAIProcessingConsent);

  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') decline();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, decline]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-surface-950/50 backdrop-blur-sm dark:bg-surface-950/70"
        onClick={decline}
      />
      <div
        role="alertdialog"
        aria-labelledby="ai-consent-title"
        aria-describedby="ai-consent-description"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[540px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
          'rounded-2xl border border-surface-200 bg-white p-6 shadow-overlay',
          'dark:border-surface-700 dark:bg-surface-800',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2
                id="ai-consent-title"
                className="font-heading text-lg font-bold tracking-tight text-surface-900 dark:text-surface-100"
              >
                Before you upload
              </h2>
              <button
                onClick={decline}
                aria-label="Close"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400/40 dark:hover:bg-surface-700 dark:hover:text-surface-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p
              id="ai-consent-description"
              className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300"
            >
              Clarity Hub processes your files through third-party services to
              extract text, classify documents, build search indexes, and power
              AI research. Before uploading material, please confirm you
              understand how that works.
            </p>

            <ul className="mt-4 space-y-2 text-sm">
              <ConsentLine>
                Files are stored in Canada (Supabase, Montréal). Processing
                steps run on providers in the US and EU, listed on the{' '}
                <a
                  href="/legal/trust"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  Trust page
                  <ExternalLink className="h-3 w-3" />
                </a>
                .
              </ConsentLine>
              <ConsentLine>
                No provider uses your data to train its models. Sub-processors
                are contractually bound to the same use restrictions.
              </ConsentLine>
              <ConsentLine>
                If you are a lawyer or paralegal, confirm your client has
                consented to cross-border processing, or upload redacted /
                synthetic material only.
              </ConsentLine>
              <ConsentLine>
                AI-generated citations are automatically checked against
                CanLII and flagged when they can&apos;t be verified. You are
                still responsible for independently verifying every authority
                before using it in a filing.
              </ConsentLine>
            </ul>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={decline}
                className="rounded-lg px-3 py-2 text-sm font-medium text-surface-500 transition-all hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400/40 active:scale-[0.98] dark:text-surface-400 dark:hover:bg-surface-700"
              >
                Cancel
              </button>
              <button
                onClick={accept}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-all hover:bg-primary-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 active:scale-[0.98] dark:focus-visible:ring-offset-surface-800"
              >
                <Check className="h-4 w-4" />
                I understand, proceed
              </button>
            </div>

            <p className="mt-3 text-xs text-surface-400 dark:text-surface-500">
              You can revoke this acknowledgment any time from Settings → Data &amp; Privacy.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ConsentLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 leading-relaxed text-surface-600 dark:text-surface-300">
      <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary-500 dark:text-primary-400" />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

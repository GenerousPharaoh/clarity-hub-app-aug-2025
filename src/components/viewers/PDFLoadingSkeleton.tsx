import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared loading skeleton for every phase of PDF rendering:
 *
 *   1. FileViewer is resolving the signed URL from Supabase Storage
 *   2. The Suspense boundary is downloading the AnnotatablePDFViewer chunk
 *   3. PdfLoader (pdf.js) is parsing the binary before pages are rendered
 *
 * Previously each phase rendered either `null` or a bare spinner, so the
 * viewport flashed grey / blank between them. The shimmer-page skeleton
 * below lands on the same slate background that pdf.js uses once pages
 * render, so the hand-off is visually continuous.
 *
 * Respects prefers-reduced-motion via Tailwind's default animate-pulse
 * (browsers will honor the media query at the CSS level).
 */
export function PDFLoadingSkeleton({
  showToolbar = false,
  message,
}: {
  /** Render a ghost toolbar bar above the page so the layout is identical to the loaded viewer */
  showToolbar?: boolean;
  /** Optional label below the spinner — defaults vary by phase */
  message?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex h-full w-full flex-col bg-surface-100 dark:bg-surface-950"
    >
      {showToolbar && (
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-surface-200 bg-white px-3 dark:border-surface-700 dark:bg-surface-900">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="ml-auto flex items-center gap-1">
            <div className="h-5 w-5 animate-pulse rounded-md bg-surface-200 dark:bg-surface-700" />
            <div className="h-5 w-12 animate-pulse rounded-md bg-surface-200 dark:bg-surface-700" />
            <div className="h-5 w-5 animate-pulse rounded-md bg-surface-200 dark:bg-surface-700" />
          </div>
        </div>
      )}

      <div className="relative flex flex-1 items-start justify-center overflow-hidden px-6 py-8">
        {/* Ghost page — landscape-free 8.5×11 proportions, centered, with a
            subtle column of text lines. This previews where real page
            content will land so the hand-off feels continuous. */}
        <div
          className={cn(
            'relative w-full max-w-2xl rounded-md bg-white shadow-[0_4px_20px_-12px_rgba(15,23,42,0.4)] ring-1 ring-surface-200/80',
            'dark:bg-surface-800 dark:shadow-[0_4px_20px_-12px_rgba(0,0,0,0.8)] dark:ring-surface-700/80',
            'aspect-[8.5/11]'
          )}
        >
          <div className="flex h-full flex-col gap-3 p-10">
            <div className="h-6 w-3/4 animate-pulse rounded bg-surface-100 dark:bg-surface-700/70" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface-100 dark:bg-surface-700/60" />
            <div className="mt-6 space-y-2.5">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="h-2.5 animate-pulse rounded bg-surface-100/90 dark:bg-surface-700/50"
                  style={{
                    width: `${82 + ((i * 7) % 15)}%`,
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>
            <div className="mt-5 space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-2.5 animate-pulse rounded bg-surface-100/90 dark:bg-surface-700/50"
                  style={{
                    width: `${72 + ((i * 11) % 22)}%`,
                    animationDelay: `${(i + 9) * 60}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Spinner + label overlaid on the page center so the user sees a
              positive loading signal without a separate flash of content. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-surface-200 backdrop-blur-sm dark:bg-surface-900/80 dark:ring-surface-700">
              <Loader2 className="h-4 w-4 animate-spin text-primary-500 dark:text-primary-400" />
            </div>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
              {message ?? 'Loading PDF…'}
            </p>
          </div>
        </div>
      </div>

      <span className="sr-only">PDF is loading, please wait.</span>
    </div>
  );
}

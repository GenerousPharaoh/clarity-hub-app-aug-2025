import { useState, useCallback } from 'react';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface PDFViewerProps {
  url: string;
  fileName: string;
}

export function PDFViewer({ url, fileName }: PDFViewerProps) {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }, [url, fileName]);

  const handleOpenInTab = useCallback(() => {
    window.open(url, '_blank');
  }, [url]);

  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-red-300 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/40">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white/80 dark:bg-red-950/30">
            <FileText className="h-7 w-7 text-red-400" />
          </div>
          <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
            Failed to Load PDF
          </h3>
          <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
            Your browser couldn't render this PDF inline.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={handleDownload}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                'text-sm font-medium text-primary-600',
                'transition-colors hover:bg-primary-50',
                'dark:text-primary-400 dark:hover:bg-primary-900/20'
              )}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              onClick={handleOpenInTab}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                'text-sm font-medium text-surface-600',
                'transition-colors hover:bg-surface-100',
                'dark:text-surface-400 dark:hover:bg-surface-800'
              )}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mobile fallback — iframe PDF viewing is unreliable on mobile browsers
  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-surface-200 px-2 dark:border-surface-700">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-red-500" />
            <span
              className="truncate text-sm font-medium text-surface-600 dark:text-surface-300"
              title={fileName}
            >
              {fileName}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
            <FileText className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
            {fileName}
          </h3>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
            Tap the button below to view this PDF in your device's native viewer.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleOpenInTab}
              className={cn(
                'flex items-center gap-2 rounded-xl px-5 py-2.5',
                'bg-primary-600 text-sm font-medium text-white',
                'transition-colors hover:bg-primary-700 active:bg-primary-700',
                'shadow-sm shadow-primary-500/25'
              )}
            >
              <ExternalLink className="h-4 w-4" />
              Open PDF
            </button>
            <button
              onClick={handleDownload}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5',
                'text-sm font-medium text-surface-600',
                'border border-surface-200 transition-colors',
                'hover:bg-surface-50 dark:border-surface-700',
                'dark:text-surface-300 dark:hover:bg-surface-800'
              )}
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Minimal toolbar: file name + actions */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-surface-200 px-2 shadow-sm dark:border-surface-700">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <span
            className="truncate text-sm font-medium text-surface-600 dark:text-surface-300"
            title={fileName}
          >
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-surface-100/80 p-0.5 dark:bg-surface-800/60">
          <button
            onClick={handleDownload}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-surface-400 transition-colors',
              'hover:bg-surface-100 hover:text-surface-600',
              'dark:hover:bg-surface-700 dark:hover:text-surface-300'
            )}
            title="Download PDF"
            aria-label="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleOpenInTab}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-surface-400 transition-colors',
              'hover:bg-surface-100 hover:text-surface-600',
              'dark:hover:bg-surface-700 dark:hover:text-surface-300'
            )}
            title="Open in new tab"
            aria-label="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Native PDF viewer via iframe — gives full scrolling, zoom, search, print */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-50 dark:bg-surface-900">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-primary-500" />
            <span className="text-xs text-surface-400">Loading PDF...</span>
          </div>
        )}

        <iframe
          src={url}
          title={fileName}
          className="h-full w-full border-0"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  );
}

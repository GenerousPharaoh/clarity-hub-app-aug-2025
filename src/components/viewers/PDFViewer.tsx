import { useState, useCallback } from 'react';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFViewerProps {
  url: string;
  fileName: string;
}

export function PDFViewer({ url, fileName }: PDFViewerProps) {
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
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
          <FileText className="h-7 w-7 text-red-400" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          Failed to Load PDF
        </h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          Your browser couldn't render this PDF inline.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleDownload}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
              'text-xs font-medium text-primary-600',
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
              'text-xs font-medium text-surface-600',
              'transition-colors hover:bg-surface-100',
              'dark:text-surface-400 dark:hover:bg-surface-800'
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Minimal toolbar: file name + actions */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-surface-200 px-2 dark:border-surface-700">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <span
            className="truncate text-xs font-medium text-surface-600 dark:text-surface-300"
            title={fileName}
          >
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
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

import { useState, useCallback } from 'react';
import { ImageOff, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  url: string;
  fileName: string;
}

export function ImageViewer({ url, fileName }: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const toggleZoom = useCallback(() => {
    setIsZoomed((prev) => !prev);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
          <ImageOff className="h-7 w-7 text-red-400" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          Failed to Load Image
        </h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          The image could not be loaded. It may have been moved or deleted.
        </p>
        <p className="mt-1 font-mono text-xs text-surface-500 truncate max-w-full">
          {fileName}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-surface-200 px-3 dark:border-surface-700">
        <span className="truncate text-xs text-surface-500 dark:text-surface-400">
          {fileName}
        </span>
        <button
          onClick={toggleZoom}
          className="flex h-6 w-6 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
          title={isZoomed ? 'Fit to view' : 'Zoom to actual size'}
        >
          {isZoomed ? (
            <ZoomOut className="h-3.5 w-3.5" />
          ) : (
            <ZoomIn className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Image container */}
      <div
        className={cn(
          'flex-1 overflow-auto',
          isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
        )}
        onClick={toggleZoom}
      >
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-primary-500" />
          </div>
        )}
        <img
          src={url}
          alt={fileName}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-all duration-200',
            isLoading && 'hidden',
            isZoomed
              ? 'max-w-none'
              : 'mx-auto max-h-full max-w-full object-contain p-4'
          )}
          draggable={false}
        />
      </div>
    </div>
  );
}

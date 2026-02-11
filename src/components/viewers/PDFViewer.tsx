import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PDFViewerProps {
  url: string;
  fileName: string;
}

const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
const DEFAULT_ZOOM_INDEX = 2; // 1.0

export function PDFViewer({ url, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [fitWidth, setFitWidth] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scale = ZOOM_STEPS[zoomIndex];

  // Observe container width for fit-to-width mode
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
      setIsLoading(false);
      setLoadError(null);
    },
    []
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setLoadError(error.message || 'Failed to load PDF');
    setIsLoading(false);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setFitWidth(false);
    setZoomIndex((prev) => Math.min(ZOOM_STEPS.length - 1, prev + 1));
  }, []);

  const zoomOut = useCallback(() => {
    setFitWidth(false);
    setZoomIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const toggleFitWidth = useCallback(() => {
    setFitWidth((prev) => !prev);
    if (!fitWidth) {
      setZoomIndex(DEFAULT_ZOOM_INDEX);
    }
  }, [fitWidth]);

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
          <svg
            className="h-7 w-7 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          Failed to Load PDF
        </h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-surface-200 px-2 dark:border-surface-700">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="flex h-6 w-6 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-surface-700 dark:hover:text-surface-300"
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[4rem] text-center text-[11px] text-surface-500 dark:text-surface-400">
            {isLoading ? '...' : `${pageNumber} / ${numPages}`}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="flex h-6 w-6 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-surface-700 dark:hover:text-surface-300"
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* File name (center) */}
        <span className="hidden truncate px-2 text-xs text-surface-500 dark:text-surface-400 sm:block" title={fileName}>
          {fileName}
        </span>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={zoomIndex <= 0}
            className="flex h-6 w-6 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30 dark:hover:bg-surface-700 dark:hover:text-surface-300"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3rem] text-center text-[11px] text-surface-500 dark:text-surface-400">
            {fitWidth ? 'Fit' : `${Math.round(scale * 100)}%`}
          </span>
          <button
            onClick={zoomIn}
            disabled={zoomIndex >= ZOOM_STEPS.length - 1}
            className="flex h-6 w-6 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30 dark:hover:bg-surface-700 dark:hover:text-surface-300"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={toggleFitWidth}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded transition-colors',
              fitWidth
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300'
            )}
            title="Fit to width"
            aria-label="Fit to width"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-surface-100 dark:bg-surface-900"
      >
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-primary-500" />
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className="flex flex-col items-center py-4"
        >
          <Page
            pageNumber={pageNumber}
            width={fitWidth && containerWidth > 0 ? containerWidth - 32 : undefined}
            scale={fitWidth ? undefined : scale}
            className="shadow-md"
            loading={
              <div className="flex h-96 w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-surface-200 border-t-primary-500" />
              </div>
            }
          />
        </Document>
      </div>
    </div>
  );
}

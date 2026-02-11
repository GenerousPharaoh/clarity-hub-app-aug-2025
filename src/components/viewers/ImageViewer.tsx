import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ImageOff,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  url: string;
  fileName: string;
}

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const FIT_ZOOM = -1; // sentinel value for "fit to view"

export function ImageViewer({ url, fileName }: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(FIT_ZOOM);
  const [rotation, setRotation] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });

  const isFit = zoom === FIT_ZOOM;
  const displayZoom = isFit ? 'Fit' : `${Math.round(zoom * 100)}%`;

  // Reset pan when switching to fit mode
  useEffect(() => {
    if (isFit) setPanOffset({ x: 0, y: 0 });
  }, [isFit]);

  const zoomIn = useCallback(() => {
    setZoom((prev) => {
      const current = prev === FIT_ZOOM ? 1 : prev;
      const next = ZOOM_LEVELS.find((z) => z > current);
      return next ?? current;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const current = prev === FIT_ZOOM ? 1 : prev;
      const next = [...ZOOM_LEVELS].reverse().find((z) => z < current);
      return next ?? current;
    });
  }, []);

  const fitToView = useCallback(() => {
    setZoom(FIT_ZOOM);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const rotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }, [url, fileName]);

  // Ctrl+scroll wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    },
    [zoomIn, zoomOut]
  );

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isFit) return;
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOffsetStartRef.current = { ...panOffset };
    },
    [isFit, panOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({
        x: panOffsetStartRef.current.x + dx,
        y: panOffsetStartRef.current.y + dy,
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
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
        <p className="mt-1 max-w-full truncate font-mono text-xs text-surface-500">
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

        <div className="flex items-center gap-0.5">
          <ToolbarButton onClick={zoomOut} title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </ToolbarButton>

          <span className="min-w-[3rem] text-center text-[10px] font-medium text-surface-500 dark:text-surface-400">
            {displayZoom}
          </span>

          <ToolbarButton onClick={zoomIn} title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-surface-200 dark:bg-surface-700" />

          <ToolbarButton onClick={fitToView} title="Fit to view" active={isFit}>
            <Maximize className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton onClick={rotate} title="Rotate 90°">
            <RotateCw className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-surface-200 dark:bg-surface-700" />

          <ToolbarButton onClick={handleDownload} title="Download">
            <Download className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-hidden',
          isFit ? 'cursor-zoom-in' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          if (!isPanning && isFit) zoomIn();
        }}
      >
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-primary-500" />
          </div>
        )}
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: isFit
              ? `rotate(${rotation}deg)`
              : `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isPanning ? 'none' : 'transform 0.2s ease',
          }}
        >
          <img
            src={url}
            alt={fileName}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              isLoading && 'hidden',
              isFit ? 'max-h-full max-w-full object-contain p-4' : 'max-w-none'
            )}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded transition-colors',
        active
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
          : 'text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300'
      )}
    >
      {children}
    </button>
  );
}

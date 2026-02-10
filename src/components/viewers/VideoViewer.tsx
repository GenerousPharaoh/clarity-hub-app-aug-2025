import { useState } from 'react';
import { VideoOff } from 'lucide-react';

interface VideoViewerProps {
  url: string;
  fileName: string;
}

export function VideoViewer({ url, fileName }: VideoViewerProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
          <VideoOff className="h-7 w-7 text-red-400" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          Failed to Load Video
        </h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          The video could not be loaded or the format is not supported by your browser.
        </p>
        <p className="mt-1 font-mono text-xs text-surface-500 truncate max-w-full">
          {fileName}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center border-b border-surface-200 px-3 dark:border-surface-700">
        <span className="truncate text-xs text-surface-500 dark:text-surface-400">
          {fileName}
        </span>
      </div>

      {/* Video */}
      <div className="flex flex-1 items-center justify-center bg-black">
        <video
          src={url}
          controls
          className="max-h-full max-w-full"
          onError={() => setHasError(true)}
        >
          Your browser does not support the video element.
        </video>
      </div>
    </div>
  );
}

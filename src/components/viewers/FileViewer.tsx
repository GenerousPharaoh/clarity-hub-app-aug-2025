import { useState, useEffect, useCallback } from 'react';
import useAppStore from '@/store';
import { getFileUrl, getSignedUrl } from '@/services/storageService';
import { getFileType, cn } from '@/lib/utils';
import { FileSearch, RefreshCw } from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import { ImageViewer } from './ImageViewer';
import { AudioViewer } from './AudioViewer';
import { VideoViewer } from './VideoViewer';
import { TextViewer } from './TextViewer';
import { DocumentViewer } from './DocumentViewer';
import { EmptyViewer } from './EmptyViewer';

export function FileViewer() {
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const files = useAppStore((s) => s.files);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const selectedFile = selectedFileId
    ? files.find((f) => f.id === selectedFileId) ?? null
    : null;

  // Determine file type to pick URL strategy
  const fileType = selectedFile ? getFileType(selectedFile.name) : 'unsupported';
  const needsSignedUrl = fileType === 'pdf' || fileType === 'document';

  useEffect(() => {
    if (!selectedFile?.file_path) {
      setFileUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // Use signed URLs for PDFs and documents (iframes need real HTTPS URLs)
    // Use blob URLs for everything else (no CORS issues)
    const fetchUrl = needsSignedUrl
      ? getSignedUrl(selectedFile.file_path, 3600).then((url) => ({ url, error: undefined }))
      : getFileUrl(selectedFile.file_path);

    fetchUrl
      .then(({ url, error: urlError }) => {
        if (cancelled) {
          // Revoke blob URL if the effect was cancelled before we could use it
          if (url && !needsSignedUrl) URL.revokeObjectURL(url);
          return;
        }
        if (urlError || !url) {
          setError(urlError || 'Could not resolve file URL');
          setFileUrl(null);
        } else {
          setFileUrl(url);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to resolve file URL');
        setFileUrl(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      // Revoke previous blob URL to free memory (only for blob URLs)
      if (!needsSignedUrl) {
        setFileUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      } else {
        setFileUrl(null);
      }
    };
  }, [selectedFile?.file_path, retryCount, needsSignedUrl]);

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  // No file selected
  if (!selectedFile) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-700">
          <FileSearch className="h-6 w-6 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          File Viewer
        </h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          Select a file from the left panel to preview it here. Supports PDFs,
          images, documents, audio, and video.
        </p>
      </div>
    );
  }

  // Loading URL — skeleton preview
  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        {/* Skeleton toolbar */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-surface-200 px-3 dark:border-surface-800">
          <div className="h-3 w-40 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="flex gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 w-6 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
            ))}
          </div>
        </div>
        {/* Skeleton content area */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8">
          <div className={cn(
            'flex h-16 w-16 animate-pulse items-center justify-center rounded-xl',
            'bg-surface-100 dark:bg-surface-800'
          )}>
            <FileSearch className="h-7 w-7 text-surface-300 dark:text-surface-600" />
          </div>
          <div className="h-3 w-32 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
        </div>
      </div>
    );
  }

  // Error
  if (error || !fileUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
          <FileSearch className="h-6 w-6 text-red-400" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          File Unavailable
        </h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          {error || 'Could not load this file. It may have been moved or deleted.'}
        </p>
        <button
          onClick={handleRetry}
          className={cn(
            'mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5',
            'text-xs font-medium text-primary-600',
            'transition-colors hover:bg-primary-50',
            'dark:text-primary-400 dark:hover:bg-primary-900/20'
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  // Render the appropriate viewer based on file type
  switch (fileType) {
    case 'pdf':
      return <PDFViewer url={fileUrl} fileName={selectedFile.name} />;
    case 'image':
      return <ImageViewer url={fileUrl} fileName={selectedFile.name} />;
    case 'audio':
      return <AudioViewer url={fileUrl} fileName={selectedFile.name} />;
    case 'video':
      return <VideoViewer url={fileUrl} fileName={selectedFile.name} />;
    case 'text':
      return <TextViewer url={fileUrl} fileName={selectedFile.name} />;
    case 'document':
      return <DocumentViewer url={fileUrl} fileName={selectedFile.name} />;
    default:
      return (
        <EmptyViewer
          fileName={selectedFile.name}
          filePath={selectedFile.file_path}
        />
      );
  }
}

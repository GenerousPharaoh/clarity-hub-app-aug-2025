import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import useAppStore from '@/store';
import { getFileUrl, getSignedUrl } from '@/services/storageService';
import { getFileType } from '@/lib/utils';
import { FileSearch, RefreshCw, Loader2 } from 'lucide-react';
import { ImageViewer } from './ImageViewer';
import { AudioViewer } from './AudioViewer';
import { VideoViewer } from './VideoViewer';
import { TextViewer } from './TextViewer';
import { DocumentViewer } from './DocumentViewer';
import { EmptyViewer } from './EmptyViewer';
import { saveWorkspaceFile } from '@/lib/workspaceSession';

// Lazy-load the annotatable PDF viewer — heavy dependency (pdfjs + highlighter)
const AnnotatablePDFViewer = lazy(async () => {
  try {
    const mod = await import('./AnnotatablePDFViewer');
    return { default: mod.AnnotatablePDFViewer };
  } catch {
    // If chunk fails to load (e.g. new deployment), try one reload
    const reloadKey = 'annotatable-pdf-chunk-reload';
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    }
    // Fallback: wrap the old iframe-based PDFViewer
    const fallback = await import('./PDFViewer');
    const FallbackViewer = (props: {
      url: string;
      fileName: string;
      fileId?: string;
      projectId?: string;
    }) => fallback.PDFViewer({ url: props.url, fileName: props.fileName });
    return { default: FallbackViewer };
  }
});

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

  useEffect(() => {
    if (!selectedFile) return;
    saveWorkspaceFile(selectedFile);
  }, [selectedFile]);

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  // No file selected
  if (!selectedFile) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <FileSearch className="mx-auto h-6 w-6 text-surface-300 dark:text-surface-600" />
          <p className="mt-3 text-sm text-surface-500 dark:text-surface-400">
            Select a file from the left panel to view it here.
          </p>
        </div>
      </div>
    );
  }

  // Loading URL — minimal spinner (no layout-shifting skeleton)
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-surface-300 dark:text-surface-600" />
      </div>
    );
  }

  // Error
  if (error || !fileUrl) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 p-5 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-red-950/40">
            <FileSearch className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="mt-3 font-heading text-base font-semibold text-surface-800 dark:text-surface-100">
            File unavailable
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-surface-500 dark:text-surface-400">
            {error || 'Could not load this file. It may have been moved or deleted.'}
          </p>
          <button
            onClick={handleRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render the appropriate viewer based on file type
  switch (fileType) {
    case 'pdf':
      return (
        <Suspense fallback={null}>
          <AnnotatablePDFViewer
            url={fileUrl}
            fileName={selectedFile.name}
            fileId={selectedFile.id}
            projectId={selectedFile.project_id}
          />
        </Suspense>
      );
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

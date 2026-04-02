import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import useAppStore from '@/store';
import { getFileUrl, getSignedUrl } from '@/services/storageService';
import { getFileType, cn } from '@/lib/utils';
import { FileSearch, MessageSquareText, RefreshCw, Loader2 } from 'lucide-react';
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
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const files = useAppStore((s) => s.files);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setMobileTab = useAppStore((s) => s.setMobileTab);
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
  const recentProjectFiles = files
    .filter((file) => file.project_id === selectedProjectId && !file.is_deleted)
    .sort(
      (a, b) =>
        new Date(b.last_modified ?? b.added_at ?? 0).getTime() -
        new Date(a.last_modified ?? a.added_at ?? 0).getTime()
    )
    .slice(0, 4);

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
      <div className="flex h-full items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-surface-200/80 bg-white p-5 text-center shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
            <FileSearch className="h-6 w-6 text-surface-400 dark:text-surface-500" />
          </div>
          <h3 className="mt-4 font-heading text-base font-semibold text-surface-800 dark:text-surface-100">
            Select a file to view
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-surface-500 dark:text-surface-400">
            Click any file in the left panel to open it here.
          </p>
          {recentProjectFiles.length > 0 && (
            <div className="mt-4 rounded-xl border border-surface-200/80 bg-surface-50 p-3 text-left dark:border-surface-800 dark:bg-surface-950/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Recent files
              </p>
              <div className="mt-2 space-y-1">
                {recentProjectFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => {
                      setSelectedFile(file.id);
                      setRightPanel(true);
                      setRightTab('viewer');
                      setMobileTab('viewer');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    <span className="truncate pr-3 text-sm font-medium text-surface-700 dark:text-surface-200" title={file.name}>
                      {file.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-surface-400 dark:text-surface-500">
                      {file.file_type ?? 'file'}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setRightPanel(true);
                  setRightTab('ai');
                  setMobileTab('viewer');
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
              >
                <MessageSquareText className="h-3 w-3" />
                Open AI chat
              </button>
            </div>
          )}
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
        <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-surface-300 dark:text-surface-600" /></div>}>
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

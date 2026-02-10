import { useState, useEffect } from 'react';
import useAppStore from '@/store';
import { getFileUrl } from '@/services/storageService';
import { getFileType } from '@/lib/utils';
import { FileSearch } from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import { ImageViewer } from './ImageViewer';
import { AudioViewer } from './AudioViewer';
import { VideoViewer } from './VideoViewer';
import { TextViewer } from './TextViewer';
import { EmptyViewer } from './EmptyViewer';

export function FileViewer() {
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const files = useAppStore((s) => s.files);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFile = selectedFileId
    ? files.find((f) => f.id === selectedFileId) ?? null
    : null;

  useEffect(() => {
    if (!selectedFile?.file_path) {
      setFileUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getFileUrl(selectedFile.file_path)
      .then(({ url, error: urlError }) => {
        if (cancelled) return;
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
    };
  }, [selectedFile?.file_path]);

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

  // Loading URL
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-primary-500" />
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
      </div>
    );
  }

  // Determine file type and render the appropriate viewer
  const fileType = getFileType(selectedFile.name);

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
    default:
      return (
        <EmptyViewer
          fileName={selectedFile.name}
          filePath={selectedFile.file_path}
        />
      );
  }
}

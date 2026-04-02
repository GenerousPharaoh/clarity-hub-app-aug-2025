import { FileQuestion, Download } from 'lucide-react';
import { getFileUrl } from '@/services/storageService';
import { useState } from 'react';
import { toast } from 'sonner';

interface EmptyViewerProps {
  fileName: string;
  filePath: string;
}

export function EmptyViewer({ fileName, filePath }: EmptyViewerProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { url } = await getFileUrl(filePath);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        toast.error('Download link unavailable');
      }
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-surface-200/80 bg-white p-5 text-center shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
          <FileQuestion className="h-6 w-6 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="mt-4 font-heading text-base font-semibold text-surface-800 dark:text-surface-100">
          Preview unavailable
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-surface-500 dark:text-surface-400">
          This file type can&apos;t be previewed. Download it to review.
        </p>
        <p className="mt-3 rounded-lg border border-surface-200/80 bg-surface-50 px-3 py-2 font-mono text-xs text-surface-500 [overflow-wrap:anywhere] dark:border-surface-800 dark:bg-surface-950/40 dark:text-surface-400" title={fileName}>
          {fileName}
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-surface-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-surface-700 disabled:opacity-50 dark:bg-white dark:text-surface-900 dark:hover:bg-surface-200"
        >
          <Download className="h-3.5 w-3.5" />
          {downloading ? 'Downloading...' : 'Download file'}
        </button>
      </div>
    </div>
  );
}

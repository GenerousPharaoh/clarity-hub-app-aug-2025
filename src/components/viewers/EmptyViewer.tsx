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
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary-500/20 transition-all hover:bg-primary-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-primary-600 disabled:hover:shadow-sm dark:bg-primary-500 dark:hover:bg-primary-400 dark:focus-visible:ring-offset-surface-900"
        >
          <Download className="h-3.5 w-3.5" />
          {downloading ? 'Downloading...' : 'Download file'}
        </button>
      </div>
    </div>
  );
}

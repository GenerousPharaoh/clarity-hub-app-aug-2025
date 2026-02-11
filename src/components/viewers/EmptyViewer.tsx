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
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-700">
        <FileQuestion className="h-7 w-7 text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
        Preview Unavailable
      </h3>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
        This file type cannot be previewed in the browser.
      </p>
      <p className="mt-1 font-mono text-xs text-surface-500 dark:text-surface-400 truncate max-w-full">
        {fileName}
      </p>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        {downloading ? 'Downloading...' : 'Download File'}
      </button>
    </div>
  );
}

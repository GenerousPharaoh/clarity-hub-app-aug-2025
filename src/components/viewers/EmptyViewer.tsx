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
      <div className="w-full max-w-sm rounded-[26px] border border-surface-200/80 bg-white/88 p-5 text-center shadow-sm dark:border-surface-800 dark:bg-surface-900/78">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
          <FileQuestion className="h-7 w-7 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="mt-4 font-heading text-lg font-semibold text-surface-800 dark:text-surface-100">
          Preview unavailable
        </h3>
        <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
          This file type cannot be previewed in the browser. You can still download it and review it outside the workspace.
        </p>
        <p className="mt-3 rounded-2xl border border-surface-200/80 bg-surface-50/75 px-3 py-2 font-mono text-xs text-surface-500 [overflow-wrap:anywhere] dark:border-surface-800 dark:bg-surface-950/35 dark:text-surface-400">
          {fileName}
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-surface-950 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-surface-800 disabled:opacity-50 dark:bg-white dark:text-surface-950 dark:hover:bg-surface-100"
        >
          <Download className="h-3.5 w-3.5" />
          {downloading ? 'Downloading...' : 'Download file'}
        </button>
      </div>
    </div>
  );
}

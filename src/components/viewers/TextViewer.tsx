import { useState, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';

interface TextViewerProps {
  url: string;
  fileName: string;
}

export function TextViewer({ url, fileName }: TextViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchContent = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (!cancelled) {
          setContent(text);
        }
      } catch (err) {
        console.error('Failed to fetch text file:', err);
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchContent();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-primary-500" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-7 w-7 text-red-400" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          Failed to Load File
        </h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          The file content could not be loaded.
        </p>
      </div>
    );
  }

  const lines = (content ?? '').split('\n');

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-surface-200 px-3 dark:border-surface-700">
        <FileText className="h-3.5 w-3.5 text-surface-400" />
        <span className="truncate text-xs text-surface-500 dark:text-surface-400">
          {fileName}
        </span>
        <span className="ml-auto text-[10px] text-surface-400">
          {lines.length} lines
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-0">
          {/* Line numbers */}
          <div className="sticky left-0 shrink-0 select-none border-r border-surface-200 bg-surface-50 px-3 py-3 text-right dark:border-surface-700 dark:bg-surface-800/50">
            {lines.map((_, i) => (
              <div
                key={i}
                className="font-mono text-[11px] leading-5 text-surface-300 dark:text-surface-500"
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code content */}
          <pre className="flex-1 overflow-x-auto p-3">
            <code className="font-mono text-[11px] leading-5 text-surface-700 dark:text-surface-300">
              {content}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

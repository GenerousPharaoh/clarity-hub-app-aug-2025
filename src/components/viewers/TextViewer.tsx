import { useState, useEffect } from 'react';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';

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
        <Loader2 className="h-5 w-5 animate-spin text-surface-300 dark:text-surface-600" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <h3 className="mt-3 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          Failed to load file
        </h3>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          The file content could not be loaded.
        </p>
      </div>
    );
  }

  const lines = (content ?? '').split('\n');
  const isEmpty = !content || content.trim().length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-surface-200 px-3 dark:border-surface-700">
        <FileText className="h-3.5 w-3.5 text-surface-400" />
        <span className="truncate text-xs text-surface-500 dark:text-surface-400" title={fileName}>
          {fileName}
        </span>
        <span className="ml-auto text-xs text-surface-400">
          {isEmpty ? '0 bytes' : `${lines.length} lines`}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <FileText className="h-8 w-8 text-surface-300 dark:text-surface-600" />
            <p className="mt-3 text-sm font-medium text-surface-500 dark:text-surface-400">
              Empty file
            </p>
            <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
              This file contains no content.
            </p>
          </div>
        ) : (
          <div className="flex min-w-0">
            {/* Line numbers */}
            <div className="sticky left-0 shrink-0 select-none border-r border-surface-200 bg-surface-50 px-3 py-3 text-right dark:border-surface-700 dark:bg-surface-800/50">
              {lines.map((_, i) => (
                <div
                  key={i}
                  className="font-mono text-xs leading-5 text-surface-300 dark:text-surface-500"
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code content */}
            <pre className="flex-1 overflow-x-auto p-3">
              <code className="font-mono text-xs leading-5 text-surface-700 dark:text-surface-300">
                {content}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

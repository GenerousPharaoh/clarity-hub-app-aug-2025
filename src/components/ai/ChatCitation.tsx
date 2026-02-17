import { useCallback, useState } from 'react';
import { FileText, Image, Music, Video, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppStore from '@/store';
import type { ChatSource } from '@/types';

interface ChatCitationProps {
  source: ChatSource;
}

const typeIconMap: Record<string, React.ElementType> = {
  pdf: FileText,
  image: Image,
  audio: Music,
  video: Video,
  document: FileText,
  text: FileText,
};

/**
 * Inline citation chip that appears in AI responses.
 * Clicking opens the source file in the right panel viewer.
 * Hovering shows a tooltip with file details and content preview.
 */
export function ChatCitation({ source }: ChatCitationProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setRightTab = useAppStore((s) => s.setRightTab);

  const IconComponent = typeIconMap[source.fileType || ''] || File;

  const handleClick = useCallback(() => {
    // Open the source file in the right panel
    setSelectedFile(source.fileId);
    setRightPanel(true);
    setRightTab('viewer');
  }, [source.fileId, setSelectedFile, setRightPanel, setRightTab]);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 mx-0.5',
          'text-[11px] font-medium leading-tight',
          'bg-accent-50 text-accent-700 border border-accent-200',
          'hover:bg-accent-100 hover:border-accent-300',
          'dark:bg-accent-900/30 dark:text-accent-300 dark:border-accent-700',
          'dark:hover:bg-accent-900/50 dark:hover:border-accent-600',
          'transition-colors cursor-pointer'
        )}
        title={`View ${source.fileName}`}
      >
        <IconComponent className="h-3 w-3 shrink-0" />
        <span>Source {source.sourceIndex}</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2',
            'rounded-lg border border-surface-200 bg-white p-3 shadow-lg',
            'dark:border-surface-700 dark:bg-surface-800',
            'pointer-events-none'
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <IconComponent className="h-3.5 w-3.5 shrink-0 text-accent-500" />
            <span className="truncate text-xs font-semibold text-surface-700 dark:text-surface-200">
              {source.fileName}
            </span>
          </div>
          {source.pageNumber && (
            <p className="text-[10px] text-surface-500 dark:text-surface-400 mb-1">
              Page {source.pageNumber}
              {source.sectionHeading && ` — ${source.sectionHeading}`}
            </p>
          )}
          {source.contentPreview && (
            <p className="text-[11px] leading-snug text-surface-600 dark:text-surface-300 line-clamp-3">
              {source.contentPreview}
            </p>
          )}
        </div>
      )}
    </span>
  );
}

/**
 * Collapsible sources list shown at the bottom of an assistant message.
 */
export function SourcesList({ sources }: { sources: ChatSource[] }) {
  const [expanded, setExpanded] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 border-t border-surface-100 pt-2 dark:border-surface-700">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1 text-[10px] font-medium text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 transition-colors"
      >
        <span>{expanded ? 'Hide' : 'Show'} {sources.length} source{sources.length !== 1 ? 's' : ''}</span>
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-1">
          {sources.map((source) => (
            <SourceListItem key={source.chunkId} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceListItem({ source }: { source: ChatSource }) {
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const IconComponent = typeIconMap[source.fileType || ''] || File;

  return (
    <button
      type="button"
      onClick={() => {
        setSelectedFile(source.fileId);
        setRightPanel(true);
        setRightTab('viewer');
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left',
        'transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50'
      )}
    >
      <IconComponent className="h-3 w-3 shrink-0 text-surface-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-surface-600 dark:text-surface-300">
          [{source.sourceIndex}] {source.fileName}
        </p>
        {(source.pageNumber || source.sectionHeading) && (
          <p className="text-[10px] text-surface-400 dark:text-surface-500">
            {source.pageNumber ? `Page ${source.pageNumber}` : ''}
            {source.pageNumber && source.sectionHeading ? ' — ' : ''}
            {source.sectionHeading || ''}
          </p>
        )}
      </div>
    </button>
  );
}

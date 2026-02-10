import { useState, useCallback } from 'react';
import useAppStore from '@/store';
import { cn } from '@/lib/utils';
import { ChevronRight, Eye, Sparkles } from 'lucide-react';
import { FileViewer } from '@/components/viewers/FileViewer';
import { AIChatPanel } from '@/components/ai/AIChatPanel';

type Tab = 'viewer' | 'ai';

export function RightPanel() {
  const isOpen = useAppStore((s) => s.isRightPanelOpen);
  const toggleRight = useAppStore((s) => s.toggleRightPanel);
  const [activeTab, setActiveTab] = useState<Tab>('viewer');

  const handleExpand = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      if (!isOpen) toggleRight();
    },
    [isOpen, toggleRight]
  );

  // Collapsed state: thin icon strip
  if (!isOpen) {
    return (
      <div className="flex h-full w-full flex-col items-center gap-1 bg-white py-2 dark:bg-surface-800">
        <button
          onClick={() => handleExpand('viewer')}
          className="flex h-8 w-8 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
          title="Open file viewer"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleExpand('ai')}
          className="flex h-8 w-8 items-center justify-center rounded-md text-accent-500 transition-colors hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-900/30 dark:hover:text-accent-400"
          title="Open AI assistant"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-surface-800">
      {/* Header with tabs and collapse */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-surface-200 dark:border-surface-700">
        <div className="flex h-full items-center gap-0 px-1">
          <TabButton
            active={activeTab === 'viewer'}
            onClick={() => setActiveTab('viewer')}
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Viewer"
          />
          <TabButton
            active={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="AI Chat"
            accent
          />
        </div>
        <button
          onClick={toggleRight}
          className="mr-2 flex h-6 w-6 items-center justify-center rounded text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
          title="Collapse panel"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'viewer' ? <FileViewer /> : <AIChatPanel />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  accent = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  const activeColor = accent
    ? 'text-accent-600 dark:text-accent-400'
    : 'text-primary-600 dark:text-primary-400';

  const indicatorColor = accent
    ? 'bg-accent-600 dark:bg-accent-400'
    : 'bg-primary-600 dark:bg-primary-400';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex h-full items-center gap-1.5 px-3 text-xs font-medium transition-colors',
        active
          ? activeColor
          : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
      )}
    >
      {icon}
      {label}
      {active && (
        <div
          className={cn(
            'absolute bottom-0 left-3 right-3 h-[2px] rounded-full',
            indicatorColor
          )}
        />
      )}
    </button>
  );
}

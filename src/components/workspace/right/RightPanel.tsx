import { useState } from 'react';
import useAppStore from '@/store';
import { cn } from '@/lib/utils';
import { ChevronRight, Eye, Sparkles } from 'lucide-react';
import { FileViewer } from '@/components/viewers/FileViewer';
import { AIChatPanel } from '@/components/ai/AIChatPanel';

type Tab = 'viewer' | 'ai';

export function RightPanel() {
  const toggleRight = useAppStore((s) => s.toggleRightPanel);
  const [activeTab, setActiveTab] = useState<Tab>('viewer');

  return (
    <div className="flex h-full w-full flex-col bg-surface-50 dark:bg-surface-900">
      {/* Header with tabs and collapse */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-surface-200 bg-surface-50/80 dark:border-surface-800 dark:bg-surface-850/50">
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
          className={cn(
            'mr-2 flex h-6 w-6 items-center justify-center rounded-md',
            'text-surface-400 transition-all',
            'hover:bg-surface-100 hover:text-surface-600',
            'dark:hover:bg-surface-800 dark:hover:text-surface-300'
          )}
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

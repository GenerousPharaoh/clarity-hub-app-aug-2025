import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import useAppStore from '@/store';
import { cn } from '@/lib/utils';
import { ChevronRight, Eye, Sparkles } from 'lucide-react';
import { FileViewer } from '@/components/viewers/FileViewer';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { useIsMobile } from '@/hooks/useMediaQuery';

export function RightPanel() {
  const toggleRight = useAppStore((s) => s.toggleRightPanel);
  const activeTab = useAppStore((s) => s.rightTab);
  const setActiveTab = useAppStore((s) => s.setRightTab);
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(0);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const update = () => setPanelWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = panelWidth > 0 && panelWidth < 250;
  const ultraCompact = panelWidth > 0 && panelWidth < 210;

  return (
    <div ref={panelRef} className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-surface-50 dark:bg-surface-900">
      {/* Header with tabs and collapse */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-surface-200 bg-surface-50/80 dark:border-surface-800 dark:bg-surface-850/50">
        <div className={cn('flex h-full items-center gap-0 px-1', ultraCompact && 'px-0.5')} role="tablist" aria-label="Right panel tabs">
          <TabButton
            active={activeTab === 'viewer'}
            onClick={() => setActiveTab('viewer')}
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Viewer"
            controls="panel-viewer"
            showLabel={!compact}
            compact={compact}
          />
          <TabButton
            active={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="AI Chat"
            accent
            controls="panel-ai"
            showLabel={!compact}
            compact={compact}
          />
        </div>
        {!isMobile && !ultraCompact && (
          <button
            onClick={toggleRight}
            className={cn(
              'mr-2 flex h-6 w-6 items-center justify-center rounded-md',
              'text-surface-400 transition-all',
              'hover:bg-surface-100 hover:text-surface-600',
              'dark:hover:bg-surface-800 dark:hover:text-surface-300'
            )}
            title="Collapse panel"
            aria-label="Collapse viewer panel"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col overflow-hidden" role="tabpanel" id={`panel-${activeTab}`} aria-label={activeTab}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex h-full flex-col"
          >
            {activeTab === 'viewer' ? <FileViewer /> : <AIChatPanel />}
          </motion.div>
        </AnimatePresence>
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
  controls,
  showLabel = true,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  controls?: string;
  showLabel?: boolean;
  compact?: boolean;
}) {
  const activeColor = accent
    ? 'text-accent-600 dark:text-accent-400'
    : 'text-primary-600 dark:text-primary-400';

  const indicatorColor = accent
    ? 'bg-accent-600 dark:bg-accent-400'
    : 'bg-primary-600 dark:bg-primary-400';

  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        'relative flex h-full min-w-0 items-center gap-1.5 text-xs font-medium transition-colors',
        compact ? 'px-2' : 'px-2.5',
        active
          ? activeColor
          : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
      )}
      title={label}
    >
      {icon}
      {showLabel && <span className="truncate">{label}</span>}
      {active && (
        <motion.div
          layoutId="right-tab-indicator"
          className={cn(
            'absolute bottom-0 left-3 right-3 h-[2px] rounded-full',
            indicatorColor
          )}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
}

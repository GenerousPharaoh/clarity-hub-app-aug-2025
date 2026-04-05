import { motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import useAppStore from '@/store';
import { cn } from '@/lib/utils';
import { saveWorkspaceView } from '@/lib/workspaceSession';
import { ChevronRight, Eye, Sparkles, Loader2 } from 'lucide-react';
import { FileViewer } from '@/components/viewers/FileViewer';
import { useIsMobile } from '@/hooks/useMediaQuery';

// Lazy-load AI chat panel with auto-reload on stale chunk failure
const AIChatPanel = lazy(() =>
  import('@/components/ai/AIChatPanel')
    .then((m) => ({ default: m.AIChatPanel }))
    .catch(() => {
      if (!sessionStorage.getItem('chunk-reload')) {
        sessionStorage.setItem('chunk-reload', '1');
        window.location.reload();
      }
      return import('@/components/ai/AIChatPanel').then((m) => ({ default: m.AIChatPanel }));
    })
);

export function RightPanel() {
  const toggleRight = useAppStore((s) => s.toggleRightPanel);
  const activeTab = useAppStore((s) => s.rightTab);
  const setActiveTab = useAppStore((s) => s.setRightTab);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const files = useAppStore((s) => s.files);
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(0);
  const selectedFile = selectedFileId
    ? files.find((file) => file.id === selectedFileId) ?? null
    : null;

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const update = () => setPanelWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    saveWorkspaceView({ projectId: selectedProjectId, rightTab: activeTab });
  }, [activeTab, selectedProjectId]);

  const compact = panelWidth > 0 && panelWidth < 320;
  const ultraCompact = panelWidth > 0 && panelWidth < 260;
  const panelLabel =
    activeTab === 'viewer'
      ? selectedFile?.name ?? 'Viewer'
      : 'AI';
  const panelSubtitle =
    activeTab === 'viewer'
      ? selectedFile
        ? selectedFile.file_type ?? 'File'
        : 'No file selected'
      : selectedFile?.name
        ? `Context: ${selectedFile.name}`
        : 'Project chat';

  return (
    <div ref={panelRef} className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-white dark:bg-surface-900">
      {/* Header with tabs and collapse */}
      <div
        className={cn(
          'shrink-0 border-b border-surface-200/80 dark:border-surface-800',
          compact ? 'px-3 py-2' : 'px-3 py-2.5'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="min-w-0 truncate text-sm font-bold text-surface-900 dark:text-surface-100" title={panelLabel}>
              {panelLabel}
            </h2>
            <p className="mt-0.5 truncate text-xs text-surface-400 dark:text-surface-500" title={panelSubtitle}>
              {panelSubtitle}
            </p>
          </div>
          {!isMobile && !ultraCompact && (
            <button
              onClick={toggleRight}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
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

        <div
          className={cn(
            'mt-2 flex items-center gap-0.5 rounded-lg border border-surface-200 bg-surface-50 p-0.5 dark:border-surface-700 dark:bg-surface-800',
            ultraCompact && 'px-0.5'
          )}
          role="tablist"
          aria-label="Right panel tabs"
        >
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
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col overflow-hidden" role="tabpanel" id={`panel-${activeTab}`} aria-label={activeTab}>
          <div key={activeTab} className="flex h-full flex-col animate-in fade-in-0 duration-150">
            {activeTab === 'viewer' ? (
              <FileViewer />
            ) : (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-surface-300 dark:text-surface-600" />
                  </div>
                }
              >
                <AIChatPanel />
              </Suspense>
            )}
          </div>
        
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
    : 'text-surface-900 dark:text-surface-100';

  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        'relative flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all',
        compact ? 'px-1.5' : 'px-3',
        active
          ? activeColor
          : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
      )}
      title={label}
    >
      {active && (
        <motion.span
          layoutId="right-tab-indicator"
          className="absolute inset-0 -z-10 rounded-md bg-white shadow-sm dark:bg-surface-700"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      {icon}
      {showLabel && <span className="truncate">{label}</span>}
    </button>
  );
}

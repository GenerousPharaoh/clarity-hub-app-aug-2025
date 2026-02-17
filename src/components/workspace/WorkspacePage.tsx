import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Panel,
  PanelGroup,
  type ImperativePanelHandle,
} from 'react-resizable-panels';
import { AnimatePresence, motion } from 'framer-motion';
import useAppStore from '@/store';
import { LeftPanel } from './left/LeftPanel';
import { CenterPanel } from './center/CenterPanel';
import { RightPanel } from './right/RightPanel';
import { PanelGrip } from './PanelGrip';
import { CollapsedStrip } from './CollapsedStrip';
import { KeyboardShortcutsHelp } from '@/components/shared/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { FolderOpen, Eye, Sparkles, LayoutList, PanelRight } from 'lucide-react';

export function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const isLeftOpen = useAppStore((s) => s.isLeftPanelOpen);
  const isRightOpen = useAppStore((s) => s.isRightPanelOpen);
  const toggleLeft = useAppStore((s) => s.toggleLeftPanel);
  const toggleRight = useAppStore((s) => s.toggleRightPanel);
  const setLeftPanel = useAppStore((s) => s.setLeftPanel);
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const rightTab = useAppStore((s) => s.rightTab);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const mobileTab = useAppStore((s) => s.mobileTab);
  const setMobileTab = useAppStore((s) => s.setMobileTab);

  const projects = useAppStore((s) => s.projects);
  const projectName = projects.find((p) => p.id === projectId)?.name;
  useDocumentTitle(projectName ?? 'Project');

  const showShortcuts = useAppStore((s) => s.showKeyboardShortcuts);
  const setShowShortcuts = useAppStore((s) => s.setShowKeyboardShortcuts);

  const isMobile = useIsMobile();

  const leftRef = useRef<ImperativePanelHandle>(null);
  const rightRef = useRef<ImperativePanelHandle>(null);

  // Set active project
  useEffect(() => {
    if (projectId) setSelectedProject(projectId);
    return () => setSelectedProject(null);
  }, [projectId, setSelectedProject]);

  // Sync Zustand → panel imperative API (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const p = leftRef.current;
    if (!p) return;
    if (isLeftOpen && p.isCollapsed()) p.expand();
    else if (!isLeftOpen && !p.isCollapsed()) p.collapse();
  }, [isLeftOpen, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const p = rightRef.current;
    if (!p) return;
    if (isRightOpen && p.isCollapsed()) p.expand();
    else if (!isRightOpen && !p.isCollapsed()) p.collapse();
  }, [isRightOpen, isMobile]);

  // Keyboard shortcut handlers
  const handleToggleAIChat = useCallback(() => {
    if (isMobile) {
      setMobileTab('viewer');
      return;
    }
    if (!isRightOpen) {
      setRightPanel(true);
      setRightTab('ai');
    } else if (rightTab !== 'ai') {
      setRightTab('ai');
    } else {
      toggleRight();
    }
  }, [isMobile, isRightOpen, rightTab, setRightPanel, setRightTab, setMobileTab, toggleRight]);

  const shortcutHandlers = useMemo(
    () => ({
      onToggleLeftPanel: isMobile ? () => setMobileTab('files') : toggleLeft,
      onToggleRightPanel: isMobile ? () => setMobileTab('viewer') : toggleRight,
      onToggleAIChat: handleToggleAIChat,
      onShowHelp: () => setShowShortcuts(true),
    }),
    [isMobile, toggleLeft, toggleRight, handleToggleAIChat, setShowShortcuts, setMobileTab]
  );

  useKeyboardShortcuts(shortcutHandlers);

  // ── Mobile Layout ──────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        {/* Active panel with crossfade */}
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mobileTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0"
            >
              {mobileTab === 'files' && <LeftPanel />}
              {mobileTab === 'content' && <CenterPanel />}
              {mobileTab === 'viewer' && <RightPanel />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom tab bar */}
        <nav className="flex shrink-0 border-t border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
          <MobileTabButton
            active={mobileTab === 'files'}
            icon={<FolderOpen className="h-4 w-4" />}
            label="Files"
            onClick={() => setMobileTab('files')}
          />
          <MobileTabButton
            active={mobileTab === 'content'}
            icon={<LayoutList className="h-4 w-4" />}
            label="Content"
            onClick={() => setMobileTab('content')}
          />
          <MobileTabButton
            active={mobileTab === 'viewer'}
            icon={<PanelRight className="h-4 w-4" />}
            label="Viewer"
            onClick={() => setMobileTab('viewer')}
          />
        </nav>

        <KeyboardShortcutsHelp
          open={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      </div>
    );
  }

  // ── Desktop Layout ─────────────────────────────────────
  return (
    <div className="flex h-full">
      {/* Left collapsed strip — outside PanelGroup */}
      <CollapsedStrip side="left" visible={!isLeftOpen}>
        <button
          onClick={() => setLeftPanel(true)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
          title="Open file browser"
        >
          <FolderOpen className="h-4 w-4" />
        </button>
      </CollapsedStrip>

      {/* Main panel group */}
      <PanelGroup
        direction="horizontal"
        autoSaveId="clarity-hub-workspace"
        className="h-full flex-1"
      >
        <Panel
          ref={leftRef}
          id="left"
          order={1}
          defaultSize={20}
          minSize={1}
          collapsible
          collapsedSize={0}
          className="overflow-hidden"
          onCollapse={() => {
            if (useAppStore.getState().isLeftPanelOpen)
              useAppStore.getState().setLeftPanel(false);
          }}
          onExpand={() => {
            if (!useAppStore.getState().isLeftPanelOpen)
              useAppStore.getState().setLeftPanel(true);
          }}
        >
          <LeftPanel />
        </Panel>

        <PanelGrip id="grip-left" />

        <Panel id="center" order={2} defaultSize={45} minSize={20} className="overflow-hidden">
          <CenterPanel />
        </Panel>

        <PanelGrip id="grip-right" />

        <Panel
          ref={rightRef}
          id="right"
          order={3}
          defaultSize={35}
          minSize={1}
          collapsible
          collapsedSize={0}
          className="overflow-hidden"
          onCollapse={() => {
            if (useAppStore.getState().isRightPanelOpen)
              useAppStore.getState().setRightPanel(false);
          }}
          onExpand={() => {
            if (!useAppStore.getState().isRightPanelOpen)
              useAppStore.getState().setRightPanel(true);
          }}
        >
          <RightPanel />
        </Panel>
      </PanelGroup>

      {/* Right collapsed strip — outside PanelGroup */}
      <CollapsedStrip side="right" visible={!isRightOpen}>
        <button
          onClick={() => setRightPanel(true)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
          title="Open file viewer"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => setRightPanel(true)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-accent-500 transition-colors hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-900/30 dark:hover:text-accent-400"
          title="Open AI assistant"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </CollapsedStrip>

      {/* Keyboard shortcuts help dialog */}
      <KeyboardShortcutsHelp
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}

/* ── Mobile Tab Button ───────────────────────────────── */

function MobileTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors',
        active
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-surface-400 dark:text-surface-500'
      )}
    >
      {active && (
        <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary-600 dark:bg-primary-400" />
      )}
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

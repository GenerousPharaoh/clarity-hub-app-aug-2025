import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Panel,
  PanelGroup,
  type ImperativePanelHandle,
} from 'react-resizable-panels';
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
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import { readWorkspaceSession, clearWorkspaceSession, saveWorkspaceProject } from '@/lib/workspaceSession';
import { FolderOpen, Eye, Sparkles, LayoutList, PanelRight } from 'lucide-react';

const COLLAPSE_THRESHOLD = 12; // percent — auto-collapse when shrunk below this

export function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const isLeftOpen = useAppStore((s) => s.isLeftPanelOpen);
  const isRightOpen = useAppStore((s) => s.isRightPanelOpen);
  const toggleLeft = useAppStore((s) => s.toggleLeftPanel);
  const toggleRight = useAppStore((s) => s.toggleRightPanel);
  const setLeftPanel = useAppStore((s) => s.setLeftPanel);
  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setCenterTab = useAppStore((s) => s.setCenterTab);
  const rightTab = useAppStore((s) => s.rightTab);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const mobileTab = useAppStore((s) => s.mobileTab);
  const setMobileTab = useAppStore((s) => s.setMobileTab);
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const requestNewNote = useAppStore((s) => s.requestNewNote);
  const defaultCenterTab = useAppStore((s) => s.defaultCenterTab);

  const projects = useAppStore((s) => s.projects);
  const files = useAppStore((s) => s.files);
  const projectName = projects.find((p) => p.id === projectId)?.name;
  useDocumentTitle(projectName ?? 'Project');

  const { data: notes } = useNotes(projectId ?? null);

  // File count for current project (non-deleted)
  const fileCount = useMemo(
    () => files.filter((f) => f.project_id === projectId && !f.is_deleted).length,
    [files, projectId]
  );
  const noteCount = notes?.length ?? 0;

  // Validate workspace session: clear if the stored project no longer exists
  useEffect(() => {
    if (projects.length === 0) return; // still loading
    const session = readWorkspaceSession();
    if (session && !projects.some((p) => p.id === session.projectId)) {
      clearWorkspaceSession();
    }
  }, [projects]);

  const showShortcuts = useAppStore((s) => s.showKeyboardShortcuts);
  const setShowShortcuts = useAppStore((s) => s.setShowKeyboardShortcuts);

  const isMobile = useIsMobile();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);

  const leftRef = useRef<ImperativePanelHandle>(null);
  const rightRef = useRef<ImperativePanelHandle>(null);
  const didNormalizeInitialLayout = useRef(false);

  // Track previous panel sizes so we can auto-collapse only when SHRINKING
  const prevLeftSize = useRef(20);
  const prevRightSize = useRef(35);

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;

    const update = () => setWorkspaceWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const desktopLayout = useMemo(() => {
    if (workspaceWidth > 0 && workspaceWidth < 1180) {
      return {
        mode: 'compact',
        autoSaveId: 'clarity-hub-workspace-compact',
        leftDefaultSize: 24,
        leftMinSize: 18,
        centerDefaultSize: 52,
        centerMinSize: 38,
        rightDefaultSize: 24,
        rightMinSize: 22,
      };
    }

    if (workspaceWidth > 0 && workspaceWidth >= 1480) {
      return {
        mode: 'wide',
        autoSaveId: 'clarity-hub-workspace-wide',
        leftDefaultSize: 18,
        leftMinSize: 14,
        centerDefaultSize: 46,
        centerMinSize: 32,
        rightDefaultSize: 36,
        rightMinSize: 24,
      };
    }

    return {
      mode: 'standard',
      autoSaveId: 'clarity-hub-workspace-standard',
      leftDefaultSize: 20,
      leftMinSize: 16,
      centerDefaultSize: 45,
      centerMinSize: 32,
      rightDefaultSize: 35,
      rightMinSize: 24,
    };
  }, [workspaceWidth]);

  const handleLayout = useCallback((sizes: number[]) => {
    const leftSize = typeof sizes[0] === 'number' ? sizes[0] : prevLeftSize.current;
    const rightSize = typeof sizes[2] === 'number' ? sizes[2] : prevRightSize.current;

    prevLeftSize.current = leftSize;
    prevRightSize.current = rightSize;

    // Normalize persisted tiny slivers on first layout paint.
    if (didNormalizeInitialLayout.current) return;
    didNormalizeInitialLayout.current = true;

    if (leftSize > 0 && leftSize < COLLAPSE_THRESHOLD) {
      leftRef.current?.collapse();
    }
    if (rightSize > 0 && rightSize < COLLAPSE_THRESHOLD) {
      rightRef.current?.collapse();
    }
  }, []);

  // Set active project
  useEffect(() => {
    if (projectId) setSelectedProject(projectId);
    return () => setSelectedProject(null);
  }, [projectId, setSelectedProject]);

  useEffect(() => {
    if (!projectId) return;

    const session = readWorkspaceSession();
    if (session?.projectId === projectId) {
      setCenterTab(session.centerTab);
      setRightTab(session.rightTab);
      setSelectedFile(session.fileId);

      if (isMobile) {
        if (session.fileId) setMobileTab('viewer');
        else setMobileTab('content');
      } else {
        setRightPanel(Boolean(session.fileId) || session.rightTab === 'ai');
      }
      return;
    }

    setCenterTab(defaultCenterTab);
    setRightTab('viewer');
    setSelectedFile(null);
    if (isMobile) {
        setMobileTab('content');
      return;
      }

    setRightPanel(false);
  }, [projectId, isMobile, defaultCenterTab, setCenterTab, setMobileTab, setRightPanel, setRightTab, setSelectedFile]);

  useEffect(() => {
    if (!projectId || !projectName) return;
    saveWorkspaceProject({ id: projectId, name: projectName });
  }, [projectId, projectName]);

  useEffect(() => {
    didNormalizeInitialLayout.current = false;
  }, [desktopLayout.autoSaveId]);

  useEffect(() => {
    if (isMobile || !selectedFileId) return;
    setRightPanel(true);
  }, [desktopLayout.autoSaveId, isMobile, selectedFileId, setRightPanel]);

  useEffect(() => {
    if (
      isMobile ||
      desktopLayout.mode !== 'compact' ||
      !isRightOpen ||
      selectedFileId ||
      rightTab === 'ai'
    ) {
      return;
    }

    setRightPanel(false);
  }, [desktopLayout.mode, isMobile, isRightOpen, rightTab, selectedFileId, setRightPanel]);

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
      onNewNote: () => {
        setCenterTab('editor');
        setMobileTab('content');
        requestNewNote();
      },
      onShowHelp: () => setShowShortcuts(true),
    }),
    [
      isMobile,
      toggleLeft,
      toggleRight,
      handleToggleAIChat,
      setCenterTab,
      setShowShortcuts,
      setMobileTab,
      requestNewNote,
    ]
  );

  useKeyboardShortcuts(shortcutHandlers);

  // ── Mobile Layout ──────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        {/* Active panel — instant switch, no fade (prevents skeleton flash) */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0">
            {mobileTab === 'files' && <LeftPanel />}
            {mobileTab === 'content' && <CenterPanel />}
            {mobileTab === 'viewer' && <RightPanel />}
          </div>
        </div>

        {/* Bottom tab bar */}
        <nav className="flex shrink-0 border-t border-surface-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-surface-800 dark:bg-surface-900">
          <MobileTabButton
            active={mobileTab === 'files'}
            icon={<FolderOpen className="h-5 w-5" />}
            label="Files"
            badge={fileCount > 0 ? fileCount : undefined}
            onClick={() => setMobileTab('files')}
          />
          <MobileTabButton
            active={mobileTab === 'content'}
            icon={<LayoutList className="h-5 w-5" />}
            label="Content"
            badge={noteCount > 0 ? noteCount : undefined}
            onClick={() => setMobileTab('content')}
          />
          <MobileTabButton
            active={mobileTab === 'viewer'}
            icon={<PanelRight className="h-5 w-5" />}
            label="Viewer"
            onClick={() => { setMobileTab('viewer'); setRightTab('viewer'); }}
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
    <div ref={workspaceRef} className="flex h-full min-w-0">
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
        key={desktopLayout.autoSaveId}
        direction="horizontal"
        autoSaveId={desktopLayout.autoSaveId}
        onLayout={handleLayout}
        className={cn(
          'h-full flex-1',
          desktopLayout.mode === 'compact' && 'workspace-panels-compact',
          desktopLayout.mode === 'wide' && 'workspace-panels-wide'
        )}
      >
        <Panel
          ref={leftRef}
          id="left"
          order={1}
          defaultSize={desktopLayout.leftDefaultSize}
          minSize={desktopLayout.leftMinSize}
          collapsible
          collapsedSize={0}
          className="overflow-hidden"
          onResize={(size: number) => {
            // Auto-collapse when user drags the panel below the useful threshold
            if (prevLeftSize.current >= COLLAPSE_THRESHOLD && size > 0 && size < COLLAPSE_THRESHOLD) {
              leftRef.current?.collapse();
            }
            prevLeftSize.current = size;
          }}
          onCollapse={() => {
            prevLeftSize.current = 0;
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

        <Panel
          id="center"
          order={2}
          defaultSize={desktopLayout.centerDefaultSize}
          minSize={desktopLayout.centerMinSize}
          className="overflow-hidden"
        >
          <CenterPanel />
        </Panel>

        <PanelGrip id="grip-right" />

        <Panel
          ref={rightRef}
          id="right"
          order={3}
          defaultSize={desktopLayout.rightDefaultSize}
          minSize={desktopLayout.rightMinSize}
          collapsible
          collapsedSize={0}
          className="overflow-hidden"
          onResize={(size: number) => {
            if (prevRightSize.current >= COLLAPSE_THRESHOLD && size > 0 && size < COLLAPSE_THRESHOLD) {
              rightRef.current?.collapse();
            }
            prevRightSize.current = size;
          }}
          onCollapse={() => {
            prevRightSize.current = 0;
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
          onClick={() => {
            setRightTab('viewer');
            setRightPanel(true);
          }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
          title="Open file viewer"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setRightTab('ai');
            setRightPanel(true);
          }}
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
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-1 flex-col items-center gap-1 py-3 min-h-[52px] transition-colors',
        active
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-surface-400 dark:text-surface-500'
      )}
    >
      {active && (
        <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary-600 dark:bg-primary-400" />
      )}
      <div className="relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -right-3 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-xs font-semibold leading-none text-white dark:bg-primary-500">
            {badge}
          </span>
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

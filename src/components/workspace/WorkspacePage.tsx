import { useEffect, useRef } from 'react';
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
import { FolderOpen, Eye, Sparkles } from 'lucide-react';

export function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const isLeftOpen = useAppStore((s) => s.isLeftPanelOpen);
  const isRightOpen = useAppStore((s) => s.isRightPanelOpen);
  const setLeftPanel = useAppStore((s) => s.setLeftPanel);
  const setRightPanel = useAppStore((s) => s.setRightPanel);

  const leftRef = useRef<ImperativePanelHandle>(null);
  const rightRef = useRef<ImperativePanelHandle>(null);

  // Set active project
  useEffect(() => {
    if (projectId) setSelectedProject(projectId);
    return () => setSelectedProject(null);
  }, [projectId, setSelectedProject]);

  // Sync Zustand → panel imperative API
  useEffect(() => {
    const p = leftRef.current;
    if (!p) return;
    if (isLeftOpen && p.isCollapsed()) p.expand();
    else if (!isLeftOpen && !p.isCollapsed()) p.collapse();
  }, [isLeftOpen]);

  useEffect(() => {
    const p = rightRef.current;
    if (!p) return;
    if (isRightOpen && p.isCollapsed()) p.expand();
    else if (!isRightOpen && !p.isCollapsed()) p.collapse();
  }, [isRightOpen]);

  return (
    <div className="flex h-full">
      {/* Left collapsed strip — outside PanelGroup */}
      <CollapsedStrip side="left" visible={!isLeftOpen}>
        <button
          onClick={() => setLeftPanel(true)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
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
          minSize={14}
          collapsible
          collapsedSize={0}
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

        <Panel id="center" order={2} defaultSize={45} minSize={30}>
          <CenterPanel />
        </Panel>

        <PanelGrip id="grip-right" />

        <Panel
          ref={rightRef}
          id="right"
          order={3}
          defaultSize={35}
          minSize={20}
          collapsible
          collapsedSize={0}
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
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
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
    </div>
  );
}

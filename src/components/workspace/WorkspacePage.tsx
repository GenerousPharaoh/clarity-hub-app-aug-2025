import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, PanelGroup } from 'react-resizable-panels';
import useAppStore from '@/store';
import { LeftPanel } from './left/LeftPanel';
import { CenterPanel } from './center/CenterPanel';
import { RightPanel } from './right/RightPanel';
import { PanelGrip } from './PanelGrip';

const PANEL_DEFAULTS = {
  left: 20,
  center: 45,
  right: 35,
} as const;

const PANEL_MINS = {
  left: 15,
  center: 30,
  right: 20,
} as const;

const COLLAPSED_SIZE = 3; // % width for collapsed icon strip

export function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const isLeftOpen = useAppStore((s) => s.isLeftPanelOpen);
  const isRightOpen = useAppStore((s) => s.isRightPanelOpen);

  // Refs for imperative panel control
  const leftPanelRef = useRef<import('react-resizable-panels').ImperativePanelHandle>(null);
  const rightPanelRef = useRef<import('react-resizable-panels').ImperativePanelHandle>(null);

  // Set active project on mount / projectId change
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }
    return () => {
      setSelectedProject(null);
    };
  }, [projectId, setSelectedProject]);

  // Sync zustand panel state with react-resizable-panels
  useEffect(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;

    if (isLeftOpen) {
      if (panel.isCollapsed()) {
        panel.expand();
      }
    } else {
      if (!panel.isCollapsed()) {
        panel.collapse();
      }
    }
  }, [isLeftOpen]);

  useEffect(() => {
    const panel = rightPanelRef.current;
    if (!panel) return;

    if (isRightOpen) {
      if (panel.isCollapsed()) {
        panel.expand();
      }
    } else {
      if (!panel.isCollapsed()) {
        panel.collapse();
      }
    }
  }, [isRightOpen]);

  return (
    <div className="h-full w-full">
      <PanelGroup
        direction="horizontal"
        autoSaveId="clarity-hub-workspace"
        className="h-full"
      >
        {/* Left Panel - File Browser */}
        <Panel
          ref={leftPanelRef}
          id="left-panel"
          order={1}
          defaultSize={PANEL_DEFAULTS.left}
          minSize={PANEL_MINS.left}
          collapsible
          collapsedSize={COLLAPSED_SIZE}
          onCollapse={() => {
            const current = useAppStore.getState().isLeftPanelOpen;
            if (current) useAppStore.getState().setLeftPanel(false);
          }}
          onExpand={() => {
            const current = useAppStore.getState().isLeftPanelOpen;
            if (!current) useAppStore.getState().setLeftPanel(true);
          }}
          className="transition-[flex] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <LeftPanel />
        </Panel>

        <PanelGrip id="left-grip" />

        {/* Center Panel - Notes & Overview */}
        <Panel
          id="center-panel"
          order={2}
          defaultSize={PANEL_DEFAULTS.center}
          minSize={PANEL_MINS.center}
        >
          <CenterPanel />
        </Panel>

        <PanelGrip id="right-grip" />

        {/* Right Panel - Viewer & AI Chat */}
        <Panel
          ref={rightPanelRef}
          id="right-panel"
          order={3}
          defaultSize={PANEL_DEFAULTS.right}
          minSize={PANEL_MINS.right}
          collapsible
          collapsedSize={COLLAPSED_SIZE}
          onCollapse={() => {
            const current = useAppStore.getState().isRightPanelOpen;
            if (current) useAppStore.getState().setRightPanel(false);
          }}
          onExpand={() => {
            const current = useAppStore.getState().isRightPanelOpen;
            if (!current) useAppStore.getState().setRightPanel(true);
          }}
          className="transition-[flex] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <RightPanel />
        </Panel>
      </PanelGroup>
    </div>
  );
}

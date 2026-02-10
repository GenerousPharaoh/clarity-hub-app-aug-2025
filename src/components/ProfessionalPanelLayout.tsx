import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, alpha, useTheme } from '@mui/material';

interface ProfessionalPanelLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
  onLeftPanelToggle?: () => void;
  onRightPanelToggle?: () => void;
  onWidthChange?: (widths: { left: number; center: number; right: number }) => void;
  leftPanelCollapsed?: React.ReactNode;
  rightPanelCollapsed?: React.ReactNode;
}

// LocalStorage key for persisting panel widths
const PANEL_WIDTHS_KEY = 'clarity-hub-panel-widths';

// Default widths for different panel configurations
const DEFAULT_WIDTHS = {
  bothOpen: { left: 20, center: 55, right: 25 },
  leftOnly: { left: 22, center: 78, right: 0 },
  rightOnly: { left: 0, center: 75, right: 25 },
  noneOpen: { left: 0, center: 100, right: 0 },
};

// Collapsed sidebar width
const COLLAPSED_WIDTH = 48; // px

// Minimum widths in percentages
const MIN_WIDTHS = { left: 14, center: 30, right: 14 };

// Smooth cubic-bezier for panel animations
const PANEL_TRANSITION = 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)';

/** Read persisted widths (returns null if none saved) */
function loadPersistedWidths(): { left: number; center: number; right: number } | null {
  try {
    const raw = localStorage.getItem(PANEL_WIDTHS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.left === 'number') return parsed;
  } catch { /* ignore */ }
  return null;
}

/** Save widths to localStorage */
function persistWidths(widths: { left: number; center: number; right: number }) {
  try {
    localStorage.setItem(PANEL_WIDTHS_KEY, JSON.stringify(widths));
  } catch { /* ignore */ }
}

const ProfessionalPanelLayout: React.FC<ProfessionalPanelLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
  leftPanelOpen = true,
  rightPanelOpen = true,
  onLeftPanelToggle,
  onRightPanelToggle,
  onWidthChange,
  leftPanelCollapsed,
  rightPanelCollapsed,
}) => {
  const theme = useTheme();

  // Internal open/close state synced with props
  const [isLeftOpen, setIsLeftOpen] = useState(leftPanelOpen);
  const [isRightOpen, setIsRightOpen] = useState(rightPanelOpen);

  useEffect(() => { setIsLeftOpen(leftPanelOpen); }, [leftPanelOpen]);
  useEffect(() => { setIsRightOpen(rightPanelOpen); }, [rightPanelOpen]);

  // Panel widths (percentages for expanded panels)
  const [panelWidths, setPanelWidths] = useState(() => {
    return loadPersistedWidths() || DEFAULT_WIDTHS.bothOpen;
  });

  const [isResizing, setIsResizing] = useState(false);

  // Refs for direct DOM manipulation during drag
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const centerPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef({
    isResizing: false,
    startX: 0,
    startWidths: { left: 20, center: 55, right: 25 },
    panelType: null as 'left' | 'right' | null,
    containerWidth: 0,
  });

  // Calculate panel widths when panels open/close
  const calculateWidths = useCallback((leftOpen: boolean, rightOpen: boolean) => {
    const saved = loadPersistedWidths();
    if (leftOpen && rightOpen) {
      return saved || DEFAULT_WIDTHS.bothOpen;
    } else if (leftOpen && !rightOpen) {
      // Use saved left width, give rest to center
      const leftW = saved ? saved.left : DEFAULT_WIDTHS.leftOnly.left;
      return { left: leftW, center: 100 - leftW, right: 0 };
    } else if (!leftOpen && rightOpen) {
      const rightW = saved ? saved.right : DEFAULT_WIDTHS.rightOnly.right;
      return { left: 0, center: 100 - rightW, right: rightW };
    }
    return DEFAULT_WIDTHS.noneOpen;
  }, []);

  // Recalculate on open/close
  useEffect(() => {
    const newWidths = calculateWidths(isLeftOpen, isRightOpen);
    setPanelWidths(newWidths);
    onWidthChange?.(newWidths);
  }, [isLeftOpen, isRightOpen, calculateWidths, onWidthChange]);

  // Cleanup resize event listeners on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('resizing-panel');
    };
  }, []);

  // --- Resize handler ---
  const createResizeHandler = useCallback((panelType: 'left' | 'right') => {
    let lastClickTime = 0;

    return (e: React.MouseEvent) => {
      // Double-click detection — collapse the panel
      const now = Date.now();
      if (now - lastClickTime < 350) {
        e.preventDefault();
        if (panelType === 'left') onLeftPanelToggle?.();
        else onRightPanelToggle?.();
        lastClickTime = 0;
        return;
      }
      lastClickTime = now;

      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const startX = e.clientX;

      resizeStateRef.current = {
        isResizing: true,
        startX,
        startWidths: { ...panelWidths },
        panelType,
        containerWidth,
      };

      // Disable transitions during drag
      [leftPanelRef, centerPanelRef, rightPanelRef].forEach(ref => {
        if (ref.current) ref.current.style.transition = 'none';
      });

      setIsResizing(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.classList.add('resizing-panel');

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeStateRef.current.isResizing) return;

        requestAnimationFrame(() => {
          const state = resizeStateRef.current;
          const deltaX = moveEvent.clientX - state.startX;
          const deltaPercent = (deltaX / state.containerWidth) * 100;
          const start = state.startWidths;
          const newWidths = { ...start };

          if (panelType === 'left') {
            newWidths.left = Math.max(MIN_WIDTHS.left, Math.min(45, start.left + deltaPercent));
            newWidths.center = start.center - (newWidths.left - start.left);
          } else {
            newWidths.right = Math.max(MIN_WIDTHS.right, Math.min(45, start.right - deltaPercent));
            newWidths.center = start.center + (start.right - newWidths.right);
          }

          // Enforce minimum center width
          if (newWidths.center < MIN_WIDTHS.center) {
            const deficit = MIN_WIDTHS.center - newWidths.center;
            newWidths.center = MIN_WIDTHS.center;
            if (panelType === 'left') {
              newWidths.left = Math.max(MIN_WIDTHS.left, newWidths.left - deficit);
            } else {
              newWidths.right = Math.max(MIN_WIDTHS.right, newWidths.right - deficit);
            }
          }

          // Apply directly to DOM for 60fps
          if (leftPanelRef.current && isLeftOpen) leftPanelRef.current.style.width = `${newWidths.left}%`;
          if (centerPanelRef.current) centerPanelRef.current.style.width = `${newWidths.center}%`;
          if (rightPanelRef.current && isRightOpen) rightPanelRef.current.style.width = `${newWidths.right}%`;
        });
      };

      const handleMouseUp = () => {
        resizeStateRef.current.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('resizing-panel');

        // Re-enable transitions
        [leftPanelRef, centerPanelRef, rightPanelRef].forEach(ref => {
          if (ref.current) ref.current.style.transition = PANEL_TRANSITION;
        });

        // Capture final widths from DOM
        const finalWidths = {
          left: leftPanelRef.current ? parseFloat(leftPanelRef.current.style.width) || panelWidths.left : panelWidths.left,
          center: centerPanelRef.current ? parseFloat(centerPanelRef.current.style.width) || panelWidths.center : panelWidths.center,
          right: rightPanelRef.current ? parseFloat(rightPanelRef.current.style.width) || panelWidths.right : panelWidths.right,
        };

        setPanelWidths(finalWidths);
        persistWidths(finalWidths);
        onWidthChange?.(finalWidths);
        setIsResizing(false);

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  }, [panelWidths, isLeftOpen, isRightOpen, onWidthChange, onLeftPanelToggle, onRightPanelToggle]);

  // Shared resize handle styles
  const resizeHandleSx = {
    width: '8px',
    height: '100%',
    background: 'transparent',
    cursor: 'col-resize',
    position: 'relative' as const,
    zIndex: 50,
    flexShrink: 0,
    transition: 'background-color 150ms ease',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 3,
      height: 28,
      borderRadius: 2,
      bgcolor: alpha(theme.palette.text.disabled, 0.3),
      transition: 'all 150ms ease',
    },
    '&:hover': {
      bgcolor: alpha(theme.palette.primary.main, 0.04),
      '&::after': {
        height: 48,
        width: 4,
        bgcolor: alpha(theme.palette.primary.main, 0.45),
      },
    },
    '&:active': {
      bgcolor: alpha(theme.palette.primary.main, 0.08),
      '&::after': {
        bgcolor: alpha(theme.palette.primary.main, 0.6),
      },
    },
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Left Panel */}
      <Box
        ref={leftPanelRef}
        sx={{
          width: isLeftOpen ? `${panelWidths.left}%` : `${COLLAPSED_WIDTH}px`,
          minWidth: isLeftOpen ? undefined : `${COLLAPSED_WIDTH}px`,
          maxWidth: isLeftOpen ? undefined : `${COLLAPSED_WIDTH}px`,
          height: '100%',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: isResizing ? 'none' : PANEL_TRANSITION,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {isLeftOpen ? leftPanel : leftPanelCollapsed}
      </Box>

      {/* Left Resize Handle */}
      {isLeftOpen && (
        <Box onMouseDown={createResizeHandler('left')} sx={resizeHandleSx} />
      )}

      {/* Center Panel */}
      <Box
        ref={centerPanelRef}
        sx={{
          flex: 1,
          minWidth: 0, // allow flex shrink
          height: '100%',
          overflow: 'hidden',
          bgcolor: 'background.default',
          transition: isResizing ? 'none' : PANEL_TRANSITION,
          position: 'relative',
        }}
      >
        {centerPanel}
      </Box>

      {/* Right Resize Handle */}
      {isRightOpen && (
        <Box onMouseDown={createResizeHandler('right')} sx={resizeHandleSx} />
      )}

      {/* Right Panel */}
      <Box
        ref={rightPanelRef}
        sx={{
          width: isRightOpen ? `${panelWidths.right}%` : `${COLLAPSED_WIDTH}px`,
          minWidth: isRightOpen ? undefined : `${COLLAPSED_WIDTH}px`,
          maxWidth: isRightOpen ? undefined : `${COLLAPSED_WIDTH}px`,
          height: '100%',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
          transition: isResizing ? 'none' : PANEL_TRANSITION,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {isRightOpen ? rightPanel : rightPanelCollapsed}
      </Box>
    </Box>
  );
};

export default ProfessionalPanelLayout;

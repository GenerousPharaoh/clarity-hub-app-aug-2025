import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';

interface ProfessionalPanelLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
  onLeftPanelToggle?: (open: boolean) => void;
  onRightPanelToggle?: (open: boolean) => void;
  onWidthChange?: (widths: { left: number; center: number; right: number }) => void;
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
}) => {
  // Panel visibility states - use props if provided, otherwise internal state
  const [isLeftOpen, setIsLeftOpen] = useState(leftPanelOpen);
  const [isRightOpen, setIsRightOpen] = useState(rightPanelOpen);
  
  // Sync with external props
  useEffect(() => {
    setIsLeftOpen(leftPanelOpen);
  }, [leftPanelOpen]);
  
  useEffect(() => {
    setIsRightOpen(rightPanelOpen);
  }, [rightPanelOpen]);
  
  // Panel width system using percentages that always sum to 100%
  const [panelWidths, setPanelWidths] = useState({
    left: 20,    // 20% when open
    center: 55,  // 55% when both panels open
    right: 25    // 25% when open
  });
  
  const [isResizing, setIsResizing] = useState(false);
  
  // Minimum widths in percentages
  const MIN_WIDTHS = {
    left: 15,
    center: 30,
    right: 15
  };

  // Refs for direct DOM manipulation during resize
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const centerPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef({
    isResizing: false,
    startX: 0,
    startWidths: { left: 20, center: 55, right: 25 },
    panelType: null as 'left' | 'right' | null,
    containerWidth: 0
  });

  // Calculate panel widths when panels open/close
  const calculatePanelWidths = useCallback((leftOpen: boolean, rightOpen: boolean) => {
    if (!leftOpen && !rightOpen) {
      return { left: 20, center: 100, right: 25 };
    } else if (leftOpen && !rightOpen) {
      return { left: 20, center: 80, right: 25 };
    } else if (!leftOpen && rightOpen) {
      return { left: 20, center: 75, right: 25 };
    } else {
      // All panels open - distribute space
      return { left: 20, center: 55, right: 25 };
    }
  }, []);

  // Update panel widths when panels open/close
  useEffect(() => {
    const newWidths = calculatePanelWidths(isLeftOpen, isRightOpen);
    setPanelWidths(newWidths);
    onWidthChange?.(newWidths);
  }, [isLeftOpen, isRightOpen, calculatePanelWidths, onWidthChange]);

  // Cleanup effect for resize event listeners
  useEffect(() => {
    const cleanup = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('resizing-panel');
      setIsResizing(false);
    };

    return cleanup;
  }, []);

  // Resize handler for percentage-based widths
  const createResizeHandler = useCallback((panelType: 'left' | 'right') => {
    return (e: React.MouseEvent) => {
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
        containerWidth
      };
      
      // Disable transitions during resize
      if (leftPanelRef.current) {
        leftPanelRef.current.style.transition = 'none';
      }
      if (centerPanelRef.current) {
        centerPanelRef.current.style.transition = 'none';
      }
      if (rightPanelRef.current) {
        rightPanelRef.current.style.transition = 'none';
      }
      
      setIsResizing(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.classList.add('resizing-panel');
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeStateRef.current.isResizing) return;
        
        requestAnimationFrame(() => {
          const deltaX = moveEvent.clientX - resizeStateRef.current.startX;
          const containerWidth = resizeStateRef.current.containerWidth;
          const deltaPercent = (deltaX / containerWidth) * 100;
          
          const startWidths = resizeStateRef.current.startWidths;
          let newWidths = { ...startWidths };
          
          if (panelType === 'left') {
            // Resizing left affects left and center
            newWidths.left = Math.max(MIN_WIDTHS.left, Math.min(50, startWidths.left + deltaPercent));
            newWidths.center = startWidths.center - (newWidths.left - startWidths.left);
          } else if (panelType === 'right') {
            // Resizing right affects center and right
            newWidths.right = Math.max(MIN_WIDTHS.right, Math.min(50, startWidths.right - deltaPercent));
            const rightDiff = startWidths.right - newWidths.right;
            
            if (isLeftOpen) {
              // Adjust center only
              newWidths.center = startWidths.center + rightDiff;
            } else {
              newWidths.center = startWidths.center + rightDiff;
            }
          }
          
          // Ensure center panel respects minimum
          if (newWidths.center < MIN_WIDTHS.center) {
            const deficit = MIN_WIDTHS.center - newWidths.center;
            newWidths.center = MIN_WIDTHS.center;
            if (panelType === 'left') {
              newWidths.left = Math.max(MIN_WIDTHS.left, newWidths.left - deficit);
            } else {
              newWidths.right = Math.max(MIN_WIDTHS.right, newWidths.right - deficit);
            }
          }
          
          // Apply the new widths directly to DOM
          if (leftPanelRef.current && isLeftOpen) {
            leftPanelRef.current.style.width = `${newWidths.left}%`;
          }
          if (centerPanelRef.current) {
            centerPanelRef.current.style.width = `${newWidths.center}%`;
          }
          if (rightPanelRef.current && isRightOpen) {
            rightPanelRef.current.style.width = `${newWidths.right}%`;
          }
        });
      };
      
      const handleMouseUp = () => {
        resizeStateRef.current.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('resizing-panel');
        
        // Re-enable transitions after resize
        if (leftPanelRef.current) {
          leftPanelRef.current.style.transition = 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)';
        }
        if (centerPanelRef.current) {
          centerPanelRef.current.style.transition = 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)';
        }
        if (rightPanelRef.current) {
          rightPanelRef.current.style.transition = 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        // Update state with final widths
        const finalWidths = {
          left: leftPanelRef.current ? parseFloat(leftPanelRef.current.style.width) : panelWidths.left,
          center: centerPanelRef.current ? parseFloat(centerPanelRef.current.style.width) : panelWidths.center,
          right: rightPanelRef.current ? parseFloat(rightPanelRef.current.style.width) : panelWidths.right,
        };
        setPanelWidths(finalWidths);
        onWidthChange?.(finalWidths);
        setIsResizing(false);
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  }, [panelWidths, isLeftOpen, isRightOpen, onWidthChange]);

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
      {isLeftOpen && (
        <>
          <Box
            ref={leftPanelRef}
            sx={{
              width: `${panelWidths.left}%`,
              height: '100%',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: isResizing ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
            }}
          >
            {leftPanel}
          </Box>

          {/* Left Resize Handle */}
          <Box
            className="panel-resize-handle"
            onMouseDown={createResizeHandler('left')}
            sx={{
              width: '8px',
              height: '100%',
              background: theme => 
                `linear-gradient(90deg, ${theme.palette.primary.main}30 0%, ${theme.palette.primary.light}30 100%)`,
              cursor: 'col-resize',
              position: 'relative',
              zIndex: 50,
              transition: 'background-color 0.2s ease',
              borderRadius: '0 4px 4px 0',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                background: theme => 
                  `linear-gradient(90deg, ${theme.palette.primary.main}50 0%, ${theme.palette.primary.light}50 100%)`,
                '& .grip-icon': {
                  opacity: 1,
                },
              },
              '&:active': {
                background: theme => 
                  `linear-gradient(90deg, ${theme.palette.primary.main}80 0%, ${theme.palette.primary.light}80 100%)`,
              },
            }}
          >
            <DragIndicator 
              className="grip-icon"
              sx={{
                color: 'white',
                opacity: 0.6,
                transition: 'opacity 0.2s',
                pointerEvents: 'none',
                fontSize: 20,
              }}
            />
          </Box>
        </>
      )}

      {/* Center Panel */}
      <Box
        ref={centerPanelRef}
        sx={{
          width: isLeftOpen 
            ? (isRightOpen ? `${panelWidths.center}%` : `${panelWidths.center + panelWidths.right}%`)
            : (isRightOpen ? `${panelWidths.left + panelWidths.center}%` : '100%'),
          height: '100%',
          overflow: 'hidden',
          bgcolor: 'background.default',
          transition: isResizing ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
        }}
      >
        {centerPanel}
      </Box>

      {/* Right Panel */}
      {isRightOpen && (
        <>
          {/* Right Resize Handle */}
          <Box
            className="panel-resize-handle"
            onMouseDown={createResizeHandler('right')}
            sx={{
              width: '8px',
              height: '100%',
              background: theme => 
                `linear-gradient(90deg, ${theme.palette.primary.main}30 0%, ${theme.palette.primary.light}30 100%)`,
              cursor: 'col-resize',
              position: 'relative',
              zIndex: 50,
              transition: 'background-color 0.2s ease',
              borderRadius: '4px 0 0 4px',
              boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                background: theme => 
                  `linear-gradient(90deg, ${theme.palette.primary.main}50 0%, ${theme.palette.primary.light}50 100%)`,
                '& .grip-icon': {
                  opacity: 1,
                },
              },
              '&:active': {
                background: theme => 
                  `linear-gradient(90deg, ${theme.palette.primary.main}80 0%, ${theme.palette.primary.light}80 100%)`,
              },
            }}
          >
            <DragIndicator 
              className="grip-icon"
              sx={{
                color: 'white',
                opacity: 0.6,
                transition: 'opacity 0.2s',
                pointerEvents: 'none',
                fontSize: 20,
              }}
            />
          </Box>

          <Box
            ref={rightPanelRef}
            sx={{
              width: `${panelWidths.right}%`,
              height: '100%',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              borderLeft: '1px solid',
              borderColor: 'divider',
              transition: isResizing ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
            }}
          >
            {rightPanel}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ProfessionalPanelLayout;
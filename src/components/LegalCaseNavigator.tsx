/**
 * LegalCaseNavigator - Sophisticated Three-Panel Layout System
 * "Notion meets LexisNexis" - Professional legal software interface
 * 
 * A sophisticated legal case management interface with three resizable panels:
 * - Left Panel (300px default): File navigation, exhibit management
 * - Center Panel (flex-grow): Rich text editor for legal documents  
 * - Right Panel (400px default): PDF viewer, document preview, media viewer
 * 
 * Key Features:
 * - Panels NEVER disappear when collapsed - they minimize to 48px strips
 * - Smooth 200ms animations with professional easing for premium feel
 * - Drag-to-resize functionality with emerald visual feedback
 * - Keyboard shortcuts: Ctrl/Cmd+1 (left panel), Ctrl/Cmd+3 (right panel)
 * - Proper focus management and accessibility
 * - Sophisticated dark theme with midnight blue and emerald accents
 * 
 * Design System:
 * - Background: #0a0f1b (deep midnight blue)
 * - Panels: #111827 (dark slate) with professional shadows
 * - Primary: #10b981 (emerald green) for trust and sophistication
 * - Secondary: #6366f1 (indigo) for professional accents
 * - Text: #f3f4f6 primary, #9ca3af secondary for optimal contrast
 * - Professional shadows: Enhanced dark mode with emerald glows
 * - Smooth transitions: 200ms cubic-bezier(0.4, 0, 0.2, 1)
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Box, IconButton, Tooltip, Paper } from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight,
  DragIndicator
} from '@mui/icons-material';

interface PanelConfig {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  collapsedWidth: number;
}

interface LegalCaseNavigatorProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftPanelConfig?: Partial<PanelConfig>;
  rightPanelConfig?: Partial<PanelConfig>;
}

const DEFAULT_LEFT_CONFIG: PanelConfig = {
  defaultWidth: 300,
  minWidth: 200,
  maxWidth: 500,
  collapsedWidth: 48
};

const DEFAULT_RIGHT_CONFIG: PanelConfig = {
  defaultWidth: 400,
  minWidth: 300,
  maxWidth: 600,
  collapsedWidth: 48
};

const LegalCaseNavigator: React.FC<LegalCaseNavigatorProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
  leftPanelConfig = {},
  rightPanelConfig = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftResizeRef = useRef<HTMLDivElement>(null);
  const rightResizeRef = useRef<HTMLDivElement>(null);
  
  // Merge configs with defaults
  const leftConfig = useMemo(() => ({ ...DEFAULT_LEFT_CONFIG, ...leftPanelConfig }), [leftPanelConfig]);
  const rightConfig = useMemo(() => ({ ...DEFAULT_RIGHT_CONFIG, ...rightPanelConfig }), [rightPanelConfig]);
  
  // Panel states - panels are never truly hidden, just minimized
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(leftConfig.defaultWidth);
  const [rightWidth, setRightWidth] = useState(rightConfig.defaultWidth);
  
  // Drag states
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  
  // Calculate actual widths (collapsed panels show at collapsedWidth, not 0)
  const actualLeftWidth = leftCollapsed ? leftConfig.collapsedWidth : leftWidth;
  const actualRightWidth = rightCollapsed ? rightConfig.collapsedWidth : rightWidth;
  
  // Handle panel toggle
  const toggleLeftPanel = useCallback(() => {
    setLeftCollapsed(!leftCollapsed);
  }, [leftCollapsed]);
  
  const toggleRightPanel = useCallback(() => {
    setRightCollapsed(!rightCollapsed);
  }, [rightCollapsed]);
  
  // Handle drag start
  const handleDragStart = useCallback((panel: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't allow resizing collapsed panels
    if ((panel === 'left' && leftCollapsed) || (panel === 'right' && rightCollapsed)) {
      return;
    }
    
    setIsDragging(panel);
    setDragStartX(e.clientX);
    setDragStartWidth(panel === 'left' ? leftWidth : rightWidth);
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [leftWidth, rightWidth, leftCollapsed, rightCollapsed]);
  
  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      
      if (isDragging === 'left') {
        const newWidth = Math.min(
          Math.max(dragStartWidth + deltaX, leftConfig.minWidth), 
          leftConfig.maxWidth
        );
        setLeftWidth(newWidth);
      } else {
        const newWidth = Math.min(
          Math.max(dragStartWidth - deltaX, rightConfig.minWidth), 
          rightConfig.maxWidth
        );
        setRightWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartWidth, leftConfig, rightConfig]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          toggleLeftPanel();
          break;
        case '3':
          e.preventDefault();
          toggleRightPanel();
          break;
      }
    }
  }, [toggleLeftPanel, toggleRightPanel]);
  
  // Resize handle component
  const ResizeHandle: React.FC<{
    side: 'left' | 'right';
    collapsed: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
  }> = ({ side, collapsed, onMouseDown }) => {
    if (collapsed) return null;
    
    return (
      <Box
        ref={side === 'left' ? leftResizeRef : rightResizeRef}
        onMouseDown={onMouseDown}
        sx={{
          position: 'absolute',
          [side === 'left' ? 'right' : 'left']: -2,
          top: 0,
          bottom: 0,
          width: 4,
          cursor: 'col-resize',
          zIndex: 10,
          backgroundColor: 'transparent',
          transition: 'all 120ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: '#10b981', // Emerald for resize handle
            '&::after': {
              opacity: 1,
            }
          },
          '&:active': {
            backgroundColor: '#059669', // Darker emerald
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 3,
            height: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 1,
            opacity: isDragging === side ? 1 : 0,
            transition: 'opacity 120ms cubic-bezier(0.4, 0, 0.2, 1)',
          }
        }}
      />
    );
  };
  
  // Toggle button component  
  const ToggleButton: React.FC<{
    side: 'left' | 'right';
    collapsed: boolean;
    onClick: () => void;
  }> = ({ side, collapsed, onClick }) => (
    <Tooltip 
      title={`${collapsed ? 'Expand' : 'Collapse'} ${side} panel (${side === 'left' ? 'Ctrl+1' : 'Ctrl+3'})`}
      placement={side === 'left' ? 'right' : 'left'}
      arrow
    >
      <IconButton
        onClick={onClick}
        size="small"
        sx={{
          position: 'absolute',
          [side === 'left' ? 'right' : 'left']: collapsed ? 8 : 8,
          top: 16,
          width: 32,
          height: 32,
          backgroundColor: '#111827', // Dark slate surface
          border: '1px solid #374151', // Subtle border
          color: '#f3f4f6', // High contrast text
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)', // Enhanced dark shadow
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 20,
          '&:hover': {
            backgroundColor: '#1f2937', // Elevated dark surface
            borderColor: '#10b981', // Emerald border on hover
            transform: 'scale(1.05)',
            boxShadow: '0 6px 25px rgba(16, 185, 129, 0.2)', // Emerald glow
          },
          '&:active': {
            transform: 'scale(0.98)',
          }
        }}
      >
        {side === 'left' ? (
          collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />
        ) : (
          collapsed ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
  
  return (
    <Box
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0f1b', // Deep midnight blue background
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      {/* Left Panel */}
      <Paper
        elevation={0}
        sx={{
          width: actualLeftWidth,
          height: '100%',
          position: 'relative',
          backgroundColor: '#111827', // Dark slate surface
          borderRight: '1px solid #374151', // Subtle border
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', // Enhanced dark shadow
          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <ToggleButton 
          side="left" 
          collapsed={leftCollapsed} 
          onClick={toggleLeftPanel} 
        />
        
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflow: leftCollapsed ? 'hidden' : 'auto',
            opacity: leftCollapsed ? 0 : 1,
            transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#0a0f1b', // Midnight blue track
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#10b981', // Emerald scrollbar
              borderRadius: 3,
              '&:hover': {
                backgroundColor: '#059669', // Darker emerald on hover
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)', // Emerald glow
              }
            },
          }}
        >
          {leftPanel}
        </Box>
        
        <ResizeHandle 
          side="left" 
          collapsed={leftCollapsed}
          onMouseDown={(e) => handleDragStart('left', e)} 
        />
      </Paper>
      
      {/* Center Panel */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          height: '100%',
          backgroundColor: '#111827', // Dark slate surface
          position: 'relative',
          overflow: 'auto',
          zIndex: 0,
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#0a0f1b', // Midnight blue track
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#10b981', // Emerald scrollbar
            borderRadius: 4,
            '&:hover': {
              backgroundColor: '#059669', // Darker emerald on hover
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)', // Emerald glow
            }
          },
        }}
      >
        {centerPanel}
      </Paper>
      
      {/* Right Panel */}
      <Paper
        elevation={0}
        sx={{
          width: actualRightWidth,
          height: '100%',
          position: 'relative',
          backgroundColor: '#111827', // Dark slate surface
          borderLeft: '1px solid #374151', // Subtle border
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', // Enhanced dark shadow
          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <ToggleButton 
          side="right" 
          collapsed={rightCollapsed} 
          onClick={toggleRightPanel} 
        />
        
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflow: rightCollapsed ? 'hidden' : 'auto',
            opacity: rightCollapsed ? 0 : 1,
            transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#0a0f1b', // Midnight blue track
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#10b981', // Emerald scrollbar
              borderRadius: 3,
              '&:hover': {
                backgroundColor: '#059669', // Darker emerald on hover
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)', // Emerald glow
              }
            },
          }}
        >
          {rightPanel}
        </Box>
        
        <ResizeHandle 
          side="right" 
          collapsed={rightCollapsed}
          onMouseDown={(e) => handleDragStart('right', e)} 
        />
      </Paper>
    </Box>
  );
};

export default LegalCaseNavigator;
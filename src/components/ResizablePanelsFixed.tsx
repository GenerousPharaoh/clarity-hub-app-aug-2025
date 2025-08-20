import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface ResizablePanelsProps {
  children: React.ReactNode | React.ReactNode[];
}

const ResizablePanels: React.FC<ResizablePanelsProps> = ({ children }) => {
  const childrenArray = React.Children.toArray(children);
  
  // Panel visibility
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  
  // Panel widths (percentages)
  const [leftWidth, setLeftWidth] = useState(20);
  const [rightWidth, setRightWidth] = useState(25);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle resize drag
  const handleMouseDown = (panel: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(panel);
  };
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const relativeX = ((e.clientX - containerRect.left) / containerWidth) * 100;
      
      if (isDragging === 'left') {
        const newWidth = Math.min(Math.max(relativeX, 15), 40);
        setLeftWidth(newWidth);
      } else if (isDragging === 'right') {
        const newWidth = Math.min(Math.max(100 - relativeX, 15), 40);
        setRightWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Calculate center width
  const centerWidth = 100 - (leftCollapsed ? 0 : leftWidth) - (rightCollapsed ? 0 : rightWidth);
  
  return (
    <Box 
      ref={containerRef}
      sx={{ 
        display: 'flex', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        position: 'relative',
        userSelect: isDragging ? 'none' : 'auto',
        backgroundColor: 'background.default',
      }}
    >
      {/* Left Panel */}
      <Box
        sx={{
          width: leftCollapsed ? '48px' : `${leftWidth}%`,
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          transition: isDragging === 'left' ? 'none' : 'width 0.3s ease',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Collapse button */}
        <Box sx={{ 
          position: 'absolute', 
          right: -12, 
          top: '50%', 
          transform: 'translateY(-50%)',
          zIndex: 15,
        }}>
          <IconButton 
            size="small" 
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            sx={{ 
              width: 24,
              height: 24,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              opacity: 0.7,
              transition: 'opacity 0.2s',
              '&:hover': { 
                backgroundColor: 'background.paper',
                opacity: 1,
              }
            }}
          >
            {leftCollapsed ? <ChevronRight sx={{ fontSize: 16 }} /> : <ChevronLeft sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
        
        {/* Content */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          display: leftCollapsed ? 'none' : 'block',
        }}>
          {childrenArray[0]}
        </Box>
        
        {/* Resize handle */}
        {!leftCollapsed && (
          <Box
            onMouseDown={handleMouseDown('left')}
            sx={{
              position: 'absolute',
              right: -8,
              top: 0,
              bottom: 0,
              width: '16px',
              cursor: 'col-resize',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              '&:hover': { 
                backgroundColor: 'action.hover',
                '& .resize-indicator': {
                  opacity: 1,
                  backgroundColor: 'primary.main',
                }
              },
              '&:active': {
                '& .resize-indicator': {
                  backgroundColor: 'primary.dark',
                  width: '4px',
                }
              }
            }}
          >
            <Box 
              className="resize-indicator"
              sx={{ 
                width: '2px',
                height: '60px',
                backgroundColor: 'divider',
                borderRadius: '4px',
                opacity: 0.5,
                transition: 'all 0.2s ease',
              }} 
            />
          </Box>
        )}
      </Box>

      {/* Center Panel */}
      <Box
        sx={{
          width: `${centerWidth}%`,
          height: '100%',
          overflow: 'auto',
          transition: isDragging ? 'none' : 'width 0.3s ease',
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
          padding: 3,
        }}
      >
        {childrenArray[1]}
      </Box>

      {/* Right Panel */}
      <Box
        sx={{
          width: rightCollapsed ? '48px' : `${rightWidth}%`,
          height: '100%',
          borderLeft: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          transition: isDragging === 'right' ? 'none' : 'width 0.3s ease',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Collapse button */}
        <Box sx={{ 
          position: 'absolute', 
          left: -12, 
          top: '50%', 
          transform: 'translateY(-50%)',
          zIndex: 15,
        }}>
          <IconButton 
            size="small" 
            onClick={() => setRightCollapsed(!rightCollapsed)}
            sx={{ 
              width: 24,
              height: 24,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              opacity: 0.7,
              transition: 'opacity 0.2s',
              '&:hover': { 
                backgroundColor: 'background.paper',
                opacity: 1,
              }
            }}
          >
            {rightCollapsed ? <ChevronLeft sx={{ fontSize: 16 }} /> : <ChevronRight sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
        
        {/* Content */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          display: rightCollapsed ? 'none' : 'block',
        }}>
          {childrenArray[2]}
        </Box>
        
        {/* Resize handle */}
        {!rightCollapsed && (
          <Box
            onMouseDown={handleMouseDown('right')}
            sx={{
              position: 'absolute',
              left: -8,
              top: 0,
              bottom: 0,
              width: '16px',
              cursor: 'col-resize',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              '&:hover': { 
                backgroundColor: 'action.hover',
                '& .resize-indicator': {
                  opacity: 1,
                  backgroundColor: 'primary.main',
                }
              },
              '&:active': {
                '& .resize-indicator': {
                  backgroundColor: 'primary.dark',
                  width: '4px',
                }
              }
            }}
          >
            <Box 
              className="resize-indicator"
              sx={{ 
                width: '2px',
                height: '60px',
                backgroundColor: 'divider',
                borderRadius: '4px',
                opacity: 0.5,
                transition: 'all 0.2s ease',
              }} 
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ResizablePanels;
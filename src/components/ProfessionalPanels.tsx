import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, IconButton, Tooltip, useTheme, alpha, Fade, Zoom } from '@mui/material';
import { 
  KeyboardArrowLeft, 
  KeyboardArrowRight, 
  DragIndicator,
  MenuOpen,
  Menu as MenuIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfessionalPanelsProps {
  children: React.ReactNode | React.ReactNode[];
}

const ProfessionalPanels: React.FC<ProfessionalPanelsProps> = ({ children }) => {
  const theme = useTheme();
  const childrenArray = React.Children.toArray(children);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Panel states
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(360);
  
  // Drag states
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  
  // Animation variants
  const panelVariants = {
    open: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: { 
      opacity: 0,
      x: (side: 'left' | 'right') => side === 'left' ? -20 : 20,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };
  
  // Handle drag start
  const handleDragStart = useCallback((panel: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(panel);
    setDragStartX(e.clientX);
    setDragStartWidth(panel === 'left' ? leftWidth : rightWidth);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftWidth, rightWidth]);
  
  // Handle drag
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      
      if (isDragging === 'left') {
        const newWidth = Math.min(Math.max(dragStartWidth + deltaX, 200), 500);
        setLeftWidth(newWidth);
      } else {
        const newWidth = Math.min(Math.max(dragStartWidth - deltaX, 250), 600);
        setRightWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartWidth]);
  
  // Resize handle component
  const ResizeHandle = ({ side, onMouseDown }: { side: 'left' | 'right', onMouseDown: (e: React.MouseEvent) => void }) => (
    <Box
      onMouseDown={onMouseDown}
      sx={{
        position: 'absolute',
        [side === 'left' ? 'right' : 'left']: -1,
        top: 0,
        bottom: 0,
        width: '3px',
        cursor: 'col-resize',
        zIndex: 100,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: 'transparent',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '-8px',
          right: '-8px',
          backgroundColor: 'transparent',
        },
        '&:hover': {
          backgroundColor: theme.palette.primary.main,
          boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
          '&::after': {
            opacity: 1,
          }
        },
        '&:active': {
          backgroundColor: theme.palette.primary.dark,
          width: '4px',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '3px',
          height: '40px',
          borderRadius: '3px',
          backgroundColor: alpha(theme.palette.divider, 0.4),
          opacity: isDragging === side ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }
      }}
    />
  );
  
  // Toggle button component
  const ToggleButton = ({ side, open, onClick }: { side: 'left' | 'right', open: boolean, onClick: () => void }) => (
    <Tooltip 
      title={`${open ? 'Collapse' : 'Expand'} ${side} panel`} 
      placement={side === 'left' ? 'right' : 'left'}
      arrow
    >
      <IconButton
        onClick={onClick}
        size="small"
        sx={{
          position: 'absolute',
          [side === 'left' ? 'right' : 'left']: open ? 8 : -36,
          top: 16,
          width: 28,
          height: 28,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: theme.shadows[2],
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: open ? 0.7 : 1,
          '&:hover': {
            backgroundColor: theme.palette.background.paper,
            transform: 'scale(1.1)',
            opacity: 1,
            boxShadow: theme.shadows[4],
          },
          zIndex: 50,
        }}
      >
        {side === 'left' ? (
          open ? <KeyboardArrowLeft fontSize="small" /> : <MenuOpen fontSize="small" />
        ) : (
          open ? <KeyboardArrowRight fontSize="small" /> : <MenuIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
  
  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: alpha(theme.palette.background.default, 0.4),
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Left Panel */}
      <AnimatePresence mode="wait">
        <Box
          component={motion.div}
          initial={false}
          animate={{ 
            width: leftOpen ? leftWidth : 0,
            marginRight: leftOpen ? 0 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
            mass: 0.8,
          }}
          sx={{
            height: '100%',
            position: 'relative',
            backgroundColor: theme.palette.background.paper,
            borderRight: leftOpen ? `1px solid ${alpha(theme.palette.divider, 0.08)}` : 'none',
            boxShadow: leftOpen ? `4px 0 24px ${alpha(theme.palette.common.black, 0.04)}` : 'none',
            overflow: 'hidden',
          }}
        >
          <ToggleButton side="left" open={leftOpen} onClick={() => setLeftOpen(!leftOpen)} />
          
          <Fade in={leftOpen} timeout={300}>
            <Box
              sx={{
                width: leftWidth,
                height: '100%',
                overflow: 'auto',
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha(theme.palette.divider, 0.05),
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(theme.palette.divider, 0.2),
                  borderRadius: '3px',
                  '&:hover': {
                    background: alpha(theme.palette.divider, 0.3),
                  }
                },
              }}
            >
              {childrenArray[0]}
            </Box>
          </Fade>
          
          {leftOpen && (
            <ResizeHandle 
              side="left" 
              onMouseDown={(e) => handleDragStart('left', e)} 
            />
          )}
        </Box>
      </AnimatePresence>
      
      {/* Center Panel */}
      <Box
        component={motion.div}
        initial={false}
        animate={{ 
          marginLeft: leftOpen ? 0 : 16,
          marginRight: rightOpen ? 0 : 16,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
        }}
        sx={{
          flex: 1,
          height: '100%',
          overflow: 'auto',
          backgroundColor: alpha(theme.palette.background.default, 0.6),
          position: 'relative',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.divider, 0.05),
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.divider, 0.15),
            borderRadius: '4px',
            '&:hover': {
              background: alpha(theme.palette.divider, 0.25),
            }
          },
        }}
      >
        <Box sx={{ 
          padding: 3,
          minHeight: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.3)} 0%, ${alpha(theme.palette.background.default, 0.5)} 100%)`,
        }}>
          {childrenArray[1]}
        </Box>
      </Box>
      
      {/* Right Panel */}
      <AnimatePresence mode="wait">
        <Box
          component={motion.div}
          initial={false}
          animate={{ 
            width: rightOpen ? rightWidth : 0,
            marginLeft: rightOpen ? 0 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
            mass: 0.8,
          }}
          sx={{
            height: '100%',
            position: 'relative',
            backgroundColor: theme.palette.background.paper,
            borderLeft: rightOpen ? `1px solid ${alpha(theme.palette.divider, 0.08)}` : 'none',
            boxShadow: rightOpen ? `-4px 0 24px ${alpha(theme.palette.common.black, 0.04)}` : 'none',
            overflow: 'hidden',
          }}
        >
          <ToggleButton side="right" open={rightOpen} onClick={() => setRightOpen(!rightOpen)} />
          
          <Fade in={rightOpen} timeout={300}>
            <Box
              sx={{
                width: rightWidth,
                height: '100%',
                overflow: 'auto',
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha(theme.palette.divider, 0.05),
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(theme.palette.divider, 0.2),
                  borderRadius: '3px',
                  '&:hover': {
                    background: alpha(theme.palette.divider, 0.3),
                  }
                },
              }}
            >
              {childrenArray[2]}
            </Box>
          </Fade>
          
          {rightOpen && (
            <ResizeHandle 
              side="right" 
              onMouseDown={(e) => handleDragStart('right', e)} 
            />
          )}
        </Box>
      </AnimatePresence>
    </Box>
  );
};

export default ProfessionalPanels;
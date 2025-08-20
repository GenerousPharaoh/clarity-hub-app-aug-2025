import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight
} from '@mui/icons-material';
import useAppStore from '../store';
import { useShallowAppStore } from '../store';

interface ResizablePanelsProps {
  children: React.ReactNode | React.ReactNode[];
}

const ResizablePanels: React.FC<ResizablePanelsProps> = ({ children }) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Local dragging state
  const [dragging, setDragging] = useState<number | null>(null);
  const [startX, setStartX] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  
  // Use shallow comparison for panel state to prevent unnecessary re-renders
  const {
    isLeftPanelOpen, 
    isRightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    leftPanelWidth,
    centerPanelWidth,
    rightPanelWidth,
    leftPanelPercentage,
    centerPanelPercentage,
    rightPanelPercentage,
    minLeftPanelWidth,
    minCenterPanelWidth,
    minRightPanelWidth,
    setPanelSizes,
    setPanelPercentages
  } = useShallowAppStore(state => ({
    isLeftPanelOpen: state.isLeftPanelOpen,
    isRightPanelOpen: state.isRightPanelOpen,
    toggleLeftPanel: state.toggleLeftPanel,
    toggleRightPanel: state.toggleRightPanel,
    leftPanelWidth: state.leftPanelWidth,
    centerPanelWidth: state.centerPanelWidth,
    rightPanelWidth: state.rightPanelWidth,
    leftPanelPercentage: state.leftPanelPercentage,
    centerPanelPercentage: state.centerPanelPercentage,
    rightPanelPercentage: state.rightPanelPercentage,
    minLeftPanelWidth: state.minLeftPanelWidth,
    minCenterPanelWidth: state.minCenterPanelWidth,
    minRightPanelWidth: state.minRightPanelWidth,
    setPanelSizes: state.setPanelSizes,
    setPanelPercentages: state.setPanelPercentages
  }));
  
  // Make sure we have three children
  const childrenArray = React.Children.toArray(children);
  if (childrenArray.length !== 3) {
    console.warn('ResizablePanels expects exactly 3 children');
  }
  
  // Update container width on window resize only
  useEffect(() => {
    const handleWindowResize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        setContainerWidth(newWidth);
      }
    };
    
    // Set initial width
    handleWindowResize();
    
    // Add resize listener
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []); // Empty dependency array - only run once
  
  // Mouse event handlers for resizing
  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(index);
    setStartX(e.clientX);
  };
  
  // Throttled mouse move handler to improve performance
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragging === null || !containerRef.current) return;
    
    // Get current container width
    const currentContainerWidth = containerRef.current.offsetWidth;
    const deltaX = e.clientX - startX;
    
    // Skip tiny movements for performance
    if (Math.abs(deltaX) < 1) return;
    
    // Resizing the first divider (between left and center panels)
    if (dragging === 0 && isLeftPanelOpen) {
      let newLeftWidth = Math.max(leftPanelWidth + deltaX, minLeftPanelWidth);
      let newCenterWidth = Math.max(centerPanelWidth - deltaX, minCenterPanelWidth);
      
      // If total exceeds container width, adjust proportionally
      const totalWidth = newLeftWidth + newCenterWidth + rightPanelWidth;
      if (totalWidth > currentContainerWidth) {
        const excess = totalWidth - currentContainerWidth;
        // Distribute excess proportionally
        newLeftWidth -= excess * (newLeftWidth / (newLeftWidth + newCenterWidth));
        newCenterWidth -= excess * (newCenterWidth / (newLeftWidth + newCenterWidth));
      }
      
      // Calculate percentages
      const newLeftPercentage = (newLeftWidth / currentContainerWidth) * 100;
      const newCenterPercentage = (newCenterWidth / currentContainerWidth) * 100;
      const newRightPercentage = 100 - newLeftPercentage - newCenterPercentage;
      
      // Update state
      setPanelSizes(newLeftWidth, newCenterWidth, rightPanelWidth);
      setPanelPercentages(newLeftPercentage, newCenterPercentage, newRightPercentage);
      setStartX(e.clientX);
    }
    
    // Resizing the second divider (between center and right panels)
    if (dragging === 1 && isRightPanelOpen) {
      let newCenterWidth = Math.max(centerPanelWidth + deltaX, minCenterPanelWidth);
      let newRightWidth = Math.max(rightPanelWidth - deltaX, minRightPanelWidth);
      
      // If total exceeds container width, adjust proportionally
      const totalWidth = leftPanelWidth + newCenterWidth + newRightWidth;
      if (totalWidth > currentContainerWidth) {
        const excess = totalWidth - currentContainerWidth;
        // Distribute excess proportionally
        newCenterWidth -= excess * (newCenterWidth / (newCenterWidth + newRightWidth));
        newRightWidth -= excess * (newRightWidth / (newCenterWidth + newRightWidth));
      }
      
      // Calculate percentages
      const newLeftPercentage = isLeftPanelOpen 
        ? (leftPanelWidth / currentContainerWidth) * 100 
        : 0;
      const newCenterPercentage = (newCenterWidth / currentContainerWidth) * 100;
      const newRightPercentage = (newRightWidth / currentContainerWidth) * 100;
      
      // Update state
      setPanelSizes(leftPanelWidth, newCenterWidth, newRightWidth);
      setPanelPercentages(newLeftPercentage, newCenterPercentage, newRightPercentage);
      setStartX(e.clientX);
    }
  }, [
    dragging, 
    startX, 
    containerRef, 
    leftPanelWidth, 
    centerPanelWidth, 
    rightPanelWidth,
    minLeftPanelWidth,
    minCenterPanelWidth,
    minRightPanelWidth,
    isLeftPanelOpen,
    isRightPanelOpen,
    setPanelSizes,
    setPanelPercentages,
    leftPanelPercentage,
    rightPanelPercentage
  ]);
  
  const handleMouseUp = () => {
    setDragging(null);
  };
  
  // Add and remove event listeners
  useEffect(() => {
    if (dragging !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove]);
  
  return (
    <Box 
      ref={containerRef} 
      sx={{ 
        display: 'flex', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'background.default',
        borderRadius: theme => theme.shape.borderRadius,
      }}
    >
      {/* Left Panel */}
      <Box 
        sx={{ 
          display: isLeftPanelOpen ? 'flex' : 'none',
          width: isLeftPanelOpen ? `${leftPanelPercentage}%` : '0',
          minWidth: isLeftPanelOpen ? minLeftPanelWidth : 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          flexDirection: 'column',
          transition: isLeftPanelOpen ? 'width 0.3s ease' : 'none',
          borderRight: 1,
          borderColor: 'divider',
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      >
        {childrenArray[0]}
      </Box>
      
      {/* Left Panel Toggle */}
      <Box
        sx={{
          position: 'absolute',
          left: isLeftPanelOpen ? `${leftPanelPercentage}%` : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: theme => theme.zIndex.drawer + 1,
          transition: isLeftPanelOpen ? 'left 0.3s ease' : 'none',
        }}
      >
        <IconButton
          onClick={toggleLeftPanel}
          size="small"
          sx={{
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: '50%',
            boxShadow: 1,
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
            },
          }}
        >
          {isLeftPanelOpen ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Box>
      
      {/* Left Divider */}
      {isLeftPanelOpen && (
        <Box
          sx={{
            position: 'absolute',
            left: `${leftPanelPercentage}%`,
            top: 0,
            bottom: 0,
            width: '5px',
            backgroundColor: 'transparent',
            cursor: 'col-resize',
            zIndex: theme => theme.zIndex.drawer,
            '&:hover': {
              backgroundColor: 'primary.main',
              opacity: 0.3,
            },
            '&:active': {
              backgroundColor: 'primary.main',
              opacity: 0.5,
            },
          }}
          onMouseDown={(e) => handleMouseDown(0, e)}
        />
      )}
      
      {/* Center Panel */}
      <Box
        sx={{
          flexGrow: 1,
          width: `${centerPanelPercentage}%`,
          minWidth: minCenterPanelWidth,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.3s ease',
          backgroundColor: 'background.paper',
          borderRadius: theme => theme.shape.borderRadius,
          borderLeft: isLeftPanelOpen ? 0 : 1,
          borderRight: isRightPanelOpen ? 0 : 1,
          borderColor: 'divider',
        }}
      >
        {childrenArray[1]}
      </Box>
      
      {/* Right Divider */}
      {isRightPanelOpen && (
        <Box
          sx={{
            position: 'absolute',
            right: `${rightPanelPercentage}%`,
            top: 0,
            bottom: 0,
            width: '5px',
            backgroundColor: 'transparent',
            cursor: 'col-resize',
            zIndex: theme => theme.zIndex.drawer,
            '&:hover': {
              backgroundColor: 'primary.main',
              opacity: 0.3,
            },
            '&:active': {
              backgroundColor: 'primary.main',
              opacity: 0.5,
            },
          }}
          onMouseDown={(e) => handleMouseDown(1, e)}
        />
      )}
      
      {/* Right Panel Toggle */}
      <Box
        sx={{
          position: 'absolute',
          right: isRightPanelOpen ? `${rightPanelPercentage}%` : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: theme => theme.zIndex.drawer + 1,
          transition: isRightPanelOpen ? 'right 0.3s ease' : 'none',
        }}
      >
        <IconButton
          onClick={toggleRightPanel}
          size="small"
          sx={{
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: '50%',
            boxShadow: 1,
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
            },
          }}
        >
          {isRightPanelOpen ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>
      
      {/* Right Panel */}
      <Box
        sx={{
          display: isRightPanelOpen ? 'flex' : 'none',
          width: isRightPanelOpen ? `${rightPanelPercentage}%` : '0',
          minWidth: isRightPanelOpen ? minRightPanelWidth : 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          flexDirection: 'column',
          transition: isRightPanelOpen ? 'width 0.3s ease' : 'none',
          borderLeft: 1,
          borderColor: 'divider',
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      >
        {childrenArray[2]}
      </Box>
    </Box>
  );
};

export default ResizablePanels; 
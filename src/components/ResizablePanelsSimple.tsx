import React from 'react';
import { Box } from '@mui/material';

interface ResizablePanelsProps {
  children: React.ReactNode | React.ReactNode[];
}

const ResizablePanels: React.FC<ResizablePanelsProps> = ({ children }) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Left Panel */}
      <Box
        sx={{
          width: '250px',
          minWidth: '200px',
          maxWidth: '400px',
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        {childrenArray[0]}
      </Box>

      {/* Center Panel */}
      <Box
        sx={{
          flex: 1,
          height: '100%',
          overflow: 'auto',
          minWidth: '400px',
        }}
      >
        {childrenArray[1]}
      </Box>

      {/* Right Panel */}
      <Box
        sx={{
          width: '350px',
          minWidth: '300px',
          maxWidth: '500px',
          height: '100%',
          borderLeft: '1px solid',
          borderColor: 'divider',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        {childrenArray[2]}
      </Box>
    </Box>
  );
};

export default ResizablePanels;
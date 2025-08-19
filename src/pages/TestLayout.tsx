import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Stack, Divider, TextField, IconButton } from '@mui/material';
import { Add, Refresh, ChevronLeft, ChevronRight } from '@mui/icons-material';
import ResizablePanels from '../components/ResizablePanels';
import usePanelStore from '../store/panelSlice';

const TestLayout: React.FC = () => {
  const isLeftCollapsed = usePanelStore(state => state.isLeftCollapsed);
  const isRightCollapsed = usePanelStore(state => state.isRightCollapsed);
  const toggleLeftPanel = usePanelStore(state => state.toggleLeftPanel);
  const toggleRightPanel = usePanelStore(state => state.toggleRightPanel);
  
  // Sample content for panels
  const [counter, setCounter] = useState(0);
  
  const handleIncrement = () => {
    setCounter(prev => prev + 1);
  };
  
  // Left panel content
  const LeftPanelContent = (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      data-test="left-panel-content"
    >
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6">Left Panel</Typography>
        <IconButton 
          size="small"
          onClick={toggleLeftPanel}
          data-test="left-panel-toggle-button"
        >
          {isLeftCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>
      
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        <Stack spacing={2}>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            fullWidth
          >
            Add Item
          </Button>
          
          <TextField 
            label="Search" 
            size="small"
            fullWidth
          />
          
          <Divider />
          
          {/* Sample list items */}
          {Array.from({ length: 15 }).map((_, index) => (
            <Paper 
              key={index}
              elevation={1}
              sx={{ p: 2 }}
            >
              <Typography>Item {index + 1}</Typography>
              <Typography variant="body2" color="text.secondary">
                Description for item {index + 1}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
  
  // Center panel content
  const CenterPanelContent = (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      data-test="center-panel-content"
    >
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6">Center Panel</Typography>
      </Box>
      
      <Box 
        sx={{ 
          p: 2, 
          flexGrow: 1, 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h3">Counter: {counter}</Typography>
        <Button 
          variant="contained" 
          onClick={handleIncrement}
          startIcon={<Add />}
        >
          Increment
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => setCounter(0)}
          startIcon={<Refresh />}
        >
          Reset
        </Button>
        
        <Typography sx={{ mt: 4 }}>
          Try collapsing and expanding the left and right panels using the buttons.
        </Typography>
      </Box>
    </Box>
  );
  
  // Right panel content
  const RightPanelContent = (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      data-test="right-panel-content"
    >
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <IconButton 
          size="small"
          onClick={toggleRightPanel}
          data-test="right-panel-toggle-button"
        >
          {isRightCollapsed ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
        <Typography variant="h6">Right Panel</Typography>
      </Box>
      
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        <Typography paragraph>
          This is the right panel content. You can use this area to display details,
          settings, or any secondary information.
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 2 }}>Panel Controls</Typography>
        <Button 
          variant="outlined" 
          onClick={toggleLeftPanel}
          fullWidth
          sx={{ mt: 1 }}
        >
          Toggle Left Panel
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={toggleRightPanel}
          fullWidth
          sx={{ mt: 1 }}
        >
          Toggle Right Panel
        </Button>
        
        <Typography variant="h6" sx={{ mt: 4 }}>Debug Info</Typography>
        <Typography variant="body2">
          Left panel collapsed: {isLeftCollapsed ? 'Yes' : 'No'} <br />
          Right panel collapsed: {isRightCollapsed ? 'Yes' : 'No'} <br />
          Counter value: {counter}
        </Typography>
      </Box>
    </Box>
  );
  
  return (
    <Box sx={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <ResizablePanels
        leftPanel={LeftPanelContent}
        centerPanel={CenterPanelContent}
        rightPanel={RightPanelContent}
        minLeftWidth={200}
        minCenterWidth={400}
        minRightWidth={250}
        initialLeftWidth={250}
        initialRightWidth={300}
      />
    </Box>
  );
};

export default TestLayout; 
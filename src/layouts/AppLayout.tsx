import React from 'react';
import { Box } from '@mui/material';
import ResizablePanels from '../components/ResizablePanels';
import LeftPanel from './panels/LeftPanel';
import CenterPanel from './panels/CenterPanel';
import RightPanelWrapper from './panels/RightPanelWrapper';
import usePanelStore from '../store/panelSlice';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // Access panel state from store
  const isLeftCollapsed = usePanelStore(state => state.isLeftCollapsed);
  const isRightCollapsed = usePanelStore(state => state.isRightCollapsed);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <ResizablePanels
          leftPanel={<LeftPanel isCollapsed={isLeftCollapsed} />}
          centerPanel={children || <CenterPanel />}
          rightPanel={<RightPanelWrapper />}
          minLeftWidth={250}
          minCenterWidth={400}
          minRightWidth={300}
          initialLeftWidth={300}
          initialRightWidth={350}
        />
      </Box>
    </Box>
  );
};

export default AppLayout; 
import * as React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import SimpleDemoEditor from '../../components/SimpleDemoEditor';
import FunctionalEditor from '../../components/FunctionalEditor';
import LegalCaseManager from '../../components/legal/LegalCaseManager';
import CollaborationDashboard from '../../components/collaboration/CollaborationDashboard';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import useAppStore from '../../store';

interface CenterPanelWrapperProps {
  children?: React.ReactNode;
}

const CenterPanelWrapper: React.FC<CenterPanelWrapperProps> = ({ children }) => {
  // Check if we're in demo mode
  const user = useAppStore(state => state.user);
  const isDemoMode = user?.id === '00000000-0000-0000-0000-000000000000';
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme => theme.palette.background.paper,
        borderRadius: 1,
        boxShadow: 1,
      }}
      data-test="center-panel"
    >
      {isDemoMode ? (
        <>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
              }
            }}
          >
            <Tab label="Document Editor" />
            <Tab label="Legal Case Management" />
            <Tab label="Team Collaboration" />
            <Tab label="Analytics Dashboard" />
          </Tabs>
          
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 0 && <FunctionalEditor />}
            {activeTab === 1 && <LegalCaseManager />}
            {activeTab === 2 && <CollaborationDashboard />}
            {activeTab === 3 && <AnalyticsDashboard />}
          </Box>
        </>
      ) : (
        children
      )}
    </Box>
  );
};

export default CenterPanelWrapper; 
import * as React from 'react';
import { Box } from '@mui/material';
import SimpleDemoEditor from '../../components/SimpleDemoEditor';
import useAppStore from '../../store';

interface CenterPanelWrapperProps {
  children?: React.ReactNode;
}

const CenterPanelWrapper: React.FC<CenterPanelWrapperProps> = ({ children }) => {
  // Check if we're in demo mode
  const user = useAppStore(state => state.user);
  const isDemoMode = user?.id === '00000000-0000-0000-0000-000000000000';

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
      {isDemoMode ? <SimpleDemoEditor /> : children}
    </Box>
  );
};

export default CenterPanelWrapper; 
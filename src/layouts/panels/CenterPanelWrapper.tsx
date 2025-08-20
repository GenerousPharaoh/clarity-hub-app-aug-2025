import * as React from 'react';
import { Box } from '@mui/material';
import FunctionalEditor from '../../components/FunctionalEditor';
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
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
      }}
      data-test="center-panel"
    >
      {isDemoMode ? (
        <Box sx={{ 
          flex: 1, 
          overflow: 'hidden',
          p: 2,
        }}>
          <FunctionalEditor />
        </Box>
      ) : (
        children || <Box sx={{ 
          flex: 1, 
          overflow: 'hidden',
          p: 2,
        }}>
          <FunctionalEditor />
        </Box>
      )}
    </Box>
  );
};

export default CenterPanelWrapper; 
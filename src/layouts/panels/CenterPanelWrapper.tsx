import * as React from 'react';
import { Box } from '@mui/material';

interface CenterPanelWrapperProps {
  children?: React.ReactNode;
}

const CenterPanelWrapper: React.FC<CenterPanelWrapperProps> = ({ children }) => {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        color: 'text.primary',
      }}
      data-test="center-panel"
    >
      {children}
    </Box>
  );
};

export default CenterPanelWrapper; 
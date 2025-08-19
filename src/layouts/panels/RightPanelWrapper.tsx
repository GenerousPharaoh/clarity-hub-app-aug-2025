import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import useAppStore from '../../store';
import UniversalFileViewer from '../../components/viewers/UniversalFileViewer';
import AIAssistPanel from '../../components/ai/AIAssistPanel';

const RightPanelWrapper = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Get selected file directly from store
  const selectedFileId = useAppStore((state) => state.selectedFileId);
  const files = useAppStore((state) => state.files);
  
  // Find the selected file details
  const selectedFile = selectedFileId 
    ? files.find(file => file.id === selectedFileId) 
    : null;
  
  // Handle tab change
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
      data-test="right-panel"
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Preview" />
          <Tab label="AI Assist" />
        </Tabs>
      </Box>

      {/* Preview Tab */}
      <Box
        role="tabpanel"
        hidden={activeTab !== 0}
        sx={{ 
          flexGrow: 1, 
          display: activeTab !== 0 ? 'none' : 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {selectedFile ? (
          <UniversalFileViewer file={selectedFile} />
        ) : (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                backgroundColor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(0,0,0,0.02)',
                width: '80%',
                textAlign: 'center',
                borderRadius: 2
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Select a file to view details
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>

      {/* AI Assist Tab */}
      <Box
        role="tabpanel"
        hidden={activeTab !== 1}
        sx={{ 
          flexGrow: 1, 
          display: activeTab !== 1 ? 'none' : 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {selectedFile ? (
          <AIAssistPanel fileId={selectedFile.id} />
        ) : (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                backgroundColor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(0,0,0,0.02)',
                width: '80%',
                textAlign: 'center',
                borderRadius: 2
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Select a file for AI analysis
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RightPanelWrapper; 
import React, { useState, useEffect } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import { Description as FileIcon, Psychology as AIIcon } from '@mui/icons-material';
import useAppStore from '../../store';
import ProfessionalViewerContainer from '../../components/viewers/ProfessionalViewerContainer';
import AdaptiveLegalAIChat from '../../components/ai/AdaptiveLegalAIChat';
import { publicUrl } from '../../utils/publicUrl';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`right-panel-tabpanel-${index}`}
      aria-labelledby={`right-panel-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RightPanelWrapper = () => {
  // Get selected file directly from store
  const selectedFileId = useAppStore((state) => state.selectedFileId);
  const files = useAppStore((state) => state.files);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Professional viewer state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  // Find the selected file details
  const selectedFile = selectedFileId 
    ? files.find(file => file.id === selectedFileId) 
    : null;
  
  // Load file URL for professional viewer
  useEffect(() => {
    const loadFileUrl = async () => {
      if (!selectedFile) {
        setFileUrl(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Generate public URL for the file
        const directUrl = publicUrl(`files/${selectedFile.storage_path}`);

        // For PDF and document files, fetch as blob for better handling
        if (['pdf', 'document'].includes(selectedFile.file_type)) {
          try {
            const response = await fetch(directUrl);
            if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
            const blob = await response.blob();
            setFileUrl(URL.createObjectURL(blob));
          } catch {
            setFileUrl(directUrl);
          }
        } else {
          // For other file types, direct URL is fine
          setFileUrl(directUrl);
        }
        
      } catch (err) {
        console.error('Error loading file URL:', err);
        setError('Error loading file. Please try again later.');
        setFileUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadFileUrl();

    // Cleanup blob URLs on file change
    return () => {
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [selectedFile]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
      data-test="right-panel"
    >
      {/* Tab Navigation */}
      <Paper elevation={0} sx={{ borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ minHeight: 48 }}
        >
          <Tab 
            icon={<FileIcon />} 
            label="Viewer" 
            id="right-panel-tab-0"
            aria-controls="right-panel-tabpanel-0"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<AIIcon />} 
            label="AI Assistant" 
            id="right-panel-tab-1"
            aria-controls="right-panel-tabpanel-1"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Paper>

      {/* File Viewer Tab */}
      <TabPanel value={tabValue} index={0}>
        <ProfessionalViewerContainer
          file={selectedFile}
          fileUrl={fileUrl}
          loading={loading}
          error={error}
        />
      </TabPanel>

      {/* AI Assistant Tab */}
      <TabPanel value={tabValue} index={1}>
        <AdaptiveLegalAIChat />
      </TabPanel>
    </Box>
  );
};

export default RightPanelWrapper; 
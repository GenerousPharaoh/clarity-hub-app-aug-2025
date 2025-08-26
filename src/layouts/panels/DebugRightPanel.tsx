import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import FileViewer from '../../components/viewers/FileViewer';
import { supabaseClient } from '../../lib/supabase';
import storageServiceDebug from '../../services/storageServiceDebug';
import { RefreshOutlined as RefreshIcon } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel component for organizing content
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      style={{ height: 'calc(100% - 48px)', overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DebugRightPanel: React.FC = () => {
  // State for panel content
  const [tabValue, setTabValue] = useState(0);
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get('fileId');
  
  // File state
  const [fileDetails, setFileDetails] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Add debug info with timestamp
  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
  };
  
  // Fetch file details and generate URL
  const fetchFileDetails = async (fileId: string, retryCount = 0) => {
    addDebugInfo(`Fetching file details for ID: ${fileId} (Attempt: ${retryCount + 1})`);
    setLoading(true);
    setErrorMessage('');
    
    try {
      // Step 1: Get basic file metadata
      const { data, error } = await supabaseClient
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();
      
      if (error) {
        addDebugInfo(`Error fetching file details: ${error.message}`);
        throw new Error(`Failed to fetch file details: ${error.message}`);
      }
      
      if (!data) {
        addDebugInfo('File not found');
        throw new Error('File not found');
      }
      
      addDebugInfo(`File metadata retrieved: ${data.name} (${data.content_type})`);
      setFileDetails(data);
      
      // Step 2: Generate URL for storage file
      if (data.storage_path) {
        addDebugInfo(`Getting URL for storage path: ${data.storage_path}`);
        
        const { url: resolvedUrl, error: urlError } = await storageServiceDebug.getFileUrl(data.storage_path);
        
        if (urlError) {
          addDebugInfo(`Error generating URL: ${urlError}`);
          throw new Error(`Failed to generate file URL: ${urlError}`);
        }
        
        if (!resolvedUrl) {
          addDebugInfo('No URL was generated');
          throw new Error('No URL was generated for the file');
        }
        
        addDebugInfo(`URL successfully generated: ${resolvedUrl.substring(0, 60)}...`);
        setFileUrl(resolvedUrl);
      } else {
        addDebugInfo('No storage path found for file');
        throw new Error('No storage path found for file');
      }
      
      setLoading(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      addDebugInfo(`Error: ${errorMsg}`);
      setErrorMessage(errorMsg);
      setLoading(false);
      
      // Retry logic (up to 3 times)
      if (retryCount < 3) {
        addDebugInfo(`Retrying in 2 seconds... (${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchFileDetails(fileId, retryCount + 1);
        }, 2000);
      }
    }
  };
  
  // Try different methods to generate a URL
  const tryAlternativeUrlMethod = async () => {
    if (!fileDetails?.storage_path) {
      addDebugInfo('No storage path available for alternative method');
      return;
    }
    
    addDebugInfo('Trying alternative URL method...');
    setLoading(true);
    
    try {
      // Method 1: Direct URL construction
      const projectId = 'swtkpfpyjjkkemmvkhmz';
      const directUrl = `https://${projectId}.supabase.co/storage/v1/object/public/files/${fileDetails.storage_path}`;
      
      addDebugInfo(`Constructed direct URL: ${directUrl}`);
      
      // Test if the URL is accessible
      const response = await fetch(directUrl, { method: 'HEAD' });
      
      if (response.ok) {
        addDebugInfo(`Direct URL accessible (${response.status})`);
        setFileUrl(directUrl);
        setLoading(false);
        return;
      } else {
        addDebugInfo(`Direct URL not accessible (${response.status})`);
      }
      
      // Method 2: Try download
      addDebugInfo('Trying download method...');
      const { data, error } = await supabaseClient.storage
        .from('files')
        .download(fileDetails.storage_path);
      
      if (error) {
        addDebugInfo(`Download error: ${error.message}`);
      } else if (data) {
        const objectUrl = URL.createObjectURL(data);
        addDebugInfo(`Created object URL from download: ${objectUrl}`);
        setFileUrl(objectUrl);
        setLoading(false);
        return;
      }
      
      // If all methods failed
      setErrorMessage('Could not generate a working URL after multiple attempts');
      setLoading(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      addDebugInfo(`Error in alternative method: ${errorMsg}`);
      setErrorMessage(errorMsg);
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Effect to load file when ID changes
  useEffect(() => {
    if (fileId) {
      fetchFileDetails(fileId);
    } else {
      setFileDetails(null);
      setFileUrl(null);
      setErrorMessage('');
      setDebugInfo([]);
    }
  }, [fileId]);
  
  // Render file content
  const renderFileContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading file...
          </Typography>
        </Box>
      );
    }
    
    if (errorMessage) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof errorMessage === 'string' 
              ? errorMessage 
              : errorMessage instanceof Error 
              ? errorMessage.message 
              : typeof errorMessage === 'object' && errorMessage?.message
              ? String(errorMessage.message)
              : 'An unknown error occurred'
            }
          </Alert>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => fetchFileDetails(fileId || '')}
            sx={{ mr: 1 }}
          >
            Retry
          </Button>
          <Button 
            variant="outlined"
            onClick={tryAlternativeUrlMethod}
          >
            Try Alternative Method
          </Button>
        </Box>
      );
    }
    
    if (!fileDetails) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No file selected. Select a file from the left panel to view its contents.
          </Typography>
        </Box>
      );
    }
    
    if (fileUrl) {
      return (
        <FileViewer 
          url={fileUrl}
          fileName={fileDetails.name}
          fileType={fileDetails.file_type}
          mimeType={fileDetails.content_type}
          onError={(error) => {
            addDebugInfo(`FileViewer error: ${error.message}`);
            setErrorMessage(`Error viewing file: ${error.message}`);
          }}
        />
      );
    }
    
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Unable to generate a URL for this file.
        </Typography>
        <Button 
          variant="outlined" 
          onClick={tryAlternativeUrlMethod}
          sx={{ mt: 2 }}
        >
          Try Alternative Method
        </Button>
      </Box>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Right panel tabs">
          <Tab label="File Viewer" />
          <Tab label="Debug Info" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {renderFileContent()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>Debug Information</Typography>
          
          <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="subtitle1">File Details:</Typography>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {fileDetails ? JSON.stringify(fileDetails, null, 2) : 'No file selected'}
            </pre>
          </Box>
          
          <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="subtitle1">Current URL:</Typography>
            <Typography component="div" style={{ wordBreak: 'break-all' }}>
              {fileUrl || 'No URL generated'}
            </Typography>
          </Box>
          
          <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1">Debug Log:</Typography>
            {debugInfo.map((log, index) => (
              <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace' }}>
                {log}
              </Typography>
            ))}
          </Box>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default DebugRightPanel; 
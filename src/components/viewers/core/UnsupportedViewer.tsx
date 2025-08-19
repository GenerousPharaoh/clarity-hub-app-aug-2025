import React from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import { Download, OpenInNew } from '@mui/icons-material';

interface UnsupportedViewerProps {
  url: string;
  fileName?: string;
  metadata?: Record<string, any>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const UnsupportedViewer: React.FC<UnsupportedViewerProps> = ({
  url,
  fileName,
  metadata,
  onLoad
}) => {
  // Call onLoad immediately since we don't actually load anything
  React.useEffect(() => {
    if (onLoad) onLoad();
  }, [onLoad]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        p: 3,
      }}
    >
      <Alert severity="info" sx={{ width: '100%', maxWidth: 500, mb: 3 }}>
        This file type cannot be previewed directly in the browser.
      </Alert>
      
      <Box sx={{ 
        width: 100, 
        height: 100, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: '50%',
        mb: 3
      }}>
        <Typography variant="h2" color="text.secondary">
          ?
        </Typography>
      </Box>
      
      <Typography variant="h6" gutterBottom>
        {fileName || 'Unknown File'}
      </Typography>
      
      {metadata?.contentType && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Type: {metadata.contentType}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<Download />} 
          href={url} 
          download={fileName}
        >
          Download
        </Button>
        
        <Button 
          variant="outlined" 
          startIcon={<OpenInNew />} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          Open in new tab
        </Button>
      </Box>
    </Box>
  );
};

export default UnsupportedViewer; 
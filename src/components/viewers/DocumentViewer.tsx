import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Paper,
  Button,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  Download, 
  Description,
  Visibility
} from '@mui/icons-material';

interface DocumentViewerProps {
  url: string;
  fileName: string;
  fileType?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, fileName, fileType }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  
  // Determine if we can display text content
  const canDisplayContent = fileType && ['text/plain', 'text/markdown', 'text/csv'].includes(fileType);
  
  // Attempt to fetch text content if supported
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      
      if (!canDisplayContent) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        setTextContent(text);
      } catch (error) {
        console.error('Error fetching document content:', error);
        setError('Failed to load document content. You can still download the file.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [url, canDisplayContent]);
  
  // Handle file download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render plain text content
  const renderTextContent = () => {
    if (!textContent) return null;
    
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          maxHeight: 'calc(100vh - 200px)', 
          overflow: 'auto',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          bgcolor: 'background.default',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          fontSize: '0.9rem',
          lineHeight: 1.5
        }}
      >
        {textContent}
      </Paper>
    );
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        height: '100%',
        p: 3
      }}
      data-test="document-viewer"
    >
      {/* Loading state */}
      {loading && (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading document...
          </Typography>
        </Box>
      )}
      
      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Document content or download prompt */}
      {!loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Document info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fileType || 'Document'} • {fileName.split('.').pop()?.toUpperCase()}
            </Typography>
          </Box>
          
          {/* Document content or preview */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 3 }}>
            {canDisplayContent && textContent ? (
              renderTextContent()
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  p: 5
                }}
              >
                <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Preview not available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  This document type cannot be displayed in the browser.
                  <br />
                  Please download the file to view it.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownload}
                  size="large"
                >
                  Download Document
                </Button>
                <Box sx={{ mt: 3 }}>
                  <Tooltip title="Try online viewer">
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      href={url}
                      target="_blank"
                      size="small"
                    >
                      Open in new tab
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Box>
          
          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default DocumentViewer; 
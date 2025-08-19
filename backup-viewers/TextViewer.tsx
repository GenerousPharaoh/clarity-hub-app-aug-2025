import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';

interface TextViewerProps {
  url: string;
  fileName?: string;
  title?: string;
  alt?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const TextViewer: React.FC<TextViewerProps> = ({ 
  url, 
  fileName, 
  title,
  onLoad, 
  onError 
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch text: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
        
        if (onLoad) {
          onLoad();
        }
      } catch (err) {
        console.error('Error loading text file:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (url) {
      fetchContent();
    }
  }, [url, onLoad, onError]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Failed to load text: {error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          minHeight: '100%', 
          backgroundColor: 'background.paper',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        <Typography 
          component="div" 
          variant="body2" 
          fontFamily="monospace" 
          sx={{ whiteSpace: 'pre-wrap' }}
        >
          {content}
        </Typography>
      </Paper>
    </Box>
  );
};

export default TextViewer;

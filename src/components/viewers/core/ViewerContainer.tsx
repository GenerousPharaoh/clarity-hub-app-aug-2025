import React, { Suspense, useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import ErrorBoundary from '../../ErrorBoundary';

// Define file type enum
export type FileType = 'pdf' | 'image' | 'document' | 'spreadsheet' | 'code' | 'audio' | 'video' | 'text' | 'unknown';

// Create a props interface for the viewer
export interface ViewerProps {
  url: string;
  fileType: FileType;
  fileName?: string;
  metadata?: Record<string, any>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Create a lightweight container component
const ViewerContainer: React.FC<ViewerProps> = ({
  url,
  fileType,
  fileName,
  metadata,
  onLoad,
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // React to URL changes
  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [url]);

  // Dynamically import the correct viewer component based on file type
  const ViewerComponent = React.lazy(() => {
    switch (fileType) {
      case 'pdf':
        return import('./PdfViewer').then(module => ({
          default: module.default || module.PdfViewer
        }));
      case 'image':
        return import('./ImageViewer').then(module => ({
          default: module.default || module.ImageViewer
        }));
      case 'audio':
      case 'video':
        return import('./MediaViewer').then(module => ({
          default: module.default || module.MediaViewer
        }));
      case 'text':
      case 'code':
        return import('./TextViewer').then(module => ({
          default: module.default || module.TextViewer
        }));
      case 'spreadsheet':
        return import('./SpreadsheetViewer').then(module => ({
          default: module.default || module.SpreadsheetViewer
        }));
      case 'document':
        return import('./DocumentViewer').then(module => ({
          default: module.default || module.DocumentViewer
        }));
      default:
        return import('./UnsupportedViewer').then(module => ({
          default: module.default || module.UnsupportedViewer
        }));
    }
  });
  
  const handleError = (error: Error) => {
    console.error(`Viewer error for ${fileType} file:`, error);
    setError(error.message);
    setLoading(false);
    if (onError) onError(error);
  };
  
  const handleLoad = () => {
    setLoading(false);
    if (onLoad) onLoad();
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'background.paper',
      }}
      data-viewer-type={fileType}
      data-test="file-viewer"
    >
      <ErrorBoundary
        onError={handleError}
        fallback={(
          <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error || 'Failed to load file viewer'}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {fileName ? `File: ${fileName}` : 'Please try another file or format'}
            </Typography>
          </Box>
        )}
      >
        <Suspense
          fallback={
            <Box sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress size={40} thickness={4} />
            </Box>
          }
        >
          <ViewerComponent
            url={url}
            fileName={fileName}
            metadata={metadata}
            onLoad={handleLoad}
            onError={handleError}
          />
        </Suspense>
      </ErrorBoundary>
    </Box>
  );
};

export default ViewerContainer; 
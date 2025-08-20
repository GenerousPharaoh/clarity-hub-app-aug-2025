import React from 'react';
import { Box, Paper, Typography, Alert, CircularProgress } from '@mui/material';
import { InsertDriveFile, PictureAsPdf, Image, AudioFile, VideoFile } from '@mui/icons-material';
import ProfessionalPdfViewer from './ProfessionalPdfViewer';
import EnhancedMediaViewer from './EnhancedMediaViewer';
import LinkActivationHandler from './LinkActivationHandler';
import { File } from '../../types';

interface ProfessionalViewerContainerProps {
  file: File | null;
  fileUrl: string | null;
  loading?: boolean;
  error?: string | null;
}

/**
 * ProfessionalViewerContainer - Main container for all professional viewers
 * 
 * Features:
 * - Automatic file type detection and viewer selection
 * - Professional loading and error states
 * - LinkActivation handling for citation jumps
 * - Consistent design system integration
 * - Responsive layout for collapsed/expanded states
 */
const ProfessionalViewerContainer: React.FC<ProfessionalViewerContainerProps> = ({
  file,
  fileUrl,
  loading = false,
  error = null,
}) => {
  // Determine file type for viewer selection
  const getViewerType = (file: File): 'pdf' | 'image' | 'audio' | 'video' | 'document' | 'unsupported' => {
    const fileType = file.file_type.toLowerCase();
    const contentType = file.content_type.toLowerCase();
    
    // PDF files
    if (fileType === 'pdf' || contentType.includes('pdf')) {
      return 'pdf';
    }
    
    // Image files
    if (fileType === 'image' || contentType.startsWith('image/')) {
      return 'image';
    }
    
    // Audio files
    if (fileType === 'audio' || contentType.startsWith('audio/')) {
      return 'audio';
    }
    
    // Video files
    if (fileType === 'video' || contentType.startsWith('video/')) {
      return 'video';
    }
    
    // Document files (fallback to PDF viewer for now)
    if (fileType === 'document' || 
        contentType.includes('word') || 
        contentType.includes('document')) {
      return 'document';
    }
    
    return 'unsupported';
  };

  // Get appropriate icon for file type
  const getFileIcon = (viewerType: string) => {
    switch (viewerType) {
      case 'pdf':
        return <PictureAsPdf sx={{ fontSize: 48, color: '#dc2626' }} />;
      case 'image':
        return <Image sx={{ fontSize: 48, color: '#059669' }} />;
      case 'audio':
        return <AudioFile sx={{ fontSize: 48, color: '#7c3aed' }} />;
      case 'video':
        return <VideoFile sx={{ fontSize: 48, color: '#ea580c' }} />;
      case 'document':
        return <InsertDriveFile sx={{ fontSize: 48, color: '#2563eb' }} />;
      default:
        return <InsertDriveFile sx={{ fontSize: 48, color: '#6b7280' }} />;
    }
  };

  // Professional loading state
  const renderLoadingState = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        p: 4,
      }}
    >
      <CircularProgress
        size={64}
        thickness={4}
        sx={{ 
          color: '#2563eb',
          mb: 3,
        }}
      />
      
      <Typography variant="h6" sx={{ mb: 1, color: '#1f2937' }}>
        Loading Document
      </Typography>
      
      <Typography variant="body2" sx={{ color: '#6b7280', textAlign: 'center', maxWidth: 300 }}>
        Preparing professional viewer for {file?.name || 'document'}...
      </Typography>
      
      {file && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          {getFileIcon(getViewerType(file))}
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#9ca3af' }}>
            {file.exhibit_id && `Exhibit ${file.exhibit_id} • `}
            {file.file_type.toUpperCase()}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Professional error state
  const renderErrorState = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        backgroundColor: '#f8f9fa',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 500,
          textAlign: 'center',
          backgroundColor: 'white',
          border: '1px solid #fecaca',
        }}
      >
        <Alert severity="error" sx={{ mb: 3 }}>
          Document Loading Error
        </Alert>
        
        <Typography variant="h6" gutterBottom sx={{ color: '#dc2626' }}>
          Unable to Load Document
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 3, color: '#6b7280' }}>
          {error || 'The document could not be loaded. Please check the file format and try again.'}
        </Typography>
        
        {file && (
          <Box sx={{ p: 2, backgroundColor: '#f9fafb', borderRadius: 1, mt: 2 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              File: {file.name}<br />
              Type: {file.file_type}<br />
              Size: {(file.size / 1024 / 1024).toFixed(2)} MB
              {file.exhibit_id && <><br />Exhibit: {file.exhibit_id}</>}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );

  // Professional empty state
  const renderEmptyState = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        backgroundColor: '#f8f9fa',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          maxWidth: 400,
          textAlign: 'center',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <InsertDriveFile sx={{ fontSize: 72, color: '#d1d5db' }} />
        </Box>
        
        <Typography variant="h6" gutterBottom sx={{ color: '#374151' }}>
          No Document Selected
        </Typography>
        
        <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
          Select a document from the file browser to view it with professional precision controls.
        </Typography>
        
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Supports PDF, images, audio, video, and document files with citation linking
        </Typography>
      </Paper>
    </Box>
  );

  // Unsupported file type
  const renderUnsupportedState = (viewerType: string) => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        backgroundColor: '#f8f9fa',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 400,
          textAlign: 'center',
          backgroundColor: 'white',
          border: '1px solid #fbbf24',
        }}
      >
        <Box sx={{ mb: 3 }}>
          {getFileIcon('unsupported')}
        </Box>
        
        <Typography variant="h6" gutterBottom sx={{ color: '#92400e' }}>
          Unsupported File Type
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 3, color: '#6b7280' }}>
          This file type is not yet supported by the professional viewer.
        </Typography>
        
        {file && (
          <Box sx={{ p: 2, backgroundColor: '#fef3c7', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: '#92400e' }}>
              File: {file.name}<br />
              Type: {file.file_type}<br />
              Content Type: {file.content_type}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );

  // Main render logic
  const renderViewer = () => {
    // Show loading state
    if (loading) {
      return renderLoadingState();
    }

    // Show error state
    if (error) {
      return renderErrorState();
    }

    // Show empty state
    if (!file || !fileUrl) {
      return renderEmptyState();
    }

    // Determine viewer type and render appropriate viewer
    const viewerType = getViewerType(file);

    switch (viewerType) {
      case 'pdf':
        return (
          <ProfessionalPdfViewer
            url={fileUrl}
            fileName={file.name}
          />
        );

      case 'image':
        return (
          <EnhancedMediaViewer
            url={fileUrl}
            fileType="image"
            fileName={file.name}
          />
        );

      case 'audio':
        return (
          <EnhancedMediaViewer
            url={fileUrl}
            fileType="audio"
            fileName={file.name}
          />
        );

      case 'video':
        return (
          <EnhancedMediaViewer
            url={fileUrl}
            fileType="video"
            fileName={file.name}
          />
        );

      case 'document':
        // For now, try to render documents as PDFs
        // In the future, could add dedicated document viewers
        return (
          <ProfessionalPdfViewer
            url={fileUrl}
            fileName={file.name}
          />
        );

      default:
        return renderUnsupportedState(viewerType);
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <LinkActivationHandler>
        {renderViewer()}
      </LinkActivationHandler>
    </Box>
  );
};

export default ProfessionalViewerContainer;
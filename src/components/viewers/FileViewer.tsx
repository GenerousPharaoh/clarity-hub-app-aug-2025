import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import EnhancedPdfViewer from './EnhancedPdfViewer';
import EnhancedImageViewer from './EnhancedImageViewer';
import AudioVideoViewer from './AudioVideoViewer';
import { LinkActivation } from '../../types';

export type SupportedFileType = 'pdf' | 'image' | 'audio' | 'video' | 'text' | 'other';

interface FileViewerProps {
  url: string;
  fileType: string;
  contentType: string;
  fileName: string;
  onLinkUpdate?: (updates: Partial<LinkActivation>) => void;
  zoom?: number;
  rotation?: number;
  onZoomChange?: (zoom: number) => void;
  onRotationChange?: (rotation: number) => void;
  viewerRef?: React.RefObject<any>;
}

export default function FileViewer({
  url,
  fileType,
  contentType,
  fileName,
  onLinkUpdate,
  zoom = 1,
  rotation = 0,
  onZoomChange,
  onRotationChange,
  viewerRef
}: FileViewerProps) {
  // Determine the viewer type based on content type
  const getViewerType = (): SupportedFileType => {
    if (contentType.includes('pdf')) return 'pdf';
    if (contentType.includes('image')) return 'image';
    if (contentType.includes('audio')) return 'audio';
    if (contentType.includes('video')) return 'video';
    if (contentType.includes('text')) return 'text';
    return 'other';
  };

  const viewerType = getViewerType();

  // Render the appropriate viewer based on file type
  switch (viewerType) {
    case 'pdf':
      return (
        <EnhancedPdfViewer
          url={url}
          fileName={fileName}
          zoom={zoom}
          rotation={rotation}
          onZoomChange={onZoomChange}
          onRotationChange={onRotationChange}
          onLinkUpdate={onLinkUpdate}
          ref={viewerRef}
        />
      );
    case 'image':
      return (
        <EnhancedImageViewer
          url={url}
          fileName={fileName}
          zoom={zoom}
          rotation={rotation}
          onZoomChange={onZoomChange}
          onRotationChange={onRotationChange}
          onLinkUpdate={onLinkUpdate}
          ref={viewerRef}
        />
      );
    case 'audio':
    case 'video':
      return (
        <AudioVideoViewer
          url={url}
          fileName={fileName}
          isVideo={viewerType === 'video'}
          onLinkUpdate={onLinkUpdate}
          ref={viewerRef}
        />
      );
    case 'text':
      return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <iframe 
            src={url} 
            title={fileName}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </Box>
      );
    default:
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            p: 3
          }}
        >
          <Typography variant="h6" gutterBottom>
            Preview not available
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            This file type cannot be previewed directly
          </Typography>
          <Button 
            variant="contained" 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            download={fileName}
          >
            Download File
          </Button>
        </Box>
      );
  }
} 
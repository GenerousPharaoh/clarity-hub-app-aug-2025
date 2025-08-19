import React, { useState } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Divider, Stack } from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  ContentCopy,
  PictureAsPdf,
  Image,
  Description,
  MusicNote,
  VideoLibrary,
  Code
} from '@mui/icons-material';

interface MockFileViewerProps {
  fileName: string;
  fileType: string;
  onCopyLink?: () => void;
}

const MockFileViewer: React.FC<MockFileViewerProps> = ({ 
  fileName,
  fileType,
  onCopyLink
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Handle zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  // Handle rotation
  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Get the appropriate file icon based on file type
  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return <PictureAsPdf sx={{ fontSize: 64 }} />;
      case 'image':
        return <Image sx={{ fontSize: 64 }} />;
      case 'document':
        return <Description sx={{ fontSize: 64 }} />;
      case 'audio':
        return <MusicNote sx={{ fontSize: 64 }} />;
      case 'video':
        return <VideoLibrary sx={{ fontSize: 64 }} />;
      case 'code':
        return <Code sx={{ fontSize: 64 }} />;
      default:
        return <Description sx={{ fontSize: 64 }} />;
    }
  };

  // Get mock content based on file type
  const getMockContent = () => {
    switch (fileType) {
      case 'pdf':
        return (
          <Box sx={{ p: 4, bgcolor: 'background.default', borderRadius: 1, width: '80%', maxWidth: 600 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PictureAsPdf color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="primary">PDF Document</Typography>
            </Box>
            <Typography variant="body1" paragraph>
              This is a preview of a PDF document. In a real application, you would see the actual PDF content rendered here.
            </Typography>
            <Typography variant="body1" paragraph>
              The document would contain text, images, and possibly other elements like tables or forms.
            </Typography>
            <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                File: {fileName}
              </Typography>
            </Box>
          </Box>
        );
      case 'image':
        return (
          <Box 
            sx={{ 
              width: 400, 
              height: 300, 
              bgcolor: 'grey.200', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
          >
            <Image sx={{ fontSize: 80, color: 'text.secondary' }} />
          </Box>
        );
      case 'audio':
        return (
          <Box sx={{ p: 3, width: '100%', maxWidth: 500 }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MusicNote color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">{fileName}</Typography>
              </Box>
              <Box 
                sx={{ 
                  height: 80, 
                  bgcolor: 'action.hover', 
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Simulate waveform */}
                {Array.from({ length: 40 }).map((_, i) => (
                  <Box 
                    key={i}
                    sx={{
                      position: 'absolute',
                      bottom: '50%',
                      left: `${i * 2.5}%`,
                      width: '2px',
                      height: `${20 + Math.random() * 30}%`,
                      bgcolor: 'primary.main',
                      opacity: 0.7
                    }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Box sx={{ 
                  width: '80%', 
                  height: 5, 
                  bgcolor: 'grey.300', 
                  borderRadius: 5,
                  position: 'relative'
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '30%',
                    height: '100%',
                    bgcolor: 'primary.main',
                    borderRadius: 5
                  }} />
                </Box>
              </Box>
            </Box>
          </Box>
        );
      case 'video':
        return (
          <Box sx={{ 
            width: 480, 
            height: 270, 
            bgcolor: 'black', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 1
          }}>
            <VideoLibrary sx={{ fontSize: 80, color: 'white' }} />
          </Box>
        );
      default:
        return (
          <Box sx={{ 
            p: 3, 
            bgcolor: 'background.paper', 
            border: 1, 
            borderColor: 'divider', 
            borderRadius: 1,
            width: '100%',
            maxWidth: 600,
            maxHeight: 400,
            overflow: 'auto'
          }}>
            <Typography variant="body1" fontFamily="monospace" sx={{ whiteSpace: 'pre-wrap' }}>
              {`This is a mock text representation of a ${fileType} file.
              
// ${fileName}
              
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

${'-'.repeat(40)}

The actual content would be displayed here in a format appropriate for the file type.
For documents, you would see formatted text.
For code files, you would see syntax-highlighted code.
For spreadsheets, you would see a grid of data.
              
${'-'.repeat(40)}`}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Toolbar */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1, 
          borderBottom: 1, 
          borderColor: 'divider',
          borderRadius: 0 
        }}
      >
        <Stack 
          direction="row" 
          spacing={1} 
          divider={<Divider orientation="vertical" flexItem />}
          sx={{ alignItems: 'center' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getFileIcon()}
            <Typography variant="subtitle2" sx={{ ml: 1 }}>
              {fileName}
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Zoom controls */}
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Zoom out">
              <IconButton onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            
            <Typography sx={{ alignSelf: 'center' }}>
              {Math.round(zoom * 100)}%
            </Typography>
            
            <Tooltip title="Zoom in">
              <IconButton onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomIn />
              </IconButton>
            </Tooltip>
          </Stack>
          
          {/* Rotation controls */}
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Rotate left">
              <IconButton onClick={handleRotateLeft}>
                <RotateLeft />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Rotate right">
              <IconButton onClick={handleRotateRight}>
                <RotateRight />
              </IconButton>
            </Tooltip>
          </Stack>
          
          {/* Copy link */}
          <Tooltip title="Copy link to this file">
            <IconButton onClick={onCopyLink}>
              <ContentCopy />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>
      
      {/* File content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 2
        }}
      >
        {getMockContent()}
      </Box>
    </Box>
  );
};

export default MockFileViewer;
import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, IconButton, Typography, Alert, Tooltip } from '@mui/material';
import { ZoomIn, ZoomOut, RotateLeft, RotateRight, Fullscreen, FullscreenExit } from '@mui/icons-material';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface ImageViewerProps {
  url: string;
  fileName?: string;
  metadata?: Record<string, any>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ 
  url, 
  fileName,
  onLoad,
  onError 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const transformComponentRef = useRef<any>(null);
  
  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);
  
  // Fetch image and create blob URL
  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setLoading(false);
      if (onError) onError(new Error('No URL provided'));
      return;
    }
    
    setLoading(true);
    setError(null);
    setBlobUrl(null);
    
    const fetchImage = async () => {
      try {
        // Try with credentials first
        let response: Response;
        try {
          response = await fetch(url, { credentials: 'include' });
        } catch (err) {
          console.warn('Failed to fetch with credentials, trying without');
          response = await fetch(url);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Image has zero bytes');
        }
        
        const newBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(newBlobUrl);
        setLoading(false);
        if (onLoad) onLoad();
      } catch (err: any) {
        console.error('Error loading image:', err);
        setError(`Failed to load image: ${err.message}`);
        setLoading(false);
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    fetchImage();
  }, [url, onLoad, onError]);
  
  // Rotation functions
  const rotateClockwise = () => setRotation(prev => (prev + 90) % 360);
  const rotateCounterClockwise = () => setRotation(prev => (prev - 90 + 360) % 360);
  
  // Fullscreen toggle
  const toggleFullscreen = () => setFullscreen(prev => !prev);
  
  // Reset zoom and position
  const resetTransform = () => {
    if (transformComponentRef.current) {
      transformComponentRef.current.resetTransform();
    }
  };
  
  // Loading state
  if (loading || !blobUrl) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading image...
        </Typography>
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box 
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        ...(fullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          bgcolor: 'background.paper',
        }),
      }}
    >
      {/* Controls */}
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        <Tooltip title="Reset view">
          <IconButton onClick={resetTransform} size="small">
            <Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>1:1</Box>
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Rotate left">
          <IconButton onClick={rotateCounterClockwise} size="small">
            <RotateLeft />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Rotate right">
          <IconButton onClick={rotateClockwise} size="small">
            <RotateRight />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
          <IconButton onClick={toggleFullscreen} size="small">
            {fullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Image display */}
      <Box sx={{ 
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}>
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={8}
          limitToBounds={true}
          doubleClick={{ disabled: false }}
          wheel={{ step: 0.05 }}
          ref={transformComponentRef}
        >
          {({ zoomIn, zoomOut }) => (
            <>
              <TransformComponent 
                wrapperStyle={{ 
                  width: '100%', 
                  height: '100%', 
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <img
                  src={blobUrl}
                  alt={fileName || 'Image'}
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease',
                  }}
                  onError={() => {
                    setError('Error displaying image. The file may be corrupted or in an unsupported format.');
                    if (onError) onError(new Error('Image display error'));
                  }}
                />
              </TransformComponent>
              
              {/* Zoom controls */}
              <Box sx={{ 
                position: 'absolute', 
                bottom: 16, 
                right: 16, 
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 2,
                p: 0.5,
              }}>
                <IconButton onClick={() => zoomIn()} size="small">
                  <ZoomIn />
                </IconButton>
                <IconButton onClick={() => zoomOut()} size="small">
                  <ZoomOut />
                </IconButton>
              </Box>
            </>
          )}
        </TransformWrapper>
      </Box>
    </Box>
  );
};

export default ImageViewer; 
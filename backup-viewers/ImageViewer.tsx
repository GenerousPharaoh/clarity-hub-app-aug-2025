import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  IconButton, 
  Typography, 
  CircularProgress, 
  Alert,
  Tooltip,
  Stack,
  Button
} from '@mui/material';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateRight,
  RotateLeft,
  Fullscreen,
  FullscreenExit,
  Download,
  Refresh
} from '@mui/icons-material';

interface ImageViewerProps {
  url: string;
  fileName: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ url, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Fetch image and create a reliable blob URL
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Clear previous blob URL if it exists
    if (localUrl && localUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localUrl);
    }
    
    // If URL is already a blob URL, use it directly
    if (url.startsWith('blob:')) {
      console.log('[ImageViewer] Using existing blob URL');
      setLocalUrl(url);
      return;
    }
    
    const fetchImage = async () => {
      try {
        console.log(`[ImageViewer] Fetching image from URL: ${url}`);
        
        // First try with credentials
        try {
          const response = await fetch(url, {
            cache: 'no-store',
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          console.log(`[ImageViewer] Created image blob: ${blob.size} bytes, type: ${blob.type}`);
          
          if (blob.size === 0) {
            throw new Error('Image has zero bytes');
          }
          
          const blobUrl = URL.createObjectURL(blob);
          console.log(`[ImageViewer] Created blob URL: ${blobUrl}`);
          setLocalUrl(blobUrl);
          
        } catch (fetchError) {
          console.warn('[ImageViewer] Fetch with credentials failed, trying without credentials:', fetchError);
          
          // Try again without credentials as fallback
          const response = await fetch(url, {
            cache: 'no-store',
            mode: 'cors'
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Image has zero bytes');
          }
          
          const blobUrl = URL.createObjectURL(blob);
          console.log(`[ImageViewer] Created blob URL (no credentials): ${blobUrl}`);
          setLocalUrl(blobUrl);
        }
      } catch (err) {
        console.error('[ImageViewer] Error loading image:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
        
        // Fallback to direct URL as last resort
        console.log('[ImageViewer] Falling back to direct URL');
        setLocalUrl(url);
      }
    };
    
    fetchImage();
    
    // Cleanup function
    return () => {
      if (localUrl && localUrl.startsWith('blob:')) {
        console.log(`[ImageViewer] Revoking blob URL: ${localUrl}`);
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [url, retryCount]);
  
  // Handle image load
  const handleImageLoad = () => {
    console.log('[ImageViewer] Image loaded successfully');
    setLoading(false);
  };
  
  // Handle image error
  const handleImageError = () => {
    console.error('[ImageViewer] Error loading image from URL:', localUrl || url);
    setError('Error displaying image. The file may be corrupted or in an unsupported format.');
    setLoading(false);
  };
  
  // Handle retry
  const handleRetry = () => {
    console.log('[ImageViewer] Retrying image load');
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
  };
  
  // Handle zoom controls
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3));
  };
  
  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };
  
  // Handle rotation controls
  const rotateClockwise = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };
  
  const rotateCounterClockwise = () => {
    setRotation((prevRotation) => (prevRotation - 90 + 360) % 360);
  };
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = localUrl || url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  };
  
  // Reset zoom when changing to/from fullscreen
  useEffect(() => {
    if (fullscreen) {
      setScale(1);
    }
  }, [fullscreen]);
  
  // If there's an error and no local URL, show error state
  if (error && !localUrl) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        p: 2 
      }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<Refresh />}
          onClick={handleRetry}
          sx={{ mt: 2 }}
        >
          Retry Loading
        </Button>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        width: '100%',
        height: '100%',
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
      onWheel={handleWheel}
      ref={containerRef}
      data-test="image-viewer"
    >
      {/* Image Container */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          width: '100%',
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          position: 'relative',
        }}
      >
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10
          }}>
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading image...
            </Typography>
          </Box>
        )}
        
        {localUrl && (
          <img
            ref={imageRef}
            src={localUrl}
            alt={fileName || 'Image'}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease',
              display: loading ? 'none' : 'block', // Use display instead of visibility for better performance
            }}
          />
        )}
      </Box>
      
      {/* Controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: '100%', 
        borderTop: fullscreen ? 0 : 1,
        borderColor: 'divider',
        p: 1,
        bgcolor: 'background.paper',
        ...(fullscreen && {
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
        }),
      }}>
        {/* Left side controls */}
        <Box>
          <Tooltip title="Download image">
            <IconButton onClick={handleDownload} size="small" disabled={loading}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Center controls - zoom and rotate */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Zoom out">
            <IconButton onClick={zoomOut} size="small" disabled={loading || scale <= 0.5}>
              <ZoomOut fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Typography variant="body2" sx={{ minWidth: '60px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </Typography>
          
          <Tooltip title="Zoom in">
            <IconButton onClick={zoomIn} size="small" disabled={loading || scale >= 3}>
              <ZoomIn fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Rotate counterclockwise">
            <IconButton onClick={rotateCounterClockwise} size="small" disabled={loading}>
              <RotateLeft fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Rotate clockwise">
            <IconButton onClick={rotateClockwise} size="small" disabled={loading}>
              <RotateRight fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        
        {/* Right side controls */}
        <Box>
          <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <IconButton onClick={toggleFullscreen} size="small" disabled={loading}>
              {fullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default ImageViewer; 
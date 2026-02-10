import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  ContentCopy,
  Fullscreen,
  RestartAlt,
} from '@mui/icons-material';
import { LinkActivation } from '../../types';

interface EnhancedImageViewerProps {
  url: string;
  fileName: string;
  zoom?: number;
  rotation?: number;
  onZoomChange?: (zoom: number) => void;
  onRotationChange?: (rotation: number) => void;
  onLinkUpdate?: (updates: Partial<LinkActivation>) => void;
}

const EnhancedImageViewer = forwardRef<any, EnhancedImageViewerProps>(
  ({ url, fileName, zoom = 1, rotation = 0, onZoomChange, onRotationChange, onLinkUpdate }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (transformComponentRef.current) {
          transformComponentRef.current.resetTransform();
        }
        if (onRotationChange) {
          onRotationChange(0);
        }
      },
      getImageData: () => {
        return {
          zoom,
          rotation,
          fileName,
        };
      },
    }));

    // Handle image load success
    const handleImageLoad = () => {
      setLoading(false);
    };

    // Handle image load error
    const handleImageError = () => {
      setError('Failed to load image. Please check the file or try again later.');
      setLoading(false);
    };

    // Zoom functions
    const handleZoomIn = () => {
      if (transformComponentRef.current) {
        transformComponentRef.current.zoomIn();
        // Update parent component if callback provided
        if (onZoomChange) {
          const newZoom = Math.min(zoom + 0.25, 3);
          onZoomChange(newZoom);
        }
      }
    };

    const handleZoomOut = () => {
      if (transformComponentRef.current) {
        transformComponentRef.current.zoomOut();
        // Update parent component if callback provided
        if (onZoomChange) {
          const newZoom = Math.max(zoom - 0.25, 0.5);
          onZoomChange(newZoom);
        }
      }
    };

    // Rotation functions
    const handleRotateLeft = () => {
      if (onRotationChange) {
        const newRotation = (rotation - 90) % 360;
        onRotationChange(newRotation);
      }
    };

    const handleRotateRight = () => {
      if (onRotationChange) {
        const newRotation = (rotation + 90) % 360;
        onRotationChange(newRotation);
      }
    };

    // Reset transformation
    const handleReset = () => {
      if (transformComponentRef.current) {
        transformComponentRef.current.resetTransform();
      }
      if (onRotationChange) {
        onRotationChange(0);
      }
      if (onZoomChange) {
        onZoomChange(1);
      }
    };

    // Copy link to image
    const copyLink = () => {
      // Notify parent about the link activation
      onLinkUpdate?.({});
    };

    // Enter full screen
    const enterFullScreen = () => {
      if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
          .catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
      }
    };

    return (
      <Box
        ref={containerRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          bgcolor: 'background.paper',
          position: 'relative',
        }}
      >
        {/* Image Toolbar */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            display: 'flex',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            borderRadius: 0,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ width: '100%', alignItems: 'center' }}
          >
            {/* File Name */}
            <Typography
              variant="body2"
              noWrap
              sx={{ maxWidth: 200, flexShrink: 1 }}
              title={fileName}
            >
              {fileName}
            </Typography>

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

            {/* Action buttons */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Reset view">
                <IconButton onClick={handleReset}>
                  <RestartAlt />
                </IconButton>
              </Tooltip>

              <Tooltip title="Copy link to image">
                <IconButton onClick={copyLink}>
                  <ContentCopy />
                </IconButton>
              </Tooltip>

              <Tooltip title="Fullscreen">
                <IconButton onClick={enterFullScreen}>
                  <Fullscreen />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Image Viewer */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'hidden',
            position: 'relative',
            bgcolor: 'background.default',
          }}
        >
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Loading image...
              </Typography>
            </Box>
          )}

          {error && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                p: 2,
                zIndex: 10,
              }}
            >
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
              <Typography variant="body2">
                Try downloading the file instead.
              </Typography>
            </Box>
          )}

          <TransformWrapper
            initialScale={zoom}
            minScale={0.5}
            maxScale={5}
            limitToBounds={false}
            centerOnInit
            ref={transformComponentRef}
            onZoomChange={(ref) => {
              if (onZoomChange) {
                onZoomChange(ref.state.scale);
              }
            }}
          >
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }}
              contentStyle={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease',
              }}
            >
              <img
                src={url}
                alt={fileName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  opacity: loading ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </TransformComponent>
          </TransformWrapper>
        </Box>
      </Box>
    );
  }
);

export default EnhancedImageViewer; 
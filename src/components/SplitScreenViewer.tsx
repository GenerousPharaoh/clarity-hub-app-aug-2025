import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Close,
  Download,
  OpenInNew,
  Fullscreen,
  FullscreenExit,
  DragIndicator,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateRight,
  FitScreen,
} from '@mui/icons-material';
import { UniversalFileViewer } from './viewers/UniversalFileViewer';
import useAppStore from '../store';

interface SplitScreenViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: string;
  exhibitTag?: string;
  onWidthChange?: (width: number) => void;
}

const SplitScreenViewer: React.FC<SplitScreenViewerProps> = ({
  isOpen,
  onClose,
  fileId,
  exhibitTag,
  onWidthChange,
}) => {
  const [panelWidth, setPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const files = useAppStore(state => state.files);
  
  // Get file data
  const file = React.useMemo(() => {
    if (fileId) {
      return files.find(f => f.id === fileId);
    }
    if (exhibitTag) {
      return files.find(f => f.exhibit_id === exhibitTag);
    }
    return null;
  }, [fileId, exhibitTag, files]);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const container = containerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Limit panel width between 20% and 80%
      if (newWidth >= 20 && newWidth <= 80) {
        setPanelWidth(newWidth);
        if (onWidthChange) {
          onWidthChange(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen(!isFullscreen);
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(prev => Math.min(prev + 10, 200));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(prev => Math.max(prev - 10, 50));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(100);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  // Handle file download
  const handleDownload = () => {
    if (!file?.url) return;
    
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  // Handle external open
  const handleOpenExternal = () => {
    if (!file?.url) return;
    window.open(file.url, '_blank');
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  if (!isOpen) return null;

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: isFullscreen ? '100%' : `${panelWidth}%`,
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
        transition: isFullscreen ? 'width 0.3s ease' : 'none',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {file?.name || 'Document Viewer'}
          </Typography>
          {file?.exhibit_id && (
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Exhibit {file.exhibit_id}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Zoom controls */}
          <Tooltip title="Zoom Out (Ctrl+-)">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
            <Typography variant="caption">{zoom}%</Typography>
          </Box>
          
          <Tooltip title="Zoom In (Ctrl++)">
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fit to Screen (Ctrl+0)">
            <IconButton size="small" onClick={handleZoomReset}>
              <FitScreen />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Rotate">
            <IconButton size="small" onClick={handleRotate}>
              <RotateRight />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Download">
            <IconButton size="small" onClick={handleDownload}>
              <Download />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Open in New Tab">
            <IconButton size="small" onClick={handleOpenExternal}>
              <OpenInNew />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}>
            <IconButton size="small" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Close (Esc)">
            <IconButton size="small" onClick={onClose}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading document...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {file && !loading && !error && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease',
            }}
          >
            <UniversalFileViewer
              file={file}
              height="100%"
              showControls={false}
            />
          </Box>
        )}
      </Box>

      {/* Resize handle */}
      {!isFullscreen && (
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            position: 'absolute',
            left: -4,
            top: 0,
            bottom: 0,
            width: 8,
            cursor: 'col-resize',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'primary.main',
              opacity: 0.3,
            },
            '&:active': {
              backgroundColor: 'primary.main',
              opacity: 0.5,
            },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DragIndicator
            sx={{
              color: 'text.secondary',
              opacity: isResizing ? 1 : 0.5,
              fontSize: '1rem',
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default SplitScreenViewer;
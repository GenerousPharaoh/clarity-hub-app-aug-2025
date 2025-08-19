import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {
  Box,
  IconButton,
  TextField,
  Typography,
  Paper,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Stack,
  Divider,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  NavigateNext,
  NavigateBefore,
  Search,
  ContentCopy,
  Fullscreen,
} from '@mui/icons-material';
import { LinkActivation } from '../../types';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface EnhancedPdfViewerProps {
  url: string;
  fileName: string;
  zoom?: number;
  rotation?: number;
  onZoomChange?: (zoom: number) => void;
  onRotationChange?: (rotation: number) => void;
  onLinkUpdate?: (updates: Partial<LinkActivation>) => void;
}

const EnhancedPdfViewer = forwardRef<any, EnhancedPdfViewerProps>(
  ({ url, fileName, zoom = 1, rotation = 0, onZoomChange, onRotationChange, onLinkUpdate }, ref) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [textSelection, setTextSelection] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const documentRef = useRef<any>(null);
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCurrentPage: () => pageNumber,
      getCurrentSelection: () => textSelection,
      getSelectionContext: () => {
        // Return context around the selected text if available
        return textSelection;
      },
      getAllText: async () => {
        // Placeholder for full text extraction (would be implemented)
        return 'PDF text content';
      },
    }));
    
    // Handle document load success
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoading(false);
      
      // If a page was specified in the URL, navigate to it
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get('page');
      if (pageParam && !isNaN(Number(pageParam))) {
        const page = Number(pageParam);
        if (page > 0 && page <= numPages) {
          setPageNumber(page);
        }
      }
    };
    
    // Handle document load error
    const onDocumentLoadError = (error: Error) => {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF. Please check the file or try again later.');
      setLoading(false);
    };
    
    // Navigation functions
    const goToPrevPage = () => {
      setPageNumber(prev => (prev > 1 ? prev - 1 : prev));
    };
    
    const goToNextPage = () => {
      setPageNumber(prev => (prev < (numPages || 1) ? prev + 1 : prev));
    };
    
    // Handle page number input change
    const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value) && value > 0 && value <= (numPages || 1)) {
        setPageNumber(value);
      }
    };
    
    // Zoom functions
    const handleZoomIn = () => {
      const newZoom = Math.min(zoom + 0.25, 3);
      onZoomChange?.(newZoom);
    };
    
    const handleZoomOut = () => {
      const newZoom = Math.max(zoom - 0.25, 0.5);
      onZoomChange?.(newZoom);
    };
    
    // Rotation functions
    const handleRotateLeft = () => {
      const newRotation = (rotation - 90) % 360;
      onRotationChange?.(newRotation);
    };
    
    const handleRotateRight = () => {
      const newRotation = (rotation + 90) % 360;
      onRotationChange?.(newRotation);
    };
    
    // Text selection handler
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setTextSelection(selection.toString());
      } else {
        setTextSelection(null);
      }
    };
    
    // Copy link to current page
    const copyPageLink = () => {
      // Notify parent about the link activation update
      onLinkUpdate?.({ page: pageNumber });
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

    // Update the link activation when page changes
    useEffect(() => {
      if (onLinkUpdate) {
        onLinkUpdate({ page: pageNumber });
      }
    }, [pageNumber, onLinkUpdate]);
    
    // Listen for text selection
    useEffect(() => {
      document.addEventListener('mouseup', handleTextSelection);
      
      return () => {
        document.removeEventListener('mouseup', handleTextSelection);
      };
    }, []);
    
    return (
      <Box 
        ref={containerRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          bgcolor: 'background.paper',
          position: 'relative',
        }}
      >
        {/* PDF Toolbar */}
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
            {/* Page navigation */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="Previous page">
                <IconButton onClick={goToPrevPage} disabled={pageNumber <= 1 || loading}>
                  <NavigateBefore />
                </IconButton>
              </Tooltip>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  size="small"
                  value={pageNumber}
                  onChange={handlePageChange}
                  inputProps={{ 
                    min: 1, 
                    max: numPages || 1,
                    style: { textAlign: 'center', width: '40px' }
                  }}
                />
                <Typography variant="body2" sx={{ mx: 0.5 }}>/ {numPages || 1}</Typography>
              </Box>
              
              <Tooltip title="Next page">
                <IconButton onClick={goToNextPage} disabled={pageNumber >= (numPages || 1) || loading}>
                  <NavigateNext />
                </IconButton>
              </Tooltip>
            </Stack>
            
            {/* Search functionality */}
            <Box sx={{ flexGrow: 1, maxWidth: 300 }}>
              <TextField
                size="small"
                placeholder="Search in document"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '100%' }}
              />
            </Box>
            
            {/* Zoom controls */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Zoom out">
                <IconButton onClick={handleZoomOut} disabled={zoom <= 0.5 || loading}>
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              
              <Typography sx={{ alignSelf: 'center' }}>
                {Math.round(zoom * 100)}%
              </Typography>
              
              <Tooltip title="Zoom in">
                <IconButton onClick={handleZoomIn} disabled={zoom >= 3 || loading}>
                  <ZoomIn />
                </IconButton>
              </Tooltip>
            </Stack>
            
            {/* Rotation controls */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Rotate left">
                <IconButton onClick={handleRotateLeft} disabled={loading}>
                  <RotateLeft />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Rotate right">
                <IconButton onClick={handleRotateRight} disabled={loading}>
                  <RotateRight />
                </IconButton>
              </Tooltip>
            </Stack>
            
            {/* Action buttons */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Copy link to page">
                <IconButton onClick={copyPageLink} disabled={loading}>
                  <ContentCopy />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Fullscreen">
                <IconButton onClick={enterFullScreen} disabled={loading}>
                  <Fullscreen />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>
        
        {/* PDF Viewer */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            position: 'relative',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#303030' : '#f5f5f5',
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
              }}
            >
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Loading PDF...
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
          
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            options={{
              cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
              cMapPacked: true,
            }}
            renderMode="canvas"
            ref={documentRef}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                p: 2, 
                minHeight: '100%'
              }}
            >
              <Page
                pageNumber={pageNumber}
                scale={zoom}
                rotate={rotation}
                renderTextLayer
                renderAnnotationLayer
                width={Math.min(window.innerWidth - 80, 1000)}
                loading={<CircularProgress size={40} />}
              />
            </Box>
          </Document>
        </Box>
      </Box>
    );
  }
);

export default EnhancedPdfViewer; 
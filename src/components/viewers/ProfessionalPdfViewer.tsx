import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Toolbar,
  IconButton,
  TextField,
  Typography,
  ButtonGroup,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Slider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  FitScreen,
  AspectRatio,
  NavigateBefore,
  NavigateNext,
  Search,
  MoreVert,
  FullscreenExit,
  Fullscreen,
  Download,
  Print,
} from '@mui/icons-material';
import * as pdfjsLib from 'pdfjs-dist';
import useAppStore from '../../store';
import { LinkActivation } from '../../types';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.js';

interface ProfessionalPdfViewerProps {
  url: string;
  fileName?: string;
}

const ProfessionalPdfViewer: React.FC<ProfessionalPdfViewerProps> = ({
  url,
  fileName = 'document.pdf'
}) => {
  const theme = useTheme();
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [thumbnailsVisible, setThumbnailsVisible] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  // Store integration for LinkActivation
  const linkActivation = useAppStore((state) => state.linkActivation);
  const setLinkActivation = useAppStore((state) => state.setLinkActivation);

  // Handle link activation from citation clicks
  useEffect(() => {
    if (linkActivation?.type === 'citation' && linkActivation.targetPage) {
      setCurrentPage(linkActivation.targetPage);
      // Clear the activation after handling
      setLinkActivation(null);
    }
  }, [linkActivation, setLinkActivation]);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      loadPdf();
    }

    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [url]);

  // Render current page
  const renderPage = useCallback(async (pageNumber: number, targetScale?: number) => {
    if (!pdfDocument || !canvasRef.current) return;

    try {
      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      const currentScale = targetScale || scale;
      const viewport = page.getViewport({ scale: currentScale });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }, [pdfDocument, scale]);

  // Re-render when page or scale changes
  useEffect(() => {
    if (pdfDocument) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage, scale, renderPage]);

  // Navigation functions
  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Zoom functions
  const zoomIn = () => setScale(prev => Math.min(prev * 1.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.25, 0.5));
  const fitToWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - (thumbnailsVisible ? 200 : 0) - 40;
      // Approximate calculation - would need actual page dimensions for precision
      setScale(containerWidth / 600); // Assuming standard page width
    }
  };
  const fitToPage = () => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight - 80; // Account for toolbar
      const containerWidth = containerRef.current.clientWidth - (thumbnailsVisible ? 200 : 0) - 40;
      // Approximate calculation
      const scaleByWidth = containerWidth / 600;
      const scaleByHeight = containerHeight / 800;
      setScale(Math.min(scaleByWidth, scaleByHeight));
    }
  };

  // Fullscreen functions
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Download function
  const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const printPdf = () => {
    window.open(url, '_blank');
  };

  // Search function (placeholder - would need full text search implementation)
  const searchInPdf = () => {
    console.log('Searching for:', searchTerm);
    // Implementation would require text extraction and highlighting
  };

  // Handle page input change
  const handlePageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value)) {
      goToPage(value);
    }
  };

  // Render thumbnail list
  const renderThumbnails = () => {
    if (!thumbnailsVisible || !pdfDocument) return null;

    const thumbnails = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <Box
        ref={thumbnailsRef}
        sx={{
          width: 180,
          height: '100%',
          overflowY: 'auto',
          backgroundColor: 'background.default',
          borderRight: 1,
          borderColor: 'divider',
          p: 1,
        }}
      >
        <Typography variant="caption" sx={{ mb: 1, display: 'block', textAlign: 'center' }}>
          Pages
        </Typography>
        {thumbnails.map((pageNum) => (
          <Paper
            key={pageNum}
            elevation={currentPage === pageNum ? 2 : 0}
            sx={{
              mb: 1,
              p: 1,
              cursor: 'pointer',
              border: currentPage === pageNum ? 2 : 1,
              borderStyle: 'solid',
              borderColor: currentPage === pageNum ? 'primary.main' : 'divider',
              backgroundColor: currentPage === pageNum ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'action.hover',
                elevation: 1,
              },
            }}
            onClick={() => goToPage(pageNum)}
          >
            <Typography variant="caption" sx={{ textAlign: 'center', display: 'block' }}>
              {pageNum}
            </Typography>
            {/* Thumbnail canvas would go here - simplified for now */}
            <Box
              sx={{
                width: '100%',
                height: 60,
                backgroundColor: 'background.default',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Page {pageNum}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: 'background.default'
      }}>
        <CircularProgress size={48} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading PDF document...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* Professional Toolbar */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar variant="dense" sx={{ minHeight: 56, px: 2 }}>
          {/* Page Navigation */}
          <ButtonGroup size="small" variant="outlined" sx={{ mr: 2 }}>
            <Tooltip title="Previous page">
              <span>
                <IconButton
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                  size="small"
                >
                  <NavigateBefore />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Next page">
              <span>
                <IconButton
                  onClick={nextPage}
                  disabled={currentPage >= totalPages}
                  size="small"
                >
                  <NavigateNext />
                </IconButton>
              </span>
            </Tooltip>
          </ButtonGroup>

          {/* Page Input */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <TextField
              size="small"
              value={currentPage}
              onChange={handlePageInputChange}
              inputProps={{
                min: 1,
                max: totalPages,
                type: 'number',
                style: { width: '60px', textAlign: 'center' }
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  height: '32px',
                }
              }}
            />
            <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
              of {totalPages}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mr: 2 }} />

          {/* Zoom Controls */}
          <ButtonGroup size="small" variant="outlined" sx={{ mr: 2 }}>
            <Tooltip title="Zoom out">
              <IconButton onClick={zoomOut} size="small">
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom in">
              <IconButton onClick={zoomIn} size="small">
                <ZoomIn />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          {/* Fit Controls */}
          <ButtonGroup size="small" variant="outlined" sx={{ mr: 2 }}>
            <Tooltip title="Fit to width">
              <Button onClick={fitToWidth} size="small" sx={{ minWidth: 'auto', px: 1 }}>
                <AspectRatio fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Fit to page">
              <Button onClick={fitToPage} size="small" sx={{ minWidth: 'auto', px: 1 }}>
                <FitScreen fontSize="small" />
              </Button>
            </Tooltip>
          </ButtonGroup>

          {/* Zoom Percentage */}
          <Typography variant="body2" sx={{ mr: 2, minWidth: '50px', color: 'text.secondary' }}>
            {Math.round(scale * 100)}%
          </Typography>

          {/* Search */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, flexGrow: 1, maxWidth: 300 }}>
            <TextField
              size="small"
              placeholder="Search in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchInPdf()}
              sx={{ 
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  height: '32px',
                }
              }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={searchInPdf} size="small" edge="end">
                    <Search fontSize="small" />
                  </IconButton>
                ),
              }}
            />
          </Box>

          {/* Actions Menu */}
          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            size="small"
          >
            <MoreVert />
          </IconButton>
          
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem onClick={toggleFullscreen}>
              <ListItemIcon>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </ListItemIcon>
              <ListItemText>
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={() => setThumbnailsVisible(!thumbnailsVisible)}>
              <ListItemText>
                {thumbnailsVisible ? 'Hide Thumbnails' : 'Show Thumbnails'}
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={downloadPdf}>
              <ListItemIcon>
                <Download />
              </ListItemIcon>
              <ListItemText>Download</ListItemText>
            </MenuItem>
            <MenuItem onClick={printPdf}>
              <ListItemIcon>
                <Print />
              </ListItemIcon>
              <ListItemText>Print</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </Paper>

      {/* Main Viewer Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Thumbnails Sidebar */}
        {renderThumbnails()}

        {/* PDF Canvas Container */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'background.default',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 2,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              display: 'inline-block',
              backgroundColor: 'background.paper',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </Paper>
        </Box>
      </Box>

      {/* Status Bar */}
      <Paper elevation={0} sx={{ borderTop: 1, borderColor: 'divider', py: 0.5, px: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {fileName} • Page {currentPage} of {totalPages} • {Math.round(scale * 100)}% zoom
        </Typography>
      </Paper>
    </Box>
  );
};

export default ProfessionalPdfViewer;
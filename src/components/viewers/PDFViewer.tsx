import React, { useState, useEffect, useRef, useCallback, FC } from 'react';
import { 
  Box, 
  IconButton, 
  Pagination, 
  Typography, 
  CircularProgress, 
  Alert,
  Slider,
  Tooltip,
  Stack,
  Paper,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import { 
  ZoomIn, 
  ZoomOut, 
  NavigateBefore, 
  NavigateNext, 
  RotateRight,
  RotateLeft,
  Search,
  Fullscreen,
  FullscreenExit,
  TuneOutlined,
  Download,
  PhotoSizeSelectActual,
  Refresh
} from '@mui/icons-material';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  fileName?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Page sizes for virtualization
const PAGE_BUFFER = 2; // Number of pages to render before/after visible pages
const PAGE_MARGIN = 8; // Margin between pages in pixels

const PDFViewer: FC<PDFViewerProps> = ({ url, fileName, onLoad, onError }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [visiblePages, setVisiblePages] = useState<number[]>([1]);
  const [documentObject, setDocumentObject] = useState<any>(null);
  const [textSearchQuery, setTextSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
  const [renderOptions, setRenderOptions] = useState({
    renderTextLayer: true,
    renderAnnotationLayer: true,
    renderInteractiveForms: false
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const viewerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  
  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages, ...doc }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setDocumentObject(doc);
    setVisiblePages([1]);
  }, []);
  
  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError(error);
    setLoading(false);
    onError?.(error);
  }, [onError]);
  
  // Page visibility detection for virtualization
  const updateVisiblePages = useCallback(() => {
    if (!containerRef.current || !numPages) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newVisiblePages: number[] = [];
    
    // Check which pages are visible in the viewport
    for (let i = 1; i <= numPages; i++) {
      const pageRef = pageRefs.current[i];
      if (!pageRef) continue;
      
      const pageRect = pageRef.getBoundingClientRect();
      
      // Check if page is visible in the viewport (with buffer)
      if (
        pageRect.bottom >= containerRect.top - 500 && 
        pageRect.top <= containerRect.bottom + 500
      ) {
        newVisiblePages.push(i);
      }
    }
    
    // Add buffer pages before and after visible pages
    const minPage = Math.max(1, Math.min(...newVisiblePages) - PAGE_BUFFER);
    const maxPage = Math.min(numPages, Math.max(...newVisiblePages) + PAGE_BUFFER);
    
    const pagesWithBuffer: number[] = [];
    for (let i = minPage; i <= maxPage; i++) {
      pagesWithBuffer.push(i);
    }
    
    setVisiblePages(pagesWithBuffer);
    
    // Update current page based on center of viewport
    const containerCenter = containerRect.top + containerRect.height / 2;
    let closestPage = 1;
    let closestDistance = Infinity;
    
    for (const page of newVisiblePages) {
      const pageRef = pageRefs.current[page];
      if (!pageRef) continue;
      
      const pageRect = pageRef.getBoundingClientRect();
      const pageCenter = pageRect.top + pageRect.height / 2;
      const distance = Math.abs(containerCenter - pageCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = page;
      }
    }
    
    if (closestPage !== pageNumber) {
      setPageNumber(closestPage);
    }
  }, [numPages, pageNumber]);
  
  // Handle scroll events for virtualization
  const handleScroll = useCallback(() => {
    requestAnimationFrame(updateVisiblePages);
  }, [updateVisiblePages]);
  
  // Initialize scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);
  
  // Update visible pages when numPages or scale changes
  useEffect(() => {
    updateVisiblePages();
  }, [numPages, scale, updateVisiblePages]);
  
  // Handle page navigation
  const goToPrevPage = useCallback(() => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
      scrollToPage(pageNumber - 1);
    }
  }, [pageNumber]);
  
  const goToNextPage = useCallback(() => {
    if (numPages && pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
      scrollToPage(pageNumber + 1);
    }
  }, [pageNumber, numPages]);
  
  // Scroll to a specific page
  const scrollToPage = useCallback((page: number) => {
    const pageRef = pageRefs.current[page];
    if (pageRef && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const pageRect = pageRef.getBoundingClientRect();
      
      containerRef.current.scrollTo({
        top: containerRef.current.scrollTop + (pageRect.top - containerRect.top) - 20,
        behavior: 'smooth'
      });
    }
  }, []);
  
  // Handle page change from pagination control
  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    setPageNumber(value);
    scrollToPage(value);
  }, [scrollToPage]);
  
  // Handle direct page input
  const handlePageInput = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.target as HTMLInputElement;
      const page = parseInt(input.value);
      
      if (!isNaN(page) && page >= 1 && numPages && page <= numPages) {
        setPageNumber(page);
        scrollToPage(page);
      }
    }
  }, [numPages, scrollToPage]);
  
  // Handle zoom controls
  const zoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3));
  }, []);
  
  const zoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  }, []);
  
  const handleZoomChange = useCallback((event: Event, newValue: number | number[]) => {
    setScale(newValue as number);
  }, []);
  
  // Reset zoom to fit width
  const resetZoom = useCallback(() => {
    if (containerRef.current && pageRefs.current[1]) {
      const containerWidth = containerRef.current.clientWidth;
      const pageWidth = pageRefs.current[1].querySelector('.react-pdf__Page__canvas')?.clientWidth || 0;
      
      if (pageWidth > 0) {
        const newScale = (containerWidth - 40) / (pageWidth / scale);
        setScale(Math.max(0.5, Math.min(newScale, 3)));
      } else {
        setScale(1.0);
      }
    } else {
      setScale(1.0);
    }
  }, [scale]);
  
  // Handle rotation controls
  const rotateClockwise = useCallback(() => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  }, []);
  
  const rotateCounterClockwise = useCallback(() => {
    setRotation((prevRotation) => (prevRotation - 90 + 360) % 360);
  }, []);
  
  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setFullscreen(!fullscreen);
    
    // Allow time for layout change before scrolling
    setTimeout(() => {
      scrollToPage(pageNumber);
    }, 100);
  }, [fullscreen, pageNumber, scrollToPage]);
  
  // Settings menu
  const openSettings = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  }, []);
  
  const closeSettings = useCallback(() => {
    setSettingsAnchorEl(null);
  }, []);
  
  // Toggle rendering options
  const toggleRenderOption = useCallback((option: keyof typeof renderOptions) => {
    setRenderOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  }, []);
  
  // Handle download
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document.pdf';
    link.target = '_blank';
    link.click();
  }, [url, fileName]);
  
  // Search text in document
  const searchText = useCallback(async () => {
    if (!textSearchQuery || !documentObject) return;
    
    try {
      const results: any[] = [];
      
      for (let i = 1; i <= (numPages || 0); i++) {
        const page = await documentObject.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(' ');
        
        if (text.toLowerCase().includes(textSearchQuery.toLowerCase())) {
          results.push({ page: i, text });
        }
      }
      
      setSearchResults(results);
      setCurrentSearchIndex(results.length > 0 ? 0 : -1);
      
      if (results.length > 0) {
        setPageNumber(results[0].page);
        scrollToPage(results[0].page);
      }
    } catch (error) {
      console.error('Error searching document:', error);
    }
  }, [textSearchQuery, documentObject, numPages, scrollToPage]);
  
  // Navigate search results
  const goToNextSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      setPageNumber(searchResults[nextIndex].page);
      scrollToPage(searchResults[nextIndex].page);
    }
  }, [searchResults, currentSearchIndex, scrollToPage]);
  
  const goToPrevSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
      setCurrentSearchIndex(prevIndex);
      setPageNumber(searchResults[prevIndex].page);
      scrollToPage(searchResults[prevIndex].page);
    }
  }, [searchResults, currentSearchIndex, scrollToPage]);
  
  // Handle wheel zoom with Ctrl key
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }, [zoomIn, zoomOut]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === '+' && e.ctrlKey) {
        zoomIn();
        e.preventDefault();
      } else if (e.key === '-' && e.ctrlKey) {
        zoomOut();
        e.preventDefault();
      } else if (e.key === '0' && e.ctrlKey) {
        resetZoom();
        e.preventDefault();
      } else if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut, resetZoom, toggleFullscreen]);
  
  // When URL changes, reset the viewer
  useEffect(() => {
    setPageNumber(1);
    setLoading(true);
    setError(null);
    setScale(1.2);
    setRotation(0);
    setVisiblePages([1]);
    setTextSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  }, [url]);
  
  // Create page placeholders for all pages
  const pageSkeletons = [];
  for (let i = 1; i <= (numPages || 1); i++) {
    const isVisible = visiblePages.includes(i);
    
    pageSkeletons.push(
      <div 
        key={`page-${i}`} 
        ref={el => pageRefs.current[i] = el} 
        style={{ 
          margin: `${PAGE_MARGIN}px auto`,
          width: `${scale * 100}%`,
          maxWidth: '100%',
          position: 'relative'
        }}
        id={`pdf-page-${i}`}
      >
        {isVisible ? (
          <Page
            key={`${i}-${scale}-${rotation}-${url}`}
            pageNumber={i}
            scale={scale}
            rotate={rotation}
            renderTextLayer={renderOptions.renderTextLayer}
            renderAnnotationLayer={renderOptions.renderAnnotationLayer}
            renderInteractiveForms={renderOptions.renderInteractiveForms}
            loading={null}
            error={null}
            width={undefined}
            height={undefined}
            onLoadSuccess={() => {
              // Record the page has loaded
              if (i === 1 && containerRef.current) {
                resetZoom();
              }
            }}
          />
        ) : (
          <div 
            style={{ 
              width: '100%', 
              height: 400 * scale, 
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f0f0f0',
              borderRadius: 4
            }} 
          />
        )}
        
        {/* Page number indicator */}
        <Typography 
          variant="caption" 
          sx={{ 
            position: 'absolute', 
            bottom: 8, 
            right: 8, 
            bgcolor: 'rgba(0,0,0,0.5)', 
            color: 'white', 
            px: 1, 
            py: 0.5, 
            borderRadius: 1,
            fontSize: '0.7rem'
          }}
        >
          {i} / {numPages}
        </Typography>
      </div>
    );
  }
  
  useEffect(() => {
    let revoke: string | null = null;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    const fetchPdf = async () => {
      try {
        console.log('[PDFViewer] Fetching PDF from:', url);
        
        const response = await fetch(url, { 
          credentials: 'include',
          cache: fetchAttempts > 0 ? 'reload' : 'default',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log(`[PDFViewer] PDF blob created: ${blob.size} bytes`);
        
        if (blob.size === 0) {
          throw new Error('Downloaded PDF is empty (0 bytes)');
        }
        
        revoke = URL.createObjectURL(blob);
        console.log('[PDFViewer] Created blob URL:', revoke);
        
        setBlobUrl(revoke);
        setLoading(false);
        setError(null);
        
        onLoad?.();
      } catch (err) {
        console.error('[PDFViewer] Error loading PDF:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    fetchPdf();

    return () => {
      if (revoke) {
        console.log('[PDFViewer] Revoking blob URL:', revoke);
        URL.revokeObjectURL(revoke);
      }
    };
  }, [url, fetchAttempts, onLoad, onError]);
  
  const handleRetry = () => {
    setFetchAttempts(prev => prev + 1);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        p: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading PDF...
        </Typography>
      </Box>
    );
  }

  if (error || !blobUrl) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        p: 2
      }}>
        <Typography color="error" gutterBottom>
          {error?.message || 'Failed to load PDF'}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />} 
          onClick={handleRetry}
          sx={{ mt: 2 }}
        >
          Retry
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
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
        borderRadius: 2,
        ...(fullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
          borderRadius: 0,
        })
      }}
      onWheel={handleWheel}
      ref={viewerRef}
      data-test="pdf-viewer"
    >
      {/* Toolbar */}
      <Paper 
        elevation={1}
        sx={{ 
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderRadius: fullscreen ? 0 : '8px 8px 0 0',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* File name */}
          <Typography 
            variant="body2" 
            noWrap 
            sx={{ 
              maxWidth: { xs: '100px', sm: '200px', md: '300px' },
              fontWeight: 500
            }}
          >
            {fileName}
          </Typography>
          
          {/* Search input */}
          <TextField
            size="small"
            placeholder="Search..."
            value={textSearchQuery}
            onChange={(e) => setTextSearchQuery(e.target.value)}
            onKeyDown={handlePageInput}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchResults.length > 0 ? (
                <InputAdornment position="end">
                  <Typography variant="caption">
                    {currentSearchIndex + 1}/{searchResults.length}
                  </Typography>
                </InputAdornment>
              ) : null,
              sx: { 
                height: 32,
                borderRadius: 4,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                }
              }
            }}
            sx={{ 
              width: { xs: 120, sm: 180 },
              display: { xs: 'none', sm: 'block' }
            }}
          />
          
          {/* Search controls */}
          {searchResults.length > 0 && (
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={goToPrevSearchResult} title="Previous result">
                <NavigateBefore fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={goToNextSearchResult} title="Next result">
                <NavigateNext fontSize="small" />
              </IconButton>
            </Stack>
          )}
          
          {/* Search button */}
          {textSearchQuery && (
            <IconButton size="small" onClick={searchText} title="Search">
              <Search fontSize="small" />
            </IconButton>
          )}
        </Stack>
        
        <Stack direction="row" spacing={1}>
          {/* Fit width button */}
          <Tooltip title="Fit to width">
            <IconButton size="small" onClick={resetZoom}>
              <PhotoSizeSelectActual fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Settings button */}
          <Tooltip title="Settings">
            <IconButton size="small" onClick={openSettings}>
              <TuneOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Settings menu */}
          <Menu
            anchorEl={settingsAnchorEl}
            open={Boolean(settingsAnchorEl)}
            onClose={closeSettings}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem 
              onClick={() => toggleRenderOption('renderTextLayer')}
              sx={{ fontSize: '0.875rem' }}
            >
              {renderOptions.renderTextLayer ? '✓ ' : ''}Text Layer
            </MenuItem>
            <MenuItem 
              onClick={() => toggleRenderOption('renderAnnotationLayer')}
              sx={{ fontSize: '0.875rem' }}
            >
              {renderOptions.renderAnnotationLayer ? '✓ ' : ''}Annotations
            </MenuItem>
            <MenuItem 
              onClick={() => toggleRenderOption('renderInteractiveForms')}
              sx={{ fontSize: '0.875rem' }}
            >
              {renderOptions.renderInteractiveForms ? '✓ ' : ''}Interactive Forms
            </MenuItem>
            <Divider />
            <MenuItem onClick={resetZoom} sx={{ fontSize: '0.875rem' }}>
              Reset Zoom
            </MenuItem>
            {fileName && (
              <MenuItem onClick={handleDownload} sx={{ fontSize: '0.875rem' }}>
                Download PDF
              </MenuItem>
            )}
          </Menu>
          
          {/* Download button */}
          {fileName && (
            <Tooltip title="Download">
              <IconButton size="small" onClick={handleDownload}>
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Fullscreen toggle */}
          <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton size="small" onClick={toggleFullscreen}>
              {fullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>
      
      {/* PDF Document */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          width: '100%',
          height: '100%',
          overflow: 'auto',
          px: 2,
          scrollBehavior: 'smooth'
        }}
        ref={containerRef}
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
              Loading PDF...
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error.message}
          </Alert>
        )}
        
        <iframe
          src={blobUrl}
          title={fileName || 'PDF'}
          style={{ width: '100%', height: '100%', border: 'none' }}
          data-testid="pdf-iframe"
        />
      </Box>
      
      {/* Controls */}
      <Paper 
        elevation={1}
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%', 
          borderTop: 1,
          borderColor: 'divider',
          p: 1,
          borderRadius: fullscreen ? 0 : '0 0 8px 8px'
        }}
      >
        {/* Page Navigation */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: { xs: 1, md: 0 } }}>
          <IconButton 
            onClick={goToPrevPage} 
            disabled={pageNumber <= 1 || loading}
            size="small"
          >
            <NavigateBefore />
          </IconButton>
          
          {/* Direct page input field */}
          <TextField
            size="small"
            value={pageNumber}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) setPageNumber(val);
            }}
            onKeyDown={handlePageInput}
            InputProps={{
              endAdornment: numPages ? (
                <InputAdornment position="end">
                  <Typography variant="body2" color="text.secondary">
                    / {numPages}
                  </Typography>
                </InputAdornment>
              ) : null,
              sx: { height: 32, width: { xs: 70, sm: 80 } }
            }}
            sx={{ width: 70, display: { xs: 'none', sm: 'block' } }}
          />
          
          {/* Simple page indicator for mobile */}
          <Typography 
            variant="body2" 
            sx={{ 
              display: { xs: 'block', sm: 'none' },
              minWidth: 40,
              textAlign: 'center'
            }}
          >
            {pageNumber} / {numPages || 1}
          </Typography>
          
          <IconButton 
            onClick={goToNextPage} 
            disabled={!numPages || pageNumber >= numPages || loading}
            size="small"
          >
            <NavigateNext />
          </IconButton>
        </Stack>
        
        {/* Zoom and Rotation Controls */}
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={1}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          <Tooltip title="Rotate counter-clockwise">
            <IconButton onClick={rotateCounterClockwise} size="small" disabled={loading}>
              <RotateLeft fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Rotate clockwise">
            <IconButton onClick={rotateClockwise} size="small" disabled={loading}>
              <RotateRight fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20 }} />
          
          <Tooltip title="Zoom out">
            <IconButton onClick={zoomOut} size="small" disabled={loading || scale <= 0.5}>
              <ZoomOut fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Slider
            aria-label="zoom"
            value={scale}
            onChange={handleZoomChange}
            min={0.5}
            max={3}
            step={0.1}
            disabled={loading}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            sx={{ width: 100, mx: 1 }}
          />
          
          <Tooltip title="Zoom in">
            <IconButton onClick={zoomIn} size="small" disabled={loading || scale >= 3}>
              <ZoomIn fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PDFViewer; 
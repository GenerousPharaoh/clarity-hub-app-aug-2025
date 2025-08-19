import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Button, IconButton, Alert, Skeleton } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Fullscreen, FullscreenExit, RotateLeft, RotateRight } from '@mui/icons-material';

// Set worker path globally using CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
  fileName?: string;
  metadata?: Record<string, any>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ 
  url, 
  fileName,
  onLoad,
  onError 
}) => {
  // State management
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocumentRef = useRef<any>(null);
  
  // Clean up blob URLs when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
      
      // Clean up PDF document
      if (pdfDocumentRef.current) {
        try {
          pdfDocumentRef.current.destroy();
          pdfDocumentRef.current = null;
        } catch (err) {
          console.error('Error cleaning up PDF document:', err);
        }
      }
    };
  }, [blobUrl]);
  
  // Load PDF document
  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setLoading(false);
      if (onError) onError(new Error('No URL provided'));
      return;
    }
    
    // Reset state for new URL
    setLoading(true);
    setError(null);
    setBlobUrl(null);
    
    const fetchPdf = async () => {
      try {
        // Try with credentials (for authenticated URLs)
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
          throw new Error('PDF has zero bytes');
        }
        
        const newBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(newBlobUrl);
        setLoading(false);
        if (onLoad) onLoad();
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err.message}`);
        setLoading(false);
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    fetchPdf();
  }, [url, onLoad, onError]);
  
  // Handle document load success
  const handleDocumentLoadSuccess = ({ numPages, pdf }: { numPages: number, pdf: any }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    
    // Store PDF document reference for cleanup
    pdfDocumentRef.current = pdf;
    
    if (onLoad) onLoad();
  };
  
  // Navigation functions
  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return newPageNumber > 0 && newPageNumber <= (numPages || 1) 
        ? newPageNumber 
        : prevPageNumber;
    });
  };
  
  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);
  
  // Zoom functions
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  
  // Rotation functions
  const rotateClockwise = () => setRotation(prev => (prev + 90) % 360);
  const rotateCounterClockwise = () => setRotation(prev => (prev - 90 + 360) % 360);
  
  // Fullscreen toggle
  const toggleFullscreen = () => setFullscreen(prev => !prev);
  
  // Handle wheel zoom with Ctrl key
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    }
  };
  
  // Main loading and error states
  if (loading || !blobUrl) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading PDF...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          href={url} 
          target="_blank"
          sx={{ mt: 2 }}
        >
          Try Direct Download
        </Button>
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
      onWheel={handleWheel}
    >
      {/* Controls */}
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={previousPage} 
            disabled={pageNumber <= 1}
            size="small"
          >
            <ChevronLeft />
          </IconButton>
          
          <Typography variant="body2" sx={{ mx: 2 }}>
            Page {pageNumber} of {numPages || '--'}
          </Typography>
          
          <IconButton 
            onClick={nextPage} 
            disabled={!numPages || pageNumber >= numPages}
            size="small"
          >
            <ChevronRight />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={zoomOut} size="small" disabled={scale <= 0.5}>
            <ZoomOut />
          </IconButton>
          
          <Typography variant="body2" sx={{ mx: 1 }}>
            {Math.round(scale * 100)}%
          </Typography>
          
          <IconButton onClick={zoomIn} size="small" disabled={scale >= 3}>
            <ZoomIn />
          </IconButton>
          
          <IconButton onClick={rotateCounterClockwise} size="small">
            <RotateLeft />
          </IconButton>
          
          <IconButton onClick={rotateClockwise} size="small">
            <RotateRight />
          </IconButton>
          
          <IconButton onClick={toggleFullscreen} size="small">
            {fullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Box>
      </Box>
      
      {/* PDF Document */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        display: 'flex', 
        justifyContent: 'center',
        p: 2 
      }}>
        <Document
          file={blobUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={(error: Error) => {
            console.error('Error loading PDF:', error);
            setError(`Failed to load PDF: ${error.message}`);
            if (onError) onError(error);
          }}
          loading={<CircularProgress />}
          options={{
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
          }}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            loading={<Skeleton variant="rectangular" width={800} height={1000} />}
          />
        </Document>
      </Box>
    </Box>
  );
};

export default PdfViewer; 
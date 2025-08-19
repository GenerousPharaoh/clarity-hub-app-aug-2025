import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Button, Skeleton } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { searchIcon } from '../icons';

// Set up the PDF.js worker - use CDN fallback if local worker fails
const workerSrc = '/pdf/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// Get worker from CDN if we can't find the local one
window.addEventListener('error', function(e) {
  const target = e.target;
  if (target && target instanceof HTMLScriptElement && target.src && target.src.includes('pdf.worker.min.js')) {
    e.preventDefault(); // Prevent the error from being displayed in console
    console.warn('Local PDF worker not found, using CDN fallback');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;
  }
}, true);

// Maximum time to wait for PDF loading before showing error
const LOADING_TIMEOUT_MS = 15000;

interface PDFViewerProps {
  url: string;
  title?: string;
  fileName?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  url, 
  title,
  fileName,
  onLoad,
  onError 
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState<boolean>(false);
  const timeoutRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setLoading(false);
      if (onError) {
        onError(new Error('No URL provided'));
      }
      return;
    }

    // Reset states for new URL
    setLoading(true);
    setError(null);
    setBlobUrl(null);
    setShowFallback(false);
    
    // Set a timeout to prevent infinite loading
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      if (loading) {
        console.warn('PDF loading timed out, showing fallback');
        setShowFallback(true);
      }
    }, LOADING_TIMEOUT_MS);

    // Main fetch strategy with credential support for Supabase URLs
    const fetchPdf = async () => {
      try {
        console.log('Fetching PDF from URL:', url);
        
        // Try first with credentials (for Supabase authenticated URLs)
        let response: Response;
        try {
          response = await fetch(url, { credentials: 'include' });
        } catch (err) {
          console.warn('Failed to fetch with credentials, trying without:', err);
          response = await fetch(url);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const newBlobUrl = URL.createObjectURL(blob);
        
        console.log('PDF loaded successfully, created blob URL:', newBlobUrl);
        setBlobUrl(newBlobUrl);
        setLoading(false);
        
        if (onLoad) {
          onLoad();
        }
        
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err.message}`);
        setLoading(false);
        setShowFallback(true);
        
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
        
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    fetchPdf();

    // Clean up blob URLs when component unmounts
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [url, onLoad, onError]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    if (onLoad) {
      onLoad();
    }
  };

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

  // Fallback to iframe if react-pdf fails
  if (showFallback && blobUrl) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column'
        }}
        data-test="file-viewer"
      >
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd' }}>
          <Typography variant="subtitle1">{title || fileName || 'PDF Document'}</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            href={url} 
            target="_blank" 
            download
          >
            Download
          </Button>
        </Box>
        <Box sx={{ flexGrow: 1, width: '100%', height: 'calc(100% - 50px)' }}>
          <iframe
            ref={iframeRef}
            src={blobUrl}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none' 
            }}
            title={title || fileName || 'PDF Document'}
          />
        </Box>
      </Box>
    );
  }

  if (error && !blobUrl) {
    return (
      <Box 
        sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}
        data-test="file-viewer"
      >
        <Typography color="error" variant="body1" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          href={url} 
          target="_blank"
          sx={{ mt: 2 }}
        >
          Try Direct Download
        </Button>
      </Box>
    );
  }

  if (loading || !blobUrl) {
    return (
      <Box 
        sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}
        data-test="file-viewer"
      >
        <Skeleton variant="rectangular" width="100%" height="80%" />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, width: '100%' }}>
          <Skeleton variant="rectangular" width="30%" height={36} sx={{ mx: 1 }} />
          <Skeleton variant="rectangular" width="30%" height={36} sx={{ mx: 1 }} />
        </Box>
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
        overflow: 'auto'
      }}
      data-test="file-viewer"
    >
      <Box sx={{ 
        width: '100%', 
        p: 1, 
        display: 'flex', 
        justifyContent: 'space-between',
        borderBottom: '1px solid #ddd',
        backgroundColor: theme => theme.palette.background.paper,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            disabled={pageNumber <= 1} 
            onClick={previousPage}
            variant="outlined"
            size="small"
            sx={{ minWidth: 0, px: 1 }}
          >
            ←
          </Button>
          <Typography variant="body2" sx={{ mx: 2 }}>
            Page {pageNumber} of {numPages || '--'}
          </Typography>
          <Button 
            disabled={!numPages || pageNumber >= numPages} 
            onClick={nextPage}
            variant="outlined"
            size="small"
            sx={{ minWidth: 0, px: 1 }}
          >
            →
          </Button>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={searchIcon()}
            onClick={() => {
              // Find PDF search input by class or id
              const searchInput = document.querySelector('.react-pdf__Document__search') as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
              }
            }}
            sx={{ mr: 1 }}
          >
            Search
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            href={url} 
            target="_blank" 
            download
          >
            Download
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ width: '100%', flexGrow: 1, p: 2, display: 'flex', justifyContent: 'center' }}>
        <Document
          file={blobUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error: Error) => {
            console.error('Error in react-pdf:', error);
            setError(`Error loading PDF: ${error.message}`);
            setShowFallback(true);
            if (onError) {
              onError(error);
            }
          }}
          loading={
            <CircularProgress size={40} thickness={4} />
          }
          options={{
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/'
          }}
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            width={window.innerWidth > 800 ? 800 : window.innerWidth - 40}
            loading={
              <Skeleton 
                variant="rectangular" 
                width={window.innerWidth > 800 ? 800 : window.innerWidth - 40} 
                height={1000} 
              />
            }
          />
        </Document>
      </Box>
    </Box>
  );
};

export default PDFViewer;
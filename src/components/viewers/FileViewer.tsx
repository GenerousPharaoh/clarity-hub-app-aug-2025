import React, { useState, useEffect, forwardRef, useMemo, useCallback } from 'react';
import { Box, CircularProgress, Typography, Alert, Button, Paper } from '@mui/material';
import { FileDownload as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
// import EnhancedPdfViewer from './EnhancedPdfViewer';
import PDFViewer from './PDFViewer';
import { getErrorMessage, logError } from '../../utils/errorHandler';

// File types supported by the viewer
export type SupportedFileType = 
  | 'pdf' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'text' 
  | 'unknown';

interface FileViewerProps {
  url?: string;
  fileName?: string;
  fileType?: string;
  mimeType?: string;
  onError?: (error: Error) => void;
}

export const FileViewer = forwardRef<HTMLDivElement, FileViewerProps>(
  ({ url, fileName, fileType, mimeType, onError }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
    const [loadRetryCount, setLoadRetryCount] = useState(0);
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);
    
    // Determine file type if not provided
    const determinedType = useMemo<SupportedFileType>(() => {
      if (!url) return 'unknown';
      
      if (fileType) {
        switch (fileType.toLowerCase()) {
          case 'pdf': return 'pdf';
          case 'image': return 'image';
          case 'video': return 'video';
          case 'audio': return 'audio';
          case 'text':
          case 'document': 
            return 'text';
          default: 
            return 'unknown';
        }
      }
      
      if (mimeType) {
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('text/') || 
            mimeType.includes('document') ||
            mimeType === 'application/rtf') return 'text';
      }
      
      // Try to determine from file extension
      if (fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (extension) {
          if (extension === 'pdf') return 'pdf';
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) return 'image';
          if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(extension)) return 'video';
          if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(extension)) return 'audio';
          if (['txt', 'doc', 'docx', 'rtf', 'odt', 'pages', 'md', 'html', 'xml', 'json'].includes(extension)) return 'text';
        }
      }
      
      if (url.includes('.pdf')) return 'pdf';
      if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)($|\?)/.test(url)) return 'image';
      if (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)($|\?)/.test(url)) return 'video';
      if (/\.(mp3|wav|ogg|aac|flac|m4a)($|\?)/.test(url)) return 'audio';
      
      return 'unknown';
    }, [url, fileType, mimeType, fileName]);
    
    // Reset loading state when URL changes and set up timeout handling
    useEffect(() => {
      if (url) {
        setLoading(true);
        setError(null);
        
        // Clear previous timeout to avoid memory leaks
        if (loadTimeout) {
          clearTimeout(loadTimeout);
          setLoadTimeout(null);
        }
        
        // Longer timeout (20 seconds)
        const timeoutId = setTimeout(() => {
          if (loading) {
            console.log('[FileViewer] Loading timed out, attempting to use alternative URL...');
            
            // Create fallback URL with cache buster
            const cacheBuster = `?cb=${Date.now()}`;
            const altUrl = url.includes('?') 
              ? `${url.split('?')[0]}${cacheBuster}&original=1` 
              : `${url}${cacheBuster}`;
              
            console.log('[FileViewer] Trying alternative URL:', altUrl);
            setCurrentUrl(altUrl);
            
            // Set a final timeout
            const finalTimeoutId = setTimeout(() => {
              console.error('[FileViewer] Final loading attempt timed out');
              setLoading(false);
              setError(new Error('File loading timed out. Please try again later.'));
            }, 10000);
            
            setLoadTimeout(finalTimeoutId);
          }
        }, 20000);
        
        setLoadTimeout(timeoutId);
        setCurrentUrl(url);
      }
      
      return () => {
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
      };
    }, [url]);

    // Add a new useEffect to handle the retry URL changes
    useEffect(() => {
      if (currentUrl && currentUrl !== url && loadRetryCount > 0) {
        setLoading(true);
        setError(null);
        
        // Reset timeout for retry
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
        
        const timeoutId = setTimeout(() => {
          // If we reach the timeout again after retrying
          if (loadRetryCount >= 3) {
            setError('File loading timed out after multiple attempts');
            setLoading(false);
          }
        }, 15000);
        
        setLoadTimeout(timeoutId);
      }
    }, [currentUrl, loadRetryCount]);
    
    // Handle loading/error states
    const handleLoad = useCallback(() => {
      console.log('[FileViewer] File loaded successfully:', fileName);
      
      // Clear any pending timeouts immediately
      if (loadTimeout) {
        clearTimeout(loadTimeout);
        setLoadTimeout(null);
      }
      
      setLoading(false);
      setError(null);
    }, [fileName, loadTimeout]);
    
    const handleError = useCallback((error: Error | string) => {
      console.error('[FileViewer] Error loading file:', error);
      
      // Clear any pending timeouts
      if (loadTimeout) {
        clearTimeout(loadTimeout);
        setLoadTimeout(null);
      }
      
      // Handle both string and Error objects
      const errorMessage = typeof error === 'string' 
        ? error 
        : error instanceof Error ? error.message : 'Unknown error occurred';
        
      setError(errorMessage);
      setLoading(false);
      
      // Add special handling for certain errors with suggested actions
      if (errorMessage.includes('CORS') || errorMessage.includes('origin') || errorMessage.includes('cross-origin')) {
        setError(`CORS error: The file server isn't allowing access to this file. Try refreshing or using a direct link. (${errorMessage})`);
      } else if (errorMessage.includes('network') || errorMessage.includes('Network Error') || errorMessage.includes('failed to fetch')) {
        setError(`Network error: Could not reach the file server. Check your internet connection. (${errorMessage})`);
      } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        setError(`File not found: The file "${fileName || 'requested'}" could not be found on the server. (${errorMessage})`);
      }
      
      // Propagate error to parent component
      if (onError) {
        onError(new Error(errorMessage));
      }
    }, [loadTimeout, onError, fileName]);
    
    // Handle retry
    const handleRetry = () => {
      if (!url) return;
      
      setLoading(true);
      setError(null);
      setLoadRetryCount(prev => prev + 1);
      
      // Clear any pending timeouts
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
      
      // Set a new timeout for this retry attempt
      const timeoutId = setTimeout(() => {
        if (loading) {
          handleError('Loading timed out during retry attempt. Please try again later.');
        }
      }, 20000);
      
      setLoadTimeout(timeoutId);
      
      // Force reload by creating a cache-busting URL
      const timestamp = Date.now();
      const cacheBuster = `${url.includes('?') ? '&' : '?'}_t=${timestamp}&retry=${loadRetryCount + 1}`;
      setCurrentUrl(url + cacheBuster);
    };
    
    // Handle file download
    const handleDownload = () => {
      if (!url) return;
      
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('[FileViewer] Download error:', error);
        // Don't use logError since it might be causing the reference to path
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    };
    
    // Render appropriate viewer based on file type
    const renderFileViewer = () => {
      if (!url) {
        return (
          <Typography variant="body1" color="text.secondary" align="center">
            No file selected
          </Typography>
        );
      }
      
      if (error) {
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {typeof error === 'string' ? error : error instanceof Error ? error.message : 'An unknown error occurred'}
            </Alert>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              The file could not be displayed. You can try again or download it directly.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
              >
                Retry
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download
              </Button>
            </Box>
          </Box>
        );
      }
      
      if (loading) {
        return (
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading file...
            </Typography>
          </Box>
        );
      }
      
      switch (determinedType) {
        case 'pdf':
          return (
            <PDFViewer 
              url={url} 
              fileName={fileName}
              onLoad={handleLoad}
              onError={handleError}
            />
          );
          
        case 'image':
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
              }}
            >
              <Box 
                sx={{ 
                  position: 'relative',
                  maxWidth: '100%',
                  maxHeight: 'calc(100% - 60px)',
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                  p: 1,
                }}
              >
                {/* Add loading state specifically for images */}
                {loading && (
                  <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                    <CircularProgress size={40} />
                  </Box>
                )}
                <img 
                  src={url} 
                  alt={fileName || 'Image'} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onLoad={handleLoad}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('[FileViewer] Image load error:', e);
                    // Try with cache buster as fallback
                    const imgElement = e.target as HTMLImageElement;
                    const originalSrc = imgElement.src;
                    
                    if (!originalSrc.includes('?cb=')) {
                      // Add cache buster and try again
                      const cacheBuster = `?cb=${Date.now()}`;
                      console.log('[FileViewer] Trying image with cache buster:', originalSrc + cacheBuster);
                      imgElement.src = originalSrc + cacheBuster;
                    } else {
                      handleError('Failed to load image');
                    }
                  }}
                />
              </Box>
              
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ mt: 2 }}
              >
                Download
              </Button>
            </Box>
          );
          
        case 'video':
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
              }}
            >
              <Paper 
                elevation={2}
                sx={{ 
                  width: '100%',
                  maxHeight: 'calc(100% - 60px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2,
                }}
              >
                <video 
                  controls 
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                  onLoadedData={handleLoad}
                  crossOrigin="anonymous"
                  onError={() => handleError('Failed to load video')}
                >
                  <source src={url} type={mimeType} />
                  Your browser does not support video playback.
                </video>
              </Paper>
              
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ mt: 2 }}
              >
                Download
              </Button>
            </Box>
          );
          
        case 'audio':
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  width: '100%',
                  maxWidth: 500,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {fileName || 'Audio File'}
                </Typography>
                
                <Box sx={{ width: '100%', mt: 2, mb: 3 }}>
                  <audio 
                    controls 
                    style={{ width: '100%' }}
                    onLoadedData={handleLoad}
                    crossOrigin="anonymous"
                    onError={() => handleError('Failed to load audio')}
                  >
                    <source src={url} type={mimeType} />
                    Your browser does not support audio playback.
                  </audio>
                </Box>
                
                <Button 
                  variant="outlined" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </Paper>
            </Box>
          );
          
        case 'text':
          // For text files, offer download since we don't have a built-in text viewer yet
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  maxWidth: 500,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {fileName || 'Text Document'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  This file type cannot be previewed directly in the browser.
                  Please download the file to view its contents.
                </Typography>
                
                <Button 
                  variant="contained" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download File
                </Button>
              </Paper>
            </Box>
          );
          
        case 'unknown':
        default:
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  maxWidth: 500,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Unsupported File Type
                </Typography>
                
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  This file type ({mimeType || fileType || 'Unknown'}) cannot be previewed in the browser.
                  Please download the file to view its contents.
                </Typography>
                
                <Button 
                  variant="contained" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download File
                </Button>
              </Paper>
            </Box>
          );
      }
    };
    
    // Ensure loading state is cleared after PDFViewer mounts and loads
    useEffect(() => {
      if (!loading && !error && url) {
        // Clear any pending timeouts
        if (loadTimeout) {
          clearTimeout(loadTimeout);
          setLoadTimeout(null);
        }
      }
    }, [loading, error, url, loadTimeout]);
    
    return (
      <Box 
        ref={ref}
        sx={{ height: '100%', position: 'relative' }}
        data-testid="file-viewer"
      >
        {renderFileViewer()}
      </Box>
    );
  }
);

FileViewer.displayName = 'FileViewer';

export default FileViewer; 
import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Alert, Paper, IconButton, Tooltip } from '@mui/material';
import { Download, ZoomIn, ZoomOut, RotateRight, Fullscreen } from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FunctionalFileViewerProps {
  file: {
    id: string;
    name: string;
    file_path: string;
    file_type: string;
  } | null;
}

const FunctionalFileViewer: React.FC<FunctionalFileViewerProps> = ({ file }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (file) {
      setLoading(false);
      setError(null);
      setZoom(1);
      setRotation(0);
      setPageNumber(1);
    }
  }, [file]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const renderFileContent = () => {
    if (!file) return null;

    const fileType = file.file_type.toLowerCase();

    // PDF Viewer
    if (fileType.includes('pdf')) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'grey.100'
        }}>
          <Box sx={{ 
            p: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate">
              <IconButton size="small" onClick={handleRotate}>
                <RotateRight />
              </IconButton>
            </Tooltip>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption">
              Page {pageNumber} of {numPages || '?'}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Download">
              <IconButton 
                size="small" 
                component="a"
                href={file.file_path}
                download={file.name}
              >
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 2
          }}>
            <Document
              file={file.file_path}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('PDF load error:', error);
                setError('Failed to load PDF');
              }}
            >
              <Page
                pageNumber={pageNumber}
                scale={zoom}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </Box>
          {numPages && numPages > 1 && (
            <Box sx={{ 
              p: 1, 
              display: 'flex', 
              justifyContent: 'center',
              gap: 2,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}>
              <button 
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
              >
                Previous
              </button>
              <button 
                onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                disabled={pageNumber >= numPages}
              >
                Next
              </button>
            </Box>
          )}
        </Box>
      );
    }

    // Image Viewer
    if (fileType.includes('image')) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'grey.900'
        }}>
          <Box sx={{ 
            p: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate">
              <IconButton size="small" onClick={handleRotate}>
                <RotateRight />
              </IconButton>
            </Tooltip>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Download">
              <IconButton 
                size="small" 
                component="a"
                href={file.file_path}
                download={file.name}
              >
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2
          }}>
            <img 
              src={file.file_path}
              alt={file.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease'
              }}
            />
          </Box>
        </Box>
      );
    }

    // Audio Viewer
    if (fileType.includes('audio')) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3
        }}>
          <Paper sx={{ p: 3, width: '100%', maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              {file.name}
            </Typography>
            <audio 
              controls 
              style={{ width: '100%' }}
              src={file.file_path}
            >
              Your browser does not support the audio element.
            </audio>
          </Paper>
        </Box>
      );
    }

    // Video Viewer
    if (fileType.includes('video')) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'black'
        }}>
          <video 
            controls 
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'contain'
            }}
            src={file.file_path}
          >
            Your browser does not support the video element.
          </video>
        </Box>
      );
    }

    // Text/Document Viewer
    if (fileType.includes('text') || fileType.includes('word') || fileType.includes('document')) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            p: 1, 
            display: 'flex', 
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              {file.name}
            </Typography>
            <Tooltip title="Download">
              <IconButton 
                size="small" 
                component="a"
                href={file.file_path}
                download={file.name}
              >
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <iframe 
              src={file.file_path}
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none',
                backgroundColor: 'white'
              }}
              title={file.name}
            />
          </Box>
        </Box>
      );
    }

    // Default fallback for unsupported types
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3
      }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {file.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Preview not available for this file type
          </Typography>
          <IconButton 
            color="primary"
            component="a"
            href={file.file_path}
            download={file.name}
            sx={{ mt: 2 }}
          >
            <Download sx={{ fontSize: 48 }} />
          </IconButton>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Click to download
          </Typography>
        </Paper>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading file...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, height: '100%' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!file) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 3
      }}>
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body1" color="text.secondary">
            Select a file to preview
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      {renderFileContent()}
    </Box>
  );
};

export default FunctionalFileViewer;
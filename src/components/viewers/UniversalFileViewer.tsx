import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Button, 
  Stack, 
  Alert, 
  IconButton,
  Chip,
  Tooltip,
  Skeleton
} from '@mui/material';
import { 
  FileOpen, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateRight, 
  Fullscreen, 
  Code, 
  Description,
  Image as ImageIcon,
  VideoFile,
  AudioFile,
  Article,
  InsertDriveFile,
  TableChart,
  Slideshow
} from '@mui/icons-material';
import { FileRecord } from '../../hooks/useProjectFiles';
import PDFViewer from './PDFViewer';
import ImageViewer from './ImageViewer';
import DocumentViewer from './DocumentViewer';
import VideoViewer from './VideoViewer';
import AudioViewer from './AudioViewer';
import CodeViewer from './CodeViewer';
import SpreadsheetViewer from './SpreadsheetViewer';
import { supabase } from '../../lib/supabaseClient';
import { getPublicUrl } from '../../services/storageService';

interface UniversalFileViewerProps {
  file: FileRecord | null;
  onClose?: () => void;
}

const UniversalFileViewer: React.FC<UniversalFileViewerProps> = ({ file, onClose }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Get file URL when component mounts or file changes
  useEffect(() => {
    const getFile = async () => {
      setLoading(true);
      setError(null);
      
      if (!file) {
        setFileUrl(null);
        setLoading(false);
        return;
      }
      
      try {
        // Get public URL for file
        const url = getPublicUrl('files', file.storage_path);
        setFileUrl(url);
        
        // Check if file needs processing based on type
        const needsProcessing = ['pdf', 'document', 'spreadsheet'].includes(file.file_type);
        
        if (needsProcessing && file.metadata?.processingStatus === 'pending') {
          setProcessing(true);
          
          // Call analyze-file function to process the file
          // This would typically be done by a server-side trigger
          // But here we'll simulate it for demo purposes
          try {
            await supabase.functions.invoke('analyze-file', {
              body: { fileId: file.id }
            });
          } catch (processingError) {
            console.error('Error processing file:', processingError);
            // Continue showing the file even if processing fails
          } finally {
            setProcessing(false);
          }
        }
      } catch (error) {
        console.error('Error fetching file URL:', error);
        setError('Error loading file. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    getFile();
  }, [file]);
  
  // Handle file download
  const handleDownload = async () => {
    if (!file || !fileUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Error downloading file. Please try again later.');
    }
  };
  
  // Get icon for file type
  const getFileIcon = () => {
    if (!file) return <InsertDriveFile />;
    
    switch (file.file_type) {
      case 'pdf':
        return <Description />;
      case 'document':
        return <Article />;
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoFile />;
      case 'audio':
        return <AudioFile />;
      case 'code':
        return <Code />;
      case 'spreadsheet':
        return <TableChart />;
      case 'presentation':
        return <Slideshow />;
      default:
        return <InsertDriveFile />;
    }
  };
  
  // Render appropriate viewer based on file type
  const renderFileViewer = () => {
    if (!file || !fileUrl) {
      return <Typography color="text.secondary">No file selected</Typography>;
    }
    
    if (loading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading file...
          </Typography>
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }
    
    // Render appropriate viewer based on file type
    switch (file.file_type) {
      case 'pdf':
        return <PDFViewer url={fileUrl} fileName={file.name} />;
        
      case 'image':
        return <ImageViewer url={fileUrl} fileName={file.name} />;
        
      case 'video':
        return <VideoViewer url={fileUrl} fileName={file.name} type={file.content_type} />;
        
      case 'audio':
        return <AudioViewer url={fileUrl} fileName={file.name} type={file.content_type} />;
        
      case 'document':
        return <DocumentViewer url={fileUrl} fileName={file.name} fileType={file.content_type} />;
        
      case 'code':
        return <CodeViewer url={fileUrl} fileName={file.name} />;
        
      case 'spreadsheet':
        return <SpreadsheetViewer url={fileUrl} fileName={file.name} />;
        
      default:
        // Generic file viewer with download option
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            {getFileIcon()}
            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
              File preview not available for this file type
            </Typography>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownload}
            >
              Download File
            </Button>
          </Box>
        );
    }
  };
  
  // File info panel
  const renderFileInfo = () => {
    if (!file) return null;
    
    return (
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getFileIcon()}
          <Typography variant="h6" noWrap sx={{ maxWidth: '85%' }}>
            {file.name}
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          <Chip 
            label={file.file_type.toUpperCase()} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
          
          <Chip 
            label={`${(file.size / 1024).toFixed(1)} KB`} 
            size="small" 
            variant="outlined" 
          />
          
          {file.exhibit_id && (
            <Chip 
              label={`ID: ${file.exhibit_id}`} 
              size="small" 
              color="secondary" 
              variant="outlined" 
            />
          )}
          
          {processing && (
            <Chip 
              label="Processing..." 
              size="small" 
              color="warning" 
              icon={<CircularProgress size={12} />} 
            />
          )}
        </Stack>
      </Box>
    );
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: 'background.paper' 
      }}
      data-test="file-viewer"
    >
      {/* File Info */}
      {renderFileInfo()}
      
      {/* File Viewer */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        position: 'relative',
        display: 'flex',
        bgcolor: 'action.hover' 
      }}>
        {renderFileViewer()}
      </Box>
      
      {/* Action Bar */}
      <Box sx={{ 
        p: 1, 
        borderTop: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between' 
      }}>
        <Button
          size="small"
          startIcon={<Download />}
          onClick={handleDownload}
          disabled={!fileUrl}
        >
          Download
        </Button>
        
        <Box>
          <Tooltip title="View fullscreen">
            <IconButton size="small">
              <Fullscreen fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default UniversalFileViewer; 
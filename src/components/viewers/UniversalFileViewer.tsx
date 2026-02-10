import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { supabase } from '../../lib/supabase';
import { publicUrl } from '../../utils/publicUrl';
import ViewerContainer, { FileType } from './core/ViewerContainer';
import { FileRecord } from '../../hooks/useProjectFiles';

const UniversalFileViewer: React.FC<{ file: FileRecord | null }> = ({ file }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Map file_type to viewer FileType
  const mapFileType = (type: string): FileType => {
    switch (type) {
      case 'pdf': return 'pdf';
      case 'image': return 'image';
      case 'document': return 'document';
      case 'spreadsheet': return 'spreadsheet';
      case 'code': return 'code';
      case 'audio': return 'audio';
      case 'video': return 'video';
      case 'text': return 'text';
      default: return 'unknown';
    }
  };

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
        const directUrl = publicUrl(`files/${file.storage_path}`);

        // For PDF and document files, fetch as blob and create object URL
        if (['pdf', 'document'].includes(file.file_type)) {
          try {
            const response = await fetch(directUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.status}`);
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setFileUrl(blobUrl);
          } catch (blobError) {
            console.error(`[UniversalFileViewer] Blob fetch failed, using direct URL:`, blobError);
            setFileUrl(directUrl);
          }
        } else {
          // For other file types, direct URL is fine
          setFileUrl(directUrl);
        }
        
        // Check if file needs processing based on type
        const needsProcessing = ['pdf', 'document', 'spreadsheet'].includes(file.file_type);
        
        if (needsProcessing && file.metadata?.processingStatus === 'pending') {
          setProcessing(true);
          
          // Call analyze-file function to process the file
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
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching file URL:', error);
        setError('Error loading file. Please try again later.');
        setLoading(false);
      }
    };
    
    getFile();
    
    // Clean up any blob URLs on unmount
    return () => {
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file]);

  if (loading) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading file...
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
      </Box>
    );
  }

  if (!file) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No file selected
        </Typography>
      </Box>
    );
  }

  if (!fileUrl) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          Unable to generate URL for this file.
        </Alert>
      </Box>
    );
  }


  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      {processing && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This file is being processed for AI analysis...
        </Alert>
      )}
      
      <ViewerContainer
        url={fileUrl}
        fileType={mapFileType(file.file_type)}
        fileName={file.name}
        metadata={file.metadata}
      />
    </Box>
  );
};

export default UniversalFileViewer; 
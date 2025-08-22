import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import useAppStore from '../../store';
import UniversalFileViewer from '../../components/viewers/UniversalFileViewer';
import FunctionalFileViewer from '../../components/viewers/FunctionalFileViewer';
import ProfessionalViewerContainer from '../../components/viewers/ProfessionalViewerContainer';
import MockFileViewer from '../../components/viewers/MockFileViewer';
import { supabase } from '../../lib/supabaseClient';
import { publicUrl } from '../../utils/publicUrl';

const RightPanelWrapper = () => {
  // Get selected file directly from store
  const selectedFileId = useAppStore((state) => state.selectedFileId);
  const files = useAppStore((state) => state.files);
  const user = useAppStore((state) => state.user);
  
  // Professional viewer state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  // Find the selected file details
  const selectedFile = selectedFileId 
    ? files.find(file => file.id === selectedFileId) 
    : null;
  
  // Check if we're in demo mode
  const isDemoMode = user?.id === '00000000-0000-0000-0000-000000000000';

  // Load file URL for professional viewer
  useEffect(() => {
    const loadFileUrl = async () => {
      if (!selectedFile || isDemoMode) {
        setFileUrl(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Generate public URL for the file
        const directUrl = publicUrl(`files/${selectedFile.storage_path}`);
        console.log(`[RightPanelWrapper] Generated public URL: ${directUrl}`);
        
        // For PDF and document files, fetch as blob and create object URL for better handling
        if (['pdf', 'document'].includes(selectedFile.file_type)) {
          console.log(`[RightPanelWrapper] Using blob approach for ${selectedFile.file_type}`);
          try {
            const response = await fetch(directUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.status}`);
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            console.log(`[RightPanelWrapper] Created blob URL from ${blob.size} bytes`);
            setFileUrl(blobUrl);
          } catch (blobError) {
            console.error(`[RightPanelWrapper] Blob fetch failed, using direct URL:`, blobError);
            setFileUrl(directUrl);
          }
        } else {
          // For other file types, direct URL is fine
          setFileUrl(directUrl);
        }
        
      } catch (err) {
        console.error('Error loading file URL:', err);
        setError('Error loading file. Please try again later.');
        setFileUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadFileUrl();

    // Cleanup blob URLs on file change
    return () => {
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [selectedFile, isDemoMode]);
  
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
      }}
      data-test="right-panel"
    >
      {isDemoMode && selectedFile ? (
        // Demo mode - use mock file viewer that doesn't need actual file URLs
        <Box sx={{ 
          flex: 1, 
          overflow: 'hidden',
        }}>
          <MockFileViewer
            fileName={selectedFile.name}
            fileType={selectedFile.file_type}
            onCopyLink={() => {
              console.log('Demo: copied link for file:', selectedFile.name);
              // Could add a notification here if needed
            }}
          />
        </Box>
      ) : (
        // Production mode - use professional viewers with citation linking
        <ProfessionalViewerContainer
          file={selectedFile}
          fileUrl={fileUrl}
          loading={loading}
          error={error}
        />
      )}
    </Box>
  );
};

export default RightPanelWrapper; 
import React, { useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert, alpha, useTheme } from '@mui/material';
import { OpenInNew, NavigateBefore } from '@mui/icons-material';
import useAppStore from '../../store';
import { LinkActivation, File } from '../../types';

interface LinkActivationHandlerProps {
  children: React.ReactNode;
}

/**
 * LinkActivationHandler - Manages citation token clicks and viewer navigation
 * 
 * This component:
 * 1. Listens for LinkActivation events from the editor
 * 2. Automatically switches files when needed
 * 3. Passes navigation info to viewers (page jumps, timestamps)
 * 4. Shows confirmation prompts for file switches
 * 5. Provides breadcrumb navigation for linked content
 */
const LinkActivationHandler: React.FC<LinkActivationHandlerProps> = ({ children }) => {
  const theme = useTheme();
  const linkActivation = useAppStore((state) => state.linkActivation);
  const setLinkActivation = useAppStore((state) => state.setLinkActivation);
  const selectedFileId = useAppStore((state) => state.selectedFileId);
  const setSelectedFile = useAppStore((state) => state.setSelectedFile);
  const files = useAppStore((state) => state.files);

  // Handle incoming link activation
  useEffect(() => {
    const handleLinkActivation = async (activation: LinkActivation) => {
      console.log('[LinkActivationHandler] Processing activation:', activation);

      // If no file specified, ignore
      if (!activation.fileId) {
        return;
      }

      // Find the target file
      const targetFile = files.find(f => f.id === activation.fileId);
      if (!targetFile) {
        console.warn('[LinkActivationHandler] Target file not found:', activation.fileId);
        setLinkActivation({
          ...activation,
          fileId: null,
          error: 'Referenced file not found'
        });
        return;
      }

      // If we're already viewing the correct file, just navigate within it
      if (selectedFileId === activation.fileId) {
        console.log('[LinkActivationHandler] Same file, navigating to position');
        // The viewers will handle this activation directly
        return;
      }

      // Different file - switch and then navigate
      console.log('[LinkActivationHandler] Switching to file:', targetFile.name);
      setSelectedFile(activation.fileId);

      // Add a small delay to allow file switch to complete
      setTimeout(() => {
        // Update the activation to trigger viewer navigation
        setLinkActivation({
          ...activation,
          timestamp: Date.now(),
        });
      }, 100);
    };

    if (linkActivation) {
      handleLinkActivation(linkActivation);
    }
  }, [linkActivation, selectedFileId, files, setLinkActivation, setSelectedFile]);

  // Parse exhibit reference from activation
  const parseExhibitReference = (activation: LinkActivation) => {
    if (activation.exhibitReference) {
      // Parse references like "2B", "3A-p5", "4C-00:32"
      const match = activation.exhibitReference.match(/^(\d+[A-Z]?)(?:-(.+))?$/);
      if (match) {
        const exhibitId = match[1];
        const location = match[2];
        
        // Find file by exhibit ID
        const targetFile = files.find(f => f.exhibit_id === exhibitId);
        if (targetFile) {
          let targetPage: number | undefined;
          let timestamp: number | string | undefined;

          if (location) {
            // Check if it's a page reference (p5, page5)
            const pageMatch = location.match(/^p?(\d+)$/);
            if (pageMatch) {
              targetPage = parseInt(pageMatch[1]);
            }
            
            // Check if it's a timestamp (00:32, 1:23:45)
            const timeMatch = location.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
            if (timeMatch) {
              timestamp = location;
            }
          }

          return {
            file: targetFile,
            targetPage,
            timestamp,
            exhibitId,
          };
        }
      }
    }
    return null;
  };

  // Create breadcrumb for current activation
  const renderActivationBreadcrumb = () => {
    if (!linkActivation || !linkActivation.fileId) return null;

    const targetFile = files.find(f => f.id === linkActivation.fileId);
    if (!targetFile) return null;

    const exhibitInfo = parseExhibitReference(linkActivation);
    
    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06),
          border: '1px solid',
          borderColor: 'primary.main',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NavigateBefore sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ color: 'primary.dark' }}>
              Citation Link: 
              {exhibitInfo && (
                <>
                  <strong> Exhibit {exhibitInfo.exhibitId}</strong>
                  {exhibitInfo.targetPage && ` - Page ${exhibitInfo.targetPage}`}
                  {exhibitInfo.timestamp && ` - ${exhibitInfo.timestamp}`}
                </>
              )}
              {!exhibitInfo && (
                <>
                  <strong> {targetFile.exhibit_id || targetFile.name}</strong>
                  {linkActivation.targetPage && ` - Page ${linkActivation.targetPage}`}
                  {linkActivation.timestamp && ` - ${linkActivation.timestamp}`}
                </>
              )}
            </Typography>
          </Box>
          
          <Button
            size="small"
            onClick={() => setLinkActivation(null)}
            sx={{ color: 'primary.dark' }}
          >
            Clear
          </Button>
        </Box>
      </Paper>
    );
  };

  // Show error if activation failed
  const renderActivationError = () => {
    if (!linkActivation?.error) return null;

    return (
      <Alert 
        severity="warning" 
        sx={{ mb: 2 }}
        onClose={() => setLinkActivation(null)}
      >
        Citation Link Error: {linkActivation.error}
      </Alert>
    );
  };

  // Show file switch prompt
  const renderFileSwitchPrompt = () => {
    if (!linkActivation || !linkActivation.fileId || selectedFileId === linkActivation.fileId) {
      return null;
    }

    const targetFile = files.find(f => f.id === linkActivation.fileId);
    if (!targetFile) return null;

    const currentFile = files.find(f => f.id === selectedFileId);

    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 2,
          textAlign: 'center',
          backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.1),
          border: '1px solid',
          borderColor: 'warning.main',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: 'warning.dark' }}>
          Switch to Referenced File?
        </Typography>

        <Typography variant="body2" sx={{ mb: 2, color: 'warning.dark' }}>
          Citation references <strong>{targetFile.exhibit_id || targetFile.name}</strong>
          {linkActivation.targetPage && ` (Page ${linkActivation.targetPage})`}
          {linkActivation.timestamp && ` (${linkActivation.timestamp})`}
        </Typography>
        
        <Typography variant="caption" sx={{ display: 'block', mb: 3, color: 'warning.dark' }}>
          Currently viewing: {currentFile?.exhibit_id || currentFile?.name || 'No file selected'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<OpenInNew />}
            onClick={() => {
              setSelectedFile(linkActivation.fileId);
            }}
            sx={{
              backgroundColor: 'warning.main',
              '&:hover': { backgroundColor: 'warning.dark' }
            }}
          >
            Switch to File
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => setLinkActivation(null)}
            sx={{
              color: 'warning.dark',
              borderColor: 'warning.dark',
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.warning.dark, 0.1),
                borderColor: 'warning.dark'
              }
            }}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Link activation UI */}
      {renderActivationError()}
      {renderFileSwitchPrompt()}
      {renderActivationBreadcrumb()}

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
};

export default LinkActivationHandler;
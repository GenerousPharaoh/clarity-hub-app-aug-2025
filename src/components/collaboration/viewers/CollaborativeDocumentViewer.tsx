import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Toolbar,
  IconButton,
  Typography,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Comment as CommentIcon,
  History as VersionIcon,
  People as PeopleIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';

import { useCollaboration } from '../../../contexts/CollaborationContext';
import UserPresenceIndicator from '../presence/UserPresenceIndicator';
import CursorTracker from '../presence/CursorTracker';
import CommentSystem from '../comments/CommentSystem';
import VersionControl from '../versions/VersionControl';

// Import existing file viewers
import UniversalFileViewer from '../../viewers/UniversalFileViewer';

interface CollaborativeDocumentViewerProps {
  documentId: string;
  projectId: string;
  fileName: string;
  fileType: string;
  fileUrl?: string;
  fileContent?: string;
  onContentChange?: (content: string) => void;
  showComments?: boolean;
  showVersions?: boolean;
  readOnly?: boolean;
}

const CollaborativeDocumentViewer: React.FC<CollaborativeDocumentViewerProps> = ({
  documentId,
  projectId,
  fileName,
  fileType,
  fileUrl,
  fileContent = '',
  onContentChange,
  showComments = true,
  showVersions = true,
  readOnly = false,
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const { state, joinDocument, leaveDocument, updatePresence } = useCollaboration();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'comments' | 'versions' | null>(null);

  // Join document on mount
  useEffect(() => {
    if (documentId) {
      joinDocument(documentId);
    }
    
    return () => {
      if (documentId) {
        leaveDocument(documentId);
      }
    };
  }, [documentId, joinDocument, leaveDocument]);

  // Update presence when viewing this document
  useEffect(() => {
    if (state.currentProject && documentId) {
      updatePresence(state.currentProject, documentId, undefined, `viewing:${fileName}`);
    }
  }, [state.currentProject, documentId, fileName, updatePresence]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      viewerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Get active users viewing this document
  const documentUsers = state.activeUsers.filter(
    user => user.document_id === documentId && user.status === 'online'
  );

  // Get comments for this document
  const documentComments = state.comments.filter(
    comment => comment.document_id === documentId && !comment.resolved
  );

  const handleCreateVersion = (message: string) => {
    // Implementation would create a new version
    console.log('Creating version:', message, 'for document:', documentId);
  };

  const handleRestoreVersion = (version: any) => {
    if (onContentChange && version.content) {
      onContentChange(version.content);
    }
  };

  return (
    <Box
      ref={viewerRef}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Toolbar */}
      <Toolbar
        variant="dense"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.default',
          gap: 1,
        }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          {fileName}
        </Typography>

        {/* Active users */}
        <UserPresenceIndicator
          maxUsers={3}
          size="small"
          variant="compact"
        />

        {/* Unread counts */}
        <Stack direction="row" spacing={0.5}>
          {documentComments.length > 0 && (
            <Tooltip title={`${documentComments.length} unresolved comments`}>
              <Chip
                icon={<CommentIcon />}
                label={documentComments.length}
                size="small"
                color={sidebarMode === 'comments' ? 'primary' : 'default'}
                variant="outlined"
                onClick={() => setSidebarMode(sidebarMode === 'comments' ? null : 'comments')}
                clickable
              />
            </Tooltip>
          )}

          {showVersions && (
            <Tooltip title="Version history">
              <IconButton
                size="small"
                color={sidebarMode === 'versions' ? 'primary' : 'default'}
                onClick={() => setSidebarMode(sidebarMode === 'versions' ? null : 'versions')}
              >
                <VersionIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            <IconButton size="small" onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>

      {/* Main content area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Document viewer */}
        <Box
          sx={{
            flex: sidebarMode ? 2 : 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Cursor tracking overlay */}
          <CursorTracker
            documentId={documentId}
            containerRef={viewerRef}
            trackSelection={!readOnly}
            showCursorNames={true}
          />

          {/* File viewer */}
          <UniversalFileViewer
            fileName={fileName}
            fileType={fileType}
            fileUrl={fileUrl}
            fileContent={fileContent}
            onContentChange={onContentChange}
            readOnly={readOnly}
          />

          {/* Collaboration indicators */}
          {documentUsers.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 100,
              }}
            >
              <Card sx={{ p: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PeopleIcon fontSize="small" color="primary" />
                  <Typography variant="caption" color="primary">
                    {documentUsers.length} viewing
                  </Typography>
                </Stack>
              </Card>
            </Box>
          )}
        </Box>

        {/* Sidebar for comments/versions */}
        {sidebarMode && (
          <Box
            sx={{
              flex: 1,
              minWidth: 350,
              maxWidth: 500,
              borderLeft: 1,
              borderColor: 'divider',
              backgroundColor: 'background.default',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {sidebarMode === 'comments' && showComments && (
              <CommentSystem
                documentId={documentId}
                containerRef={viewerRef}
                showResolved={false}
              />
            )}

            {sidebarMode === 'versions' && showVersions && (
              <VersionControl
                documentId={documentId}
                currentContent={fileContent}
                onCreateVersion={handleCreateVersion}
                onRestoreVersion={handleRestoreVersion}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Connection status indicator */}
      {!state.isConnected && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1000,
          }}
        >
          <Chip
            label="Reconnecting..."
            size="small"
            color="warning"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
};

export default CollaborativeDocumentViewer;
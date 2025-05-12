import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  ListItemAvatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  History as HistoryIcon,
  RestoreFromTrash as RestoreIcon,
  DeleteOutline as DeleteIcon,
  CloudDownload as DownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getFileVersions } from '../services/storageService';
import { fallbackStorage } from '../services/fallbackStorageService';
import { formatDistanceToNow } from 'date-fns';
import FileTypeIcon from './icons/FileTypeIcon';

interface FileVersionHistoryProps {
  filePath: string;
  fileName: string;
  onRestore?: (success: boolean) => void;
}

const FileVersionHistory: React.FC<FileVersionHistoryProps> = ({
  filePath,
  fileName,
  onRestore
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

  // Load versions when component mounts
  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get path parts
        const parts = filePath.split('/');
        const bucket = parts[0];
        const path = parts.slice(1).join('/');
        
        // Get versions from memory storage
        const memoryVersions = getFileVersions(filePath);
        
        // Get versions from fallback storage if any
        let fallbackVersions: any[] = [];
        const fileEntry = await fallbackStorage.getFileByPath(filePath);
        if (fileEntry) {
          fallbackVersions = await fallbackStorage.getFileVersions(fileEntry.id);
        }
        
        // Combine versions
        const allVersions = [
          ...memoryVersions.map(v => ({
            ...v,
            createdAt: v.timestamp,
            type: 'memory'
          })),
          ...fallbackVersions.map(v => ({
            ...v,
            type: 'fallback'
          }))
        ];
        
        // Sort by creation date (newest first)
        const sortedVersions = allVersions.sort((a, b) => b.createdAt - a.createdAt);
        
        setVersions(sortedVersions);
      } catch (err) {
        console.error('Error loading file versions:', err);
        setError('Failed to load file versions');
      } finally {
        setLoading(false);
      }
    };
    
    loadVersions();
  }, [filePath]);
  
  // Handle restore version
  const handleRestoreVersion = async () => {
    if (!selectedVersion) return;
    
    setRestoreLoading(true);
    
    try {
      // Find the version
      const version = versions.find(v => 
        v.id === selectedVersion || v.versionId === selectedVersion
      );
      
      if (!version) {
        throw new Error('Version not found');
      }
      
      // Restore based on version type
      let success = false;
      
      if (version.type === 'fallback') {
        success = await fallbackStorage.restoreFileVersion(version.id);
      } else {
        // Memory-only versions might need different handling
        // Potentially need to fetch from Supabase based on path, etc.
        alert('Direct cloud version restore not yet implemented');
        success = false;
      }
      
      if (success) {
        if (onRestore) {
          onRestore(true);
        }
        
        // Refresh versions
        const updatedVersions = await fallbackStorage.getFileVersions(version.fileId);
        setVersions(updatedVersions);
      } else {
        throw new Error('Failed to restore version');
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      setError('Failed to restore file version');
      
      if (onRestore) {
        onRestore(false);
      }
    } finally {
      setRestoreLoading(false);
      setConfirmRestoreOpen(false);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (err) {
      return 'Unknown date';
    }
  };
  
  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <Paper sx={{ p: 2, maxWidth: 500 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <HistoryIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Version History</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : versions.length === 0 ? (
        <Typography color="textSecondary" align="center" sx={{ p: 2 }}>
          No previous versions available
        </Typography>
      ) : (
        <List>
          {versions.map((version, index) => (
            <React.Fragment key={version.id || version.versionId}>
              <ListItem
                secondaryAction={
                  <Box>
                    <Tooltip title="Restore this version">
                      <IconButton 
                        edge="end" 
                        onClick={() => {
                          setSelectedVersion(version.id || version.versionId);
                          setConfirmRestoreOpen(true);
                        }}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <FileTypeIcon fileName={fileName} size="small" />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(version.createdAt || version.timestamp)}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      {formatFileSize(version.size)} 
                      {version.type === 'fallback' && ' • Local'}
                      {version.type === 'memory' && ' • Cloud'}
                    </Typography>
                  }
                />
              </ListItem>
              {index < versions.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Restore confirmation dialog */}
      <Dialog 
        open={confirmRestoreOpen} 
        onClose={() => setConfirmRestoreOpen(false)}
      >
        <DialogTitle>Confirm Version Restore</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore this version? Your current version will 
            be preserved in history, but all unsaved changes will be replaced.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRestoreOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRestoreVersion} 
            color="primary" 
            variant="contained"
            disabled={restoreLoading}
          >
            {restoreLoading ? <CircularProgress size={24} /> : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FileVersionHistory; 
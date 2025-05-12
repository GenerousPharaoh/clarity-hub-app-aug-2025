import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  LinearProgress,
  Collapse,
  Badge,
  Tooltip,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondary,
  Divider,
  Button
} from '@mui/material';
import {
  KeyboardArrowUp as ExpandLessIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CloudDone as CloudDoneIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fallbackStorage } from '../services/fallbackStorageService'; 
import { isUsingFallback, syncLocalFilesToCloud } from '../services/storageService';
import FileStatusIndicator from './FileStatusIndicator';
import AutoSyncButton from './AutoSyncButton';

interface FileUploadStatusProps {
  projectId?: string;
  onSync?: () => void;
}

/**
 * Component showing the status of all files in the system
 * - Shows counts of synced, local, and error files
 * - Provides button to trigger sync
 * - Shows detailed list in a drawer
 */
const FileUploadStatus: React.FC<FileUploadStatusProps> = ({ 
  projectId,
  onSync
}) => {
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Get all files to track status
  const { data: files = [], refetch } = useQuery({
    queryKey: ['file-status', projectId],
    queryFn: async () => {
      try {
        // If in fallback mode or if projectId provided
        if (isUsingFallback() && projectId) {
          return await fallbackStorage.listProjectFiles(projectId);
        } else if (isUsingFallback()) {
          return await fallbackStorage.getAllFiles();
        }
        
        // If not in fallback mode, get unsynced files
        const unsyncedFiles = await fallbackStorage.getUnsyncedFiles();
        return unsyncedFiles;
      } catch (error) {
        console.error('Error loading file status:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Calculate file stats
  const totalFiles = files.length;
  const localFiles = files.filter(f => !f.synced).length;
  const syncedFiles = files.filter(f => f.synced).length;
  
  // Handle sync button click
  const handleSync = async () => {
    setSyncing(true);
    
    try {
      await syncLocalFilesToCloud();
      await refetch();
      
      if (onSync) {
        onSync();
      }
    } catch (error) {
      console.error('Error syncing files:', error);
    } finally {
      setSyncing(false);
    }
  };
  
  // Handle delete of a specific file
  const handleDeleteFile = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;
      
      // Extract bucket and path
      const parts = file.path.split('/');
      const bucket = parts[0];
      const path = parts.slice(1).join('/');
      
      // Delete from storage
      await fallbackStorage.deleteFile(bucket, path);
      
      // Refresh list
      refetch();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  
  // If no files, don't show anything
  if (totalFiles === 0) return null;
  
  return (
    <>
      <Paper 
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: expanded ? 300 : 'auto',
          zIndex: 1200,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'width 0.3s ease'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            bgcolor: theme => theme.palette.mode === 'dark' 
              ? 'grey.800' 
              : 'grey.100',
            cursor: 'pointer'
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Badge
            badgeContent={localFiles}
            color="error"
            invisible={localFiles === 0}
            sx={{ mr: 1 }}
          >
            <CloudUploadIcon color="primary" />
          </Badge>
          
          <Typography 
            variant="body2" 
            sx={{ 
              flexGrow: 1,
              display: expanded ? 'block' : 'none'
            }}
          >
            File Storage Status
          </Typography>
          
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
        
        <Collapse in={expanded}>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2">
              {totalFiles} total file{totalFiles !== 1 ? 's' : ''}
            </Typography>
            
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', mb: 1 }}>
              <FileStatusIndicator 
                status="synced" 
                showLabel
                size="small"
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {syncedFiles} synced
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FileStatusIndicator 
                status="local" 
                showLabel
                size="small"
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {localFiles} local only
              </Typography>
            </Box>
            
            {isUsingFallback() && (
              <Alert 
                severity="warning" 
                sx={{ 
                  mt: 1, 
                  py: 0.5, 
                  fontSize: '0.75rem'
                }}
              >
                Using local storage mode
              </Alert>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                size="small"
                onClick={() => setDrawerOpen(true)}
                startIcon={<AssignmentIcon />}
              >
                Details
              </Button>
              
              <AutoSyncButton 
                variant="button" 
                showCount={false}
                onSyncComplete={() => refetch()} 
              />
            </Box>
          </Box>
        </Collapse>
      </Paper>
      
      {/* Detailed Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 350, p: 2 }}>
          <Typography variant="h6">File Storage Details</Typography>
          <Typography variant="body2" color="textSecondary">
            {isUsingFallback() 
              ? 'Using local storage (offline mode)'
              : 'Connected to cloud storage'
            }
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <List sx={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
            {files.map(file => (
              <ListItem
                key={file.id}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    size="small"
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <FileStatusIndicator 
                    status={file.synced ? 'synced' : 'local'} 
                    size="small"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${new Date(file.uploadDate).toLocaleString()}`}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    noWrap: true,
                    style: { maxWidth: 220 }
                  }}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    noWrap: true 
                  }}
                />
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={() => setDrawerOpen(false)}
            >
              Close
            </Button>
            
            <AutoSyncButton 
              variant="button"
              onSyncComplete={() => refetch()}
            />
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default FileUploadStatus; 
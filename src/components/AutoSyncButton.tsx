import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Badge,
  Box,
  Typography
} from '@mui/material';
import {
  CloudSync as CloudSyncIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { syncLocalFilesToCloud, isUsingFallback } from '../services/storageService';
import { fallbackStorage } from '../services/fallbackStorageService';

interface AutoSyncButtonProps {
  variant?: 'icon' | 'button';
  showCount?: boolean;
  color?: 'primary' | 'secondary' | 'default' | 'inherit';
  onSyncComplete?: (success: boolean) => void;
}

const AutoSyncButton: React.FC<AutoSyncButtonProps> = ({
  variant = 'icon',
  showCount = true,
  color = 'primary',
  onSyncComplete
}) => {
  const [syncing, setSyncing] = useState(false);
  const [localFileCount, setLocalFileCount] = useState<number | null>(null);
  
  // Get count of local files
  React.useEffect(() => {
    const checkLocalFiles = async () => {
      if (!isUsingFallback()) {
        // In cloud mode, get files that need syncing
        const unsyncedFiles = await fallbackStorage.getUnsyncedFiles();
        setLocalFileCount(unsyncedFiles.length);
      } else {
        // In fallback mode, all files need syncing
        const allFiles = await fallbackStorage.getAllFiles();
        setLocalFileCount(allFiles.length);
      }
    };
    
    checkLocalFiles();
    
    // Set up an interval to check periodically
    const interval = setInterval(checkLocalFiles, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle sync button click
  const handleSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    
    try {
      // Attempt to sync files
      const success = await syncLocalFilesToCloud();
      
      // Get updated count
      const unsyncedFiles = await fallbackStorage.getUnsyncedFiles();
      setLocalFileCount(unsyncedFiles.length);
      
      // Notify parent component if callback provided
      if (onSyncComplete) {
        onSyncComplete(success);
      }
    } catch (error) {
      console.error('Error syncing files:', error);
      if (onSyncComplete) {
        onSyncComplete(false);
      }
    } finally {
      setSyncing(false);
    }
  };
  
  // If no local files and not in fallback mode, don't render anything
  if (localFileCount === 0 && !isUsingFallback()) {
    return null;
  }
  
  // Render as icon button
  if (variant === 'icon') {
    return (
      <Tooltip title={syncing ? 'Syncing...' : 'Sync files to cloud'}>
        <Badge
          badgeContent={showCount && localFileCount ? localFileCount : 0}
          color="error"
          invisible={!showCount || !localFileCount}
          overlap="circular"
        >
          <IconButton
            onClick={handleSync}
            disabled={syncing}
            color={color}
            sx={{ position: 'relative' }}
          >
            {syncing ? (
              <CircularProgress size={24} color="inherit" />
            ) : isUsingFallback() ? (
              <StorageIcon />
            ) : (
              <CloudSyncIcon />
            )}
          </IconButton>
        </Badge>
      </Tooltip>
    );
  }
  
  // Render as button
  return (
    <Button
      variant="outlined"
      color={color}
      onClick={handleSync}
      disabled={syncing}
      startIcon={
        syncing ? (
          <CircularProgress size={20} color="inherit" />
        ) : isUsingFallback() ? (
          <StorageIcon />
        ) : (
          <CloudSyncIcon />
        )
      }
      sx={{ whiteSpace: 'nowrap' }}
    >
      {syncing ? 'Syncing...' : 'Sync Files'}
      {showCount && localFileCount ? (
        <Box
          component="span"
          sx={{
            ml: 1,
            bgcolor: 'error.main',
            color: 'white',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
          }}
        >
          {localFileCount}
        </Box>
      ) : null}
    </Button>
  );
};

export default AutoSyncButton; 
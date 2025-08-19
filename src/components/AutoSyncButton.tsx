import React, { useState, useEffect } from 'react';
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
  Storage as StorageIcon,
  Sync as SyncIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';
import { syncLocalFilesToCloud, isUsingFallback } from '../services/storageService';
import { fallbackStorage } from '../services/fallbackStorageService';
import { useNotification } from '../contexts/NotificationContext';
import { styled } from '@mui/material/styles';

interface AutoSyncButtonProps {
  variant?: 'icon' | 'button';
  showCount?: boolean;
  color?: 'primary' | 'secondary' | 'default' | 'inherit';
  size?: 'small' | 'medium' | 'large';
}

const RotatingIconButton = styled(IconButton)<{ spinning: number }>(({ spinning, theme }) => ({
  transition: spinning ? 'transform 1s linear infinite' : 'none',
  transform: spinning ? 'rotate(360deg)' : 'none',
  animation: spinning ? 'spin 1.5s linear infinite' : 'none',
  '@keyframes spin': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
}));

const AutoSyncButton: React.FC<AutoSyncButtonProps> = ({
  variant = 'icon',
  showCount = true,
  color = 'primary',
  size = 'medium'
}) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'offline'>('idle');
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { showNotification } = useNotification();
  
  // Get count of local files
  useEffect(() => {
    const checkLocalFiles = async () => {
      if (!isUsingFallback()) {
        // In cloud mode, get files that need syncing
        const unsyncedFiles = await fallbackStorage.getUnsyncedFiles();
        setPendingChanges(unsyncedFiles.length);
      } else {
        // In fallback mode, all files need syncing
        const allFiles = await fallbackStorage.getAllFiles();
        setPendingChanges(allFiles.length);
      }
    };
    
    checkLocalFiles();
    
    // Set up an interval to check periodically
    const interval = setInterval(checkLocalFiles, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Simulate periodic syncing
  useEffect(() => {
    // Check online status
    const handleOnlineStatusChange = () => {
      setSyncStatus(navigator.onLine ? 'idle' : 'offline');
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    // Initial status
    handleOnlineStatusChange();
    
    // For demo purposes, set a random number of pending changes every 30 seconds
    const pendingInterval = setInterval(() => {
      if (navigator.onLine) {
        const newChanges = Math.floor(Math.random() * 3); // 0-2 changes
        setPendingChanges(prev => prev + newChanges);
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      clearInterval(pendingInterval);
    };
  }, []);
  
  const handleSync = () => {
    if (syncStatus === 'offline') {
      showNotification('You are currently offline. Changes will sync when you reconnect.', 'warning');
      return;
    }
    
    if (pendingChanges === 0) {
      showNotification('Already up to date', 'info');
      return;
    }
    
    setSyncStatus('syncing');
    
    // Simulate sync process
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% chance of success
      
      if (success) {
        setSyncStatus('success');
        setLastSynced(new Date());
        setPendingChanges(0);
        showNotification('Changes synced successfully', 'success');
        
        // Reset to idle after a delay
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      } else {
        setSyncStatus('error');
        showNotification('Failed to sync changes. Please try again.', 'error');
        
        // Reset to idle after a delay
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }
    }, 1500);
  };
  
  const getTooltipText = () => {
    switch (syncStatus) {
      case 'idle':
        return pendingChanges > 0 
          ? `${pendingChanges} pending change${pendingChanges !== 1 ? 's' : ''} to sync`
          : 'All changes synced';
      case 'syncing':
        return 'Syncing changes...';
      case 'success':
        return `Last synced: ${lastSynced?.toLocaleTimeString()}`;
      case 'error':
        return 'Sync failed. Click to retry.';
      case 'offline':
        return 'Currently offline. Changes will sync when you reconnect.';
      default:
        return 'Sync status';
    }
  };
  
  const renderIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <CircularProgress size={24} color="inherit" />;
      case 'success':
        return <CloudDoneIcon />;
      case 'error':
        return <SyncIcon color="error" />;
      case 'offline':
        return <CloudOffIcon />;
      default:
        return <SyncIcon />;
    }
  };
  
  // If no local files and not in fallback mode, don't render anything
  if (pendingChanges === 0 && !isUsingFallback()) {
    return null;
  }
  
  // Render as icon button
  if (variant === 'icon') {
    return (
      <Tooltip title={getTooltipText()}>
        <Box>
          <Badge
            badgeContent={showCount && pendingChanges > 0 ? pendingChanges : 0}
            color="error"
            overlap="circular"
            invisible={!showCount || pendingChanges === 0}
          >
            <RotatingIconButton
              color={color}
              onClick={handleSync}
              size={size}
              spinning={syncStatus === 'syncing' ? 1 : 0}
              disabled={syncStatus === 'syncing'}
            >
              {renderIcon()}
            </RotatingIconButton>
          </Badge>
        </Box>
      </Tooltip>
    );
  }
  
  // Render as button
  return (
    <Tooltip title={getTooltipText()}>
      <Box>
        <Button
          variant="outlined"
          color={color}
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          startIcon={renderIcon()}
          size={size}
        >
          {syncStatus === 'syncing' ? 'Syncing...' : 'Sync'}
          {showCount && pendingChanges > 0 && (
            <Typography 
              component="span" 
              variant="caption" 
              sx={{ 
                ml: 1, 
                bgcolor: 'error.main', 
                color: 'error.contrastText',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {pendingChanges}
            </Typography>
          )}
        </Button>
      </Box>
    </Tooltip>
  );
};

export default AutoSyncButton; 
import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  CloudSync as CloudSyncIcon,
  CloudQueue as CloudQueueIcon,
  Error as ErrorIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { isUsingFallback } from '../services/storageService';

export type FileStatus = 
  | 'synced'     // File is in sync with cloud storage
  | 'local'      // File is only in local storage
  | 'syncing'    // File is being synced to cloud storage
  | 'error'      // Error occurred during sync/upload
  | 'uploading'  // File is currently being uploaded
  | 'pending';   // File is waiting to be processed

interface FileStatusIndicatorProps {
  status: FileStatus;
  tooltip?: string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const FileStatusIndicator: React.FC<FileStatusIndicatorProps> = ({
  status,
  tooltip,
  showLabel = false,
  size = 'medium',
}) => {
  // Determine if we're in fallback mode
  const usingFallbackStorage = isUsingFallback();
  
  // Get the appropriate icon based on status
  const getIcon = () => {
    const sizeMap = {
      small: 16,
      medium: 20,
      large: 24,
    };
    
    const iconSize = sizeMap[size];
    
    switch (status) {
      case 'synced':
        return <CloudDoneIcon sx={{ fontSize: iconSize, color: 'success.main' }} />;
      case 'local':
        return <StorageIcon sx={{ fontSize: iconSize, color: 'info.main' }} />;
      case 'syncing':
        return <CloudSyncIcon sx={{ fontSize: iconSize, color: 'primary.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: iconSize, color: 'error.main' }} />;
      case 'uploading':
        return <CircularProgress size={iconSize} thickness={5} />;
      case 'pending':
        return <CloudQueueIcon sx={{ fontSize: iconSize, color: 'text.secondary' }} />;
      default:
        return null;
    }
  };
  
  // Get text label for status
  const getLabel = () => {
    switch (status) {
      case 'synced':
        return 'Synced';
      case 'local':
        return 'Local Only';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Error';
      case 'uploading':
        return 'Uploading...';
      case 'pending':
        return 'Pending';
      default:
        return '';
    }
  };
  
  // Get tooltip text, using custom text if provided, otherwise default
  const getTooltip = () => {
    if (tooltip) return tooltip;
    
    switch (status) {
      case 'synced':
        return 'File is synced to cloud storage';
      case 'local':
        return 'File is stored locally only. Will sync when connection is restored.';
      case 'syncing':
        return 'Syncing file to cloud storage...';
      case 'error':
        return 'Error syncing file. Click to retry.';
      case 'uploading':
        return 'Uploading file...';
      case 'pending':
        return 'File is pending processing';
      default:
        return '';
    }
  };
  
  // Render indicator with optional label
  return (
    <Tooltip title={getTooltip()}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 0.5
        }}
        data-status={status}
      >
        {usingFallbackStorage && status === 'synced' ? (
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <CloudOffIcon 
                sx={{ 
                  fontSize: size === 'small' ? 10 : 12,
                  color: 'warning.main',
                  bgcolor: 'background.paper',
                  borderRadius: '50%'
                }} 
              />
            }
          >
            {getIcon()}
          </Badge>
        ) : (
          getIcon()
        )}
        
        {showLabel && (
          <Typography 
            variant="caption" 
            color="textSecondary"
            sx={{ 
              fontSize: size === 'small' ? '0.65rem' : 
                     size === 'medium' ? '0.75rem' : '0.85rem'
            }}
          >
            {getLabel()}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

export default FileStatusIndicator; 
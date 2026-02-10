import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  Chip,
  Tooltip,
  styled,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  Code as CodeIcon,
  InsertDriveFile as GenericFileIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// TypeScript types for file objects
export interface FileItem {
  id: string;
  name: string;
  file_type: string;
  content_type: string;
  size: number;
  metadata?: Record<string, any>;
  exhibit_id?: string;
  added_at: string;
  project_id: string;
  owner_id: string;
  [key: string]: any; // Allow for additional properties
}

interface EnhancedFileListItemProps {
  file: FileItem;
  isSelected: boolean;
  onSelect: (fileId: string) => void;
  onShowDetails?: (fileId: string) => void;
  onDownload?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
}

// Styled components for enhanced visuals
const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: '2px 0',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  padding: '6px 8px',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.08)' 
      : 'rgba(0, 0, 0, 0.04)',
    transform: 'translateX(4px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(99, 102, 241, 0.2)' 
      : 'rgba(99, 102, 241, 0.1)',
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    transform: 'translateX(4px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 12px rgba(99, 102, 241, 0.3)'
      : '0 4px 12px rgba(99, 102, 241, 0.2)',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(99, 102, 241, 0.25)' 
        : 'rgba(99, 102, 241, 0.15)',
      transform: 'translateX(6px)',
    },
  },
  '&:active': {
    transform: 'scale(0.98) translateX(2px)',
  },
}));

// Helper function to get file icon based on type
const getFileIcon = (fileType: string, contentType?: string) => {
  switch (fileType) {
    case 'pdf':
      return <PdfIcon color="error" />;
    case 'image':
      return <ImageIcon color="primary" />;
    case 'document':
      return <DocumentIcon color="info" />;
    case 'audio':
      return <AudioIcon color="secondary" />;
    case 'video':
      return <VideoIcon color="success" />;
    case 'code':
      return <CodeIcon color="warning" />;
    default:
      // Check content type for more specific icon matching
      if (contentType?.includes('pdf')) {
        return <PdfIcon color="error" />;
      } else if (contentType?.includes('image')) {
        return <ImageIcon color="primary" />;
      } else if (contentType?.includes('audio')) {
        return <AudioIcon color="secondary" />;
      } else if (contentType?.includes('video')) {
        return <VideoIcon color="success" />;
      } else if (contentType?.includes('text')) {
        return <DocumentIcon color="info" />;
      }
      return <GenericFileIcon />;
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const EnhancedFileListItem: React.FC<EnhancedFileListItemProps> = ({
  file,
  isSelected,
  onSelect,
  onShowDetails,
  onDownload,
  onDelete,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  // Handle opening the menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle closing the menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle delete with confirmation dialog
  const handleDelete = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    
    // Only call onDelete if it exists
    if (onDelete) {
      onDelete(file.id);
    }
  };
  
  // Handle download action
  const handleDownload = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    
    // Only call onDownload if it exists
    if (onDownload) {
      onDownload(file.id);
    }
  };
  
  // Handle showing details
  const handleShowDetails = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    
    // Only call onShowDetails if it exists
    if (onShowDetails) {
      onShowDetails(file.id);
    }
  };
  
  // Is file being processed?
  const isProcessing = file.metadata?.processingStatus === 'pending';
  
  // Format the date added
  const dateAdded = new Date(file.added_at);
  const timeAgo = formatDistanceToNow(dateAdded, { addSuffix: true });
  
  // Get primary tags if available
  const primaryTag = file.metadata?.tags?.[0];
  
  return (
    <ListItem
      disablePadding
      sx={{ display: 'block' }}
      secondaryAction={
        <IconButton 
          edge="end" 
          aria-label="more options"
          onClick={handleMenuOpen}
          size="small"
          sx={{ opacity: menuOpen ? 1 : 0.3, '&:hover': { opacity: 1 } }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      }
    >
      <StyledListItemButton
        selected={isSelected}
        onClick={() => onSelect(file.id)}
        data-testid={`file-item-${file.id}`}
      >
        <ListItemAvatar>
          <Avatar
            variant="rounded"
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'background.paper',
              boxShadow: isSelected ? 2 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: 2,
              },
            }}
          >
            {getFileIcon(file.file_type, file.content_type)}
          </Avatar>
        </ListItemAvatar>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title={file.name} placement="top">
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: isSelected ? 600 : 400,
                    flexGrow: 1,
                    maxWidth: 'calc(100% - 80px)',
                  }}
                >
                  {file.name}
                </Typography>
              </Tooltip>
              
              {file.exhibit_id && (
                <Tooltip title="Exhibit ID" placement="top">
                  <Chip
                    label={file.exhibit_id}
                    size="small"
                    sx={{ 
                      ml: 1,
                      height: 20,
                      fontSize: '0.7rem',
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          }
          secondary={
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginTop: '0.25rem',
              gap: '0.5rem',
              fontSize: '0.7rem',
              color: 'inherit',
            }}>
              <span style={{ fontSize: '0.7rem' }}>
                {formatFileSize(file.size || 0)}
              </span>
              
              <span style={{ fontSize: '0.7rem' }}>
                •
              </span>
              
              <span style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {timeAgo}
              </span>
              
              {primaryTag && (
                <>
                  <span style={{ fontSize: '0.7rem' }}>
                    •
                  </span>
                  <Chip 
                    label={primaryTag} 
                    size="small" 
                    sx={{ 
                      height: 16, 
                      fontSize: '0.6rem',
                      '& .MuiChip-label': { px: 0.5 }
                    }} 
                  />
                </>
              )}
              
              {isProcessing && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    animation: 'pulse 1.5s infinite',
                    display: 'inline-block',
                    marginLeft: '0.25rem',
                  }}
                />
              )}
            </span>
          }
          primaryTypographyProps={{ 
            variant: 'body2' 
          }}
          secondaryTypographyProps={{ 
            component: 'span'
          }}
        />
      </StyledListItemButton>
      
      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'file-menu-button',
          dense: true,
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleShowDetails}>
          <ListItemIcon>
            <Tooltip title="Details">
              <MoreVertIcon fontSize="small" />
            </Tooltip>
          </ListItemIcon>
          <ListItemText>Details</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <Tooltip title="Download">
              <DownloadIcon fontSize="small" />
            </Tooltip>
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Tooltip title="Delete">
              <DeleteIcon fontSize="small" color="error" />
            </Tooltip>
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </ListItem>
  );
};

export default EnhancedFileListItem;
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
  margin: '4px 0',
  transition: 'all 0.2s ease',
  padding: '8px 12px',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.08)' 
      : 'rgba(0, 0, 0, 0.04)',
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(67, 129, 250, 0.2)' 
      : 'rgba(67, 129, 250, 0.1)',
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(67, 129, 250, 0.25)' 
        : 'rgba(67, 129, 250, 0.15)',
    },
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
              width: 40,
              height: 40,
              bgcolor: 'background.paper',
              boxShadow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mt: 0.5,
              gap: 1,
              fontSize: '0.7rem',
              color: 'text.secondary',
            }}>
              <Typography variant="caption">
                {formatFileSize(file.size || 0)}
              </Typography>
              
              <Typography variant="caption" noWrap>
                •
              </Typography>
              
              <Typography variant="caption" noWrap>
                {timeAgo}
              </Typography>
              
              {primaryTag && (
                <>
                  <Typography variant="caption" noWrap>
                    •
                  </Typography>
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
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'warning.main',
                    animation: 'pulse 1.5s infinite',
                    display: 'inline-block',
                    ml: 0.5,
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.4 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
              )}
            </Box>
          }
          primaryTypographyProps={{ 
            variant: 'body2' 
          }}
          secondaryTypographyProps={{ 
            variant: 'caption',
            component: 'div'
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
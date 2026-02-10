import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
  Chip,
  Stack,
  Divider,
  Box,
  LinearProgress,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import FileTypeIcon from '../../components/icons/FileTypeIcon';
import { FileRecord } from '../../hooks/useProjectFiles';
import { NoFilesEmptyState, NoSearchResultsEmptyState } from '../ui/EmptyState';
import { FileListSkeleton } from '../ui/LoadingSkeleton';

interface FileListProps {
  files: FileRecord[];
  filteredFiles: FileRecord[];
  selectedFileId: string | null;
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  onSelectFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => Promise<void>;
  onDownloadFile: (fileId: string) => Promise<void>;
  onRenameFile: (fileId: string) => void;
  onSwitchToUpload?: () => void;
  searchActive: boolean;
}

const FileList: React.FC<FileListProps> = ({
  files,
  filteredFiles,
  selectedFileId,
  loading,
  uploading,
  uploadProgress,
  onSelectFile,
  onDeleteFile,
  onDownloadFile,
  onRenameFile,
  onSwitchToUpload,
  searchActive,
}) => {
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFileMenuId, setActiveFileMenuId] = useState<string | null>(null);

  // File menu handlers
  const handleFileMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, fileId: string) => {
    event.stopPropagation();
    setFileMenuAnchorEl(event.currentTarget);
    setActiveFileMenuId(fileId);
  };

  const handleCloseFileMenu = () => {
    setFileMenuAnchorEl(null);
    setActiveFileMenuId(null);
  };

  // Handle file rename
  const handleRenameFile = () => {
    if (activeFileMenuId) {
      onRenameFile(activeFileMenuId);
      handleCloseFileMenu();
    }
  };

  // Handle file delete
  const handleDeleteFile = async () => {
    if (activeFileMenuId) {
      await onDeleteFile(activeFileMenuId);
      handleCloseFileMenu();
    }
  };

  // Handle file download
  const handleDownloadFile = async () => {
    if (activeFileMenuId) {
      await onDownloadFile(activeFileMenuId);
      handleCloseFileMenu();
    }
  };

  // Display files to show (filtered or all)
  const displayFiles = searchActive ? filteredFiles : files;
  
  return (
    <>
      {/* Files section header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        px: 2, 
        py: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Files
          {displayFiles.length > 0 && (
            <Typography 
              component="span" 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 1 }}
            >
              ({displayFiles.length})
            </Typography>
          )}
        </Typography>
      </Box>

      {/* Upload progress */}
      {uploading && (
        <Box sx={{ width: '100%', px: 2, py: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ height: 6, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 0.5 }}>
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* Files list */}
      <List
        sx={{
          width: '100%',
          overflow: 'auto',
          flexGrow: 1,
        }}
        component="nav"
        aria-label="files list"
      >
        {loading ? (
          <FileListSkeleton items={5} />
        ) : displayFiles.length === 0 ? (
          searchActive ? (
            <NoSearchResultsEmptyState />
          ) : (
            <NoFilesEmptyState onUpload={onSwitchToUpload} />
          )
        ) : (
          // File list
          displayFiles.map((file) => (
            <ListItem
              key={file.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="file options"
                  onClick={(e) => handleFileMenuOpen(e, file.id)}
                  size="small"
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton
                selected={selectedFileId === file.id}
                onClick={() => onSelectFile(file.id)}
                data-test={`file-item-${file.id}`}
                sx={{
                  pr: 7,
                  borderRadius: '10px',
                  mx: 1,
                  mb: 0.5,
                  py: 0.5,
                  transition: 'all 150ms ease',
                  '&:hover': {
                    transform: 'translateX(3px)',
                    bgcolor: (t: any) => alpha(t.palette.primary.main, 0.04),
                  },
                  '&.Mui-selected': {
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    bgcolor: (t: any) => alpha(t.palette.primary.main, 0.06),
                  },
                }}
              >
                <ListItemIcon>
                  <FileTypeIcon fileType={file.file_type} fileName={file.name} size="medium" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.name}
                    </Typography>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                      {file.exhibit_id && (
                        <Chip
                          label={file.exhibit_id}
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<LabelIcon fontSize="small" />}
                          sx={{ height: 20, '& .MuiChip-label': { px: 1 } }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'inline-block',
                          lineHeight: 1.2,
                        }}
                      >
                        {new Date(file.added_at).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>

      {/* File actions menu */}
      <Menu
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl)}
        onClose={handleCloseFileMenu}
        PaperProps={{
          elevation: 3,
          sx: { width: 200 }
        }}
      >
        <MenuItem onClick={handleRenameFile}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename / Assign ID</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadFile}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteFile} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default FileList; 
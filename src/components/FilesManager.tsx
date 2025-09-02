import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemIcon,
} from '@mui/material';
import {
  Description,
  Image as ImageIcon,
  VideoFile,
  AudioFile,
  InsertDriveFile,
  Add,
  Delete,
  MoreVert,
  TextSnippet,
  TableChart,
  Slideshow,
  Code,
  FileDownload,
  ContentCopy,
  History as HistoryIcon,
} from '@mui/icons-material';
import FileUploadZone from './FileUploadZone';
import UniversalFileViewer from './viewers/UniversalFileViewer';
import { FileRecord, useProjectFiles } from '../hooks/useProjectFiles';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import FileVersionHistory from './FileVersionHistory';
import FileStatusIndicator, { FileStatus } from './FileStatusIndicator';
import { isUsingFallback, syncLocalFilesToCloud } from '../services/storageService';

interface FilesManagerProps {
  projectId: string;
}

const FilesManager: React.FC<FilesManagerProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFile, setMenuFile] = useState<FileRecord | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>({});
  
  // Fetch files for the current project
  const { data: files = [], isLoading, error, refetch } = useProjectFiles(projectId);
  
  // Group files by type
  const filesByType = files.reduce((acc: Record<string, FileRecord[]>, file) => {
    const type = file.file_type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(file);
    return acc;
  }, {});
  
  // Get file count by type
  const getFileCount = (type: string): number => {
    return type === 'all' ? files.length : (filesByType[type]?.length || 0);
  };
  
  // Get all file types in the project
  const fileTypes = ['all', ...Object.keys(filesByType).sort()];
  
  // Filter files by selected type
  const filteredFiles = activeTab === 'all' ? files : (filesByType[activeTab] || []);
  
  // Handle file upload success
  const handleUploadSuccess = (fileData: any) => {
    refetch();
    // Optionally auto-select the newly uploaded file
    setSelectedFile(fileData);
  };
  
  // Handle upload dialog close
  const handleCloseUploadDialog = () => {
    setShowUploadDialog(false);
  };
  
  // Handle file select
  const handleFileSelect = (file: FileRecord) => {
    setSelectedFile(file);
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
    setSelectedFile(null);
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: FileRecord) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuFile(file);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuFile(null);
  };
  
  // Handle file delete
  const handleDeleteFile = async () => {
    if (!menuFile) return;
    
    try {
      // Delete file from storage
      await supabase.storage
        .from('files')
        .remove([menuFile.storage_path]);
      
      // Delete file record from database
      await supabase
        .from('files')
        .delete()
        .eq('id', menuFile.id);
      
      // Clear selected file if it's the one being deleted
      if (selectedFile && selectedFile.id === menuFile.id) {
        setSelectedFile(null);
      }
      
      // Refresh file list
      refetch();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
    
    // Close menu and dialog
    handleMenuClose();
    setDeleteConfirmOpen(false);
  };
  
  // Handle copy file link
  const handleCopyLink = () => {
    if (!menuFile) return;
    
    // Get public URL for file
    const { data } = supabase.storage
      .from('files')
      .getPublicUrl(menuFile.storage_path);
    
    // Copy to clipboard
    navigator.clipboard.writeText(data.publicUrl);
    
    // Close menu
    handleMenuClose();
  };
  
  // Handle file download
  const handleDownload = () => {
    if (!menuFile) return;
    
    // Get public URL for file
    const { data } = supabase.storage
      .from('files')
      .getPublicUrl(menuFile.storage_path);
    
    // Create download link
    const link = document.createElement('a');
    link.href = data.publicUrl;
    link.download = menuFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Close menu
    handleMenuClose();
  };
  
  // Get icon for file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <Description />;
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoFile />;
      case 'audio':
        return <AudioFile />;
      case 'document':
        return <TextSnippet />;
      case 'spreadsheet':
        return <TableChart />;
      case 'presentation':
        return <Slideshow />;
      case 'code':
        return <Code />;
      default:
        return <InsertDriveFile />;
    }
  };
  
  // Update file status when files change
  useEffect(() => {
    if (!files.length) return;

    // Create initial file status map
    const newStatuses: Record<string, FileStatus> = {};
    const fallbackMode = isUsingFallback();

    files.forEach(file => {
      // Check if file has metadata with sync status information
      if (file.metadata?.synced === false) {
        newStatuses[file.id] = 'local';
      } else if (fallbackMode) {
        // In fallback mode, mark files as local if they don't have explicit sync status
        newStatuses[file.id] = 'local';
      } else {
        // Otherwise, assume synced
        newStatuses[file.id] = 'synced';
      }
    });

    setFileStatuses(newStatuses);
  }, [files]);

  // Attempt to sync files when in local mode
  useEffect(() => {
    const attemptSync = async () => {
      // Don't attempt to sync if there are no files in local status
      const hasLocalFiles = Object.values(fileStatuses).some(status => status === 'local');
      if (!hasLocalFiles) return;

      try {
        // Update status to syncing for all local files
        const syncingStatuses = { ...fileStatuses };
        Object.keys(syncingStatuses).forEach(id => {
          if (syncingStatuses[id] === 'local') {
            syncingStatuses[id] = 'syncing';
          }
        });
        setFileStatuses(syncingStatuses);

        // Attempt to sync files to cloud
        const success = await syncLocalFilesToCloud();

        // Update statuses based on sync result
        if (success) {
          const updatedStatuses = { ...fileStatuses };
          Object.keys(updatedStatuses).forEach(id => {
            if (updatedStatuses[id] === 'syncing') {
              updatedStatuses[id] = 'synced';
            }
          });
          setFileStatuses(updatedStatuses);

          // Refresh files list from server
          refetch();
        } else {
          // Mark files as still local if sync failed
          const failedStatuses = { ...fileStatuses };
          Object.keys(failedStatuses).forEach(id => {
            if (failedStatuses[id] === 'syncing') {
              failedStatuses[id] = 'local';
            }
          });
          setFileStatuses(failedStatuses);
        }
      } catch (error) {
        console.error('Error syncing files:', error);
        // Mark all syncing files as error
        const errorStatuses = { ...fileStatuses };
        Object.keys(errorStatuses).forEach(id => {
          if (errorStatuses[id] === 'syncing') {
            errorStatuses[id] = 'error';
          }
        });
        setFileStatuses(errorStatuses);
      }
    };

    // Run sync attempt when not in fallback mode
    if (!isUsingFallback()) {
      attemptSync();
    }
  }, [fileStatuses, refetch]);

  // Handle file version restore
  const handleVersionRestore = (success: boolean) => {
    if (success) {
      // Refresh file list to show the restored version
      refetch();
      setShowVersionHistory(false);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* File List Panel */}
      <Paper
        sx={{
          width: 300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 2,
          ml: 1,
          mr: 1,
        }}
        elevation={1}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Files</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            size="small"
            onClick={() => setShowUploadDialog(true)}
          >
            Upload
          </Button>
        </Box>
        
        {/* File Type Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="file type tabs"
          >
            {fileTypes.map((type) => (
              <Tab
                key={type}
                label={`${type.charAt(0).toUpperCase() + type.slice(1)} (${getFileCount(type)})`}
                value={type}
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </Tabs>
        </Box>
        
        {/* File List */}
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {isLoading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Loading files...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="error">
                Error loading files
              </Typography>
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No files found
              </Typography>
            </Box>
          ) : (
            filteredFiles.map((file) => (
              <ListItem
                key={file.id}
                disablePadding
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FileStatusIndicator 
                      status={fileStatuses[file.id] || 'synced'} 
                      size="small" 
                    />
                    <IconButton
                      edge="end"
                      aria-label="more"
                      onClick={(e) => handleMenuOpen(e, file)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemButton
                  selected={selectedFile?.id === file.id}
                  onClick={() => handleFileSelect(file)}
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                      }}
                    >
                      {getFileIcon(file.file_type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                        >
                          {new Date(file.added_at).toLocaleDateString()}
                        </Typography>
                        {file.exhibit_id && (
                          <Typography
                            variant="caption"
                            color="primary"
                            component="span"
                            sx={{ ml: 1 }}
                          >
                            ID: {file.exhibit_id}
                          </Typography>
                        )}
                      </>
                    }
                    primaryTypographyProps={{
                      noWrap: true,
                      style: { maxWidth: '160px' },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper>
      
      {/* File Viewer Panel */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {selectedFile ? (
          <UniversalFileViewer file={selectedFile} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 4,
              bgcolor: 'background.default',
              borderRadius: 2,
            }}
          >
            <InsertDriveFile
              sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6">No file selected</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 1, mb: 3 }}
            >
              Select a file from the list to view it, or upload a new file
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setShowUploadDialog(true)}
            >
              Upload Files
            </Button>
          </Box>
        )}
      </Box>
      
      {/* File Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={handleCloseUploadDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <FileUploadZone
            projectId={projectId}
            userId={user?.id || ''}
            onSuccess={handleUploadSuccess}
            maxFileSizeMB={100}
            multiple={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* File Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <FileDownload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy link</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setDeleteConfirmOpen(true);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedFile(menuFile);
            setShowVersionHistory(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Version History</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{menuFile?.name}"? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteFile}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Version History Dialog */}
      <Dialog
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>File Version History</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <FileVersionHistory
              filePath={selectedFile.storage_path}
              fileName={selectedFile.name}
              onRestore={handleVersionRestore}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersionHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FilesManager; 
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  Divider,
  Paper,
  Collapse,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Alert,
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import useAppStore from '../store';
import EnhancedFileListItem, { FileItem } from './EnhancedFileListItem';

interface DemoFilesListProps {
  className?: string;
  searchQuery?: string;
}

const DemoFilesList: React.FC<DemoFilesListProps> = ({ className, searchQuery = '' }) => {
  const [expanded, setExpanded] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchText, setLocalSearchText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Get files and selected file from store
  const files = useAppStore(state => state.files);
  const selectedFileId = useAppStore(state => state.selectedFileId);
  const setSelectedFile = useAppStore(state => state.setSelectedFile);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);

  // Filter files by project and search text
  const filteredFiles = useMemo(() => {
    if (!selectedProjectId) return [];
    
    // Use global search query or local search text
    const effectiveSearchText = searchQuery || localSearchText;
    
    return files
      .filter(file => file.project_id === selectedProjectId)
      .filter(file => {
        if (!effectiveSearchText) return true;
        const searchLower = effectiveSearchText.toLowerCase();
        return (
          file.name.toLowerCase().includes(searchLower) ||
          (file.exhibit_id && file.exhibit_id.toLowerCase().includes(searchLower)) ||
          (file.metadata?.tags && file.metadata.tags.some((tag: string) => 
            tag.toLowerCase().includes(searchLower)
          ))
        );
      });
  }, [files, selectedProjectId, searchQuery, localSearchText]);

  // Handle file selection with immediate feedback and auto-open right panel
  const handleSelectFile = useCallback((fileId: string) => {
    setSelectedFile(fileId);
    // Ensure right panel is open for immediate file display
    const isRightPanelOpen = useAppStore.getState().isRightPanelOpen;
    if (!isRightPanelOpen) {
      useAppStore.getState().toggleRightPanel();
    }
  }, [setSelectedFile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'u':
            e.preventDefault();
            handleUpload();
            break;
          case 'f':
            e.preventDefault();
            // Focus search input
            const searchInput = document.querySelector('input[placeholder="Search files..."]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
            break;
        }
      }
      // Arrow navigation
      if (filteredFiles.length > 0 && document.activeElement?.closest('[data-testid^="file-item-"]')) {
        const currentIndex = filteredFiles.findIndex(f => f.id === selectedFileId);
        if (e.key === 'ArrowDown' && currentIndex < filteredFiles.length - 1) {
          e.preventDefault();
          handleSelectFile(filteredFiles[currentIndex + 1].id);
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          e.preventDefault();
          handleSelectFile(filteredFiles[currentIndex - 1].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredFiles, selectedFileId, handleSelectFile]);

  // Placeholder for file actions (these would be implemented in a real app)
  const handleShowFileDetails = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      console.log('Show details for file:', file.name);
      alert(`File Details:\n\nName: ${file.name}\nType: ${file.file_type}\nSize: ${formatFileSize(file.size)}\nExhibit ID: ${file.exhibit_id || 'N/A'}\nAdded: ${new Date(file.added_at).toLocaleDateString()}`);
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

  const handleDownloadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      console.log('Download file:', file.name);
      // Create a mock download
      const link = document.createElement('a');
      link.href = '#';
      link.download = file.name;
      link.click();
      // Show feedback
      alert(`Downloading ${file.name} (Demo mode - actual file not downloaded)`);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && confirm(`Are you sure you want to delete "${file.name}"?`)) {
      useAppStore.setState(state => ({
        files: state.files.filter(f => f.id !== fileId),
        selectedFileId: state.selectedFileId === fileId ? null : state.selectedFileId
      }));
      console.log(`File deleted: ${file.name}`);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!selectedProjectId) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null) return 0;
          const newProgress = prev + Math.random() * 30;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => setUploadProgress(null), 500);
            return 100;
          }
          return newProgress;
        });
      }, 200);
      
      // Process files
      const newFiles = droppedFiles.map((file, index) => {
        const fileType = file.type.includes('pdf') ? 'pdf' :
                        file.type.includes('image') ? 'image' :
                        file.type.includes('audio') ? 'audio' :
                        file.type.includes('video') ? 'video' :
                        'document';
        
        return {
          id: `file-${Date.now()}-${index}`,
          name: file.name,
          file_type: fileType,
          content_type: file.type || 'application/octet-stream',
          size: file.size,
          project_id: selectedProjectId,
          owner_id: '00000000-0000-0000-0000-000000000000',
          exhibit_id: `${filteredFiles.length + index + 1}-A`,
          added_at: new Date().toISOString(),
          metadata: {
            tags: ['uploaded', fileType],
            processingStatus: 'completed'
          }
        };
      });
      
      // Add files to store and auto-select first one
      useAppStore.setState(state => ({
        files: [...state.files, ...newFiles],
        selectedFileId: newFiles[0].id
      }));
    }
  }, [selectedProjectId, filteredFiles.length]);

  // Upload button handler - simulate new file upload
  const handleUpload = useCallback(() => {
    if (!selectedProjectId) return;
    
    // Mock file types
    const fileTypes = ['pdf', 'image', 'document', 'audio', 'video'];
    const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    
    // Mock content types based on file type
    const contentTypes = {
      pdf: 'application/pdf',
      image: 'image/jpeg',
      document: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      audio: 'audio/mpeg',
      video: 'video/mp4'
    };
    
    // Generate a file name
    const fileNames = {
      pdf: ['Contract', 'Agreement', 'Report', 'Brief', 'Case Summary', 'Testimony'],
      image: ['Evidence Photo', 'Scene Image', 'Document Scan', 'Exhibit'],
      document: ['Meeting Notes', 'Deposition', 'Statement', 'Analysis'],
      audio: ['Interview', 'Recording', 'Testimony', 'Call Recording'],
      video: ['Surveillance Footage', 'Video Statement', 'Interview Recording']
    };
    
    const baseName = fileNames[fileType as keyof typeof fileNames][
      Math.floor(Math.random() * fileNames[fileType as keyof typeof fileNames].length)
    ];
    
    const fileName = `${baseName} ${new Date().toLocaleDateString().replace(/\//g, '-')}.${
      fileType === 'pdf' ? 'pdf' : 
      fileType === 'image' ? 'jpg' : 
      fileType === 'document' ? 'docx' : 
      fileType === 'audio' ? 'mp3' : 
      'mp4'
    }`;
    
    // Create new file
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name: fileName,
      file_type: fileType,
      content_type: contentTypes[fileType as keyof typeof contentTypes],
      size: Math.floor(Math.random() * 10000000),
      project_id: selectedProjectId,
      owner_id: '00000000-0000-0000-0000-000000000000',
      exhibit_id: `${filteredFiles.length + 1}-${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
      added_at: new Date().toISOString(),
      metadata: {
        tags: ['demo', fileType],
        processingStatus: 'completed'
      }
    };
    
    // Simulate upload progress
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 0;
        const newProgress = prev + Math.random() * 25;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setUploadProgress(null), 500);
          return 100;
        }
        return newProgress;
      });
    }, 150);
    
    // Add to store and auto-select
    setTimeout(() => {
      useAppStore.setState(state => ({
        files: [...state.files, newFile],
        selectedFileId: newFile.id
      }));
    }, 800);
  }, [selectedProjectId, filteredFiles.length]);

  // Clear search
  const handleClearSearch = () => {
    setLocalSearchText('');
  };

  return (
    <Paper 
      elevation={0}
      className={className}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        border: dragActive ? '2px dashed' : '1px solid',
        borderColor: dragActive ? 'primary.main' : 'divider',
        display: 'flex',
        flexDirection: 'column',
        mb: 2,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: dragActive ? 'scale(1.02)' : 'scale(1)',
        boxShadow: dragActive ? 3 : 0,
        position: 'relative',
      }}
    >
      {/* Drag overlay */}
      {dragActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'primary.main',
            opacity: 0.1,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
            Drop files here to upload
          </Typography>
        </Box>
      )}
      
      {/* Upload progress indicator */}
      {uploadProgress !== null && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: 'action.hover',
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              height: '100%',
              bgcolor: 'primary.main',
              width: `${uploadProgress}%`,
              transition: 'width 0.2s ease',
            }}
          />
        </Box>
      )}
      
      {/* Section Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          bgcolor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.02)',
          transition: 'background-color 0.2s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <UploadFileIcon sx={{ mr: 1, opacity: 0.7 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Files
          </Typography>
          {filteredFiles.length > 0 && (
            <Chip 
              label={filteredFiles.length} 
              size="small" 
              sx={{ ml: 1, height: 20, minWidth: 20 }} 
            />
          )}
        </Box>
        
        <Box>
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label="toggle files"
            sx={{
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.1)',
                bgcolor: 'action.hover',
              },
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Files Content */}
      <Collapse 
        in={expanded} 
        timeout={300}
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          '& .MuiCollapse-wrapperInner': {
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Search Bar */}
        <Box sx={{ p: 1 }}>
          <TextField
            fullWidth
            placeholder="Search files... (Ctrl+F)"
            variant="outlined"
            size="small"
            value={localSearchText}
            onChange={(e) => setLocalSearchText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: 1,
                },
                '&.Mui-focused': {
                  transform: 'scale(1.02)',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: localSearchText ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="clear search"
                    onClick={handleClearSearch}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="toggle filters"
                    onClick={() => setShowFilters(!showFilters)}
                    edge="end"
                  >
                    <FilterListIcon 
                      fontSize="small" 
                      color={showFilters ? 'primary' : undefined}
                    />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Advanced Filters Collapsed Panel */}
        <Collapse in={showFilters}>
          <Box sx={{ px: 1, pb: 1 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Advanced Filters (Demo)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {['PDF', 'Image', 'Document', 'Audio', 'Video'].map(type => (
                  <Chip
                    key={type}
                    label={type}
                    size="small"
                    onClick={() => {
                      const matchingFiles = filteredFiles.filter(file => 
                        file.file_type.toLowerCase() === type.toLowerCase()
                      );
                      alert(`Filter by ${type}:\nFound ${matchingFiles.length} ${type.toLowerCase()} files\n\nIn a real app, this would filter the file list to show only ${type} files.`);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Paper>
          </Box>
        </Collapse>

        {/* Files List */}
        <Box sx={{ 
          borderTop: '1px solid',
          borderTopColor: 'divider',
        }}>
          {!selectedProjectId ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Alert severity="info">
                Please select a project to view files
              </Alert>
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" variant="body2">
                {(searchQuery || localSearchText) ? 'No files match your search' : 'No files in this project yet'}
              </Typography>
              {!(searchQuery || localSearchText) && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                  onClick={handleUpload}
                >
                  Upload Files
                </Button>
              )}
            </Box>
          ) : (
            <List disablePadding>
              {filteredFiles.map(file => (
                <EnhancedFileListItem
                  key={file.id}
                  file={file}
                  isSelected={file.id === selectedFileId}
                  onSelect={handleSelectFile}
                  onShowDetails={handleShowFileDetails}
                  onDownload={handleDownloadFile}
                  onDelete={handleDeleteFile}
                />
              ))}
            </List>
          )}
        </Box>
        
        {/* Upload Button */}
        {selectedProjectId && filteredFiles.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<UploadFileIcon />}
                onClick={handleUpload}
                disabled={uploadProgress !== null}
                sx={{
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2,
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                }}
              >
                {uploadProgress !== null ? 'Uploading...' : 'Upload New File'}
              </Button>
            </Box>
          </>
        )}
      </Collapse>
    </Paper>
  );
};

export default DemoFilesList;
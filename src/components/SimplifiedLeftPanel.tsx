import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Paper,
  Button,
  Tooltip,
  alpha,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  CloudUpload,
  CreateNewFolder,
  Clear as ClearIcon,
  FilePresent,
  FilterList,
} from '@mui/icons-material';
import useAppStore from '../store';
import DemoFilesList from './DemoFilesList';

interface SimplifiedLeftPanelProps {
  className?: string;
  sx?: any;
}

const SimplifiedLeftPanel: React.FC<SimplifiedLeftPanelProps> = ({ className, sx }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const files = useAppStore(state => state.files);
  const projects = useAppStore(state => state.projects);
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectFiles = files.filter(f => f.project_id === selectedProjectId);

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedProjectId) {
      setDragActive(true);
    }
  }, [selectedProjectId]);

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
    
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesUpload(droppedFiles);
  }, [selectedProjectId]);

  const handleFilesUpload = (uploadedFiles: File[]) => {
    if (!selectedProjectId) return;
    
    setUploadProgress(0);
    const totalFiles = uploadedFiles.length;
    
    uploadedFiles.forEach((file, index) => {
      setTimeout(() => {
        const newFile = {
          id: `file-${Date.now()}-${index}`,
          name: file.name,
          project_id: selectedProjectId,
          file_type: file.type || 'application/octet-stream',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          content: '',
          size: file.size,
          user_id: '00000000-0000-0000-0000-000000000000',
        };
        
        useAppStore.setState(state => ({
          files: [...state.files, newFile]
        }));
        
        setUploadProgress(((index + 1) / totalFiles) * 100);
        
        if (index === totalFiles - 1) {
          setTimeout(() => setUploadProgress(null), 1000);
        }
      }, 200 * index);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    if (uploadedFiles.length > 0) {
      handleFilesUpload(uploadedFiles);
    }
  };

  const handleNewFile = () => {
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }
    
    const fileName = prompt('Enter file name:', 'Untitled Document');
    if (!fileName) return;
    
    const fileType = fileName.includes('.') 
      ? `application/${fileName.split('.').pop()}`
      : 'text/plain';
    
    const newFile = {
      id: `file-${Date.now()}`,
      name: fileName.includes('.') ? fileName : `${fileName}.txt`,
      project_id: selectedProjectId,
      file_type: fileType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      content: '',
      size: 0,
      user_id: '00000000-0000-0000-0000-000000000000',
    };
    
    useAppStore.setState(state => ({
      files: [...state.files, newFile],
      selectedFileId: newFile.id
    }));
  };

  if (!selectedProjectId) {
    return (
      <Box 
        className={className}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
          bgcolor: 'background.paper',
          ...sx
        }}
      >
        <FilePresent sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Project Selected
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Select a project from the dropdown above to view its files
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        position: 'relative',
        ...sx
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <Fade in={dragActive}>
        <Paper
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            bgcolor: alpha('#2563eb', 0.95),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: dragActive ? 'auto' : 'none',
          }}
        >
          <CloudUpload sx={{ fontSize: 64, color: 'white', mb: 2 }} />
          <Typography variant="h5" color="white" gutterBottom>
            Drop files here
          </Typography>
          <Typography variant="body1" color="white" sx={{ opacity: 0.8 }}>
            Files will be added to {selectedProject?.name}
          </Typography>
        </Paper>
      </Fade>

      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            mb: 2,
            color: 'primary.main'
          }}
        >
          {selectedProject?.name} Files
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
          }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<CreateNewFolder />}
            onClick={handleNewFile}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            New File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
          <Button
            fullWidth
            variant="outlined"
            startIcon={uploadProgress !== null ? <CircularProgress size={16} /> : <CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress !== null}
          >
            {uploadProgress !== null ? `${Math.round(uploadProgress)}%` : 'Upload'}
          </Button>
        </Box>

        {/* File Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {projectFiles.length} files
          </Typography>
          <Tooltip title="Filter files">
            <IconButton size="small">
              <FilterList fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Files List */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <DemoFilesList searchQuery={searchQuery} />
      </Box>
    </Box>
  );
};

export default SimplifiedLeftPanel;
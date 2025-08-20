import React, { useState, useMemo } from 'react';
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

  // Handle file selection
  const handleSelectFile = (fileId: string) => {
    setSelectedFile(fileId);
  };

  // Placeholder for file actions (these would be implemented in a real app)
  const handleShowFileDetails = (fileId: string) => {
    console.log('Show details for file:', fileId);
  };

  const handleDownloadFile = (fileId: string) => {
    console.log('Download file:', fileId);
    alert('Download functionality is simulated in demo mode');
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      useAppStore.setState(state => ({
        files: state.files.filter(f => f.id !== fileId),
        selectedFileId: state.selectedFileId === fileId ? null : state.selectedFileId
      }));
    }
  };

  // Upload button handler - simulate new file upload
  const handleUpload = () => {
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
    
    // Add to store
    useAppStore.setState(state => ({
      files: [...state.files, newFile],
      selectedFileId: newFile.id
    }));
  };

  // Clear search
  const handleClearSearch = () => {
    setLocalSearchText('');
  };

  return (
    <Paper 
      elevation={0}
      className={className}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        mb: 2,
      }}
    >
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
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Files Content */}
      <Collapse in={expanded} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Search Bar */}
        <Box sx={{ p: 1 }}>
          <TextField
            fullWidth
            placeholder="Search files..."
            variant="outlined"
            size="small"
            value={localSearchText}
            onChange={(e) => setLocalSearchText(e.target.value)}
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
                    onClick={() => {}}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Paper>
          </Box>
        </Collapse>

        {/* Files List */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          borderTop: '1px solid',
          borderTopColor: 'divider',
          scrollbarWidth: 'thin',
          minHeight: 0
        }}
          {!selectedProjectId ? (
            <Box sx={{ p: 2, textAlign: 'center' }}
              <Alert severity="info">
                Please select a project to view files
              </Alert>
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}
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
                variant="contained"
                startIcon={<UploadFileIcon />}
                onClick={handleUpload}
              >
                Upload New File
              </Button>
            </Box>
          </>
        )}
      </Collapse>
    </Paper>
  );
};

export default DemoFilesList;
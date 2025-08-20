import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Paper,
  Fade,
  Zoom,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  CheckCircle,
  Error as ErrorIcon,
  Delete,
  PictureAsPdf,
  Image,
  AudioFile,
  VideoFile,
  Description,
  Close,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import useAppStore from '../store';

interface FileWithProgress extends File {
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
}

const FunctionalFileUpload: React.FC = () => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const { selectedProjectId, addFileToProject } = useAppStore();

  // Simulate file upload
  const uploadFile = async (file: FileWithProgress) => {
    // Update progress gradually
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, progress, status: progress === 100 ? 'completed' : 'uploading' }
          : f
      ));
    }
    
    // Create a local URL for the file
    const url = URL.createObjectURL(file);
    
    // Add to store
    if (selectedProjectId) {
      // Determine file type from MIME type
      let fileType = 'document';
      if (file.type.includes('pdf')) fileType = 'pdf';
      else if (file.type.includes('image')) fileType = 'image';
      else if (file.type.includes('audio')) fileType = 'audio';
      else if (file.type.includes('video')) fileType = 'video';
      else if (file.type.includes('text')) fileType = 'text';
      else if (file.type.includes('word')) fileType = 'document';
      
      addFileToProject(selectedProjectId, {
        id: file.id,
        name: file.name,
        file_path: url,
        file_type: fileType,
        added_at: new Date().toISOString(),
        content_type: file.type,
        size: file.size,
      });
    }
    
    return url;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: FileWithProgress[] = acceptedFiles.map(file => ({
      ...file,
      id: `file-${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'uploading' as const,
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    setUploadMessage('');
    
    // Upload files
    for (const file of newFiles) {
      try {
        const url = await uploadFile(file);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, url, status: 'completed' } : f
        ));
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ));
      }
    }
    
    if (selectedProjectId) {
      setUploadMessage(`Successfully uploaded ${newFiles.length} file(s)`);
    } else {
      setUploadMessage('Please select a project first');
    }
    setTimeout(() => setUploadMessage(''), 3000);
  }, [selectedProjectId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'audio/*': ['.mp3', '.wav'],
      'video/*': ['.mp4', '.avi'],
      'application/msword': ['.doc', '.docx'],
      'text/*': ['.txt', '.md'],
    }
  });

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <PictureAsPdf color="error" />;
    if (type.includes('image')) return <Image color="primary" />;
    if (type.includes('audio')) return <AudioFile color="secondary" />;
    if (type.includes('video')) return <VideoFile color="info" />;
    if (type.includes('word') || type.includes('document')) return <Description color="action" />;
    return <InsertDriveFile />;
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Dropzone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: isDragActive ? 'action.hover' : 'background.default',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          }
        }}
      >
        <input {...getInputProps()} />
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        </Zoom>
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Supported: PDF, Images, Audio, Video, Documents
        </Typography>
      </Paper>

      {/* Upload message */}
      <Fade in={!!uploadMessage}>
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          action={
            <IconButton size="small" onClick={() => setUploadMessage('')}>
              <Close fontSize="small" />
            </IconButton>
          }
        >
          {uploadMessage}
        </Alert>
      </Fade>

      {/* File list */}
      {files.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files
          </Typography>
          <List>
            {files.map((file, index) => (
              <Fade in={true} key={file.id} style={{ transitionDelay: `${index * 50}ms` }}>
                <ListItem>
                  <ListItemIcon>
                    {getFileIcon(file.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption">
                          {formatFileSize(file.size)}
                        </Typography>
                        {file.status === 'uploading' && (
                          <Box sx={{ flex: 1, minWidth: 100 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={file.progress}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        )}
                        {file.status === 'completed' && (
                          <Chip 
                            label="Uploaded" 
                            size="small" 
                            color="success"
                            icon={<CheckCircle />}
                          />
                        )}
                        {file.status === 'error' && (
                          <Chip 
                            label="Error" 
                            size="small" 
                            color="error"
                            icon={<ErrorIcon />}
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading'}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Fade>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default FunctionalFileUpload;
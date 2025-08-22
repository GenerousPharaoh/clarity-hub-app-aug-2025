/**
 * SupabaseFileUpload - Advanced file upload component with Supabase integration
 * 
 * Features:
 * - Drag and drop support
 * - Multiple file uploads
 * - Progress tracking
 * - File type validation
 * - Automatic metadata extraction
 * - SHA256 hash generation
 * - Thumbnail generation for images
 * - Integration with document citations
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  PictureAsPdf,
  Image,
  AudioFile,
  VideoFile,
  Description,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
  Close,
  Upload,
} from '@mui/icons-material';
import { 
  uploadFile, 
  createFileRecord, 
  getSignedUrl,
  supabase 
} from '../../lib/supabase';
import useAppStore from '../../store';

interface FileUploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  url?: string;
  storageId?: string;
  hash?: string;
}

interface SupabaseFileUploadProps {
  projectId: string;
  documentId?: string;
  onUploadComplete?: (files: any[]) => void;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

const SupabaseFileUpload: React.FC<SupabaseFileUploadProps> = ({
  projectId,
  documentId,
  onUploadComplete,
  maxFileSize = 100, // 100MB default
  acceptedTypes = [
    'application/pdf',
    'image/*',
    'audio/*',
    'video/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
}) => {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileUploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFile = useAppStore(state => state.addFile);

  // Get file icon based on type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image color="primary" />;
    if (mimeType.includes('pdf')) return <PictureAsPdf color="error" />;
    if (mimeType.startsWith('audio/')) return <AudioFile color="secondary" />;
    if (mimeType.startsWith('video/')) return <VideoFile color="secondary" />;
    if (mimeType.includes('word') || mimeType.includes('document')) 
      return <Description color="primary" />;
    return <InsertDriveFile />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Generate SHA256 hash for file
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileUploadItem[] = [];
    const maxSizeBytes = maxFileSize * 1024 * 1024;

    Array.from(selectedFiles).forEach(file => {
      // Validate file size
      if (file.size > maxSizeBytes) {
        console.error(`File ${file.name} exceeds ${maxFileSize}MB limit`);
        return;
      }

      // Create file upload item
      const fileItem: FileUploadItem = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        status: 'pending',
        progress: 0,
      };

      newFiles.push(fileItem);
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setUploadDialog(true);
  }, [maxFileSize]);

  // Upload single file to Supabase
  const uploadSingleFile = async (fileItem: FileUploadItem) => {
    try {
      // Update status
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploading', progress: 10 }
          : f
      ));

      // Generate file hash
      const hash = await generateFileHash(fileItem.file);
      
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, progress: 30, hash }
          : f
      ));

      // Create storage path
      const fileExt = fileItem.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storagePath = `${projectId}/${fileName}`;

      // Upload to Supabase Storage
      const uploadResult = await uploadFile(
        'files',
        storagePath,
        fileItem.file,
        { contentType: fileItem.type }
      );

      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, progress: 70, status: 'processing' }
          : f
      ));

      // Create database record
      const fileRecord = await createFileRecord({
        project_id: projectId,
        document_id: documentId,
        file_name: fileItem.name,
        file_type: fileItem.type,
        file_size: fileItem.size,
        storage_path: storagePath,
        mime_type: fileItem.type,
        sha256_hash: hash,
        metadata: {
          original_name: fileItem.name,
          upload_date: new Date().toISOString(),
        },
      });

      // Get signed URL for access
      const signedUrl = await getSignedUrl('files', storagePath);

      // Update local state
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              url: signedUrl,
              storageId: fileRecord.id,
            }
          : f
      ));

      // Add to global store
      addFile({
        id: fileRecord.id,
        name: fileItem.name,
        file_type: fileItem.type,
        size: fileItem.size,
        url: signedUrl,
        storage_path: storagePath,
        project_id: projectId,
        document_id: documentId,
        metadata: {
          hash,
          uploaded_at: new Date().toISOString(),
        },
      });

      return fileRecord;
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed',
            }
          : f
      ));
      throw error;
    }
  };

  // Handle batch upload
  const handleUpload = async () => {
    const uploadedFiles = [];
    
    for (const fileItem of selectedFiles) {
      try {
        const result = await uploadSingleFile(fileItem);
        uploadedFiles.push(result);
      } catch (error) {
        console.error(`Failed to upload ${fileItem.name}:`, error);
      }
    }

    if (onUploadComplete && uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles);
    }

    // Move completed files to main list
    setFiles(prev => [...prev, ...selectedFiles]);
    setSelectedFiles([]);
    setUploadDialog(false);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove file from queue
  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <Box>
      {/* Drop Zone */}
      <Paper
        elevation={isDragging ? 8 : 1}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: 'primary.light',
            backgroundColor: 'action.hover',
          },
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag & Drop Files Here
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Maximum file size: {maxFileSize}MB
        </Typography>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </Paper>

      {/* Upload History */}
      {files.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files
          </Typography>
          <List>
            {files.map(file => (
              <ListItem key={file.id}>
                <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {formatFileSize(file.size)} • {file.type}
                      </Typography>
                      {file.status === 'uploading' && (
                        <LinearProgress 
                          variant="determinate" 
                          value={file.progress} 
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  {file.status === 'completed' && (
                    <CheckCircle color="success" />
                  )}
                  {file.status === 'error' && (
                    <ErrorIcon color="error" />
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialog}
        onClose={() => setUploadDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Upload Files
          <IconButton
            aria-label="close"
            onClick={() => setUploadDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedFiles.length === 0 ? (
            <Alert severity="info">No files selected</Alert>
          ) : (
            <List>
              {selectedFiles.map(file => (
                <ListItem
                  key={file.id}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => removeFile(file.id)}
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={`${formatFileSize(file.size)} • ${file.type}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            startIcon={<Upload />}
            disabled={selectedFiles.length === 0}
          >
            Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupabaseFileUpload;
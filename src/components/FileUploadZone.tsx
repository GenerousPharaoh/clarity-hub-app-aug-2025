import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Paper, 
  Stack, 
  LinearProgress,
  Tooltip,
  IconButton,
  Alert,
  Snackbar,
  List,
  ListItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  CloudUpload, 
  Close, 
  CheckCircle, 
  Error as ErrorIcon,
  Delete,
  Warning,
  FileUpload
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useFileUpload } from '../hooks/useProjectFiles';
import { uploadFile as uploadFileService, isUsingFallback } from '../services/storageService';
import { supabase } from '../lib/supabaseClient';
import FileStatusIndicator, { FileStatus } from './FileStatusIndicator';

// Split file into chunks for upload
const chunkFile = (file: File, chunkSize = 2 * 1024 * 1024) => {
  const chunks = [];
  let offset = 0;
  
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }
  
  return chunks;
};

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Enhance dropzone with animation
const DropZone = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  borderStyle: 'dashed',
  borderWidth: 2,
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  textAlign: 'center',
  marginBottom: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 200,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
  '&.drag-active': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.lighter || 'rgba(0, 120, 255, 0.08)',
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[6],
  }
}));

interface FileUploadZoneProps {
  projectId: string;
  userId: string;
  onSuccess?: (fileData: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  maxFileSizeMB?: number;
  acceptedFileTypes?: string[];
  multiple?: boolean;
  chunkSize?: number; // Chunk size in bytes for large file uploads
}

interface FileUploadState {
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  fileStatus?: FileStatus;
  retryCount?: number;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  projectId,
  userId,
  onSuccess,
  onError,
  onCancel,
  maxFileSizeMB = 50,
  acceptedFileTypes,
  multiple = true,
  chunkSize = 2 * 1024 * 1024, // Default to 2MB chunks
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [useDirectUpload, setUseDirectUpload] = useState(false);
  const [fallbackModeActive, setFallbackModeActive] = useState(isUsingFallback());
  const [showFallbackNotice, setShowFallbackNotice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Check if fallback mode is active on component mount and state changes
  useEffect(() => {
    const fallbackActive = isUsingFallback();
    setFallbackModeActive(fallbackActive);
    
    // Show notification when fallback mode is activated
    if (fallbackActive && !showFallbackNotice) {
      setShowFallbackNotice(true);
    }
  }, [uploads]);
  
  // Convert MB to bytes
  const maxFileSize = maxFileSizeMB * 1024 * 1024;
  
  // Format bytes to human-readable string
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Use the upload mutation from our hook
  const { mutateAsync: uploadFile } = useFileUpload();
  
  // Improved chunked upload with retry logic
  const handleChunkedUpload = async (file: File, index: number) => {
    try {
      // Update file status to uploading
      setUploads(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'uploading', progress: 0, fileStatus: 'uploading' } : item
      ));
      
      // Generate a unique file ID
      const fileId = crypto.randomUUID();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `projects/${projectId}/${fileId}_${safeFileName}`;
      const bucket = 'files';
      
      // Split file into chunks if it's large
      const chunks = file.size > chunkSize ? chunkFile(file, chunkSize) : [file];
      const totalChunks = chunks.length;
      
      // If only one chunk, use regular upload
      if (totalChunks === 1) {
        return handleDirectUpload(file, index);
      }
      
      console.log(`Starting chunked upload with ${totalChunks} chunks for ${file.name}`);
      
      // Upload each chunk with progress tracking
      let uploadedChunks = 0;
      const chunkResults = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkPath = `${storagePath}_chunk_${i}`;
        
        try {
          // Upload the chunk
          const result = await uploadFileService(bucket, chunkPath, chunk, {
            onProgress: (progress) => {
              // Calculate overall progress
              const chunkProgress = progress.loaded / progress.total;
              const overallProgress = ((uploadedChunks + chunkProgress) / totalChunks) * 100;
              
              setUploads(prev => prev.map((item, idx) => 
                idx === index ? { ...item, progress: Math.round(overallProgress) } : item
              ));
            },
            upsert: true
          });
          
          chunkResults.push(result);
          uploadedChunks++;
          
        } catch (error) {
          console.error(`Error uploading chunk ${i}:`, error);
          
          // Retry logic for failed chunks (up to 3 attempts)
          const retryCount = (uploads[index]?.retryCount || 0) + 1;
          
          if (retryCount <= 3) {
            setUploads(prev => prev.map((item, idx) => 
              idx === index ? { ...item, retryCount } : item
            ));
            
            // Wait briefly before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            i--; // Retry this chunk
            continue;
          }
          
          // If retries exhausted, fail the upload
          throw new Error(`Failed to upload chunk ${i} after multiple attempts`);
        }
      }
      
      // Once all chunks are uploaded, combine them or mark as completed
      console.log('All chunks uploaded successfully:', chunkResults.length);
      
      // Determine file type from extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' :
                    file.type === 'application/pdf' ? 'pdf' : 'document';
      
      // Create metadata with chunk information
      const fileMetadata = {
        thumbnailUrl: fileType === 'image' ? chunkResults[0].publicUrl : null,
        tags: [],
        fileType: fileType,
        uploadTimestamp: Date.now(),
        originalFileName: file.name,
        fileExtension: fileExt,
        mimeType: file.type,
        processingStatus: 'completed',
        totalChunks: totalChunks,
        chunkPaths: chunkResults.map((result, i) => `${storagePath}_chunk_${i}`),
        isChunked: true
      };
      
      // Create database record
      let fileData = null;
      
      if (!isUsingFallback()) {
        try {
          const { data, error } = await supabase
            .from('files')
            .insert([
              {
                name: file.name,
                project_id: projectId,
                storage_path: storagePath,
                content_type: file.type,
                size: file.size,
                file_type: fileType,
                metadata: fileMetadata,
                owner_id: userId,
                uploaded_by_user_id: userId,
              }
            ])
            .select('*')
            .single();
          
          if (error) {
            console.error('Error creating file record:', error);
          } else {
            fileData = data;
          }
        } catch (error) {
          console.error('Exception creating file record:', error);
        }
      }
      
      // Fallback to client-side record if needed
      if (!fileData) {
        fileData = {
          id: fileId,
          name: file.name,
          project_id: projectId,
          storage_path: storagePath,
          content_type: file.type,
          size: file.size,
          file_type: fileType,
          metadata: fileMetadata,
          storage_url: chunkResults[0].publicUrl,
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          using_fallback_storage: isUsingFallback()
        };
      }
      
      // Update status to completed
      setUploads(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'completed', fileStatus: isUsingFallback() ? 'local' : 'synced' } : item
      ));
      
      // Call onSuccess callback
      onSuccess?.(fileData);
      
      return fileData;
    } catch (error) {
      console.error('Error in chunked upload:', error);
      
      // Update status to error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploads(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'error', errorMessage, fileStatus: 'error' } : item
      ));
      
      // Call onError callback
      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error('Unknown error occurred during chunked upload'));
      }
      
      return null;
    }
  };
  
  // Direct upload method as a fallback
  const handleDirectUpload = async (file: File, index: number) => {
    try {
      // Update file status to uploading
      setUploads(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'uploading', progress: 0, fileStatus: 'uploading' } : item
      ));
      
      // Generate a unique file path
      const fileId = crypto.randomUUID();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `projects/${projectId}/${fileId}_${safeFileName}`;
      const bucket = 'files';
      
      // Additional logging for debugging
      console.log('Starting direct upload:', { 
        file: file.name, 
        size: file.size, 
        bucket, 
        path: storagePath 
      });
      
      // Upload with enhanced storage service (which handles fallback automatically)
      const uploadResult = await uploadFileService(bucket, storagePath, file, {
        onProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setUploads(prev => prev.map((item, i) => 
            i === index ? { ...item, progress: percent } : item
          ));
        },
        upsert: true
      });
      
      console.log('Upload successful:', uploadResult.publicUrl);
      
      // Check if we're using fallback storage after upload attempt
      if (isUsingFallback() && !fallbackModeActive) {
        setFallbackModeActive(true);
        setShowFallbackNotice(true);
      }
      
      // Determine file type from extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' :
                      file.type.startsWith('audio/') ? 'audio' :
                      file.type === 'application/pdf' ? 'pdf' : 'document';
      
      // Create metadata
      const fileMetadata = {
        thumbnailUrl: fileType === 'image' ? uploadResult.publicUrl : null,
        tags: [],
        fileType: fileType,
        uploadTimestamp: Date.now(),
        originalFileName: file.name,
        fileExtension: fileExt,
        mimeType: file.type,
        processingStatus: 'completed',
      };
      
      // Create database record or use fallback object
      let fileData = null;
      
      if (!isUsingFallback()) {
        // Try to create the record in the database
        try {
          const { data, error } = await supabase
            .from('files')
            .insert([
              {
                name: file.name,
                project_id: projectId,
                storage_path: storagePath,
                content_type: file.type,
                size: file.size,
                file_type: fileType,
                metadata: fileMetadata,
                owner_id: userId,
                uploaded_by_user_id: userId,
              }
            ])
            .select('*')
            .single();
          
          if (error) {
            console.error('Error creating file record:', error);
          } else {
            fileData = data;
          }
        } catch (error) {
          console.error('Exception creating file record:', error);
        }
      }
      
      // If database record creation failed or we're using fallback storage,
      // create a client-side file record
      if (!fileData) {
        console.log('Creating client-side file record');
        
        fileData = {
          id: fileId,
          name: file.name,
          project_id: projectId,
          storage_path: storagePath,
          content_type: file.type,
          size: file.size,
          file_type: fileType,
          metadata: fileMetadata,
          storage_url: uploadResult.publicUrl,
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          using_fallback_storage: isUsingFallback()
        };
        
        if (isUsingFallback()) {
          console.log('Using local fallback storage for file:', file.name);
        } else {
          console.warn('File uploaded to storage but database record creation failed');
        }
      }
      
      // Update status to completed
      setUploads(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'completed', fileStatus: isUsingFallback() ? 'local' : 'synced' } : item
      ));
      
      // Call onSuccess callback
      onSuccess?.(fileData);
      
      return fileData;
    } catch (error) {
      console.error('Error in direct upload:', error);
      
      // Update status to error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploads(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'error', errorMessage, fileStatus: 'error' } : item
      ));
      
      // Set general error for common failures
      if (errorMessage.includes('bucket') || errorMessage.includes('storage')) {
        setGeneralError('Storage system error. Please contact support if this persists.');
      } else if (errorMessage.includes('auth') || errorMessage.includes('permission')) {
        setGeneralError('Login session may have expired. Try refreshing the page and logging in again.');
      }
      
      // Call onError callback
      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error('Unknown error occurred during direct upload'));
      }
      
      return null;
    }
  };
  
  // Select upload method based on file size
  const handleUpload = async (file: File, index: number) => {
    // For large files, use chunked upload
    if (file.size > chunkSize) {
      return handleChunkedUpload(file, index);
    }
    
    // For direct upload override
    if (useDirectUpload) {
      return handleDirectUpload(file, index);
    }
    
    try {
      // Update file status to uploading
      setUploads(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'uploading', progress: 0, fileStatus: 'uploading' } : item
      ));
      
      // Upload file with progress tracking
      const fileData = await uploadFile({
        file,
        projectId,
        userId,
        onProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setUploads(prev => prev.map((item, i) => 
            i === index ? { ...item, progress: percent } : item
          ));
        }
      });
      
      // Update status to completed
      setUploads(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'completed', fileStatus: isUsingFallback() ? 'local' : 'synced' } : item
      ));
      
      // Call onSuccess callback
      onSuccess?.(fileData);
      
      return fileData;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Check for RLS errors and suggest using direct upload
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const isRlsError = errorMessage.includes('row-level security') || 
                         errorMessage.includes('permission denied');
      
      if (isRlsError && !useDirectUpload) {
        setUseDirectUpload(true);
        setGeneralError('Permission issue detected. Switching to direct upload method.');
        
        // Retry with direct upload
        return handleDirectUpload(file, index);
      }
      
      // Update status to error
      setUploads(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'error', errorMessage, fileStatus: 'error' } : item
      ));
      
      // Call onError callback
      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error('Unknown error occurred during upload'));
      }
      
      return null;
    }
  };
  
  // Retry a failed upload
  const retryUpload = (index: number) => {
    const upload = uploads[index];
    if (upload) {
      handleUpload(upload.file, index);
    }
  };
  
  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds maximum limit of ${maxFileSizeMB}MB.`;
    }
    
    // Check file type if acceptedFileTypes is provided
    if (acceptedFileTypes && acceptedFileTypes.length > 0) {
      const fileType = file.type;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      const isValidType = acceptedFileTypes.some(type => {
        if (type.startsWith('.')) {
          // Extension check
          return `.${fileExtension}` === type;
        } else {
          // MIME type check
          return fileType.includes(type) || type === '*/*';
        }
      });
      
      if (!isValidType) {
        return `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`;
      }
    }
    
    return null;
  };
  
  // Process files for upload
  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    let hasErrors = false;
    const newUploads: FileUploadState[] = [];
    
    // Clear general error
    setGeneralError(null);
    
    // Validate and add files
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      
      if (error) {
        hasErrors = true;
        newUploads.push({
          file,
          progress: 0,
          status: 'error',
          errorMessage: error,
          fileStatus: 'error'
        });
      } else {
        newUploads.push({
          file,
          progress: 0,
          status: 'idle',
          fileStatus: 'pending'
        });
      }
    });
    
    // Add to uploads list
    if (multiple) {
      setUploads(prev => [...prev, ...newUploads]);
    } else {
      // In single mode, replace the current upload
      setUploads(newUploads);
    }
    
    // Start uploads for valid files
    if (!hasErrors) {
      const validUploads = newUploads.filter(upload => upload.status === 'idle');
      validUploads.forEach((upload, i) => {
        const uploadIndex = multiple ? uploads.length + i : i;
        handleUpload(upload.file, uploadIndex);
      });
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    // Reset the input value so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  // Handle button click
  const handleButtonClick = () => {
    inputRef.current?.click();
  };
  
  // Remove a specific upload
  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };
  
  // Clear all uploads
  const clearUploads = () => {
    setUploads([]);
    setGeneralError(null);
  };
  
  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, []);
  
  // Check if there are any active uploads
  const hasActiveUploads = uploads.some(upload => upload.status === 'uploading');
  
  // Calculate overall progress
  const overallProgress = uploads.length > 0
    ? uploads.reduce((total, upload) => total + upload.progress, 0) / uploads.length
    : 0;
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Fallback mode notice */}
      <Snackbar 
        open={showFallbackNotice} 
        autoHideDuration={10000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={() => setShowFallbackNotice(false)}
      >
        <Alert 
          severity="warning" 
          icon={<Warning />}
          onClose={() => setShowFallbackNotice(false)}
          sx={{ width: '100%' }}
        >
          Using local storage mode. Files are stored in your browser and will not sync to the cloud.
        </Alert>
      </Snackbar>
      
      {/* General error message */}
      {generalError && (
        <Alert 
          severity="error" 
          onClose={() => setGeneralError(null)}
          sx={{ mb: 2 }}
        >
          {generalError}
        </Alert>
      )}
      
      {/* Fallback mode indicator */}
      {fallbackModeActive && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
        >
          <strong>Local Storage Mode Active:</strong> Files are being stored in your browser. They will be available on this device only and won't sync to the cloud.
        </Alert>
      )}
      
      {/* Drop zone with enhanced styling */}
      <DropZone
        className={dragActive ? 'drag-active' : ''}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        data-test="drop-zone"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            p: 2, 
            borderRadius: '50%', 
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.08)',
            transition: 'all 0.3s ease',
            mb: 1
          }}>
            <FileUpload sx={{ 
              fontSize: 48, 
              color: 'primary.main',
              animation: dragActive ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 0.6, transform: 'scale(0.95)' },
                '70%': { opacity: 1, transform: 'scale(1.05)' },
                '100%': { opacity: 0.6, transform: 'scale(0.95)' },
              },
            }} />
          </Box>
          
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {dragActive ? 'Drop Files Here' : 'Drag & Drop Files Here'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            or click to browse files
          </Typography>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CloudUpload />}
            sx={{ 
              mt: 1,
              borderRadius: theme => theme.shape.borderRadius * 4,
              px: 3
            }}
            onClick={e => {
              e.stopPropagation();
              handleButtonClick();
            }}
          >
            Select Files
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {maxFileSizeMB}MB max file size
            {acceptedFileTypes && acceptedFileTypes.length > 0 && (
              ` • Accepted formats: ${acceptedFileTypes.join(', ')}`
            )}
            {fallbackModeActive && ` • Local storage mode active`}
          </Typography>
          
          <VisuallyHiddenInput
            ref={inputRef}
            type="file"
            multiple={multiple}
            accept={acceptedFileTypes?.join(',')}
            onChange={handleFileInputChange}
          />
        </Box>
      </DropZone>
      
      {/* Uploads list with improved styling */}
      {uploads.length > 0 && (
        <Box sx={{ 
          mt: 3,
          bgcolor: 'background.paper',
          borderRadius: theme => theme.shape.borderRadius * 2,
          boxShadow: theme => theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
            : '0 4px 20px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          border: theme => `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            px: 2, 
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {uploads.length} {uploads.length === 1 ? 'file' : 'files'}
            </Typography>
            
            <Button 
              size="small"
              onClick={clearUploads}
              disabled={hasActiveUploads}
              color="inherit"
              variant="text"
              startIcon={<Delete />}
            >
              Clear All
            </Button>
          </Box>
          
          {/* Overall progress */}
          {hasActiveUploads && (
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>Overall Progress</Typography>
                <Typography variant="body2">{Math.round(overallProgress)}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={overallProgress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': {
                    transition: 'transform 0.3s ease'
                  }
                }}
              />
            </Box>
          )}
          
          {/* File list */}
          <List sx={{ p: 0 }}>
            {uploads.map((upload, index) => (
              <ListItem 
                key={index}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: index < uploads.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Status indicator */}
                    <FileStatusIndicator 
                      status={upload.fileStatus || 
                        (upload.status === 'completed' 
                          ? (isUsingFallback() ? 'local' : 'synced')
                          : upload.status === 'uploading' 
                            ? 'uploading' 
                            : upload.status === 'error' 
                              ? 'error' 
                              : 'pending')}
                      size="small"
                      showLabel={!isMobile}
                    />
                    
                    {/* Retry button for errors */}
                    {upload.status === 'error' && (
                      <Tooltip title="Retry upload">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => retryUpload(index)}
                          sx={{ mx: 0.5 }}
                        >
                          <CloudUpload fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* Remove button */}
                    <IconButton 
                      edge="end" 
                      onClick={() => removeUpload(index)}
                      disabled={upload.status === 'uploading'}
                      size="small"
                    >
                      {upload.status === 'uploading' ? (
                        <Close fontSize="small" />
                      ) : (
                        <Delete fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                }
              >
                {/* File icon */}
                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}>
                  {upload.status === 'uploading' ? (
                    <CircularProgress 
                      size={32} 
                      thickness={5} 
                      variant="determinate" 
                      value={upload.progress} 
                    />
                  ) : upload.status === 'completed' ? (
                    <CheckCircle color="success" />
                  ) : upload.status === 'error' ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <CloudUpload color="primary" />
                  )}
                </Box>
                
                {/* File info */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden', mr: isMobile ? 1 : 6 }}>
                  <Typography variant="body2" fontWeight={500} noWrap title={upload.file.name}>
                    {upload.file.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                      {formatBytes(upload.file.size)}
                    </Typography>
                    
                    {upload.status === 'uploading' && (
                      <Typography variant="caption" color="primary">
                        {upload.progress}%
                      </Typography>
                    )}
                    
                    {upload.status === 'error' && (
                      <Typography variant="caption" color="error" noWrap sx={{ maxWidth: '100%' }} title={upload.errorMessage}>
                        {upload.errorMessage}
                      </Typography>
                    )}
                  </Box>
                  
                  {upload.status === 'uploading' && (
                    <LinearProgress 
                      variant="determinate" 
                      value={upload.progress} 
                      sx={{ height: 4, mt: 0.5, borderRadius: 2 }}
                    />
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default FileUploadZone; 
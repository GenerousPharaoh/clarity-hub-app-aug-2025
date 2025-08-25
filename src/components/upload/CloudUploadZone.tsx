/**
 * Cloud Upload Zone - Pure Cloud-Native File Processing
 * 
 * Direct upload to Supabase Storage with real-time AI analysis
 * using Gemini 2.5 Pro for superior legal document processing
 */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress,
  IconButton,
  Collapse,
  Button
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  AutoAwesome as AIIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Psychology as ProcessingIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { v4 as uuid } from 'uuid';
import useAppStore from '../../store';
import { cloudFileService } from '../../services/cloudFileService';
import { geminiAI } from '../../services/geminiAIService';
import ExhibitEditor from '../exhibits/ExhibitEditor';
import { demoService, DEMO_USER_ID, DEMO_PROJECT_ID } from '../../services/demoService';
import { demoAI } from '../../services/demoAIService';
import { FileValidationService } from '../../services/fileValidationService';

interface UploadFile {
  id: string;
  file: File;
  fileName: string;
  stage: 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  exhibitId?: string;
  exhibitTitle?: string;
  insights: any[];
  error?: string;
}

export const CloudUploadZone: React.FC = () => {
  const user = useAppStore(state => state.user);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  
  const [uploads, setUploads] = useState<Map<string, UploadFile>>(new Map());
  const [expandedUploads, setExpandedUploads] = useState<Set<string>>(new Set());

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Use demo project if in demo mode
    const projectId = window.DEMO_MODE ? DEMO_PROJECT_ID : selectedProjectId;
    
    if (!projectId) {
      alert('Please select or create a project first');
      return;
    }

    // SECURITY: Validate files before processing
    const { validFiles, invalidFiles } = FileValidationService.validateFiles(acceptedFiles);
    
    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.join(', ')}`
      ).join('\n');
      alert(`Some files failed validation:\n${errorMessages}`);
    }

    // Process only valid files
    for (const file of validFiles) {
      const uploadId = uuid();
      
      // Initialize upload tracking
      setUploads(prev => new Map(prev.set(uploadId, {
        id: uploadId,
        file,
        fileName: file.name,
        stage: 'uploading',
        progress: 0,
        insights: []
      })));

      try {
        const userId = window.DEMO_MODE ? DEMO_USER_ID : (user?.id || '00000000-0000-0000-0000-000000000000');
        const targetProjectId = window.DEMO_MODE ? DEMO_PROJECT_ID : selectedProjectId;
        await processCloudUpload(file, uploadId, userId, targetProjectId!);
      } catch (error) {
        console.error('Upload failed:', error);
        updateUpload(uploadId, { stage: 'error', error: error.message });
      }
    }
  }, [user, selectedProjectId]);

  const processCloudUpload = async (
    file: File,
    uploadId: string,
    userId: string,
    projectId: string
  ) => {
    try {
      // Handle demo mode with persistent storage
      if (window.DEMO_MODE || userId === DEMO_USER_ID) {
        updateUpload(uploadId, { stage: 'uploading', progress: 10 });
        
        // Use demo service for persistent storage
        const cloudFile = await demoService.uploadDemoFile(
          file,
          (progress) => updateUpload(uploadId, { progress: Math.min(progress * 0.5, 50) })
        );
        
        updateUpload(uploadId, { progress: 50, stage: 'analyzing' });
        
        // Use demo AI for analysis
        const fileContent = await file.text();
        const analysis = await demoAI.analyzeDocument(
          fileContent,
          file.name,
          file.type,
          `Demo project: ${DEMO_PROJECT_ID}`
        );
        
        updateUpload(uploadId, { progress: 80 });
        
        // Update file with AI results
        await cloudFileService.updateFile(cloudFile.id, {
          exhibit_id: analysis.suggestedExhibitId,
          exhibit_title: analysis.suggestedExhibitTitle,
          processing_status: 'completed',
          processed_at: new Date().toISOString()
        });
        
        updateUpload(uploadId, { 
          stage: 'completed', 
          progress: 100,
          exhibitId: analysis.suggestedExhibitId,
          exhibitTitle: analysis.suggestedExhibitTitle,
          insights: analysis.insights
        });
        
        // Add to store for immediate UI update
        useAppStore.getState().addFile({
          id: cloudFile.id,
          name: file.name,
          project_id: DEMO_PROJECT_ID,
          owner_id: DEMO_USER_ID,
          file_type: file.type.split('/')[0],
          content_type: file.type,
          size: file.size,
          storage_path: cloudFile.storage_path,
          added_at: new Date().toISOString(),
          exhibit_id: cloudFile.exhibit_id,
          exhibit_title: cloudFile.exhibit_title || file.name
        });
        
        return;
      }
      
      // Stage 1: Upload to Supabase Storage with progress tracking (real users only)
      updateUpload(uploadId, { stage: 'uploading', progress: 10 });
      
      const cloudFile = await cloudFileService.uploadFile(
        file,
        projectId,
        userId,
        (progress) => updateUpload(uploadId, { progress: Math.min(progress * 0.5, 50) })
      );
      
      updateUpload(uploadId, { progress: 50 });

      // Stage 2: AI Analysis with Gemini 2.5 Pro
      updateUpload(uploadId, { stage: 'analyzing', progress: 60 });
      
      // Get file content for analysis
      let fileContent: string | Uint8Array = '';
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        fileContent = await file.text();
      } else {
        // For binary files, read as array buffer
        const buffer = await file.arrayBuffer();
        fileContent = new Uint8Array(buffer);
      }
      
      // Analyze with Gemini 2.5 Pro
      const analysis = await geminiAI.analyzeDocument(
        fileContent,
        file.name,
        file.type,
        `Legal case project: ${projectId}`
      );
      
      updateUpload(uploadId, { progress: 80 });
      
      // Stage 3: Update file with AI results
      const updatedFile = await cloudFileService.updateFile(cloudFile.id, {
        exhibit_id: analysis.suggestedExhibitId,
        exhibit_title: analysis.suggestedExhibitTitle,
        content_text: analysis.extractedText.substring(0, 10000), // Store first 10k chars
        ai_insights: analysis.insights,
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      });
      
      // Generate embeddings for semantic search (optional)
      if (analysis.extractedText) {
        try {
          const embeddings = await geminiAI.generateEmbeddings(
            analysis.extractedText.substring(0, 5000) // Use first 5k chars for embedding
          );
          // Store embeddings if needed
          console.log('Generated embeddings:', embeddings.length, 'dimensions');
        } catch (err) {
          console.warn('Embedding generation failed:', err);
        }
      }
      
      // Add to store for immediate UI update
      useAppStore.getState().addFile({
        id: cloudFile.id,
        name: file.name,
        project_id: projectId,
        owner_id: userId,
        file_type: file.type.split('/')[0],
        content_type: file.type,
        size: file.size,
        storage_path: cloudFile.storage_path,
        added_at: new Date().toISOString(),
        exhibit_id: analysis.suggestedExhibitId,
        exhibit_title: analysis.suggestedExhibitTitle
      });
      
      updateUpload(uploadId, {
        stage: 'completed',
        progress: 100,
        exhibitId: analysis.suggestedExhibitId,
        exhibitTitle: analysis.suggestedExhibitTitle,
        insights: analysis.insights
      });
      
    } catch (error) {
      console.error('Processing failed:', error);
      throw error;
    }
  };

  const updateUpload = (id: string, updates: Partial<UploadFile>) => {
    setUploads(prev => {
      const map = new Map(prev);
      const current = map.get(id);
      if (current) {
        map.set(id, { ...current, ...updates });
      }
      return map;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: FileValidationService.getDropzoneAcceptTypes(), // Use secure validation service
    multiple: true,
    maxSize: FileValidationService.getMaxFileSize() // Consistent 50MB limit
  });

  const toggleExpanded = (uploadId: string) => {
    setExpandedUploads(prev => {
      const updated = new Set(prev);
      if (updated.has(uploadId)) {
        updated.delete(uploadId);
      } else {
        updated.add(uploadId);
      }
      return updated;
    });
  };

  const clearCompleted = () => {
    setUploads(prev => {
      const map = new Map(prev);
      Array.from(map.entries()).forEach(([id, upload]) => {
        if (upload.stage === 'completed') {
          map.delete(id);
        }
      });
      return map;
    });
  };

  const getStageLabel = (stage: string): string => {
    switch (stage) {
      case 'uploading': return 'Uploading to Cloud';
      case 'analyzing': return 'AI Analysis (Gemini 2.5 Pro)';
      case 'completed': return 'Completed';
      case 'error': return 'Failed';
      default: return stage;
    }
  };

  const getStageColor = (stage: string): 'primary' | 'success' | 'error' | 'warning' => {
    switch (stage) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'analyzing': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Drop Zone - Enhanced for bulk uploads */}
      <Paper
        {...getRootProps()}
        sx={{
          border: '3px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 3,
          p: 6,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: isDragActive 
            ? 'rgba(25, 118, 210, 0.08)' 
            : 'background.paper',
          background: isDragActive 
            ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)'
            : 'none',
          transform: isDragActive ? 'scale(1.02)' : 'scale(1)',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
            transform: 'scale(1.01)'
          }
        }}
      >
        <input {...getInputProps()} />
        
        {/* Enhanced Upload Icon with animation */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 3,
          animation: isDragActive ? 'pulse 1s infinite' : 'none',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.1)' },
            '100%': { transform: 'scale(1)' }
          }
        }}>
          <UploadIcon sx={{ fontSize: 64, color: 'primary.main' }} />
        </Box>
        
        <Typography variant="h5" gutterBottom fontWeight="bold">
          {isDragActive ? '📂 Drop your files here!' : 'Upload Documents'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Drag & drop multiple files or click to browse
        </Typography>
        
        {/* Features highlight */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center', 
          mb: 3,
          flexWrap: 'wrap'
        }}>
          <Chip 
            icon={<AIIcon />} 
            label="AI-Powered Analysis" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            label="Bulk Upload" 
            color="success" 
            variant="outlined"
          />
          <Chip 
            label="Auto-Exhibit Generation" 
            color="secondary" 
            variant="outlined"
          />
        </Box>
        
        {/* Supported formats */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Supported formats:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip size="small" label="PDF" />
            <Chip size="small" label="Word (.doc, .docx)" />
            <Chip size="small" label="Images (.jpg, .png)" />
            <Chip size="small" label="Email (.eml)" />
            <Chip size="small" label="Excel (.xls, .xlsx)" />
            <Chip size="small" label="Text (.txt)" />
            <Chip size="small" label="Audio/Video" />
          </Box>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Max {FileValidationService.getMaxFileSize() / 1024 / 1024}MB per file • Unlimited files • Secure cloud storage
        </Typography>
      </Paper>

      {/* Upload Progress List - Scrollable for bulk uploads */}
      {uploads.size > 0 && (
        <Box sx={{ 
          mt: 3, 
          flex: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2 
          }}>
            <Typography variant="h6">
              Processing {uploads.size} {uploads.size === 1 ? 'File' : 'Files'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {Array.from(uploads.values()).every(u => u.stage === 'completed') && (
                <>
                  <Chip 
                    label="All Complete!" 
                    color="success" 
                    icon={<CompleteIcon />}
                  />
                  <Tooltip title="Clear completed">
                    <IconButton 
                      onClick={clearCompleted}
                      size="small"
                      color="primary"
                    >
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
          
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {Array.from(uploads.values()).map((upload) => {
              const isExpanded = expandedUploads.has(upload.id);
              
              return (
                <Paper key={upload.id} sx={{ mb: 2 }}>
                  <ListItemButton
                    onClick={() => toggleExpanded(upload.id)}
                    sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {upload.error ? (
                          <ErrorIcon color="error" />
                        ) : upload.stage === 'completed' ? (
                          <CompleteIcon color="success" />
                        ) : (
                          <CircularProgress size={24} />
                        )}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={upload.fileName}
                        secondary={
                          <>
                            <Chip
                              icon={upload.stage === 'analyzing' ? <AIIcon /> : <FileIcon />}
                              label={getStageLabel(upload.stage)}
                              size="small"
                              color={getStageColor(upload.stage)}
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                            {upload.exhibitId && (
                              <Chip
                                label={upload.exhibitId}
                                size="small"
                                color="secondary"
                              />
                            )}
                          </>
                        }
                      />
                      
                      <Typography variant="caption">
                        {upload.progress}%
                      </Typography>
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={upload.progress}
                      sx={{ width: '100%', height: 6, borderRadius: 3 }}
                      color={getStageColor(upload.stage)}
                    />
                  </ListItemButton>
                  
                  {/* Expanded Details */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ p: 2, pt: 0 }}>
                      {upload.error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {upload.error}
                        </Alert>
                      )}

                      {/* Exhibit Information */}
                      {upload.exhibitId && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Exhibit Information
                          </Typography>
                          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="body2">
                              <strong>ID:</strong> {upload.exhibitId}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Title:</strong> {upload.exhibitTitle}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                      
                      {/* AI Insights */}
                      {upload.insights.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            AI Analysis (Gemini 2.5 Pro)
                          </Typography>
                          {upload.insights.map((insight, index) => (
                            <Alert 
                              key={index} 
                              severity={
                                insight.type === 'risk' ? 'warning' :
                                insight.type === 'opportunity' ? 'success' :
                                'info'
                              } 
                              sx={{ mb: 1 }}
                            >
                              <Typography variant="body2">
                                <strong>{insight.title}</strong>: {insight.description}
                              </Typography>
                            </Alert>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default CloudUploadZone;
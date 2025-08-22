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
  Edit as EditIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { v4 as uuid } from 'uuid';
import useAppStore from '../../store';
import { cloudFileService } from '../../services/cloudFileService';
import { geminiAI } from '../../services/geminiAIService';
import ExhibitEditor from '../exhibits/ExhibitEditor';

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
    if (!user || !selectedProjectId) {
      console.error('User or project not selected');
      // For demo user, still allow uploads
      if (!selectedProjectId) {
        alert('Please select or create a project first');
        return;
      }
    }

    for (const file of acceptedFiles) {
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
        const userId = user?.id || '00000000-0000-0000-0000-000000000000';
        await processCloudUpload(file, uploadId, userId, selectedProjectId);
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
      // Handle demo user differently - simulate upload but don't actually upload to Supabase
      if (userId === '00000000-0000-0000-0000-000000000000') {
        updateUpload(uploadId, { stage: 'uploading', progress: 20 });
        
        // Simulate upload progress
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateUpload(uploadId, { progress: 50 });
        
        // Create a mock file object for demo
        const cloudFile = {
          id: `demo-${uploadId}`,
          name: file.name,
          size: file.size,
          type: file.type,
          project_id: projectId,
          owner_id: userId,
          storage_path: `demo/${file.name}`,
          public_url: URL.createObjectURL(file), // Create a temporary URL for demo
          processing_status: 'processing' as const,
          created_at: new Date().toISOString()
        };
        
        updateUpload(uploadId, { progress: 50 });
        
        // Skip Stage 2 (AI Analysis) for demo user to avoid API costs
        updateUpload(uploadId, { 
          stage: 'completed', 
          progress: 100,
          exhibitId: 'D1',
          exhibitTitle: `Demo: ${file.name}`,
          insights: [
            {
              type: 'info',
              title: 'Demo Mode',
              description: 'This is a demo upload. Real uploads would use cloud storage and AI analysis.',
              importance: 'low'
            }
          ]
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
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'message/rfc822': ['.eml'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024 // 50MB (Supabase free tier limit)
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
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Drop Zone */}
      <Paper
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here...' : 'Upload Legal Documents'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag & drop or click to browse • Max 50MB per file
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip size="small" label="PDF" />
          <Chip size="small" label="Word" />
          <Chip size="small" label="Images" />
          <Chip size="small" label="Email" />
          <Chip size="small" label="Audio/Video" />
        </Box>
        <Typography variant="caption" display="block" sx={{ mt: 2, color: 'primary.main' }}>
          Powered by Gemini 2.5 Pro AI • Automatic exhibit generation • Cloud storage
        </Typography>
      </Paper>

      {/* Upload Progress List */}
      {uploads.size > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Processing Files
          </Typography>
          
          <List>
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
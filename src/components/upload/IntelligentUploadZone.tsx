/**
 * Intelligent Upload Zone - AI-Powered File Processing
 * 
 * Seamlessly uploads files to Supabase and triggers real-time AI analysis
 * with personalized insights for each user.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Alert,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  AutoAwesome as AIIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Psychology as InsightIcon,
  Lightbulb as PsychologyIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { v4 as uuid } from 'uuid';
import { supabase } from '../../lib/supabase';
import { AdaptiveAIService } from '../../services/adaptiveAIService';
import ExhibitEditor from '../exhibits/ExhibitEditor';
import useAppStore from '../../store';

interface UploadProgress {
  id: string;
  fileName: string;
  stage: string;
  progress: number;
  aiInsights: any[];
  exhibitId?: string;
  exhibitTitle?: string;
  error?: string;
  completed?: boolean;
}

interface ProcessingStage {
  name: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    name: 'upload',
    label: 'Uploading',
    icon: <UploadIcon />,
    description: 'Securing file in cloud storage'
  },
  {
    name: 'extract',
    label: 'Extracting',
    icon: <FileIcon />,
    description: 'Reading document content'
  },
  {
    name: 'analyze',
    label: 'Analyzing',
    icon: <AIIcon />,
    description: 'AI analysis with your case context'
  },
  {
    name: 'embed',
    label: 'Indexing',
    icon: <InsightIcon />,
    description: 'Building searchable knowledge'
  },
  {
    name: 'personalize',
    label: 'Personalizing',
    icon: <PsychologyIcon />,
    description: 'Tailoring insights to your practice'
  }
];

export const IntelligentUploadZone: React.FC = () => {
  const { user } = useAppStore(state => ({ user: state.user }));
  const { selectedProjectId } = useAppStore(state => ({ selectedProjectId: state.selectedProjectId }));
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [aiService] = useState(() => new AdaptiveAIService());
  const [expandedUploads, setExpandedUploads] = useState<Set<string>>(new Set());

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || !selectedProjectId) {
      console.error('User or project not selected');
      return;
    }

    for (const file of acceptedFiles) {
      const uploadId = uuid();
      
      // Initialize upload tracking
      setUploads(prev => new Map(prev.set(uploadId, {
        id: uploadId,
        fileName: file.name,
        stage: 'upload',
        progress: 0,
        aiInsights: []
      })));

      try {
        await processFileUpload(file, uploadId, user.id, selectedProjectId);
      } catch (error) {
        console.error('Upload failed:', error);
        updateUploadProgress(uploadId, 'error', 0, [], error.message);
      }
    }
  }, [user, selectedProjectId]);

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
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024 // 100MB limit
  });

  const processFileUpload = async (
    file: File,
    uploadId: string,
    userId: string,
    projectId: string
  ) => {
    try {
      // Stage 1: Upload to Supabase Storage
      updateUploadProgress(uploadId, 'upload', 20);
      
      const storagePath = `users/${userId}/projects/${projectId}/${uploadId}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Stage 2: Create file record
      updateUploadProgress(uploadId, 'upload', 40);
      
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          id: uploadId,
          project_id: projectId,
          owner_id: userId,
          name: file.name,
          file_type: file.type.split('/')[0], // 'image', 'document', etc.
          content_type: file.type,
          size: file.size,
          storage_path: storagePath,
          added_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      // Stage 3: Add to processing queue
      updateUploadProgress(uploadId, 'upload', 60);
      
      const { error: queueError } = await supabase
        .from('file_processing_queue')
        .insert({
          user_id: userId,
          file_id: uploadId,
          processing_stages: ['upload', 'extract', 'analyze', 'embed', 'personalize'],
          current_stage: 'extract',
          progress_percentage: 60
        });

      if (queueError) throw queueError;

      // Stage 4: Trigger AI processing
      updateUploadProgress(uploadId, 'extract', 80);
      
      // Trigger AI processing in background
      setTimeout(async () => {
        try {
          await aiService.processFileForUser(uploadId, userId);
        } catch (aiError) {
          console.error('AI processing failed:', aiError);
          updateUploadProgress(uploadId, 'error', 0, [], aiError.message);
        }
      }, 1000);

      updateUploadProgress(uploadId, 'extract', 100);
      
    } catch (error) {
      throw error;
    }
  };

  const updateUploadProgress = (
    uploadId: string,
    stage: string,
    progress: number,
    insights: any[] = [],
    error?: string,
    exhibitId?: string,
    exhibitTitle?: string
  ) => {
    setUploads(prev => {
      const updated = new Map(prev);
      const current = updated.get(uploadId);
      if (current) {
        updated.set(uploadId, {
          ...current,
          stage,
          progress,
          aiInsights: insights.length > 0 ? insights : current.aiInsights,
          exhibitId: exhibitId || current.exhibitId,
          exhibitTitle: exhibitTitle || current.exhibitTitle,
          error,
          completed: stage === 'completed' || stage === 'error'
        });
      }
      return updated;
    });
  };

  // Real-time processing updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`file_processing_${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'file_processing_queue',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const { 
            file_id, 
            current_stage, 
            progress_percentage, 
            ai_analysis_result,
            user_specific_insights,
            error_message 
          } = payload.new;
          
          const insights = user_specific_insights?.insights || [];
          const exhibit = ai_analysis_result?.exhibit || {};
          
          updateUploadProgress(
            file_id, 
            current_stage, 
            progress_percentage, 
            insights,
            error_message,
            exhibit.exhibitId,
            exhibit.exhibitTitle
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

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

  const getCurrentStageInfo = (stageName: string): ProcessingStage => {
    return PROCESSING_STAGES.find(s => s.name === stageName) || PROCESSING_STAGES[0];
  };

  const getStageColor = (stage: string): 'primary' | 'success' | 'error' | 'warning' => {
    switch (stage) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'personalize': return 'primary';
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
          {isDragActive ? 'Drop files here...' : 'Drag & drop files or click to browse'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supports PDF, images, audio, video, and documents • AI analysis included
        </Typography>
      </Paper>

      {/* Upload Progress List */}
      {uploads.size > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Processing Files ({uploads.size})
          </Typography>
          
          <List>
            {Array.from(uploads.values()).map((upload) => {
              const currentStage = getCurrentStageInfo(upload.stage);
              const isExpanded = expandedUploads.has(upload.id);
              
              return (
                <Paper key={upload.id} sx={{ mb: 2 }}>
                  <ListItem
                    button
                    onClick={() => toggleExpanded(upload.id)}
                    sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {upload.error ? (
                          <ErrorIcon color="error" />
                        ) : upload.completed ? (
                          <CompleteIcon color="success" />
                        ) : (
                          <CircularProgress size={24} />
                        )}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={upload.fileName}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              icon={currentStage.icon}
                              label={currentStage.label}
                              size="small"
                              color={getStageColor(upload.stage)}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {currentStage.description}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {upload.aiInsights.length > 0 && (
                          <Chip
                            icon={<AIIcon />}
                            label={`${upload.aiInsights.length} insights`}
                            size="small"
                            color="primary"
                          />
                        )}
                        <Typography variant="caption">
                          {upload.progress}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={upload.progress}
                      sx={{ width: '100%', height: 6, borderRadius: 3 }}
                    />
                  </ListItem>
                  
                  {/* Expanded Details */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ p: 2, pt: 0 }}>
                      {upload.error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {upload.error}
                        </Alert>
                      )}

                      {/* Exhibit Information */}
                      {(upload.exhibitId || upload.exhibitTitle) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Exhibit Information:
                          </Typography>
                          <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                            <ExhibitEditor
                              fileId={upload.id}
                              exhibitId={upload.exhibitId || 'X1'}
                              exhibitTitle={upload.exhibitTitle || upload.fileName}
                              autoGenerated={true}
                              onUpdate={(newId, newTitle) => {
                                updateUploadProgress(
                                  upload.id,
                                  upload.stage,
                                  upload.progress,
                                  upload.aiInsights,
                                  upload.error,
                                  newId,
                                  newTitle
                                );
                              }}
                            />
                          </Paper>
                        </Box>
                      )}
                      
                      {upload.aiInsights.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            AI Insights:
                          </Typography>
                          {upload.aiInsights.map((insight, index) => (
                            <Alert key={index} severity="info" sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                <strong>{insight.title}</strong>: {insight.description}
                              </Typography>
                            </Alert>
                          ))}
                        </Box>
                      )}
                      
                      {/* Processing Stages */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Processing Pipeline:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {PROCESSING_STAGES.map((stage) => {
                            const isCompleted = PROCESSING_STAGES.findIndex(s => s.name === upload.stage) >= 
                                               PROCESSING_STAGES.findIndex(s => s.name === stage.name);
                            const isCurrent = upload.stage === stage.name;
                            
                            return (
                              <Tooltip key={stage.name} title={stage.description}>
                                <Chip
                                  icon={stage.icon}
                                  label={stage.label}
                                  size="small"
                                  color={isCurrent ? 'primary' : isCompleted ? 'success' : 'default'}
                                  variant={isCurrent ? 'filled' : 'outlined'}
                                />
                              </Tooltip>
                            );
                          })}
                        </Box>
                      </Box>
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

export default IntelligentUploadZone;
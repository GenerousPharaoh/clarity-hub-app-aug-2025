import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Search as SearchIcon,
  FindInPage as FindInPageIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import useAppStore from '../../store';
import { supabase as supabaseClient } from '../../lib/supabase';
import { File as FileType, FileWithUrl, LinkActivation } from '../../types';
import FileViewer, { SupportedFileType } from '../../components/viewers/FileViewer';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import storageService from '../../services/storageService';
import { useNotification } from '../../contexts/NotificationContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
import AIAssistPanel from '../../components/ai/AIAssistPanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  sx?: any; // Allow passing sx prop
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`right-panel-tabpanel-${index}`}
      aria-labelledby={`right-panel-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
};

const RightPanel = ({
  isCollapsed = false,
  headerComponent,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedFile, setSelectedFile] = useState<FileWithUrl | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [fileSummary, setFileSummary] = useState('');
  const [extractedEntities, setExtractedEntities] = useState<{entity_text: string, entity_type: string}[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [projectQuestion, setProjectQuestion] = useState('');
  const [projectAnswer, setProjectAnswer] = useState('');
  const [isAnalyzingProject, setIsAnalyzingProject] = useState(false);
  const [linkCopySuccess, setLinkCopySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Viewer control states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // References
  const pdfViewerRef = useRef<any>(null);
  const imageViewerRef = useRef<any>(null);
  const audioVideoViewerRef = useRef<any>(null);

  // Use individual selectors instead of object destructuring
  const selectedFileId = useAppStore((state) => state.selectedFileId);
  const linkActivation = useAppStore((state) => state.linkActivation);
  const setLinkActivation = useAppStore((state) => state.setLinkActivation);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);

  const { showNotification } = useNotification();

  // Fetch file details when the selected file changes
  useEffect(() => {
    if (selectedFileId) {
      fetchFileDetails(selectedFileId);
      // Reset tab to preview when file changes
      setTabValue(0);
      // Reset states
      setFileSummary('');
      setExtractedEntities([]);
      setAnswer('');
    } else {
      setSelectedFile(null);
    }
  }, [selectedFileId]);

  // Handle link activation
  useEffect(() => {
    if (linkActivation && linkActivation.fileId) {
      fetchFileDetails(linkActivation.fileId);
      // Switch to preview tab when a link is activated
      setTabValue(0);
    }
  }, [linkActivation]);

  // Fetch file details with error handling and retry
  const fetchFileDetails = async (fileId: string, retryCount = 0) => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Get basic file metadata
      const { data, error } = await supabaseClient
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch file details: ${error.message}`);
      }

      if (!data) {
        throw new Error('File not found');
      }

      // Generate URL using storageService (handles multiple approaches internally)
      const resolvedUrlData = await storageService.getFileUrl(data.storage_path, {
        cacheBuster: true
      });

      if (!resolvedUrlData.url) {
        throw new Error('Failed to generate a valid URL for the file');
      }

      // Set the file with the resolved URL
      setSelectedFile({
        ...data,
        url: resolvedUrlData.url,
      });
    } catch (error) {
      console.error('Error in fetchFileDetails:', error);

      // Retry once with a delay
      if (retryCount < 1) {
        setTimeout(() => {
          fetchFileDetails(fileId, retryCount + 1);
        }, 1000);
        return;
      }

      // Final fallback: try direct blob download
      try {
        const { data: metaData } = await supabaseClient
          .from('files')
          .select('*')
          .eq('id', fileId)
          .single();

        if (metaData?.storage_path) {
          const { data: fileBlob } = await supabaseClient.storage
            .from('files')
            .download(metaData.storage_path);

          if (fileBlob) {
            const blobUrl = URL.createObjectURL(fileBlob);
            setSelectedFile({ ...metaData, url: blobUrl });
            setLoading(false);
            return;
          }
        }
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
      }

      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_, newValue: number) => {
    setTabValue(newValue);
    
    // Load data for the selected tab if needed
    if (newValue === 1 && selectedFile && fileSummary === '') {
      fetchFileSummary();
    } else if (newValue === 2 && selectedFile && extractedEntities.length === 0) {
      fetchExtractedEntities();
    }
  };

  // Updated fetchFileSummary with option to run in background
  const fetchFileSummary = async (inBackground = false) => {
    if (!selectedFile) return;
    
    if (!inBackground) {
      setIsLoadingSummary(true);
    }
    
    try {
      // Check if we already have a summary cached in metadata
      if (selectedFile.metadata?.summary) {
        setFileSummary(selectedFile.metadata.summary);
        if (!inBackground) {
          setIsLoadingSummary(false);
        }
        return;
      }
      
      const response = await supabaseClient.functions.invoke('analyze-file', {
        body: {
          storagePath: selectedFile.storage_path,
          contentType: selectedFile.content_type,
          task: 'summarize',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const summary = response.data?.summary || 'No summary was generated.';
      setFileSummary(summary);
      
      // Update the file metadata to cache the summary
      if (!inBackground) {
        try {
          await supabaseClient
            .from('files')
            .update({
              metadata: {
                ...selectedFile.metadata,
                summary
              }
            })
            .eq('id', selectedFile.id);
        } catch (updateError) {
          console.error('Error caching summary in metadata:', updateError);
        }
      }
    } catch (error) {
      console.error('Error getting file summary:', error);
      setFileSummary('An error occurred while generating the summary.');
    } finally {
      if (!inBackground) {
        setIsLoadingSummary(false);
      }
    }
  };

  // Updated fetchExtractedEntities with option to run in background
  const fetchExtractedEntities = async (inBackground = false) => {
    if (!selectedFile) return;
    
    if (!inBackground) {
      setIsLoadingEntities(true);
    }
    
    try {
      // Check if we already have entities in the metadata
      if (selectedFile.metadata?.entities && Array.isArray(selectedFile.metadata.entities) && selectedFile.metadata.entities.length > 0) {
        setExtractedEntities(selectedFile.metadata.entities);
        if (!inBackground) {
          setIsLoadingEntities(false);
        }
        return;
      }
      
      // First check if we already have entities in the database
      try {
        const { data: entitiesData, error: entitiesError } = await supabaseClient
          .from('entities')
          .select('entity_text, entity_type')
          .eq('source_file_id', selectedFile.id);
      
        if (entitiesError) {
          throw entitiesError;
        }
      
        if (entitiesData && entitiesData.length > 0) {
          // Cast the data to the correct type
          const entities = entitiesData.map(entity => ({
            entity_text: entity.entity_text as string,
            entity_type: entity.entity_type as string
          }));
          
          setExtractedEntities(entities);
          
          // Update the file metadata to cache entities
          if (!inBackground) {
            try {
              await supabaseClient
                .from('files')
                .update({
                  metadata: {
                    ...selectedFile.metadata,
                    entities
                  }
                })
                .eq('id', selectedFile.id);
            } catch (updateError) {
              console.error('Error caching entities in metadata:', updateError);
            }
          }
          
          if (!inBackground) {
            setIsLoadingEntities(false);
          }
          return;
        }
      } catch (error) {
        console.error('Error fetching entities:', error);
        // Continue to try fetching from edge function
      }
      
      // If no entities in database, call the Edge Function to extract them
      const response = await supabaseClient.functions.invoke('analyze-file', {
        body: {
          storagePath: selectedFile.storage_path,
          contentType: selectedFile.content_type,
          task: 'extract_entities',
          fileId: selectedFile.id,
          projectId: selectedFile.project_id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.entities) {
        const entities = response.data?.entities ?? [];
        setExtractedEntities(entities);
        
        // Update the file metadata to cache entities
        if (!inBackground) {
          try {
            await supabaseClient
              .from('files')
              .update({
                metadata: {
                  ...selectedFile.metadata,
                  entities
                }
              })
              .eq('id', selectedFile.id);
          } catch (updateError) {
            console.error('Error caching entities in metadata:', updateError);
          }
        }
      } else {
        setExtractedEntities([]);
      }
    } catch (error) {
      console.error('Error extracting entities:', error);
      setExtractedEntities([]);
    } finally {
      if (!inBackground) {
        setIsLoadingEntities(false);
      }
    }
  };

  // Analyze file with AI
  const analyzeFile = async () => {
    if (!selectedFile || !question) return;

    try {
      setAnalyzing(true);
      setAnswer('');

      const response = await supabaseClient.functions.invoke('analyze-file', {
        body: {
          storagePath: selectedFile.storage_path,
          contentType: selectedFile.content_type,
          task: 'qa',
          question,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setAnswer(response.data?.answer || 'No answer was generated.');
    } catch (error) {
      console.error('Error analyzing file:', error);
      setAnswer('An error occurred while analyzing the file.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Project Q&A
  const analyzeProject = async () => {
    if (!selectedProjectId || !projectQuestion) return;

    try {
      setIsAnalyzingProject(true);
      setProjectAnswer('');

      const response = await supabaseClient.functions.invoke('project-qa', {
        body: {
          projectId: selectedProjectId,
          question: projectQuestion,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setProjectAnswer(response.data?.answer || 'No answer was generated.');
    } catch (error) {
      console.error('Error analyzing project:', error);
      setProjectAnswer('An error occurred while analyzing the project.');
    } finally {
      setIsAnalyzingProject(false);
    }
  };

  // Create link to current position
  const copyLink = () => {
    if (!selectedFile) return;

    let linkData: LinkActivation = {
      fileId: selectedFile.id,
    };
    
    // Add page number for PDFs
    if (selectedFile.content_type.includes('pdf') && linkActivation?.page !== undefined) {
      linkData.page = linkActivation.page;
    }
    
    // Add timestamp for audio/video
    if ((selectedFile.content_type.includes('audio') || selectedFile.content_type.includes('video')) 
        && linkActivation?.timestamp !== undefined) {
      linkData.timestamp = linkActivation.timestamp;
    }
    
    // Add selected text for PDFs
    if (linkActivation?.selection) {
      linkData.selection = linkActivation.selection;
    }
    
    // Convert to JSON and copy to clipboard
    const linkJson = JSON.stringify(linkData);
    navigator.clipboard.writeText(linkJson)
      .then(() => {
        // Show success message
        setLinkCopySuccess(true);
        
        // Store the link in the database for future reference
        saveLinkToDatabase(linkData);
      })
      .catch((err) => {
        console.error('Error copying to clipboard:', err);
      });
  };

  // Save link to database
  const saveLinkToDatabase = async (linkData: LinkActivation) => {
    if (!selectedProjectId || !selectedFile) return;
    
    try {
      const { data: userData } = await supabaseClient.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const linkEntry = {
        project_id: selectedProjectId,
        owner_id: userId,
        source_file_id: linkData.fileId,
        source_details_json: {
          type: 'exhibit',
          exhibitId: selectedFile.exhibit_id,
          filename: selectedFile.name,
        },
        target_context_json: {
          page: linkData.page,
          timestamp: linkData.timestamp,
          selection: linkData.selection,
        },
      };
      
      const { error } = await supabaseClient
        .from('links')
        .insert(linkEntry);
      
      if (error) {
        throw error;
      }
      
      // Link saved successfully
    } catch (error) {
      console.error('Error saving link to database:', error);
    }
  };

  // Zoom in
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.25, 3);
    setZoom(newZoom);
    
    if (selectedFile?.content_type.includes('pdf') && pdfViewerRef.current) {
      pdfViewerRef.current.setZoom(newZoom);
    } else if (selectedFile?.content_type.includes('image') && imageViewerRef.current) {
      imageViewerRef.current.setZoom(newZoom);
    }
  };

  // Zoom out
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, 0.5);
    setZoom(newZoom);
    
    if (selectedFile?.content_type.includes('pdf') && pdfViewerRef.current) {
      pdfViewerRef.current.setZoom(newZoom);
    } else if (selectedFile?.content_type.includes('image') && imageViewerRef.current) {
      imageViewerRef.current.setZoom(newZoom);
    }
  };

  // Rotate left
  const handleRotateLeft = () => {
    const newRotation = (rotation - 90) % 360;
    setRotation(newRotation);
    
    if (selectedFile?.content_type.includes('pdf') && pdfViewerRef.current) {
      pdfViewerRef.current.setRotation(newRotation);
    } else if (selectedFile?.content_type.includes('image') && imageViewerRef.current) {
      imageViewerRef.current.setRotation(newRotation);
    }
  };

  // Rotate right
  const handleRotateRight = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    
    if (selectedFile?.content_type.includes('pdf') && pdfViewerRef.current) {
      pdfViewerRef.current.setRotation(newRotation);
    } else if (selectedFile?.content_type.includes('image') && imageViewerRef.current) {
      imageViewerRef.current.setRotation(newRotation);
    }
  };

  // Handle link activation update
  const handleLinkUpdate = (updates: Partial<LinkActivation>) => {
    if (linkActivation && linkActivation.fileId) {
      setLinkActivation({
        ...linkActivation,
        ...updates,
      });
    } else if (selectedFile) {
      setLinkActivation({
        fileId: selectedFile.id,
        ...updates,
      });
    }
  };

  // Handle file download
  const handleDownload = useCallback(() => {
    if (!selectedFile) return;
    
    try {
      // Create a download link
      const link = document.createElement('a');
      link.href = selectedFile.url;
      link.download = selectedFile.name || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Downloaded file
    } catch (error) {
      console.error('[RightPanel] Download error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred during download');
    }
  }, [selectedFile]);

  // Render file viewer with enhanced error handling
  const renderFileViewer = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading file...
          </Typography>
        </Box>
      );
    }

    if (errorMessage) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof errorMessage === 'string' 
              ? errorMessage 
              : errorMessage instanceof Error 
              ? errorMessage.message 
              : typeof errorMessage === 'object' && errorMessage?.message
              ? String(errorMessage.message)
              : 'An unknown error occurred'
            }
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2, alignItems: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<RefreshIcon />} 
              onClick={() => selectedFileId && fetchFileDetails(selectedFileId)}
              sx={{ mb: 1 }}
            >
              Retry Loading
            </Button>
            
            {selectedFileId && (
              <Button
                variant="outlined"
                onClick={() => {
                  if (!selectedFileId) return;
                  
                  // Try with a direct public URL approach as a last resort
                  const supabaseProjectUrl = import.meta.env.VITE_SUPABASE_URL || '';
                  
                  supabaseClient
                    .from('files')
                    .select('storage_path')
                    .eq('id', selectedFileId)
                    .single()
                    .then(({ data }) => {
                      if (data?.storage_path) {
                        const directUrl = `${supabaseProjectUrl}/storage/v1/object/public/files/${data.storage_path}?t=${Date.now()}`;
                        // Try alternative URL method
                        
                        // Open in new tab to test access
                        window.open(directUrl, '_blank');
                      }
                    });
                }}
              >
                Open in New Tab
              </Button>
            )}
          </Box>
        </Box>
      );
    }

    if (!selectedFile || !selectedFile.url) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {selectedFileId ? 'Failed to load file' : 'No file selected'}
          </Typography>
          {selectedFileId && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<RefreshIcon />} 
              onClick={() => fetchFileDetails(selectedFileId)}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          )}
        </Box>
      );
    }

    return (
      <FileViewer
        url={selectedFile.url}
        fileName={selectedFile.name}
        fileType={selectedFile.file_type}
        mimeType={selectedFile.content_type}
        onError={(error) => {
          console.error('File viewer error:', error);
          setErrorMessage(`Error viewing file: ${error.message || 'Unknown error'}`);
        }}
      />
    );
  };

  // Group entities by type
  const groupedEntities = extractedEntities.reduce((acc, entity) => {
    if (!acc[entity.entity_type]) {
      acc[entity.entity_type] = [];
    }
    acc[entity.entity_type].push(entity.entity_text);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      data-test="right-panel"
    >
      {/* Header component passed from parent */}
      {headerComponent ? headerComponent(
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {selectedFile ? selectedFile.name : 'No file selected'}
        </Typography>
      ) : null}

      {/* Collapsible content */}
      <Box
        sx={{
          display: isCollapsed ? 'none' : 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {!selectedFile ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3,
              textAlign: 'center',
            }}
          >
            <InfoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem' }}>
              No file selected
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, fontSize: '0.844rem' }}>
              Select a file from the list to view it here.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Tabs for file viewer and AI tools */}
            <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="file tabs"
                sx={{ minHeight: 48 }}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="View" id="file-tab-0" />
                <Tab label="AI Assist" id="file-tab-1" />
              </Tabs>
            </Paper>

            {/* Tab panels */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: tabValue === 0 ? 'flex' : 'none' }}>
              {renderFileViewer()}
            </Box>

            {/* AI Assist tab panel */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'hidden',
                display: tabValue === 1 ? 'flex' : 'none',
                flexDirection: 'column',
              }}
            >
              <AIAssistPanel
                file={selectedFile}
                projectId={selectedProjectId}
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default RightPanel; 
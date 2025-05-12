import { useState, useEffect, useRef } from 'react';
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
} from '@mui/icons-material';
import useAppStore from '../../store';
import supabaseClient from '../../services/supabaseClient';
import { File as FileType, FileWithUrl, LinkActivation } from '../../types';
import FileViewer, { SupportedFileType } from '../../components/viewers/FileViewer';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import storageService from '../../services/storageService';

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

const RightPanel = () => {
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

  // Fetch file details with better error handling and retries
  const fetchFileDetails = async (fileId: string, retryCount = 0) => {
    console.log('Fetching file details for ID:', fileId);
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
        console.error('Error fetching file details:', error);
        throw new Error(`Failed to fetch file details: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('File not found');
      }
      
      console.log('File metadata retrieved:', { 
        id: data.id, 
        name: data.name, 
        content_type: data.content_type, 
        storage_path: data.storage_path 
      });
      
      // Generate URL for storage file using robust helper
      const { url: resolvedUrl, error: urlError } = await storageService.getFileUrl(data.storage_path);

      if (!resolvedUrl) {
        console.error('Error generating URL:', urlError);
        
        // If the helper fails, try direct URL construction as a last resort
        const projectId = 'swtkpfpyjjkkemmvkhmz';
        const directUrl = `https://${projectId}.supabase.co/storage/v1/object/public/files/${data.storage_path}`;
        console.log('Using direct URL as last resort:', directUrl);
        
        setSelectedFile({
          ...data,
          url: directUrl,
        });
        return;
      }

      console.log('Resolved file URL:', resolvedUrl);
      
      // Try fetching with a HEAD request to verify URL accessibility
      try {
        const checkResponse = await fetch(resolvedUrl, { method: 'HEAD' });
        if (!checkResponse.ok) {
          console.warn('URL accessibility check failed, status:', checkResponse.status);
          
          if (retryCount < 2) {
            // If HEAD fails, try with a cache buster
            const cacheBuster = `?cb=${Date.now()}`;
            const altUrl = resolvedUrl.includes('?') 
              ? `${resolvedUrl.split('?')[0]}${cacheBuster}` 
              : `${resolvedUrl}${cacheBuster}`;
              
            console.log('Trying with cache buster:', altUrl);
            
            setSelectedFile({
              ...data,
              url: altUrl,
            });
            return;
          }
        }
      } catch (checkError) {
        console.warn('URL accessibility check error:', checkError);
        // Continue anyway as the browser might still be able to load it
      }

      setSelectedFile({
        ...data,
        url: resolvedUrl,
      });
    } catch (error) {
      console.error('Error in fetchFileDetails:', error);
      
      if (retryCount < 2) {
        // Wait briefly before retrying
        setTimeout(() => {
          console.log(`Retrying fetchFileDetails (${retryCount + 1}/2)...`);
          fetchFileDetails(fileId, retryCount + 1);
        }, 1000);
        return;
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
        const entities = response.data.entities;
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
      
      console.log('Link saved to database');
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

  // Render file viewer
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
            {typeof errorMessage === 'string' ? errorMessage : errorMessage instanceof Error ? errorMessage.message : 'An unknown error occurred'}
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
                  
                  // Try with a direct public URL approach
                  const projectId = 'swtkpfpyjjkkemmvkhmz';
                  
                  supabaseClient
                    .from('files')
                    .select('storage_path')
                    .eq('id', selectedFileId)
                    .single()
                    .then(({ data }) => {
                      if (data?.storage_path) {
                        const directUrl = `https://${projectId}.supabase.co/storage/v1/object/public/files/${data.storage_path}?t=${Date.now()}`;
                        console.log('Trying alternative URL method:', directUrl);
                        
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
        contentType={selectedFile.content_type}
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
      {/* File Info */}
      <Paper sx={{ p: 2, boxShadow: 'none', borderBottom: 1, borderColor: 'divider' }}>
        {loading && selectedFileId ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Loading...</Typography>
          </Box>
        ) : selectedFile ? (
          <>
            <Typography variant="subtitle1" noWrap title={selectedFile.name}>
              {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {selectedFile.exhibit_id ? `Exhibit ID: ${selectedFile.exhibit_id} • ` : ''}
              {selectedFile.content_type} • {(selectedFile.size / 1024).toFixed(0)} KB
            </Typography>
          </>
        ) : (
          <Typography variant="subtitle1" color="text.secondary">
            No file selected
          </Typography>
        )}
      </Paper>

      {/* Controls for viewer */}
      {selectedFile && (
        <Paper sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          p: 0.5, 
          boxShadow: 'none', 
          borderBottom: 1, 
          borderColor: 'divider' 
        }}>
          <Box>
            <Tooltip title="Zoom out">
              <span>
                <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Zoom in">
              <span>
                <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Rotate left">
              <span>
                <IconButton size="small" onClick={handleRotateLeft}>
                  <RotateLeftIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Rotate right">
              <span>
                <IconButton size="small" onClick={handleRotateRight}>
                  <RotateRightIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <Tooltip title="Copy link to current position">
            <span>
              <IconButton 
                size="small" 
                onClick={copyLink}
                color={linkActivation ? 'primary' : 'default'}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Paper>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ minHeight: 40 }}
        >
          <Tab label="Preview" sx={{ minHeight: 40, py: 0.5 }} />
          <Tab label="AI Assist" sx={{ minHeight: 40, py: 0.5 }} />
        </Tabs>
      </Box>

      {/* File Viewer Tab */}
      <TabPanel value={tabValue} index={0} sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        <Box sx={{ height: '100%' }}>
          {renderFileViewer()}
        </Box>
      </TabPanel>

      {/* AI Assist Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
          {/* File Summary */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">File Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {isLoadingSummary ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : fileSummary ? (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {fileSummary}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => fetchFileSummary()}
                    startIcon={<SearchIcon />}
                  >
                    Generate Summary
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* File Q&A */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Ask about this document</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask a question about this document..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={analyzing || !selectedFile}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={analyzeFile}
                disabled={analyzing || !selectedFile || !question}
                sx={{ mb: 2 }}
              >
                {analyzing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                {analyzing ? 'Analyzing...' : 'Ask AI'}
              </Button>
              
              {answer && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="body2" whiteSpace="pre-wrap">
                    {answer}
                  </Typography>
                </Paper>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Project Q&A */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Project Q&A</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask a question about the entire project..."
                value={projectQuestion}
                onChange={(e) => setProjectQuestion(e.target.value)}
                disabled={isAnalyzingProject || !selectedProjectId}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={analyzeProject}
                disabled={isAnalyzingProject || !selectedProjectId || !projectQuestion}
                sx={{ mb: 2 }}
              >
                {isAnalyzingProject ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                {isAnalyzingProject ? 'Analyzing...' : 'Ask Project AI'}
              </Button>
              
              {projectAnswer && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="body2" whiteSpace="pre-wrap">
                    {projectAnswer}
                  </Typography>
                </Paper>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Entity Extraction */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Entities</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {isLoadingEntities ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : extractedEntities.length > 0 ? (
                <Box>
                  {Object.entries(groupedEntities).map(([entityType, entities]) => (
                    <Box key={entityType} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {entityType.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {entities.map((entity, index) => (
                          <Chip 
                            key={index} 
                            label={entity} 
                            size="small" 
                            variant="outlined" 
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => fetchExtractedEntities()}
                    startIcon={<SearchIcon />}
                  >
                    Extract Entities
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      </TabPanel>

      {/* Link copied alert */}
      <Snackbar
        open={linkCopySuccess}
        autoHideDuration={3000}
        onClose={() => setLinkCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setLinkCopySuccess(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Link copied to clipboard
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RightPanel; 
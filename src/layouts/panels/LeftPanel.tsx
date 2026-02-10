import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  TextField,
  IconButton,
  Chip,
  Stack,
  Skeleton,
  Tooltip,
  LinearProgress,
  Alert,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Badge,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  FileUpload as UploadIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  CloudDownload as DownloadIcon,
  Label as LabelIcon,
  Sort as SortIcon,
  Folder as ExhibitIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import useAppStore from '../../store';
import { supabase as supabaseClient } from '../../lib/supabase';
import { Project } from '../../types';
import AdvancedSearchFilters from '../../components/search/AdvancedSearchFilters';
import RenameFileDialog from '../../components/dialogs/RenameFileDialog';
import { useProjectFiles, useFileUpload, FileRecord } from '../../hooks/useProjectFiles';
import { debounce } from 'lodash';
import FileTypeIcon from '../../components/icons/FileTypeIcon';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import ProjectList from '../../components/search/ProjectList';
import FileList from '../../components/search/FileList';
import ExhibitManager from '../../components/legal/ExhibitManager';
import CloudUploadZone from '../../components/upload/CloudUploadZone';

// Props interface definition
interface LeftPanelProps {
  isCollapsed?: boolean;
  headerComponent?: (defaultHeader: React.ReactNode) => React.ReactNode;
}

const LeftPanel = ({ 
  isCollapsed = false, 
  headerComponent,
}: LeftPanelProps = {}) => {
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  const selectedFileId = useAppStore((state) => state.selectedFileId);
  const setSelectedFile = useAppStore((state) => state.setSelectedFile);
  const searchFilters = useAppStore((state) => state.searchFilters);
  const setSearchFilters = useAppStore((state) => state.setSearchFilters);
  const resetSearchFilters = useAppStore((state) => state.resetSearchFilters);
  const setFiles = useAppStore((state) => state.setFiles);
  const projects = useAppStore((state) => state.projects);
  const setProjects = useAppStore((state) => state.setProjects);
  const navigate = useNavigate();

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Dialog states
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renameFileDialogOpen, setRenameFileDialogOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  
  // UI state
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFileMenuId, setActiveFileMenuId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'added_at' | 'name' | 'exhibit_id'>('added_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'upload' | 'files' | 'exhibits'>('upload');
  
  // React Query hooks
  const { 
    data: files = [], // Ensure it's always an array with default empty array
    isLoading: filesLoading, 
    refetch: refetchFiles,
    isError: isFilesError,
    error: filesError
  } = useProjectFiles(selectedProjectId);
  
  const {
    mutate: uploadFile,
    isPending: isUploading,
    isError: isUploadError,
    error: uploadMutationError
  } = useFileUpload();
  
  // Sync files with the store to maintain compatibility
  useEffect(() => {
    if (files) {
      setFiles(files);
    }
  }, [files, setFiles]);

  // Fetch projects on mount - only when auth is loaded and user exists
  useEffect(() => {
    if (!authLoading && user) {
      fetchProjects();
    }
  }, [user, authLoading]);

  // Add a useEffect to auto-open the project dialog when no projects exist
  // Add after the useEffect that fetches projects
  useEffect(() => {
    // Check if projects were loaded and there are none
    if (!projectsLoading && projects.length === 0 && user) {
      // Slight delay to ensure UI is ready
      const timer = setTimeout(() => {
        setProjectDialogOpen(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [projectsLoading, projects, user]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!selectedProjectId) return;
      
      // If search term is empty, just reset and return
      if (!term.trim()) {
        setSearchLoading(false);
        return;
      }
      
      try {
        setSearchLoading(true);
        
        // Call the project-search Edge Function
        const response = await supabaseClient.functions.invoke('project-search', {
          body: {
            projectId: selectedProjectId,
            query: term,
            filters: {
              fileTypes: searchFilters.fileTypes || [],
              tags: searchFilters.tags || [],
              entities: searchFilters.entities || [],
              dateFrom: searchFilters.dateFrom ? new Date(searchFilters.dateFrom).toISOString() : null,
              dateTo: searchFilters.dateTo ? new Date(searchFilters.dateTo).toISOString() : null,
            },
            searchType: searchFilters.searchType || 'combined',
          },
        });
        
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        // The response should contain file IDs sorted by relevance
        if (response.data?.results) {
          // We could update the file list directly here, but for now we'll just filter the existing files
          // This would need to be updated to fully use the semantic search results when ready
          console.log('Search results:', response.data.results);
        }
      } catch (error) {
        console.error('Error during search:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    [selectedProjectId, searchFilters]
  );

  // Trigger search when searchTerm changes
  useEffect(() => {
    if (searchFilters.searchTerm) {
      setSearchLoading(true);
      debouncedSearch(searchFilters.searchTerm);
    }
  }, [searchFilters.searchTerm, debouncedSearch]);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      
      // Guard against fetching when user is not available
      if (!user) {
        console.log('Skipping project fetch - no authenticated user');
        return;
      }
      
      // Verify authentication status before proceeding
      const { data: session, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session?.session?.access_token) {
        throw new Error('Authentication error: No API key found in request');
      }
      
      // Use the Supabase client consistently for all database operations
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (error) {
      logError(error, 'fetchProjects');
      // If this is the common API key error, provide a more helpful message
      if (error?.message?.includes('No API key found')) {
        showNotification(
          'Session expired. Please refresh your browser or log in again.',
          'warning',
          6000
        );
      }
    } finally {
      setProjectsLoading(false);
    }
  };

  // Create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    // Close the dialog immediately to prevent UI issues
    setProjectDialogOpen(false);
    
    try {
      if (!user) {
        throw new Error('You must be signed in to create a project');
      }

      console.log('Creating new project:', newProjectName);

      // Verify authentication status before proceeding
      const { data: session, error: sessionError } = await supabaseClient.auth.getSession();

      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`);
      }

      if (!session?.session?.access_token) {
        throw new Error('Authentication error: No API key found in request');
      }

      const ownerId = user.id;

      // Create project in database
      const { data, error } = await supabaseClient
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          owner_id: ownerId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Project created successfully:', data);
      setProjects([data, ...projects]);
      setSelectedProject(data.id);
      setNewProjectName('');
      
      // Navigate to the new project page
      console.log('Navigating to:', `/projects/${data.id}`);
      navigate(`/projects/${data.id}`);
      
    } catch (error) {
      logError(error, 'handleCreateProject');
      showNotification(
        getErrorMessage(error, 'Error creating project'),
        'error',
        6000
      );
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectId || !user || !event.target.files || event.target.files.length === 0) {
      return;
    }

    try {
      setUploadProgress(0);
      
      const file = event.target.files[0];
      
      // Use the React Query mutation with progress tracking
      await uploadFile(
        { 
          file, 
          projectId: selectedProjectId, 
          userId: user.id,
          onProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        },
        {
          onSuccess: (data) => {
            console.log('Upload successful:', data);
            
            // Show success message via notification system
            showNotification(
              'File uploaded successfully',
              'success'
            );
            
            // Also select the new file for immediate viewing
            if (data && data.id) {
              setSelectedFile(data.id);
            }
            
            // Reset the input
            event.target.value = '';
          },
          onError: (error) => {
            logError(error, 'fileUpload');
            showNotification(
              getErrorMessage(error, 'Error uploading file'),
              'error',
              6000
            );
          }
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Handle search term change
  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilters({ searchTerm: event.target.value });
  };

  // Clear search term
  const handleClearSearch = () => {
    setSearchFilters({ searchTerm: '' });
  };

  // Add tag filters
  const handleAddTagFilter = (tag: string) => {
    const currentTags = searchFilters.tags || [];
    if (!currentTags.includes(tag)) {
      setSearchFilters({ tags: [...currentTags, tag] });
    }
  };

  // Filter by tags function
  const filterFilesByTags = (filesToFilter: FileRecord[]): FileRecord[] => {
    if (!searchFilters.tags || searchFilters.tags.length === 0) {
      return filesToFilter;
    }
    
    return filesToFilter.filter(file => {
      const fileTags = file.metadata?.tags || [];
      return searchFilters.tags.some(tag => fileTags.includes(tag));
    });
  };

  // Update to apply tag filters
  const filterFiles = (filesToFilter: FileRecord[]): FileRecord[] => {
    // Guard: ensure files is always an array
    if (!Array.isArray(filesToFilter)) {
      console.warn('filterFiles received non-array input:', filesToFilter);
      return [];
    }
    
    // No filters applied
    if (!searchFilters.searchTerm && 
        (!searchFilters.fileTypes || searchFilters.fileTypes.length === 0) &&
        (!searchFilters.tags || searchFilters.tags.length === 0) &&
        (!searchFilters.dateFrom && !searchFilters.dateTo)) {
      return sortFiles(filesToFilter);
    }

    let filteredByTextAndType = filesToFilter.filter((file) => {
      const matchesSearchTerm = !searchFilters.searchTerm ||
        file.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        (file.exhibit_id && file.exhibit_id.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())) ||
        (file.metadata?.description && file.metadata.description.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()));
      
      const matchesFileType = !searchFilters.fileTypes || 
        searchFilters.fileTypes.length === 0 || 
        searchFilters.fileTypes.includes(file.file_type);
      
      let matchesDateRange = true;
      if (searchFilters.dateFrom || searchFilters.dateTo) {
        const fileDate = new Date(file.added_at);
        
        if (searchFilters.dateFrom) {
          matchesDateRange = fileDate >= new Date(searchFilters.dateFrom);
        }
        
        if (matchesDateRange && searchFilters.dateTo) {
          matchesDateRange = fileDate <= new Date(searchFilters.dateTo);
        }
      }
      
      return matchesSearchTerm && matchesFileType && matchesDateRange;
    });
    
    // Apply tag filtering
    if (searchFilters.tags && searchFilters.tags.length > 0) {
      filteredByTextAndType = filterFilesByTags(filteredByTextAndType);
    }
    
    return sortFiles(filteredByTextAndType);
  };

  // Sort files based on sort option and direction
  const sortFiles = (filesToSort: FileRecord[]): FileRecord[] => {
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'exhibit_id':
          // Sort null exhibit_ids to the end
          if (!a.exhibit_id && !b.exhibit_id) comparison = 0;
          else if (!a.exhibit_id) comparison = 1;
          else if (!b.exhibit_id) comparison = -1;
          else comparison = a.exhibit_id.localeCompare(b.exhibit_id);
          break;
        case 'added_at':
        default:
          comparison = new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
  };

  // Handle rename dialog
  const handleOpenRenameDialog = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFileToRename(fileId);
    setRenameFileDialogOpen(true);
    handleCloseFileMenu();
  };

  // Handle file menu open
  const handleFileMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, fileId: string) => {
    event.stopPropagation();
    setFileMenuAnchorEl(event.currentTarget);
    setActiveFileMenuId(fileId);
  };

  // Handle file menu close
  const handleCloseFileMenu = () => {
    setFileMenuAnchorEl(null);
    setActiveFileMenuId(null);
  };

  // Handle file delete confirmation
  const handleDeleteConfirm = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteConfirmOpen(true);
    handleCloseFileMenu();
  };

  // Delete file
  const handleDeleteFile = async () => {
    if (!fileToDelete || !selectedProjectId) {
      setDeleteConfirmOpen(false);
      return;
    }
    
    try {
      // Get file details to get the storage path
      const fileToDeleteDetails = files.find(f => f.id === fileToDelete);
      
      if (fileToDeleteDetails) {
        // Delete from storage first
        const { error: storageError } = await supabaseClient.storage
          .from('files')
          .remove([fileToDeleteDetails.storage_path]);
        
        if (storageError) {
          logError(storageError, 'handleDeleteFile.storage');
          // Continue anyway to try to delete the database record
        }
        
        // Delete from database
        const { error } = await supabaseClient
          .from('files')
          .delete()
          .eq('id', fileToDelete);
        
        if (error) throw error;
        
        // If currently selected file was deleted, clear selection
        if (selectedFileId === fileToDelete) {
          setSelectedFile(null);
        }
        
        // Refetch files list
        refetchFiles();
      }
    } catch (error) {
      logError(error, 'handleDeleteFile.database');
      showNotification(
        getErrorMessage(error, 'Error deleting file'),
        'error',
        6000
      );
    } finally {
      setDeleteConfirmOpen(false);
      setFileToDelete(null);
    }
  };

  // Handle file download
  const handleDownloadFile = async (fileId: string) => {
    handleCloseFileMenu();
    
    const fileToDownload = files.find(f => f.id === fileId);
    if (!fileToDownload) return;
    
    try {
      // Get a signed URL
      const { data, error } = await supabaseClient.storage
        .from('files')
        .createSignedUrl(fileToDownload.storage_path, 60); // 1 minute expiry
      
      if (error) throw error;
      
      if (data?.signedUrl) {
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileToDownload.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      logError(error, 'handleDownloadFile');
      showNotification(
        getErrorMessage(error, 'Error downloading file'),
        'error',
        6000
      );
    }
  };

  // Toggle sort direction
  const handleToggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Change sort option
  const handleChangeSortOption = (option: 'added_at' | 'name' | 'exhibit_id') => {
    setSortOption(option);
  };

  // IMPORTANT: guarantee filteredFiles is always an array before using .map()
  const filteredFiles = filterFiles(files || []);

  return (
    <Box 
      sx={{ 
        height: '100%', 
        maxHeight: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        pt: 1.5, // Increased padding to prevent content from being cut off
        backgroundColor: theme => theme.palette.background.default
      }}
      data-test="left-panel"
    >
      {/* Header component passed from parent */}
      {headerComponent ? headerComponent(
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Clarity Hub
        </Typography>
      ) : (
        <Typography variant="h6" sx={{ fontWeight: 'bold', px: 2, py: 1 }}>
          Clarity Hub
        </Typography>
      )}

      {/* Collapsible content */}
      <Box
        sx={{
          display: isCollapsed ? 'none' : 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
        }}
      >
        {/* Project List Section */}
        <Box sx={{ pb: 2 }}>
          <ProjectList
            projects={projects}
            selectedProjectId={selectedProjectId}
            loading={projectsLoading}
            onSelectProject={setSelectedProject}
            onCreateProject={handleCreateProject}
            onRefresh={fetchProjects}
          />
        </Box>

        <Divider />

        {/* Tabs for Upload, Files and Exhibits */}
        {selectedProjectId && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab
                icon={<UploadIcon fontSize="small" />}
                iconPosition="start"
                label="Upload"
                value="upload"
                sx={{ minHeight: 48, textTransform: 'none' }}
              />
              <Tab
                icon={<FileIcon fontSize="small" />}
                iconPosition="start"
                label="Files"
                value="files"
                sx={{ minHeight: 48, textTransform: 'none' }}
              />
              <Tab
                icon={<ExhibitIcon fontSize="small" />}
                iconPosition="start"
                label="Exhibits"
                value="exhibits"
                sx={{ minHeight: 48, textTransform: 'none' }}
              />
            </Tabs>
          </Box>
        )}

        {/* Tab Content */}
        {selectedProjectId && (
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'upload' ? (
              /* Upload Tab - Cloud Native with Gemini 2.5 Pro */
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <CloudUploadZone />
              </Box>
            ) : activeTab === 'files' ? (
              <>
                {/* Search bar for files */}
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Search files..."
                    value={searchFilters.searchTerm || ''}
                    onChange={handleSearchTermChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {searchLoading ? (
                            <CircularProgress size={20} />
                          ) : searchFilters.searchTerm ? (
                            <IconButton
                              size="small"
                              onClick={handleClearSearch}
                              edge="end"
                              aria-label="clear search"
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => setSearchExpanded(!searchExpanded)}
                              edge="end"
                              aria-label="advanced search"
                              color={searchExpanded ? 'primary' : 'default'}
                            >
                              <FilterListIcon fontSize="small" />
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                    sx={{ mb: 1 }}
                  />

                  {/* Advanced search filters */}
                  {searchExpanded && (
                    <AdvancedSearchFilters
                      filters={searchFilters}
                      onUpdateFilters={setSearchFilters}
                      onReset={resetSearchFilters}
                      projectId={selectedProjectId}
                    />
                  )}
                </Box>

                {/* Files List */}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <FileList
                    files={files}
                    filteredFiles={filteredFiles}
                    selectedFileId={selectedFileId}
                    loading={filesLoading}
                    uploading={isUploading}
                    uploadProgress={uploadProgress}
                    onSelectFile={handleFileSelect}
                    onDeleteFile={handleDeleteFile}
                    onDownloadFile={handleDownloadFile}
                    onRenameFile={handleOpenRenameDialog}
                    onSwitchToUpload={() => setActiveTab('upload')}
                    searchActive={!!searchFilters.searchTerm || 
                                  (searchFilters.tags && searchFilters.tags.length > 0) ||
                                  (searchFilters.fileTypes && searchFilters.fileTypes.length > 0) ||
                                  searchFilters.dateFrom || 
                                  searchFilters.dateTo}
                  />
                </Box>
              </>
            ) : (
              /* Exhibits Tab */
              <ExhibitManager
                projectId={selectedProjectId}
                onExhibitClick={(exhibitId) => {
                  // Switch to files tab to show the selected exhibit file
                  setActiveTab('files');
                }}
                onCitationInsert={(exhibitId, page) => {
                  // Create a citation insertion event that the editor can listen for
                  const citationReference = page ? `${exhibitId}:${page}` : exhibitId;
                  
                  // Dispatch a custom event for citation insertion
                  const event = new CustomEvent('insertCitation', {
                    detail: {
                      exhibitId,
                      pageNumber: page,
                      citationReference,
                      description: `Exhibit ${exhibitId}${page ? `, page ${page}` : ''}`,
                    }
                  });
                  window.dispatchEvent(event);
                  
                  console.log('Dispatched citation insertion event:', citationReference);
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Rename file dialog */}
      <RenameFileDialog
        open={renameFileDialogOpen}
        fileId={fileToRename}
        onClose={() => {
          setRenameFileDialogOpen(false);
          setFileToRename(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this file? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteFile} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Success is handled via the NotificationProvider */}
    </Box>
  );
};

export default LeftPanel; 
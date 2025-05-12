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
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import useAppStore from '../../store';
import supabaseClient from '../../services/supabaseClient';
import { Project } from '../../types';
import AdvancedSearchFilters from '../../components/search/AdvancedSearchFilters';
import RenameFileDialog from '../../components/dialogs/RenameFileDialog';
import { useProjectFiles, useFileUpload, FileRecord } from '../../hooks/useProjectFiles';
import { debounce } from 'lodash';
import FileTypeIcon from '../../components/icons/FileTypeIcon';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

// File type icons are now handled by the FileTypeIcon component

const LeftPanel = () => {
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
        showNotification({
          message: 'Session expired. Please refresh your browser or log in again.',
          severity: 'warning',
          autoHideDuration: 6000
        });
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
    
    // Check if we are in demo mode (no real user)
    const isDemoMode = !user || user.id === 'demo-user-123';
    
    try {
      console.log('Creating new project:', newProjectName, isDemoMode ? '(DEMO MODE)' : '');
      
      // Verify authentication status before proceeding
      const { data: session, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session?.session?.access_token) {
        throw new Error('Authentication error: No API key found in request');
      }
      
      // Use user ID if available, otherwise use a fallback for demo mode
      const ownerId = user?.id || 'demo-user-123';
      
      // In demo mode, create a mock project without database call
      if (isDemoMode) {
        // Generate a mock project with proper UUID instead of demo- prefix
        const mockProject = {
          id: crypto.randomUUID(), // Using standard UUID format
          name: newProjectName.trim(),
          owner_id: ownerId,
          created_at: new Date().toISOString(),
        };
        
        console.log('Created mock project (demo mode):', mockProject);
        
        // Add to local projects array
        setProjects([mockProject, ...projects]);
        setSelectedProject(mockProject.id);
        setNewProjectName('');
        
        // Navigate to the new project page
        console.log('Navigating to:', `/projects/${mockProject.id}`);
        navigate(`/projects/${mockProject.id}`);
        
        // Show a demo mode notification
        showNotification({
          message: 'Project created in demo mode (changes won\'t be saved)',
          severity: 'info',
          autoHideDuration: 6000
        });
        
        return;
      }
      
      // Normal mode - create project in database
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
      showNotification({
        message: getErrorMessage(error, 'Error creating project'),
        severity: 'error',
        autoHideDuration: 6000
      });
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
            showNotification({
              message: 'File uploaded successfully',
              severity: 'success'
            });
            
            // Also select the new file for immediate viewing
            if (data && data.id) {
              setSelectedFile(data.id);
            }
            
            // Reset the input
            event.target.value = '';
          },
          onError: (error) => {
            logError(error, 'fileUpload');
            showNotification({
              message: getErrorMessage(error, 'Error uploading file'),
              severity: 'error',
              autoHideDuration: 6000
            });
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
      showNotification({
        message: getErrorMessage(error, 'Error deleting file'),
        severity: 'error',
        autoHideDuration: 6000
      });
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
      showNotification({
        message: getErrorMessage(error, 'Error downloading file'),
        severity: 'error',
        autoHideDuration: 6000
      });
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
      {/* Projects Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          position: 'relative',
          zIndex: 1,
          backgroundColor: theme => theme.palette.mode === 'dark' 
            ? theme.palette.background.paper
            : theme.palette.background.default
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Projects</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setProjectDialogOpen(true)}
            data-test="new-project-button"
            color="primary"
            sx={{
              borderRadius: 4,
              px: 1.5,
              '&:hover': {
                backgroundColor: theme => theme.palette.primary.main + '10',
              }
            }}
          >
            New
          </Button>
        </Box>
        
        {/* Project List */}
        {authLoading || projectsLoading ? (
          <List>
            {[1, 2, 3].map((i) => (
              <ListItem key={i} disablePadding>
                <ListItemButton>
                  <Skeleton variant="rectangular" width="100%" height={30} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
            {projects.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  No projects yet
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  fullWidth
                  size="large"
                  onClick={() => setProjectDialogOpen(true)}
                  data-test="start-first-project-button"
                  sx={{
                    py: 1.5,
                    fontWeight: 'bold',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                    }
                  }}
                >
                  Start your first project
                </Button>
              </Box>
            ) : (
              projects.map((project: Project) => (
                <ListItem key={project.id} disablePadding>
                  <ListItemButton
                    data-test="project-list-item"
                    selected={selectedProjectId === project.id}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <ListItemText
                      primary={project.name}
                      primaryTypographyProps={{
                        noWrap: true,
                        sx: { fontWeight: selectedProjectId === project.id ? 'bold' : 'normal' },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        )}
      </Paper>
      
      {/* Files Section */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Paper elevation={0} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Files</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh files list">
                <span>
                  <IconButton 
                    size="small" 
                    onClick={() => refetchFiles()} 
                    disabled={!selectedProjectId || filesLoading}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              
              {/* Sort Menu */}
              <Tooltip title="Sort files">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      setFileMenuAnchorEl(e.currentTarget);
                      setActiveFileMenuId('sort');
                    }}
                    color={activeFileMenuId === 'sort' ? 'primary' : 'default'}
                    disabled={!selectedProjectId}
                  >
                    <SortIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Menu
                anchorEl={fileMenuAnchorEl}
                open={activeFileMenuId === 'sort'}
                onClose={handleCloseFileMenu}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem 
                  onClick={() => { handleChangeSortOption('added_at'); handleCloseFileMenu(); }}
                  selected={sortOption === 'added_at'}
                >
                  Date Added {sortOption === 'added_at' && (sortDirection === 'desc' ? '(Newest)' : '(Oldest)')}
                </MenuItem>
                <MenuItem 
                  onClick={() => { handleChangeSortOption('name'); handleCloseFileMenu(); }}
                  selected={sortOption === 'name'}
                >
                  Name {sortOption === 'name' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
                </MenuItem>
                <MenuItem 
                  onClick={() => { handleChangeSortOption('exhibit_id'); handleCloseFileMenu(); }}
                  selected={sortOption === 'exhibit_id'}
                >
                  Exhibit ID {sortOption === 'exhibit_id' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleToggleSortDirection(); handleCloseFileMenu(); }}>
                  {sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                </MenuItem>
              </Menu>
              
              {/* Upload Button */}
              <Button
                size="small"
                startIcon={<UploadIcon />}
                component="label"
                disabled={!selectedProjectId || isUploading}
                variant="contained"
                color="primary"
                data-test="upload-button"
              >
                Upload
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={!selectedProjectId || isUploading}
                  data-test="file-input"
                />
              </Button>
            </Box>
          </Box>
          
          {/* Search Box */}
          <Box sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search files..."
              value={searchFilters.searchTerm || ''}
              onChange={handleSearchTermChange}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: searchLoading ? (
                  <InputAdornment position="start">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchFilters.searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <IconButton
              size="small"
              onClick={() => setSearchExpanded(!searchExpanded)}
              color={searchExpanded ? 'primary' : 'default'}
              sx={{ ml: 1 }}
            >
              <FilterListIcon />
            </IconButton>
          </Box>
          
          {/* Advanced Search Filters */}
          {searchExpanded && (
            <Box sx={{ mb: 2 }}>
              <AdvancedSearchFilters />
            </Box>
          )}
          
          {/* Upload Progress */}
          {isUploading && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="caption" display="block" gutterBottom>
                Uploading file... {uploadProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ height: 4, borderRadius: 2 }} 
              />
            </Box>
          )}
          
          {/* Upload Error */}
          {isUploadError && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              Upload failed: {uploadMutationError instanceof Error ? uploadMutationError.message : 'Unknown error'}
            </Alert>
          )}
          
          {/* Files Error */}
          {isFilesError && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              Error loading files: {filesError instanceof Error ? filesError.message : 'Unknown error'}
            </Alert>
          )}
          
          {/* Active Filters */}
          {((searchFilters.fileTypes?.length || 0) > 0 || searchFilters.dateFrom || searchFilters.dateTo) && (
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
              {/* File type filters */}
              {searchFilters.fileTypes?.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  size="small"
                  onDelete={() => {
                    const newTypes = searchFilters.fileTypes?.filter(t => t !== type) || [];
                    setSearchFilters({ fileTypes: newTypes });
                  }}
                />
              ))}
              
              {/* Date filters */}
              {searchFilters.dateFrom && (
                <Chip
                  label={`From: ${new Date(searchFilters.dateFrom).toLocaleDateString()}`}
                  size="small"
                  onDelete={() => setSearchFilters({ dateFrom: null })}
                />
              )}
              
              {searchFilters.dateTo && (
                <Chip
                  label={`To: ${new Date(searchFilters.dateTo).toLocaleDateString()}`}
                  size="small"
                  onDelete={() => setSearchFilters({ dateTo: null })}
                />
              )}
              
              {/* Clear all button */}
              {((searchFilters.fileTypes?.length || 0) > 0 || searchFilters.dateFrom || searchFilters.dateTo) && (
                <Chip
                  label="Clear all filters"
                  size="small"
                  color="primary"
                  onClick={resetSearchFilters}
                />
              )}
            </Stack>
          )}
        </Paper>
        
        {/* File List */}
        <List sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0, p: 0 }}>
          {filesLoading ? (
            Array(5).fill(0).map((_, index) => (
              <ListItem key={index} divider>
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <Skeleton variant="rectangular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="50%" />
                  </Box>
                </Box>
              </ListItem>
            ))
          ) : !selectedProjectId ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Select a project to view files.
              </Typography>
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchFilters.searchTerm ? 'No files match your search criteria.' : 'No files found. Upload a file to get started.'}
              </Typography>
            </Box>
          ) : (
            filteredFiles.map((file) => {
              const metadata = file.metadata || {};
              const thumbnailUrl = metadata.thumbnailUrl;
              const tags = metadata.tags || [];
              const description = metadata.description || '';
              
              return (
                <ListItem
                  key={file.id}
                  divider
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleFileMenuOpen(e, file.id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  }
                  disablePadding
                >
                  <ListItemButton
                    selected={selectedFileId === file.id}
                    onClick={() => handleFileSelect(file.id)}
                    sx={{ py: 1 }}
                    data-test="file-item"
                  >
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      {/* Thumbnail or Icon */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          mr: 2,
                          backgroundColor: 'background.default',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: 1,
                          borderColor: 'divider',
                        }}
                      >
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={file.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <FileTypeIcon 
                            fileName={file.name}
                            fileType={file.file_type}
                            mimeType={file.content_type}
                            size="medium"
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ fontWeight: selectedFileId === file.id ? 'bold' : 'normal' }}
                          title={description ? `${description}` : file.name}
                        >
                          {file.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                          {file.exhibit_id && (
                            <Chip
                              label={file.exhibit_id}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 1, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                            />
                          )}
                          
                          {tags.slice(0, 2).map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddTagFilter(tag);
                              }}
                              sx={{ 
                                height: 20, 
                                '& .MuiChip-label': { px: 1, py: 0 },
                                backgroundColor: theme => theme.palette.primary.main + '20',
                              }}
                            />
                          ))}
                          {tags.length > 2 && (
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              +{tags.length - 2}
                            </Typography>
                          )}
                          
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ ml: 'auto' }}>
                            {(file.size / 1024).toFixed(0)} KB
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </Box>

      {/* File Action Menu */}
      <Menu
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl) && activeFileMenuId !== 'sort'}
        onClose={handleCloseFileMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => activeFileMenuId && handleOpenRenameDialog(activeFileMenuId, {} as React.MouseEvent)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename / Assign ID</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => activeFileMenuId && handleDownloadFile(activeFileMenuId)}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => activeFileMenuId && handleDeleteConfirm(activeFileMenuId)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* New Project Dialog */}
      <Dialog 
        open={isProjectDialogOpen} 
        onClose={() => setProjectDialogOpen(false)} 
        data-test="create-project-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{projects.length === 0 ? 'Start Your First Project' : 'Create New Project'}</DialogTitle>
        <DialogContent>
          {projects.length === 0 && (
            <DialogContentText sx={{ mb: 2 }}>
              Projects help you organize your files and documents. Create your first project to get started.
            </DialogContentText>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            type="text"
            fullWidth
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            data-test="project-name-input"
            placeholder="Enter a name for your project"
            helperText="Example: Smith Case, Client Onboarding, etc."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProjectDialogOpen(false)} data-test="cancel-project-button">Cancel</Button>
          <Button
            variant="contained" 
            color="primary"
            disabled={!newProjectName.trim()}
            onClick={handleCreateProject}
            data-test="create-project-button"
          >
            {projects.length === 0 ? 'Start Project' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename File Dialog */}
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
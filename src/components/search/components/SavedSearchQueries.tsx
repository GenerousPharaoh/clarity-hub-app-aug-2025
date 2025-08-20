import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as RunIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  FileCopy as CopyIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import useAppStore from '../../../store';
import { advancedSearchService, SavedSearchQuery } from '../../../services/advancedSearchService';
import { SearchFilters } from '../../../types';

interface SavedSearchQueriesProps {
  onRunSearch: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
}

const SavedSearchQueries: React.FC<SavedSearchQueriesProps> = ({
  onRunSearch,
  currentFilters
}) => {
  const [savedQueries, setSavedQueries] = useState<SavedSearchQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SavedSearchQuery | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saveAsGlobal, setSaveAsGlobal] = useState(false);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const [contextQuery, setContextQuery] = useState<SavedSearchQuery | null>(null);

  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const setSearchFilters = useAppStore(state => state.setSearchFilters);

  useEffect(() => {
    if (selectedProjectId) {
      loadSavedQueries();
    }
  }, [selectedProjectId]);

  const loadSavedQueries = async () => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const queries = await advancedSearchService.getSavedSearchQueries(selectedProjectId);
      setSavedQueries(queries);
    } catch (error) {
      console.error('Error loading saved queries:', error);
      setError('Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentSearch = () => {
    if (!currentFilters || !Object.keys(currentFilters).some(key => 
      currentFilters[key as keyof SearchFilters] !== undefined && 
      currentFilters[key as keyof SearchFilters] !== null &&
      currentFilters[key as keyof SearchFilters] !== ''
    )) {
      setError('No active search to save');
      return;
    }

    setSaveName(currentFilters.searchTerm || 'New Search');
    setSaveAsGlobal(false);
    setEditingQuery(null);
    setSaveDialogOpen(true);
  };

  const handleEditQuery = (query: SavedSearchQuery) => {
    setEditingQuery(query);
    setSaveName(query.name);
    setSaveAsGlobal(query.is_global);
    setSaveDialogOpen(true);
  };

  const handleSaveQuery = async () => {
    if (!selectedProjectId || !saveName.trim()) return;

    try {
      if (editingQuery) {
        // Update existing query
        await advancedSearchService.deleteSearchQuery(editingQuery.id);
      }

      await advancedSearchService.saveSearchQuery(
        selectedProjectId,
        saveName.trim(),
        currentFilters || {},
        saveAsGlobal
      );

      setSaveDialogOpen(false);
      setSaveName('');
      setSaveAsGlobal(false);
      setEditingQuery(null);
      loadSavedQueries();
    } catch (error) {
      console.error('Error saving query:', error);
      setError('Failed to save search query');
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    try {
      await advancedSearchService.deleteSearchQuery(queryId);
      loadSavedQueries();
    } catch (error) {
      console.error('Error deleting query:', error);
      setError('Failed to delete search query');
    }
  };

  const handleRunQuery = async (query: SavedSearchQuery) => {
    try {
      // Update usage count
      await advancedSearchService.updateSearchQueryUsage(query.id);
      
      // Apply filters and run search
      setSearchFilters(query.query_filters);
      onRunSearch(query.query_filters);
      
      // Reload to update usage count
      loadSavedQueries();
    } catch (error) {
      console.error('Error running query:', error);
      setError('Failed to run search query');
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>, query: SavedSearchQuery) => {
    event.preventDefault();
    setContextMenuAnchor(event.currentTarget);
    setContextQuery(query);
  };

  const handleContextMenuClose = () => {
    setContextMenuAnchor(null);
    setContextQuery(null);
  };

  const formatFiltersPreview = (filters: SearchFilters): string => {
    const parts: string[] = [];
    
    if (filters.searchTerm) parts.push(`"${filters.searchTerm}"`);
    if (filters.fileTypes?.length) parts.push(`${filters.fileTypes.length} file types`);
    if (filters.tags?.length) parts.push(`${filters.tags.length} tags`);
    if (filters.entities?.length) parts.push(`${filters.entities.length} entities`);
    if (filters.authors?.length) parts.push(`${filters.authors.length} authors`);
    if (filters.evidenceStatus?.length) parts.push(`${filters.evidenceStatus.length} evidence types`);
    if (filters.dateFrom || filters.dateTo) parts.push('date range');
    
    return parts.join(', ') || 'No filters';
  };

  const getFilterChips = (filters: SearchFilters) => {
    const chips: React.ReactNode[] = [];
    
    if (filters.searchType && filters.searchType !== 'combined') {
      chips.push(
        <Chip key="searchType" label={filters.searchType} size="small" variant="outlined" />
      );
    }
    
    if (filters.exactMatch) {
      chips.push(
        <Chip key="exactMatch" label="Exact match" size="small" color="info" variant="outlined" />
      );
    }
    
    if (filters.caseSensitive) {
      chips.push(
        <Chip key="caseSensitive" label="Case sensitive" size="small" color="info" variant="outlined" />
      );
    }
    
    if (filters.includePrivileged) {
      chips.push(
        <Chip key="privileged" label="Privileged" size="small" color="warning" variant="outlined" />
      );
    }
    
    if (filters.includeWorkProduct) {
      chips.push(
        <Chip key="workProduct" label="Work product" size="small" color="warning" variant="outlined" />
      );
    }
    
    return chips;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">
          Saved Searches
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={handleSaveCurrentSearch}
          disabled={!currentFilters}
        >
          Save Current Search
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && savedQueries.length === 0 && (
        <Card sx={{ textAlign: 'center', p: 3 }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No saved searches yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Save your search queries to quickly run them again
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={handleSaveCurrentSearch}
            disabled={!currentFilters}
          >
            Save Current Search
          </Button>
        </Card>
      )}

      {savedQueries.length > 0 && (
        <List sx={{ p: 0 }}>
          {savedQueries.map((query) => (
            <Card key={query.id} sx={{ mb: 1 }}>
              <ListItem
                sx={{ p: 0 }}
                onContextMenu={(e) => handleContextMenu(e, query)}
              >
                <CardContent sx={{ flex: 1, p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack spacing={1.5}>
                    {/* Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {query.name}
                          </Typography>
                          
                          {query.is_global ? (
                            <Tooltip title="Global search - available to all team members">
                              <PublicIcon fontSize="small" color="primary" />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Personal search">
                              <PrivateIcon fontSize="small" color="action" />
                            </Tooltip>
                          )}
                          
                          {query.usage_count > 0 && (
                            <Badge badgeContent={query.usage_count} color="primary" max={99}>
                              <StarIcon fontSize="small" color="action" />
                            </Badge>
                          )}
                        </Stack>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatFiltersPreview(query.query_filters)}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Run search">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleRunQuery(query)}
                          >
                            <RunIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <IconButton
                          size="small"
                          onClick={(e) => handleContextMenu(e, query)}
                        >
                          <MoreIcon />
                        </IconButton>
                      </Stack>
                    </Stack>

                    {/* Filter chips */}
                    {getFilterChips(query.query_filters).length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {getFilterChips(query.query_filters)}
                      </Stack>
                    )}

                    {/* Footer */}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mt: 1 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        <ScheduleIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        Last used {formatDistanceToNow(new Date(query.last_used_at), { addSuffix: true })}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">
                        Created {formatDistanceToNow(new Date(query.created_at), { addSuffix: true })}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingQuery ? 'Edit Saved Search' : 'Save Search Query'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Search Name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              fullWidth
              required
              helperText="Give your search a descriptive name"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={saveAsGlobal}
                  onChange={(e) => setSaveAsGlobal(e.target.checked)}
                />
              }
              label="Make this search available to all team members"
            />

            {currentFilters && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Search preview:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', p: 1, backgroundColor: 'action.hover', borderRadius: 1 }}>
                  {formatFiltersPreview(currentFilters)}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveQuery}
            variant="contained"
            disabled={!saveName.trim()}
          >
            {editingQuery ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleContextMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => {
          if (contextQuery) handleRunQuery(contextQuery);
          handleContextMenuClose();
        }}>
          <ListItemIcon>
            <RunIcon />
          </ListItemIcon>
          <ListItemText>Run Search</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (contextQuery) handleEditQuery(contextQuery);
          handleContextMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          // Copy search to clipboard
          if (contextQuery) {
            navigator.clipboard.writeText(JSON.stringify(contextQuery.query_filters, null, 2));
          }
          handleContextMenuClose();
        }}>
          <ListItemIcon>
            <CopyIcon />
          </ListItemIcon>
          <ListItemText>Copy Filters</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => {
            if (contextQuery) handleDeleteQuery(contextQuery.id);
            handleContextMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SavedSearchQueries;
/**
 * ExhibitManager - Professional exhibit management component for legal case navigation
 * 
 * Features:
 * - Professional exhibit list organized by exhibit ID (1A, 2B, etc.)
 * - File-to-exhibit mapping with drag & drop support
 * - Auto-detection of exhibit IDs from filenames
 * - Quick citation insertion into editor
 * - Exhibit metadata management
 * - Visual indicators for key evidence and file types
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Folder as ExhibitIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Link as LinkIcon,
  FileCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AutoDetectIcon,
  PlayArrow as InsertIcon,
} from '@mui/icons-material';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import useAppStore from '../../store';
import { Exhibit, File } from '../../types';
import { INSERT_CITATION_COMMAND } from '../editor/CitationNode';

interface ExhibitManagerProps {
  projectId: string;
  onExhibitClick?: (exhibitId: string) => void;
  onCitationInsert?: (exhibitId: string, page?: number) => void;
}

const ExhibitManager: React.FC<ExhibitManagerProps> = ({
  projectId,
  onExhibitClick,
  onCitationInsert,
}) => {
  // Store state
  const allExhibits = useAppStore(state => state.exhibits);
  const allFiles = useAppStore(state => state.files);
  
  // Filter outside of selector to prevent infinite loops
  const exhibits = React.useMemo(() => 
    allExhibits.filter(e => e.project_id === projectId), 
    [allExhibits, projectId]
  );
  const files = React.useMemo(() => 
    allFiles.filter(f => f.project_id === projectId), 
    [allFiles, projectId]
  );
  const selectedExhibitId = useAppStore(state => state.selectedExhibitId);
  const setSelectedExhibit = useAppStore(state => state.setSelectedExhibit);
  const addExhibit = useAppStore(state => state.addExhibit);
  const updateExhibit = useAppStore(state => state.updateExhibit);
  const deleteExhibit = useAppStore(state => state.deleteExhibit);
  const createExhibitFromFile = useAppStore(state => state.createExhibitFromFile);
  const assignFileToExhibit = useAppStore(state => state.assignFileToExhibit);
  const detectExhibitIdFromFilename = useAppStore(state => state.detectExhibitIdFromFilename);
  const getNextExhibitId = useAppStore(state => state.getNextExhibitId);
  const getFilesByExhibit = useAppStore(state => state.getFilesByExhibit);
  const navigateToExhibit = useAppStore(state => state.navigateToExhibit);

  // Local state
  const [newExhibitDialog, setNewExhibitDialog] = useState(false);
  const [editExhibitDialog, setEditExhibitDialog] = useState<Exhibit | null>(null);
  const [newExhibitData, setNewExhibitData] = useState({
    exhibit_id: '',
    title: '',
    description: '',
    exhibit_type: 'document' as const,
    is_key_evidence: false,
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExhibitForMenu, setSelectedExhibitForMenu] = useState<string | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  
  // Auto-detect exhibits from uploaded files
  const autoDetectExhibits = useCallback(async () => {
    setIsAutoDetecting(true);
    let detectedCount = 0;
    
    // Find files without exhibit assignments
    const unassignedFiles = files.filter(file => 
      !file.exhibit_id && 
      !exhibits.some(ex => ex.files.some(ef => ef.file_id === file.id))
    );
    
    for (const file of unassignedFiles) {
      const detectedId = detectExhibitIdFromFilename(file.name);
      if (detectedId) {
        // Check if exhibit already exists
        let exhibit = exhibits.find(e => e.exhibit_id === detectedId);
        
        if (!exhibit) {
          // Create new exhibit
          await createExhibitFromFile(file.id, detectedId, `Exhibit ${detectedId}`);
          detectedCount++;
        } else {
          // Assign file to existing exhibit
          assignFileToExhibit(file.id, detectedId, !exhibit.files.length);
          detectedCount++;
        }
      }
    }
    
    setIsAutoDetecting(false);
    
    if (detectedCount > 0) {
      // Show success message (could use notification system)
      console.log(`Auto-detected ${detectedCount} exhibit assignments`);
    }
  }, [files, exhibits, detectExhibitIdFromFilename, createExhibitFromFile, assignFileToExhibit]);

  // Get icon for exhibit type
  const getExhibitTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <ImageIcon />;
      case 'video': return <VideoIcon />;
      case 'audio': return <AudioIcon />;
      case 'document':
      default: return <DocumentIcon />;
    }
  };

  // Handle exhibit selection
  const handleExhibitClick = (exhibit: Exhibit) => {
    setSelectedExhibit(exhibit.id);
    navigateToExhibit(exhibit.exhibit_id, 'exhibit_list');
    onExhibitClick?.(exhibit.exhibit_id);
  };

  // Handle citation insertion
  const handleInsertCitation = (exhibitId: string, page?: number) => {
    const citationReference = page ? `${exhibitId}:${page}` : exhibitId;
    
    // Call the callback if provided
    onCitationInsert?.(exhibitId, page);
    
    // Also dispatch the INSERT_CITATION_COMMAND if we have access to the editor context
    // This will be handled by the parent component that has the editor context
    console.log('Requesting citation insertion:', citationReference);
  };

  // Handle new exhibit creation
  const handleCreateExhibit = () => {
    if (!newExhibitData.exhibit_id || !newExhibitData.title) return;
    
    const newExhibit: Exhibit = {
      id: crypto.randomUUID(),
      exhibit_id: newExhibitData.exhibit_id.toUpperCase(),
      project_id: projectId,
      title: newExhibitData.title,
      description: newExhibitData.description,
      exhibit_type: newExhibitData.exhibit_type,
      is_key_evidence: newExhibitData.is_key_evidence,
      files: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: '', // Would be set from auth context
    };
    
    addExhibit(newExhibit);
    setNewExhibitDialog(false);
    setNewExhibitData({
      exhibit_id: '',
      title: '',
      description: '',
      exhibit_type: 'document',
      is_key_evidence: false,
    });
  };

  // Handle exhibit menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, exhibitId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedExhibitForMenu(exhibitId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedExhibitForMenu(null);
  };

  // Toggle key evidence status
  const handleToggleKeyEvidence = (exhibit: Exhibit) => {
    updateExhibit(exhibit.id, { is_key_evidence: !exhibit.is_key_evidence });
    handleMenuClose();
  };

  // Delete exhibit
  const handleDeleteExhibit = (exhibitId: string) => {
    deleteExhibit(exhibitId);
    handleMenuClose();
  };

  // Sort exhibits by exhibit ID
  const sortedExhibits = [...exhibits].sort((a, b) => {
    // Extract number and letter parts for proper sorting
    const parseId = (id: string) => {
      const match = id.match(/^(\d+)([A-Z])$/);
      return match ? [parseInt(match[1], 10), match[2]] : [0, id];
    };
    
    const [aNum, aLetter] = parseId(a.exhibit_id);
    const [bNum, bLetter] = parseId(b.exhibit_id);
    
    if (aNum !== bNum) return aNum - bNum;
    return aLetter.localeCompare(bLetter);
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Exhibits
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Auto-detect exhibits from filenames">
              <IconButton
                size="small"
                onClick={autoDetectExhibits}
                disabled={isAutoDetecting}
                sx={{ color: 'primary.main' }}
              >
                {isAutoDetecting ? <CircularProgress size={16} /> : <AutoDetectIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Create new exhibit">
              <IconButton
                size="small"
                onClick={() => {
                  setNewExhibitData(prev => ({ ...prev, exhibit_id: getNextExhibitId() }));
                  setNewExhibitDialog(true);
                }}
                sx={{ color: 'primary.main' }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {exhibits.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {exhibits.length} exhibit{exhibits.length !== 1 ? 's' : ''} • 
            {exhibits.filter(e => e.is_key_evidence).length} key evidence
          </Typography>
        )}
      </Box>

      {/* Exhibit List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {sortedExhibits.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <ExhibitIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" paragraph>
              No exhibits yet. Upload files or create exhibits manually.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setNewExhibitDialog(true)}
              size="small"
            >
              Create First Exhibit
            </Button>
          </Box>
        ) : (
          <List dense>
            {sortedExhibits.map((exhibit) => {
              const exhibitFiles = getFilesByExhibit(exhibit.exhibit_id);
              const isSelected = selectedExhibitId === exhibit.id;
              
              return (
                <ListItem key={exhibit.id} disablePadding>
                  <Accordion
                    expanded={isSelected}
                    onChange={() => handleExhibitClick(exhibit)}
                    sx={{ 
                      width: '100%', 
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        minHeight: 'unset',
                        '& .MuiAccordionSummary-content': {
                          margin: '8px 0',
                          alignItems: 'center',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {exhibit.is_key_evidence ? (
                            <Badge color="error" variant="dot">
                              {getExhibitTypeIcon(exhibit.exhibit_type)}
                            </Badge>
                          ) : (
                            getExhibitTypeIcon(exhibit.exhibit_type)
                          )}
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={exhibit.exhibit_id}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  minWidth: 40,
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {exhibit.title}
                              </Typography>
                              {exhibit.is_key_evidence && (
                                <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {exhibitFiles.length} file{exhibitFiles.length !== 1 ? 's' : ''}
                              {exhibit.description && ` • ${exhibit.description}`}
                            </Typography>
                          }
                          sx={{ m: 0 }}
                        />
                        
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, exhibit.id)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Stack spacing={1}>
                        {/* File List */}
                        {exhibitFiles.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                              Files:
                            </Typography>
                            {exhibitFiles.map((file) => (
                              <Box
                                key={file.id}
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  p: 0.5,
                                  borderRadius: 1,
                                  bgcolor: 'action.hover',
                                  mb: 0.5,
                                }}
                              >
                                <Typography variant="caption" sx={{ flex: 1 }}>
                                  {file.name}
                                </Typography>
                                <Tooltip title="Insert citation">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleInsertCitation(exhibit.exhibit_id)}
                                  >
                                    <InsertIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ))}
                          </Box>
                        )}
                        
                        {/* Quick Actions */}
                        <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                          <Button
                            size="small"
                            startIcon={<CopyIcon />}
                            onClick={() => handleInsertCitation(exhibit.exhibit_id)}
                            variant="outlined"
                          >
                            Insert [{exhibit.exhibit_id}]
                          </Button>
                          <Button
                            size="small"
                            startIcon={<LinkIcon />}
                            onClick={() => navigateToExhibit(exhibit.exhibit_id, 'exhibit_list')}
                            variant="text"
                          >
                            View
                          </Button>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {selectedExhibitForMenu && (() => {
          const exhibit = exhibits.find(e => e.id === selectedExhibitForMenu);
          if (!exhibit) return null;
          
          return [
            <MenuItem key="toggle-key" onClick={() => handleToggleKeyEvidence(exhibit)}>
              {exhibit.is_key_evidence ? <StarBorderIcon sx={{ mr: 1 }} /> : <StarIcon sx={{ mr: 1 }} />}
              {exhibit.is_key_evidence ? 'Remove Key Evidence' : 'Mark as Key Evidence'}
            </MenuItem>,
            <MenuItem key="edit" onClick={() => {
              setEditExhibitDialog(exhibit);
              handleMenuClose();
            }}>
              <EditIcon sx={{ mr: 1 }} />
              Edit Exhibit
            </MenuItem>,
            <MenuItem key="delete" onClick={() => handleDeleteExhibit(exhibit.id)} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Delete Exhibit
            </MenuItem>
          ];
        })()}
      </Menu>

      {/* New Exhibit Dialog */}
      <Dialog
        open={newExhibitDialog}
        onClose={() => setNewExhibitDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Exhibit</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Exhibit ID"
              value={newExhibitData.exhibit_id}
              onChange={(e) => setNewExhibitData(prev => ({ ...prev, exhibit_id: e.target.value.toUpperCase() }))}
              placeholder="1A, 2B, 15C..."
              helperText="Auto-generated or enter custom ID"
              size="small"
              fullWidth
            />
            <TextField
              label="Title"
              value={newExhibitData.title}
              onChange={(e) => setNewExhibitData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the exhibit"
              size="small"
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newExhibitData.description}
              onChange={(e) => setNewExhibitData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
              size="small"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewExhibitDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateExhibit}
            variant="contained"
            disabled={!newExhibitData.exhibit_id || !newExhibitData.title}
          >
            Create Exhibit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExhibitManager;
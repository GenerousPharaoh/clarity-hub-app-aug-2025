/**
 * CitationToolbarPlugin - Toolbar integration for citation insertion
 * 
 * Features:
 * - Modal dialog for citation insertion
 * - Auto-completion for existing exhibits
 * - Validation for proper format
 * - Integration with file system for exhibit discovery
 */
import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Box,
  Typography,
  FormHelperText,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  LinkOutlined,
  Close,
  Add
} from '@mui/icons-material';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import { INSERT_CITATION_COMMAND, CitationPayload } from './CitationNode';
import useAppStore from '../../store';

interface CitationToolbarPluginProps {
  className?: string;
}

interface ExhibitOption {
  letter: string;
  label: string;
  fileId?: string;
  fileName?: string;
}

const CitationToolbarPlugin: React.FC<CitationToolbarPluginProps> = ({ className }) => {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [exhibitLetter, setExhibitLetter] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const files = useAppStore(state => state.files);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);

  // Extract exhibit letters from existing files
  const availableExhibits: ExhibitOption[] = React.useMemo(() => {
    const projectFiles = files.filter(f => f.project_id === selectedProjectId);
    const exhibits: ExhibitOption[] = [];
    
    projectFiles.forEach(file => {
      // Extract exhibit letters from filenames like "1-A:", "2-B:", etc.
      const exhibitMatch = file.name.match(/^(\d+)-([A-Z]):/);
      if (exhibitMatch) {
        const [, number, letter] = exhibitMatch;
        exhibits.push({
          letter: `${number}${letter}`,
          label: `${number}${letter}: ${file.name.replace(/^\d+-[A-Z]:\s*/, '')}`,
          fileId: file.id,
          fileName: file.name
        });
      }
    });

    return exhibits.sort((a, b) => {
      const aNum = parseInt(a.letter);
      const bNum = parseInt(b.letter);
      if (aNum !== bNum) return aNum - bNum;
      return a.letter.localeCompare(b.letter);
    });
  }, [files, selectedProjectId]);

  const handleOpen = () => {
    setIsOpen(true);
    setExhibitLetter('');
    setPageNumber('');
    setDescription('');
    setErrors({});
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validate exhibit letter format (number + letter, e.g., "1A", "25C")
    if (!exhibitLetter) {
      newErrors.exhibitLetter = 'Exhibit letter is required';
    } else if (!/^\d+[A-Z]$/.test(exhibitLetter)) {
      newErrors.exhibitLetter = 'Format should be like "1A", "2B", "15C"';
    }

    // Validate page number (should be a positive number)
    if (!pageNumber) {
      newErrors.pageNumber = 'Page number is required';
    } else if (!/^\d+$/.test(pageNumber) || parseInt(pageNumber) < 1) {
      newErrors.pageNumber = 'Page number must be a positive integer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInsert = () => {
    if (!validateForm()) return;

    const selectedExhibit = availableExhibits.find(e => e.letter === exhibitLetter);
    
    const payload: CitationPayload = {
      exhibitLetter: exhibitLetter.slice(0, -1), // Remove the letter part for storage
      pageNumber,
      description: description || undefined,
      fileId: selectedExhibit?.fileId
    };

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        editor.dispatchCommand(INSERT_CITATION_COMMAND, payload);
      }
    });

    handleClose();
  };

  const handleExhibitChange = (_: any, value: ExhibitOption | string | null) => {
    if (typeof value === 'string') {
      setExhibitLetter(value);
    } else if (value) {
      setExhibitLetter(value.letter);
    } else {
      setExhibitLetter('');
    }
  };

  return (
    <>
      <Tooltip title="Insert Citation ([1A], [2B], etc.)">
        <IconButton 
          size="small" 
          onClick={handleOpen}
          className={className}
          sx={{
            color: '#2563eb',
            '&:hover': {
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
            }
          }}
        >
          <LinkOutlined fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog 
        open={isOpen} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkOutlined color="primary" />
            <Typography variant="h6">Insert Citation</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Create a clickable citation token like [1A], [2B], [15C]
              </Typography>
            </Box>

            <Autocomplete
              options={availableExhibits}
              getOptionLabel={(option) => 
                typeof option === 'string' ? option : option.label || option.letter
              }
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight="600">
                      [{option.letter}]
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.fileName}
                    </Typography>
                  </Box>
                </Box>
              )}
              freeSolo
              value={availableExhibits.find(e => e.letter === exhibitLetter) || exhibitLetter}
              onChange={handleExhibitChange}
              onInputChange={(_, value) => setExhibitLetter(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Exhibit"
                  placeholder="e.g., 1A, 2B, 15C"
                  error={!!errors.exhibitLetter}
                  helperText={errors.exhibitLetter || 'Enter exhibit number and letter (e.g., 1A)'}
                  fullWidth
                />
              )}
            />

            <TextField
              label="Page Number"
              type="number"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              error={!!errors.pageNumber}
              helperText={errors.pageNumber || 'Page number within the exhibit'}
              fullWidth
              InputProps={{
                inputProps: { min: 1 }
              }}
            />

            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText="Optional description for the citation"
              fullWidth
              multiline
              rows={2}
            />

            <Box 
              sx={{ 
                p: 2, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 1,
                border: '1px solid #e5e7eb'
              }}
            >
              <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
                Preview:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #2563eb',
                    borderRadius: '4px',
                    color: '#1565c0',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    fontFamily: 'monospace',
                  }}
                >
                  [{exhibitLetter}]
                </Box>
                {description && (
                  <Typography variant="body2" color="text.secondary">
                    {description}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleInsert} 
            variant="contained"
            startIcon={<Add />}
            disabled={!exhibitLetter || !pageNumber}
            sx={{
              backgroundColor: '#2563eb',
              '&:hover': {
                backgroundColor: '#1d4ed8',
              }
            }}
          >
            Insert Citation
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CitationToolbarPlugin;
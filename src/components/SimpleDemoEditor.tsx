import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  Button,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Save,
  Link,
  Image,
  Code,
  TextFields,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  TableChart,
} from '@mui/icons-material';
import useAppStore from '../store';

interface SimpleDemoEditorProps {
  className?: string;
}

const SimpleDemoEditor: React.FC<SimpleDemoEditorProps> = ({ className }) => {
  const [content, setContent] = useState<string>(
    `# Case Summary
  
## Background
This case involves a contract dispute between Acme Corporation and Widget Industries. The contract, signed on January 15, 2023, outlined terms for the delivery of specialized manufacturing components.

## Key Issues
1. Delayed delivery of critical components
2. Quality discrepancies in delivered items
3. Disputed interpretation of force majeure clause

## Evidence Analysis
The photographic evidence (Exhibit 1-B) clearly shows manufacturing defects in the delivered components. Additionally, the client contract (Exhibit 1-A) explicitly states delivery timelines that were not met.

### Witness Statement
According to the witness statement (Exhibit 1-C), the manufacturing process was interrupted by equipment failures, but notification procedures outlined in section 8.3 of the contract were not followed.

## Legal Strategy
Our approach will focus on three primary arguments:
- Breach of contract for missed delivery dates
- Failure to meet quality specifications
- Improper invocation of force majeure provisions

The interview recording (Exhibit 1-D) provides additional context about the manufacturing delays and internal communications that occurred.
`);

  const [isSaving, setIsSaving] = useState(false);

  // Get selectedProjectId to check if we have an active project
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const selectedFileId = useAppStore(state => state.selectedFileId);
  
  // Mock saving action
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Editor Toolbar */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          p: 1,
          gap: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          <Tooltip title="Text Style">
            <Box sx={{ position: 'relative' }}>
              <IconButton size="small">
                <TextFields fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Bold">
            <IconButton size="small">
              <FormatBold fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton size="small">
              <FormatItalic fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton size="small">
              <FormatUnderlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Align Left">
            <IconButton size="small">
              <FormatAlignLeft fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Center">
            <IconButton size="small">
              <FormatAlignCenter fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Right">
            <IconButton size="small">
              <FormatAlignRight fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Bulleted List">
            <IconButton size="small">
              <FormatListBulleted fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton size="small">
              <FormatListNumbered fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Insert Link">
            <IconButton size="small">
              <Link fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Image">
            <IconButton size="small">
              <Image fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Table">
            <IconButton size="small">
              <TableChart fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Code">
            <IconButton size="small">
              <Code fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={isSaving || !selectedProjectId}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Paper>

      {/* Editor Content */}
      {!selectedProjectId ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            height: '100%',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" gutterBottom>
            No Project Selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please select a project from the left panel to start editing.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 3,
            bgcolor: 'background.default',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              maxWidth: 800,
              mx: 'auto',
              minHeight: '100%',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <TextField
              fullWidth
              multiline
              variant="standard"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: 'text.primary',
                  '& textarea': {
                    resize: 'none',
                    lineHeight: 1.6,
                  },
                },
              }}
              sx={{ 
                '& .MuiInputBase-root': { 
                  p: 0 
                } 
              }}
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default SimpleDemoEditor;
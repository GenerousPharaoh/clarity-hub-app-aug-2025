import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Alert,
  Snackbar,
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
  Undo,
  Redo,
} from '@mui/icons-material';
import useAppStore from '../store';

interface FunctionalEditorProps {
  className?: string;
}

const FunctionalEditor: React.FC<FunctionalEditorProps> = ({ className }) => {
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const selectedFileId = useAppStore(state => state.selectedFileId);
  const files = useAppStore(state => state.files);
  const updateFile = useAppStore(state => state.updateFile);
  const projects = useAppStore(state => state.projects);
  
  const [content, setContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Get selected file data
  const selectedFile = selectedFileId ? files.find(f => f.id === selectedFileId) : null;
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  // Load content when file changes
  useEffect(() => {
    if (selectedFile && selectedFile.metadata?.content) {
      setContent(selectedFile.metadata.content);
      setHistory([selectedFile.metadata.content]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
    } else if (selectedFile) {
      // If file has no content yet, create default content
      const defaultContent = `# ${selectedFile.name}

## Notes

Start typing your notes here...

---
Created: ${new Date().toLocaleDateString()}
`;
      setContent(defaultContent);
      setHistory([defaultContent]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
    } else if (!selectedFile && selectedProject) {
      // Show project overview if no file is selected
      const projectContent = `# ${selectedProject.name}

${selectedProject.description || 'No description available'}

## Project Files
${files.filter(f => f.project_id === selectedProjectId).length} file(s) in this project

Select a file from the left panel to edit it, or create a new document.

---
Created: ${new Date(selectedProject.created_at).toLocaleDateString()}
`;
      setContent(projectContent);
      setHistory([projectContent]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
    } else {
      // Default welcome content
      const welcomeContent = `# Welcome to Clarity Hub Editor

## Getting Started

1. Create or select a project from the left panel
2. Upload files or create new documents
3. Start editing and organizing your content

## Features

- **Rich Text Editing**: Format your text with bold, italic, lists, and more
- **Auto-Save**: Your content is automatically saved as you type
- **Version History**: Track changes and revert to previous versions
- **File Organization**: Keep all your project files organized in one place

---
Select a project to begin
`;
      setContent(welcomeContent);
      setHistory([welcomeContent]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
    }
  }, [selectedFile, selectedProject, selectedProjectId, files]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    
    // Add to history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Save content
  const handleSave = async () => {
    if (!selectedFileId || !selectedFile) {
      setShowSaveNotification(false);
      setTimeout(() => setShowSaveNotification(true), 100);
      return;
    }
    
    setIsSaving(true);
    
    // Update file metadata with content
    updateFile(selectedFileId, {
      metadata: {
        ...selectedFile.metadata,
        content,
        lastModified: new Date().toISOString(),
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
      }
    });
    
    // Simulate save delay
    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      setShowSaveNotification(true);
    }, 500);
  };

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (hasUnsavedChanges && selectedFileId) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [content, hasUnsavedChanges, selectedFileId]);

  // Undo/Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  // Insert formatting
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end);
    
    handleContentChange(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
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
          alignItems: 'center',
        }}
      >
        {/* Text Formatting */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Bold (Ctrl+B)">
            <IconButton size="small" onClick={() => insertFormatting('**', '**')}>
              <FormatBold fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic (Ctrl+I)">
            <IconButton size="small" onClick={() => insertFormatting('*', '*')}>
              <FormatItalic fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton size="small" onClick={() => insertFormatting('<u>', '</u>')}>
              <FormatUnderlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Code">
            <IconButton size="small" onClick={() => insertFormatting('`', '`')}>
              <Code fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        {/* Lists */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Bullet List">
            <IconButton size="small" onClick={() => insertFormatting('- ')}>
              <FormatListBulleted fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton size="small" onClick={() => insertFormatting('1. ')}>
              <FormatListNumbered fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        {/* Headers */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Heading 1">
            <IconButton size="small" onClick={() => insertFormatting('# ')}>
              <TextFields fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Heading 2">
            <IconButton size="small" onClick={() => insertFormatting('## ')}>
              <TextFields fontSize="small" style={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        {/* Undo/Redo */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Undo">
            <IconButton 
              size="small" 
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo">
            <IconButton 
              size="small" 
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ flex: 1 }} />
        
        {/* Status and Save */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasUnsavedChanges && (
            <Typography variant="caption" color="text.secondary">
              Unsaved changes
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!selectedFileId || isSaving || !hasUnsavedChanges}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Paper>

      {/* Editor Content Area */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <TextField
          id="editor-textarea"
          multiline
          fullWidth
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start typing..."
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '16px',
              lineHeight: 1.6,
              fontFamily: 'monospace',
            }
          }}
          sx={{
            height: '100%',
            '& .MuiInputBase-root': {
              height: '100%',
              alignItems: 'flex-start',
              p: 3,
              overflow: 'auto',
            },
            '& textarea': {
              height: '100% !important',
              overflow: 'auto !important',
            }
          }}
        />
      </Box>

      {/* Status Bar */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.default',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {selectedFile ? selectedFile.name : selectedProject ? selectedProject.name : 'No file selected'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {content.split(/\s+/).filter(w => w).length} words • {content.length} characters
        </Typography>
      </Paper>

      {/* Save Notification */}
      <Snackbar
        open={showSaveNotification}
        autoHideDuration={2000}
        onClose={() => setShowSaveNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSaveNotification(false)} 
          severity={selectedFileId ? "success" : "info"}
          sx={{ width: '100%' }}
        >
          {selectedFileId ? 'Content saved successfully!' : 'Select a file to save your work'}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FunctionalEditor;
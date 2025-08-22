import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ButtonGroup,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Save,
  Print,
  Fullscreen,
  FullscreenExit,
  FindReplace,
  Description,
  GetApp,
  MenuBook,
  Settings,
  Close,
  CloudDone,
  InsertDriveFile,
  PictureAsPdf,
  Archive,
} from '@mui/icons-material';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';
import { useTheme } from '@mui/material/styles';
import '../../theme/tinymce-custom.css';
import { DocumentExporter } from './EditorExportUtils';

interface RichDocumentEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  onExport?: (format: 'pdf' | 'docx' | 'html') => void;
  exhibits?: Array<{ id: string; tag: string; name: string }>;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  height?: string | number;
  placeholder?: string;
  documentTitle?: string;
}

const RichDocumentEditor: React.FC<RichDocumentEditorProps> = ({
  initialContent = '',
  onChange,
  onSave,
  onExport,
  exhibits = [],
  readOnly = false,
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  height = '600px',
  placeholder = 'Start writing your professional document...',
  documentTitle = 'Document',
}) => {
  const editorRef = useRef<any>(null);
  const theme = useTheme();
  
  const [content, setContent] = useState(initialContent);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveNotification, setSaveNotification] = useState('');
  const [editorSettings, setEditorSettings] = useState({
    spellcheck: true,
    darkMode: false,
    autoSave,
    showWordCount: true,
    enableCollaboration: false,
  });

  // TinyMCE configuration
  const editorConfig = React.useMemo(() => ({
    height: isFullscreen ? 'calc(100vh - 200px)' : height,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'autosave',
      'save', 'directionality', 'emoticons', 'template', 'paste',
      'textcolor', 'colorpicker', 'textpattern', 'codesample', 'toc',
      'hr', 'pagebreak', 'nonbreaking', 'quickbars'
    ],
    toolbar: [
      'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks',
      'forecolor backcolor | alignleft aligncenter alignright alignjustify',
      'bullist numlist checklist outdent indent | link image media table',
      'code codesample hr pagebreak | searchreplace fullscreen help'
    ].join(' | '),
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
    quickbars_insert_toolbar: 'quickimage quicktable media codesample',
    contextmenu: 'link image table',
    
    // Content styling
    content_style: `
      body {
        font-family: ${theme.typography.fontFamily};
        font-size: 16px;
        line-height: 1.6;
        color: ${theme.palette.text.primary};
        background-color: ${theme.palette.background.paper};
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 60px;
      }
      h1, h2, h3, h4, h5, h6 {
        font-weight: 600;
        margin-top: 2em;
        margin-bottom: 1em;
        color: ${theme.palette.text.primary};
      }
      h1 { font-size: 2.5em; }
      h2 { font-size: 2em; }
      h3 { font-size: 1.5em; }
      h4 { font-size: 1.25em; }
      h5 { font-size: 1.1em; }
      h6 { font-size: 1em; }
      p { margin-bottom: 1.2em; }
      blockquote {
        border-left: 4px solid ${theme.palette.primary.main};
        padding-left: 1.5em;
        margin: 1.5em 0;
        font-style: italic;
        color: ${theme.palette.text.secondary};
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1.5em 0;
      }
      table td, table th {
        border: 1px solid ${theme.palette.divider};
        padding: 0.75em;
      }
      table th {
        background-color: ${theme.palette.action.hover};
        font-weight: 600;
      }
      pre {
        background-color: ${theme.palette.action.hover};
        border: 1px solid ${theme.palette.divider};
        border-radius: 4px;
        padding: 1em;
        overflow-x: auto;
      }
      code {
        background-color: ${theme.palette.action.hover};
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'Monaco', 'Consolas', monospace;
      }
    `,
    
    // Professional fonts
    font_family_formats: [
      'Inter=Inter, system-ui, sans-serif',
      'Arial=Arial, Helvetica, sans-serif',
      'Times New Roman=Times New Roman, Times, serif',
      'Courier New=Courier New, Courier, monospace',
      'Georgia=Georgia, serif',
      'Verdana=Verdana, Geneva, sans-serif'
    ],
    
    // Font sizes
    fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 24pt 30pt 36pt 48pt 60pt 72pt 96pt',
    
    // Advanced features
    autosave_ask_before_unload: false,
    autosave_interval: autoSaveInterval / 1000 + 's',
    autosave_retention: '30m',
    
    // Paste options
    paste_as_text: false,
    paste_auto_cleanup_on_paste: true,
    paste_remove_styles_if_webkit: true,
    
    // Accessibility
    a11y_advanced_options: true,
    
    // Link options
    link_default_target: '_blank',
    link_default_protocol: 'https',
    
    // Image options
    image_advtab: true,
    image_caption: true,
    
    // Table options
    table_default_attributes: {
      border: '1'
    },
    table_default_styles: {
      'border-collapse': 'collapse'
    },
    
    // Custom setup
    setup: (editor: any) => {
      // Word count tracking
      editor.on('NodeChange KeyUp', () => {
        const wordcount = editor.plugins.wordcount;
        if (wordcount) {
          setWordCount(wordcount.getCount());
          setCharCount(wordcount.getCharacterCount());
        }
      });
      
      // Content change tracking
      editor.on('Change', () => {
        setIsDirty(true);
      });
      
      // Auto-save
      if (autoSave) {
        editor.on('AutoSave', () => {
          handleSave();
        });
      }
    }
  }), [theme, height, isFullscreen, autoSaveInterval, autoSave]);

  // Handle content change
  const handleChange = useCallback((value: string, editor: any) => {
    if (!isMounted) return;
    
    setContent(value);
    setIsDirty(true);
    
    // Update counts using both TinyMCE and our utility
    const wordcount = editor.plugins?.wordcount;
    if (wordcount) {
      setWordCount(wordcount.getCount());
      setCharCount(wordcount.getCharacterCount());
    } else {
      // Fallback to our own counting
      const stats = DocumentExporter.getDocumentStats(value);
      setWordCount(stats.wordCount);
      setCharCount(stats.characterCount);
    }
    
    if (onChange) {
      onChange(value);
    }
  }, [onChange, isMounted]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave || !isDirty) return;
    
    setIsSaving(true);
    try {
      await onSave(content);
      setLastSaved(new Date());
      setIsDirty(false);
      setSaveNotification('Document saved successfully!');
    } catch (error) {
      setSaveNotification('Failed to save document. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, onSave, isDirty]);
  
  // Handle export
  const handleExport = useCallback(async (format: 'pdf' | 'docx' | 'html') => {
    try {
      const exportOptions = {
        title: documentTitle,
        author: 'Clarity Hub User',
        subject: 'Professional Document',
        includeMetadata: true,
      };
      
      switch (format) {
        case 'pdf':
          await DocumentExporter.exportAsPDF(content, exportOptions);
          break;
        case 'html':
          DocumentExporter.exportAsHTML(content, exportOptions);
          break;
        case 'docx':
          DocumentExporter.exportAsDOCX(content, exportOptions);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      setShowExportDialog(false);
      setSaveNotification(`Document exported as ${format.toUpperCase()} successfully!`);
      
      // Also call the parent callback if provided
      if (onExport) {
        onExport(format);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setSaveNotification(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    }
  }, [content, documentTitle, onExport]);
  
  // Handle print
  const handlePrint = useCallback(() => {
    if (editorRef.current) {
      const editor = editorRef.current.getEditor();
      const printContent = editor.getContent();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${documentTitle}</title>
              <style>
                body {
                  font-family: ${theme.typography.fontFamily};
                  font-size: 16px;
                  line-height: 1.6;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 40px;
                }
                @media print {
                  body { padding: 20px; }
                }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }, [documentTitle, theme]);
  
  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);
  
  // Insert exhibit citation
  const insertExhibit = useCallback((exhibit: { id: string; tag: string; name: string }) => {
    if (editorRef.current) {
      const editor = editorRef.current.getEditor();
      const citationHTML = `<span style="color: ${theme.palette.primary.main}; font-weight: bold; background-color: ${theme.palette.primary.light}20; padding: 2px 6px; border-radius: 3px; border: 1px solid ${theme.palette.primary.light};">[${exhibit.tag}]</span>`;
      editor.insertContent(citationHTML);
    }
  }, [theme]);

  // Component mounting effect
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (editorSettings.autoSave && onSave && isMounted && isDirty) {
      const timeout = setTimeout(() => {
        handleSave();
      }, autoSaveInterval);
      
      return () => clearTimeout(timeout);
    }
  }, [editorSettings.autoSave, isDirty, handleSave, onSave, isMounted, autoSaveInterval]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    
    if (isMounted) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMounted, handleSave, toggleFullscreen]);


  // Professional toolbar component
  const ProfessionalToolbar = () => (
    <Paper
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        position: isFullscreen ? 'fixed' : 'sticky',
        top: 0,
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 10,
      }}
    >
      <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {/* Document actions */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Save (Ctrl+S)">
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </Tooltip>
          <Tooltip title="Print">
            <Button onClick={handlePrint} startIcon={<Print />}>
              Print
            </Button>
          </Tooltip>
          <Tooltip title="Export">
            <Button onClick={() => setShowExportDialog(true)} startIcon={<GetApp />}>
              Export
            </Button>
          </Tooltip>
        </ButtonGroup>
        
        <Divider orientation="vertical" flexItem />
        
        {/* Citations */}
        {exhibits.length > 0 && (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<MenuBook />}
              onClick={() => {
                // Show citation menu - simplified for demo
                if (exhibits[0]) insertExhibit(exhibits[0]);
              }}
            >
              Insert Citation ({exhibits.length})
            </Button>
            <Divider orientation="vertical" flexItem />
          </>
        )}
        
        {/* View options */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Find & Replace (Ctrl+F)">
            <Button onClick={() => setShowFindReplace(true)} startIcon={<FindReplace />}>
              Find
            </Button>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}>
            <Button onClick={toggleFullscreen} startIcon={isFullscreen ? <FullscreenExit /> : <Fullscreen />}>
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </Button>
          </Tooltip>
          <Tooltip title="Settings">
            <Button onClick={() => setShowSettings(true)} startIcon={<Settings />}>
              Settings
            </Button>
          </Tooltip>
        </ButtonGroup>
        
        {/* Status indicators */}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
          {isDirty && (
            <Chip
              label="Unsaved changes"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          {editorSettings.autoSave && (
            <Chip
              label={<><CloudDone sx={{ fontSize: 14, mr: 0.5 }} />Auto-save</>}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      
      {/* Status bar */}
      <Box
        sx={{
          px: 3,
          py: 1,
          backgroundColor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" fontWeight={500}>
          {documentTitle}
        </Typography>
        
        <Divider orientation="vertical" flexItem />
        
        {editorSettings.showWordCount && (
          <>
            <Typography variant="caption" color="text.secondary">
              {wordCount.toLocaleString()} words
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {charCount.toLocaleString()} characters
            </Typography>
          </>
        )}
        
        {lastSaved && (
          <>
            <Divider orientation="vertical" flexItem />
            <Typography variant="caption" color="text.secondary">
              Last saved: {lastSaved.toLocaleTimeString()}
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );

  return (
    <>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          right: isFullscreen ? 0 : 'auto',
          bottom: isFullscreen ? 0 : 'auto',
          zIndex: isFullscreen ? 9998 : 'auto',
        }}
      >
        <ProfessionalToolbar />
        
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
            '& .tox': {
              border: 'none !important',
            },
            '& .tox-editor-header': {
              borderBottom: `1px solid ${theme.palette.divider} !important`,
              backgroundColor: `${theme.palette.background.paper} !important`,
            },
            '& .tox-toolbar__group': {
              border: 'none !important',
            },
            '& .tox-tbtn': {
              color: `${theme.palette.text.primary} !important`,
            },
            '& .tox-tbtn:hover': {
              backgroundColor: `${theme.palette.action.hover} !important`,
            },
            '& .tox-statusbar': {
              borderTop: `1px solid ${theme.palette.divider} !important`,
              backgroundColor: `${theme.palette.action.hover} !important`,
            },
          }}
        >
          <TinyMCEEditor
            ref={editorRef}
            apiKey="no-api-key" // Use local installation
            value={content}
            onEditorChange={handleChange}
            disabled={readOnly}
            init={editorConfig}
          />
        </Box>
      </Box>
      
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Document</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Choose the format to export your document:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleExport('pdf')}
              fullWidth
            >
              Export as PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<InsertDriveFile />}
              onClick={() => handleExport('docx')}
              fullWidth
            >
              Export as Word Document
            </Button>
            <Button
              variant="outlined"
              startIcon={<Archive />}
              onClick={() => handleExport('html')}
              fullWidth
            >
              Export as HTML
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Editor Settings
          <IconButton onClick={() => setShowSettings(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={editorSettings.spellcheck}
                  onChange={(e) => setEditorSettings(prev => ({ ...prev, spellcheck: e.target.checked }))}
                />
              }
              label="Enable spell check"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editorSettings.autoSave}
                  onChange={(e) => setEditorSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                />
              }
              label="Auto-save changes"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editorSettings.showWordCount}
                  onChange={(e) => setEditorSettings(prev => ({ ...prev, showWordCount: e.target.checked }))}
                />
              }
              label="Show word count"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editorSettings.enableCollaboration}
                  onChange={(e) => setEditorSettings(prev => ({ ...prev, enableCollaboration: e.target.checked }))}
                />
              }
              label="Enable collaboration features"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Find & Replace Dialog */}
      <Dialog open={showFindReplace} onClose={() => setShowFindReplace(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Find & Replace</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Find"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Replace with"
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFindReplace(false)}>Cancel</Button>
          <Button variant="outlined">Find Next</Button>
          <Button variant="contained">Replace All</Button>
        </DialogActions>
      </Dialog>
      
      {/* Save Notification */}
      <Snackbar
        open={!!saveNotification}
        autoHideDuration={3000}
        onClose={() => setSaveNotification('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSaveNotification('')} 
          severity={saveNotification.includes('Failed') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {saveNotification}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RichDocumentEditor;
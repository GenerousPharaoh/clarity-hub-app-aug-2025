import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  CloudDone as CloudDoneIcon,
  CloudUpload as CloudUploadIcon,
  Info as InfoIcon,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  Code,
  FormatListBulleted,
  FormatListNumbered,
  Link,
  Image,
  TableChart,
  FormatQuote,
  Undo,
  Redo,
} from '@mui/icons-material';
import useAppStore from '../../store';

interface ProfessionalRichEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  autoSave?: boolean;
  autoSaveInterval?: number;
  height?: string | number;
  placeholder?: string;
  readOnly?: boolean;
}

const ProfessionalRichEditor: React.FC<ProfessionalRichEditorProps> = ({
  initialContent = '',
  onChange,
  onSave,
  autoSave = true,
  autoSaveInterval = 30000,
  height = '100%',
  placeholder = 'Start typing your document...',
  readOnly = false,
}) => {
  const editorRef = useRef<any>(null);
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const themeMode = useAppStore((state) => state.themeMode);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && isDirty && onSave) {
      const autoSaveTimer = setTimeout(async () => {
        await handleSave();
      }, autoSaveInterval);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [content, autoSave, autoSaveInterval, isDirty]);

  // Handle save with demo mode persistence
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(content);
      }
      
      setLastSaved(new Date());
      setShowSaveNotification(true);
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, onSave]);

  // Handle content change
  const handleEditorChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
    onChange?.(newContent);
    
    // Update word and character count
    const text = newContent.replace(/<[^>]*>/g, '');
    setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length);
    setCharCount(text.length);
  };

  // Handle export
  const handleExport = (format: 'pdf' | 'docx' | 'html' | 'txt') => {
    const editor = editorRef.current;
    if (!editor) return;

    const content = editor.getContent();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
  };

  // TinyMCE configuration
  const editorConfig = {
    height: isFullscreen ? 'calc(100vh - 60px)' : 'calc(100vh - 250px)',
    menubar: 'file edit view insert format tools table help',
    branding: false,
    placeholder,
    readonly: readOnly,
    skin: themeMode === 'dark' ? 'oxide-dark' : 'oxide',
    content_css: themeMode === 'dark' ? 'dark' : 'default',
    license_key: 'gpl', // Use GPL license for open source
    plugins: [
      'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'wordcount', 'help',
      'emoticons', 'codesample', 'autosave', 'directionality',
      'visualchars', 'nonbreaking', 'pagebreak', 'quickbars', 'advlist'
    ],
    toolbar: 'undo redo | cut copy paste | formatselect | ' +
      'bold italic underline strikethrough subscript superscript | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist checklist outdent indent | ' +
      'link unlink anchor image media table | ' +
      'forecolor backcolor | fontfamily fontsize | ' +
      'codesample blockquote | ' +
      'searchreplace | removeformat | fullscreen help',
    toolbar_mode: 'sliding',
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
    quickbars_insert_toolbar: 'quickimage quicktable',
    paste_data_images: true,
    paste_as_text: false,
    browser_spellcheck: true,
    allow_html_in_named_anchor: true,
    link_context_toolbar: true,
    link_quicklink: true,
    default_link_target: '_blank',
    link_assume_external_targets: true,
    table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
    table_appearance_options: true,
    table_grid: true,
    table_class_list: [
      {title: 'None', value: ''},
      {title: 'Bordered', value: 'table-bordered'},
      {title: 'Striped', value: 'table-striped'}
    ],
    content_style: `
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: ${themeMode === 'dark' ? '#f1f5f9' : '#1e293b'};
        padding: 20px;
        max-width: 100%;
      }
      h1 { font-size: 2.5em; font-weight: 700; margin-bottom: 0.5em; }
      h2 { font-size: 2em; font-weight: 600; margin-bottom: 0.5em; }
      h3 { font-size: 1.75em; font-weight: 600; margin-bottom: 0.5em; }
      h4 { font-size: 1.5em; font-weight: 600; margin-bottom: 0.5em; }
      h5 { font-size: 1.25em; font-weight: 600; margin-bottom: 0.5em; }
      h6 { font-size: 1em; font-weight: 600; margin-bottom: 0.5em; }
      p { margin-bottom: 1em; }
      a { color: #2563eb; text-decoration: none; }
      a:hover { text-decoration: underline; }
      blockquote {
        border-left: 4px solid #2563eb;
        padding-left: 1em;
        margin: 1em 0;
        font-style: italic;
        color: ${themeMode === 'dark' ? '#94a3b8' : '#64748b'};
      }
      pre {
        background: ${themeMode === 'dark' ? '#1e293b' : '#f1f5f9'};
        padding: 1em;
        border-radius: 4px;
        overflow-x: auto;
      }
      code {
        background: ${themeMode === 'dark' ? '#334155' : '#e2e8f0'};
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'Monaco', 'Courier New', monospace;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      th, td {
        border: 1px solid ${themeMode === 'dark' ? '#475569' : '#cbd5e1'};
        padding: 0.5em;
        text-align: left;
      }
      th {
        background: ${themeMode === 'dark' ? '#334155' : '#f8fafc'};
        font-weight: 600;
      }
      ul, ol {
        margin-bottom: 1em;
        padding-left: 2em;
      }
      li {
        margin-bottom: 0.25em;
      }
      img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
      }
      .citation {
        background: ${themeMode === 'dark' ? '#1e3a8a' : '#dbeafe'};
        color: ${themeMode === 'dark' ? '#dbeafe' : '#1e3a8a'};
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-weight: 500;
        font-size: 0.9em;
      }
    `,
    autosave_interval: '30s',
    autosave_restore_when_empty: false,
    image_advtab: true,
    image_caption: true,
    noneditable_class: 'mceNonEditable',
    toolbar_sticky: true,
    setup: (editor: any) => {
      editorRef.current = editor;
      
      // Add custom keyboard shortcuts
      editor.addShortcut('meta+s', 'Save', () => {
        handleSave();
      });
      
      editor.addShortcut('meta+shift+f', 'Fullscreen', () => {
        setIsFullscreen(!isFullscreen);
      });
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: isFullscreen ? '100vh' : '100%',
        width: isFullscreen ? '100vw' : '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: isFullscreen ? 0 : 2,
        overflow: 'hidden',
      }}
    >
      {/* Professional Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: theme => theme.palette.mode === 'dark' ? '#1e293b' : '#fafafa',
        }}
      >
        {/* Left side - Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isSaving ? (
            <Chip
              icon={<CloudUploadIcon />}
              label="Saving..."
              size="small"
              color="primary"
              variant="outlined"
            />
          ) : lastSaved ? (
            <Chip
              icon={<CloudDoneIcon />}
              label={`Saved ${lastSaved.toLocaleTimeString()}`}
              size="small"
              color="success"
              variant="outlined"
            />
          ) : null}
          
          {isDirty && !isSaving && (
            <Chip
              label="Unsaved changes"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>

        {/* Center - Document stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {wordCount} words
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="caption" color="text.secondary">
            {charCount} characters
          </Typography>
        </Box>

        {/* Right side - Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Save (⌘S)">
            <IconButton 
              onClick={handleSave} 
              disabled={!isDirty || isSaving}
              size="small"
            >
              <SaveIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export">
            <IconButton 
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              size="small"
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Print">
            <IconButton 
              onClick={() => window.print()}
              size="small"
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen (⌘⇧F)"}>
            <IconButton 
              onClick={() => setIsFullscreen(!isFullscreen)}
              size="small"
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Loading bar for auto-save */}
      {autoSave && isDirty && (
        <LinearProgress 
          variant="determinate" 
          value={(Date.now() % autoSaveInterval) / autoSaveInterval * 100}
          sx={{ height: 2 }}
        />
      )}

      {/* TinyMCE Editor */}
      <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Editor
          tinymceScriptSrc="/tinymce/tinymce.min.js"
          onInit={(evt, editor) => editorRef.current = editor}
          initialValue={initialContent}
          init={editorConfig}
          onEditorChange={handleEditorChange}
        />
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('pdf')}>
          Export as PDF
        </MenuItem>
        <MenuItem onClick={() => handleExport('docx')}>
          Export as Word
        </MenuItem>
        <MenuItem onClick={() => handleExport('html')}>
          Export as HTML
        </MenuItem>
        <MenuItem onClick={() => handleExport('txt')}>
          Export as Text
        </MenuItem>
      </Menu>

      {/* Save Notification */}
      <Snackbar
        open={showSaveNotification}
        autoHideDuration={3000}
        onClose={() => setShowSaveNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSaveNotification(false)} 
          severity="success"
          variant="filled"
        >
          Document saved successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ProfessionalRichEditor;
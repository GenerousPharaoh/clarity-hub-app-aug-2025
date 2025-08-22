/**
 * LegalRichTextEditor - Professional Lexical-based rich text editor for legal documents
 * 
 * Features:
 * - Rich text formatting (bold, italic, underline, headers, lists)
 * - Custom citation nodes for legal references
 * - Professional "Google Docs for litigation" design
 * - Keyboard shortcuts and toolbar
 * - Auto-save functionality
 * - Export capabilities
 * - Citation linking to right panel viewers
 */
import React, { useCallback, useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Save,
} from '@mui/icons-material';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  EditorState,
  SELECTION_CHANGE_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND
} from 'lexical';



import CitationNode, { 
  INSERT_CITATION_COMMAND, 
  CITATION_CLICK_COMMAND,
  $createCitationNode,
  CitationPayload,
  CitationClickPayload
} from './CitationNode';
import CitationToolbarPlugin from './CitationToolbarPlugin';
import CitationInsertionPlugin from './CitationInsertionPlugin';
import CitationAutoCompletePlugin from './CitationAutoCompletePlugin';
import ExportPlugin from './ExportPlugin';
import EditorToolbar from './EditorToolbar';
import ContentEditableWrapper from './ContentEditableWrapper';
import useAppStore from '../../store';

interface LegalRichTextEditorProps {
  className?: string;
  onCitationClick?: (payload: CitationClickPayload) => void;
}

// Toolbar state tracking plugin
const ToolbarPlugin: React.FC<{
  onFormatChange: (formats: {[key: string]: boolean}) => void;
  onCanUndoRedoChange: (canUndo: boolean, canRedo: boolean) => void;
}> = ({ onFormatChange, onCanUndoRedoChange }) => {
  const [editor] = useLexicalComposerContext();

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      onFormatChange({
        bold: selection.hasFormat('bold'),
        italic: selection.hasFormat('italic'),
        underline: selection.hasFormat('underline'),
        code: selection.hasFormat('code'),
      });
    }
  }, [onFormatChange]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    const removeCanUndoListener = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (canUndo) => {
        editor.getEditorState().read(() => {
          const canRedo = editor.canRedo();
          onCanUndoRedoChange(canUndo, canRedo);
        });
        return false;
      },
      1,
    );

    const removeCanRedoListener = editor.registerCommand(
      CAN_REDO_COMMAND,
      (canRedo) => {
        editor.getEditorState().read(() => {
          const canUndo = editor.canUndo();
          onCanUndoRedoChange(canUndo, canRedo);
        });
        return false;
      },
      1,
    );

    return () => {
      removeCanUndoListener();
      removeCanRedoListener();
    };
  }, [editor, onCanUndoRedoChange]);

  return null;
};

// Citation command handler plugin
const CitationPlugin: React.FC<{
  onCitationClick?: (payload: CitationClickPayload) => void;
}> = ({ onCitationClick }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeInsertListener = editor.registerCommand(
      INSERT_CITATION_COMMAND,
      (payload: CitationPayload) => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const citationNode = $createCitationNode(
            payload.exhibitId,
            payload.pageNumber,
            payload.description,
            payload.fileId,
            payload.citationReference
          );
          selection.insertNodes([citationNode]);
        }
        return true;
      },
      1,
    );

    const removeClickListener = editor.registerCommand(
      CITATION_CLICK_COMMAND,
      (payload: CitationClickPayload) => {
        onCitationClick?.(payload);
        return true;
      },
      1,
    );

    return () => {
      removeInsertListener();
      removeClickListener();
    };
  }, [editor, onCitationClick]);

  return null;
};

// Main Editor Content Component (must be inside LexicalComposer)
const EditorContent: React.FC<{
  onCitationClick?: (payload: CitationClickPayload) => void;
  selectedFile: any;
  selectedProject: any;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onEditorChange?: (state: EditorState) => void;
}> = ({ 
  onCitationClick,
  selectedFile,
  selectedProject,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onEditorChange,
}) => {
  const [toolbarFormats, setToolbarFormats] = useState<{[key: string]: boolean}>({});
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  // Handle editor change - notify parent component
  const handleEditorChange = useCallback((state: EditorState) => {
    setEditorState(state);
    // Notify parent component of changes
    const root = state.read(() => $getRoot());
    console.log('Editor content changed:', root.getTextContent());
    // Pass change to parent
    onEditorChange?.(state);
  }, [onEditorChange]);

  // Handle citation clicks (inside component)
  const handleCitationClick = useCallback((payload: CitationClickPayload) => {
    console.log('Citation clicked:', payload);
    
    // Use the store's navigation function to handle exhibit navigation
    const navigateToExhibit = useAppStore.getState().navigateToExhibit;
    navigateToExhibit(payload.citationReference, 'editor');
    
    // Also call the external handler if provided
    onCitationClick?.(payload);
  }, [onCitationClick]);

  return (
    <>
      {/* Editor Toolbar - Now using the new component */}
      <EditorToolbar 
        toolbarFormats={toolbarFormats}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      
      {/* Save button section */}
      <Box sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        {hasUnsavedChanges && (
          <Typography variant="caption" color="text.secondary">
            Unsaved changes
          </Typography>
        )}
        <Button
          variant="contained"
          size="small"
          startIcon={<Save />}
          onClick={onSave}
          disabled={!selectedFile || isSaving || !hasUnsavedChanges}
          sx={{
            backgroundColor: '#2563eb',
            '&:hover': { backgroundColor: '#1d4ed8' }
          }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {/* Editor Content Area */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'hidden', 
          position: 'relative',
          backgroundColor: '#ffffff',
          minHeight: '400px',
        }}
      >
        <RichTextPlugin
            contentEditable={
              <ContentEditableWrapper
                placeholder={
                  <div 
                    className="lexical-placeholder"
                    style={{
                      position: 'absolute',
                      top: '24px',
                      left: '32px',
                      color: '#9ca3af',
                      fontSize: '16px',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    {selectedFile 
                      ? `Start writing your legal document...`
                      : selectedProject
                      ? 'Select a file to edit or create a new document'
                      : 'Create or select a project to begin'
                    }
                  </div>
                }
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          
        <OnChangePlugin onChange={handleEditorChange} />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        
        <ToolbarPlugin 
          onFormatChange={setToolbarFormats}
          onCanUndoRedoChange={(undo, redo) => {
            setCanUndo(undo);
            setCanRedo(redo);
          }}
        />
        <CitationPlugin onCitationClick={handleCitationClick} />
        <CitationInsertionPlugin />
        <CitationAutoCompletePlugin />
      </Box>

      {/* Status Bar */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 3,
          py: 1,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: '#f8f9fa',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {selectedFile ? selectedFile.name : selectedProject ? selectedProject.name : 'No file selected'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {editorState 
            ? `${editorState.read(() => $getRoot().getTextContent()).split(/\s+/).filter(w => w).length} words • ${editorState.read(() => $getRoot().getTextContent()).length} characters`
            : '0 words • 0 characters'
          }
        </Typography>
      </Paper>
    </>

  );
};

// Main Component with proper context structure
const LegalRichTextEditor: React.FC<LegalRichTextEditorProps> = ({ 
  className,
  onCitationClick 
}) => {
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const selectedFileId = useAppStore(state => state.selectedFileId);
  const files = useAppStore(state => state.files);
  const updateFile = useAppStore(state => state.updateFile);
  const projects = useAppStore(state => state.projects);

  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get selected file data
  const selectedFile = selectedFileId ? files.find(f => f.id === selectedFileId) : null;
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  // Editor configuration
  const initialConfig = {
    namespace: 'LegalEditor',
    theme: {
      root: 'lexical-editor',
      paragraph: 'lexical-paragraph',
      heading: {
        h1: 'lexical-heading-h1',
        h2: 'lexical-heading-h2',
        h3: 'lexical-heading-h3',
      },
      list: {
        nested: {
          listitem: 'lexical-nested-listitem',
        },
        ol: 'lexical-list-ol',
        ul: 'lexical-list-ul',
        listitem: 'lexical-listitem',
      },
      text: {
        bold: 'lexical-text-bold',
        code: 'lexical-text-code',
        italic: 'lexical-text-italic',
        underline: 'lexical-text-underline',
      },
      quote: 'lexical-quote',
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
      CitationNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  // Save content
  const handleSave = async () => {
    if (!selectedFileId || !selectedFile || !editorState) {
      setShowSaveNotification(false);
      setTimeout(() => setShowSaveNotification(true), 100);
      return;
    }
    
    setIsSaving(true);
    
    // Convert editor state to JSON for storage
    const contentJSON = JSON.stringify(editorState.toJSON());
    
    // Update file metadata with content
    updateFile(selectedFileId, {
      metadata: {
        ...selectedFile.metadata,
        content: contentJSON,
        contentType: 'lexical',
        lastModified: new Date().toISOString(),
        // Word count from plain text
        wordCount: editorState.read(() => $getRoot().getTextContent()).split(/\s+/).filter(w => w).length,
        characterCount: editorState.read(() => $getRoot().getTextContent()).length,
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
    if (hasUnsavedChanges && selectedFileId && editorState) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [editorState, hasUnsavedChanges, selectedFileId]);

  // Update editor state when it changes (from EditorContent)
  const handleEditorStateChange = useCallback((state: EditorState) => {
    setEditorState(state);
    setHasUnsavedChanges(true);
    
    // Debug logging
    const textContent = state.read(() => $getRoot().getTextContent());
    console.log('Main editor received update:', textContent.length, 'chars');
  }, []);

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
      <LexicalComposer initialConfig={initialConfig}>
        <EditorContent
          onCitationClick={onCitationClick}
          selectedFile={selectedFile}
          selectedProject={selectedProject}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onSave={handleSave}
          onEditorChange={handleEditorStateChange}
        />
      </LexicalComposer>

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
          {selectedFileId ? 'Document saved successfully!' : 'Select a file to save your work'}
        </Alert>
      </Snackbar>

      <style>{`
        .lexical-editor {
          height: 100%;
        }
        
        .lexical-paragraph {
          margin: 0 0 8px 0;
        }
        
        .lexical-heading-h1 {
          font-size: 2rem;
          font-weight: 600;
          margin: 24px 0 16px 0;
          color: #1a1a1a;
        }
        
        .lexical-heading-h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 20px 0 12px 0;
          color: #1a1a1a;
        }
        
        .lexical-heading-h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 16px 0 8px 0;
          color: #1a1a1a;
        }
        
        .lexical-list-ol, .lexical-list-ul {
          margin: 8px 0;
          padding-left: 24px;
        }
        
        .lexical-listitem {
          margin: 4px 0;
        }
        
        .lexical-text-bold {
          font-weight: 600;
        }
        
        .lexical-text-italic {
          font-style: italic;
        }
        
        .lexical-text-underline {
          text-decoration: underline;
        }
        
        .lexical-text-code {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 3px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 0.9em;
          padding: 2px 4px;
        }
        
        .lexical-quote {
          border-left: 4px solid #2563eb;
          padding-left: 16px;
          margin: 16px 0;
          color: #4b5563;
          font-style: italic;
        }
      `}</style>
    </Box>
  );
};

export default LegalRichTextEditor;
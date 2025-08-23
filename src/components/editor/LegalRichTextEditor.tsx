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
  AutoAwesome,
} from '@mui/icons-material';

import '../../styles/premium-editor.css';
import '../../styles/premium-editor-enhancements.css';

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
  focusMode?: boolean;
  onFocusModeChange?: (focusMode: boolean) => void;
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
  focusMode?: boolean;
  onFocusModeToggle?: () => void;
}> = ({ 
  onCitationClick,
  selectedFile,
  selectedProject,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onEditorChange,
  focusMode,
  onFocusModeToggle,
}) => {
  const [toolbarFormats, setToolbarFormats] = useState<{[key: string]: boolean}>({});
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

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

  const handleEditorFocusChange = useCallback((focused: boolean) => {
    setIsEditorFocused(focused);
  }, []);

  return (
    <div className={`premium-editor-focus-container ${focusMode ? 'premium-editor-focus-mode' : ''}`}>
      {/* Editor Toolbar - Now using the new component */}
      <EditorToolbar 
        toolbarFormats={toolbarFormats}
        canUndo={canUndo}
        canRedo={canRedo}
        focusMode={focusMode}
        onFocusModeToggle={onFocusModeToggle}
      />
      
      {/* Premium Save button */}
      <Box sx={{ 
        position: 'fixed', 
        top: 24, 
        right: 24, 
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        {hasUnsavedChanges && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '20px',
            padding: '4px 12px',
            animation: 'premiumPulse 2s infinite'
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#f59e0b',
            }} />
            <Typography variant="caption" color="#b45309" fontWeight={500}>
              Unsaved changes
            </Typography>
          </Box>
        )}
        <Button
          className="premium-floating-button"
          variant="contained"
          size="small"
          startIcon={<Save fontSize="small" />}
          onClick={onSave}
          disabled={!selectedFile || isSaving || !hasUnsavedChanges}
          sx={{
            position: 'static',
            minWidth: 'auto',
            height: '36px',
            borderRadius: '18px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: hasUnsavedChanges 
              ? 'linear-gradient(135deg, #4299e1, #63b3ed)' 
              : 'linear-gradient(135deg, #e2e8f0, #cbd5e0)',
            color: hasUnsavedChanges ? 'white' : '#718096',
            boxShadow: hasUnsavedChanges 
              ? '0 4px 12px rgba(66, 153, 225, 0.4)' 
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              background: hasUnsavedChanges 
                ? 'linear-gradient(135deg, #3182ce, #4299e1)' 
                : 'linear-gradient(135deg, #cbd5e0, #a0aec0)',
              transform: 'translateY(-2px)',
              boxShadow: hasUnsavedChanges 
                ? '0 6px 16px rgba(66, 153, 225, 0.5)' 
                : '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            '&:disabled': {
              background: '#f1f5f9',
              color: '#cbd5e0',
              boxShadow: 'none',
            }
          }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {/* Premium Editor Content Area */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'hidden', 
          position: 'relative',
          backgroundColor: 'transparent',
          minHeight: '500px',
        }}
      >
        <RichTextPlugin
            contentEditable={
              <ContentEditableWrapper
                focusMode={focusMode}
                onFocusChange={handleEditorFocusChange}
                placeholder={
                  <div 
                    className="premium-placeholder"
                    style={{
                      position: 'absolute',
                      top: '48px',
                      left: '64px',
                      right: '64px',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      transition: 'all 0.3s ease',
                      opacity: isEditorFocused ? 0 : 1,
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

      {/* Premium Status Bar */}
      <div className="premium-status-bar">
        <div className="premium-status-item">
          <AutoAwesome fontSize="small" style={{ opacity: 0.7 }} />
          <span>
            {selectedFile ? selectedFile.name : selectedProject ? selectedProject.name : 'No file selected'}
          </span>
        </div>
        
        <div className="premium-status-item">
          <span>
            {editorState 
              ? `${editorState.read(() => $getRoot().getTextContent()).split(/\s+/).filter(w => w).length} words • ${editorState.read(() => $getRoot().getTextContent()).length} characters`
              : '0 words • 0 characters'
            }
          </span>
        </div>
      </div>
    </div>

  );
};

// Main Component with proper context structure
const LegalRichTextEditor: React.FC<LegalRichTextEditorProps> = ({ 
  className,
  onCitationClick,
  focusMode = false,
  onFocusModeChange
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
  const [localFocusMode, setLocalFocusMode] = useState(focusMode);

  // Handle focus mode changes
  const handleFocusModeToggle = useCallback(() => {
    const newFocusMode = !localFocusMode;
    setLocalFocusMode(newFocusMode);
    onFocusModeChange?.(newFocusMode);
  }, [localFocusMode, onFocusModeChange]);

  // Sync external focus mode changes
  useEffect(() => {
    setLocalFocusMode(focusMode);
  }, [focusMode]);

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
    <div
      className={`premium-editor-container ${className || ''} ${localFocusMode ? 'premium-editor-focus-mode' : ''}`}
      style={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
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
          focusMode={localFocusMode}
          onFocusModeToggle={handleFocusModeToggle}
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

      {/* Focus Mode Overlay */}
      {localFocusMode && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(2px)',
            zIndex: -1,
            transition: 'all 0.3s ease',
          }}
        />
      )}

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
        
        /* Custom scrollbar for editor */
        .premium-content-editable::-webkit-scrollbar {
          width: 8px;
        }
        
        .premium-content-editable::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 4px;
        }
        
        .premium-content-editable::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .premium-content-editable::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8);
        }
        
        /* Focus mode transition */
        .premium-editor-focus-mode {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};

export default LegalRichTextEditor;
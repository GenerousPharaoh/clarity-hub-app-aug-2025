/**
 * SupabaseDocumentEditor - Document editor with Supabase integration
 * 
 * Features:
 * - Auto-save to Supabase
 * - Document versioning
 * - Load/save document content
 * - Citation management with file links
 * - Real-time collaboration ready
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Save,
  History,
  CloudSync,
  CloudDone,
  CloudOff,
} from '@mui/icons-material';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { $getRoot, $insertNodes, EditorState } from 'lexical';
import LegalRichTextEditor from './LegalRichTextEditor';
import {
  createDocument,
  saveDocumentContent,
  loadDocumentContent,
  getDocumentCitations,
  createCitation,
} from '../../lib/supabase';
import useAppStore from '../../store';

interface SupabaseDocumentEditorProps {
  projectId: string;
  documentId?: string;
  onDocumentCreate?: (documentId: string) => void;
  onCitationAdd?: (citation: any) => void;
}

const SupabaseDocumentEditor: React.FC<SupabaseDocumentEditorProps> = ({
  projectId,
  documentId: initialDocumentId,
  onDocumentCreate,
  onCitationAdd,
}) => {
  const [documentId, setDocumentId] = useState<string | undefined>(initialDocumentId);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editorContent, setEditorContent] = useState<any>(null);
  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  const [version, setVersion] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const files = useAppStore(state => state.files);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);

  // Load document content if documentId exists
  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  // Load document from Supabase
  const loadDocument = async () => {
    if (!documentId) return;

    setIsLoading(true);
    try {
      const content = await loadDocumentContent(documentId);
      if (content) {
        setEditorContent(content.content);
        setVersion(content.version);
        setSaveStatus('saved');
        setLastSaved(new Date(content.created_at));
      }

      // Load citations
      const citations = await getDocumentCitations(documentId);
      // Process citations if needed
    } catch (error) {
      console.error('Error loading document:', error);
      setError('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new document if needed
  const ensureDocument = async () => {
    if (documentId) return documentId;

    try {
      const newDoc = await createDocument({
        project_id: projectId,
        title: documentTitle,
        document_type: 'legal_document',
        description: 'Created from Clarity Hub Editor',
      });

      setDocumentId(newDoc.id);
      onDocumentCreate?.(newDoc.id);
      return newDoc.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  };

  // Save document to Supabase
  const saveDocument = async (content: any, plainText: string) => {
    try {
      setSaveStatus('saving');
      setIsSaving(true);

      // Ensure document exists
      const docId = await ensureDocument();

      // Save content with versioning
      const savedContent = await saveDocumentContent(
        docId,
        content,
        plainText
      );

      setVersion(savedContent.version);
      setSaveStatus('saved');
      setLastSaved(new Date());
      setNotificationMessage('Document saved successfully');
      setShowNotification(true);

      return savedContent;
    } catch (error) {
      console.error('Error saving document:', error);
      setSaveStatus('error');
      setError('Failed to save document');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle editor content change
  const handleEditorChange = useCallback((editorState: EditorState) => {
    const content = editorState.toJSON();
    const plainText = editorState.read(() => $getRoot().getTextContent());
    
    setEditorContent(content);
    
    // Auto-save after 2 seconds of inactivity
    if (documentId || projectId) {
      setSaveStatus('saving');
      const timer = setTimeout(() => {
        saveDocument(content, plainText);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [documentId, projectId]);

  // Handle citation insertion
  const handleCitationInsert = async (fileId: string, citationKey: string, pageNumber?: number) => {
    if (!documentId) {
      setError('Please save the document first');
      return;
    }

    try {
      const citation = await createCitation({
        document_id: documentId,
        file_id: fileId,
        citation_key: citationKey,
        page_number: pageNumber,
      });

      onCitationAdd?.(citation);
      setNotificationMessage('Citation added');
      setShowNotification(true);
    } catch (error) {
      console.error('Error adding citation:', error);
      setError('Failed to add citation');
    }
  };

  // Get save status icon
  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <CloudSync color="primary" />;
      case 'saved':
        return <CloudDone color="success" />;
      case 'error':
        return <CloudOff color="error" />;
      default:
        return null;
    }
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return 'Never saved';
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return lastSaved.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Status Bar */}
      <Paper
        elevation={0}
        sx={{
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 0 }}>
          {documentTitle}
        </Typography>
        
        <Divider orientation="vertical" flexItem />
        
        <Box display="flex" alignItems="center" gap={1}>
          {getSaveStatusIcon()}
          <Typography variant="body2" color="text.secondary">
            {saveStatus === 'saving' ? 'Saving...' : formatLastSaved()}
          </Typography>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        <Chip
          label={`Version ${version}`}
          size="small"
          variant="outlined"
          icon={<History />}
        />
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button
          variant="contained"
          size="small"
          startIcon={<Save />}
          onClick={() => {
            if (editorContent) {
              const plainText = ''; // Get from editor
              saveDocument(editorContent, plainText);
            }
          }}
          disabled={isSaving || saveStatus === 'saving'}
        >
          Save Now
        </Button>
      </Paper>

      {/* Editor */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <LegalRichTextEditor
          onCitationClick={(payload) => {
            console.log('Citation clicked in Supabase editor:', payload);
            // Handle citation navigation
          }}
        />
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={3000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setShowNotification(false)}>
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SupabaseDocumentEditor;
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  CircularProgress,
  Tooltip,
  Paper,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ZoomOut,
  ZoomIn,
  AutoAwesome as AnalyzeIcon,
  NoteAddOutlined,
} from '@mui/icons-material';
import { Editor } from '@tinymce/tinymce-react';
import { useAuth } from '../../contexts/AuthContext';
import useAppStore from '../../store';
import supabaseClient from '../../services/supabaseClient';
import { Note, Link } from '../../types';
import SuggestionPanel from '../../components/ai/SuggestionPanel';
import CitationFinder from '../../components/dialogs/CitationFinder';
import { debounce } from 'lodash';
import '../../theme/tinymce-custom.css'; // Import custom TinyMCE CSS

// Define a local interface to match the actual database schema
interface NoteData {
  id: string;
  project_id: string;
  content: string;
  updated_at: string;
  user_id: string;
}

const CenterPanel = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<string>('');
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCitationFinderOpen, setCitationFinderOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const fetchedRef = useRef(false);
  
  // Use individual selectors instead of object destructuring
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const selectedFileId = useAppStore((state) => state.selectedFileId);
  const selectedNoteId = useAppStore((state) => state.selectedNoteId);
  const isSuggestionPanelOpen = useAppStore((state) => state.isSuggestionPanelOpen);
  const toggleSuggestionPanel = useAppStore((state) => state.toggleSuggestionPanel);
  const linkActivation = useAppStore((state) => state.linkActivation);
  const setLinkActivation = useAppStore((state) => state.setLinkActivation);
  const files = useAppStore((state) => state.files);

  // Load note when project changes
  useEffect(() => {
    if (selectedProjectId && user) {
      // Prevent duplicate calls in StrictMode
      if (fetchedRef.current) return;
      fetchedRef.current = true;
      fetchNote();
    } else {
      setNote(null);
      setContent('');
      // Reset the ref when project changes
      fetchedRef.current = false;
    }
  }, [selectedProjectId, user]);

  // Create debounced save function
  const debouncedSaveNote = useCallback(
    debounce((noteToSave: NoteData, contentToSave: string) => {
      saveNote(noteToSave, contentToSave);
    }, 2000),
    []
  );

  // Auto-save content changes
  useEffect(() => {
    if (note && content !== note.content) {
      debouncedSaveNote(note, content);
    }
  }, [content, note, debouncedSaveNote]);

  // Link activation handler - scroll to and highlight citation when a link is activated
  useEffect(() => {
    if (linkActivation && editorInstance) {
      highlightLinkedCitation(linkActivation.fileId);
    }
  }, [linkActivation, editorInstance]);

  // Highlight citation in the editor
  const highlightLinkedCitation = (fileId: string) => {
    if (!editorInstance) return;
    
    const editor = editorInstance;
    const content = editor.getContent();
    
    // Find all citation elements with the matching file ID
    const body = editor.getBody();
    const citations = body.querySelectorAll(`a.exhibit-citation[data-file-id="${fileId}"]`);
    
    if (citations.length > 0) {
      // Scroll to the first occurrence
      citations[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight all matching citations
      citations.forEach((citation: HTMLElement) => {
        editor.selection.select(citation);
        editor.focus();
      });
    }
  };

  // Fetch the note for the current project
  const fetchNote = async () => {
    if (!selectedProjectId) return;
    
    setLoading(true);
    
    try {
      // Always get the authenticated user from Supabase auth first
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authUser) {
        console.error('Error getting authenticated user:', authError || 'No user found');
        throw authError || new Error('No user found');
      }
      
      const userId = authUser.id;
      
      console.log('Fetching note for project:', selectedProjectId, 'and user:', userId);
      const { data, error } = await supabaseClient
        .from('notes')
        .select('id, project_id, user_id, content, updated_at')
        .eq('project_id', selectedProjectId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error in note query:', error);
        throw error;
      }
      
      if (data) {
        console.log('Found existing note:', data);
        setNote(data);
        setContent(data.content || '');
      } else {
        // Create a new note if one doesn't exist
        console.log('Creating new note for project:', selectedProjectId);
        
        const newNote = {
          project_id: selectedProjectId,
          user_id: userId,
          content: '',
        };
        
        const { data: createdNote, error: createError } = await supabaseClient
          .from('notes')
          .upsert([newNote], { 
            onConflict: 'project_id,user_id',
            ignoreDuplicates: false // Use merge-duplicates behavior
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating note:', createError);
          throw createError;
        }
        
        console.log('Created new note:', createdNote);
        setNote(createdNote);
        setContent('');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save note to the database
  const saveNote = async (noteToSave: NoteData, contentToSave: string) => {
    if (!noteToSave || !selectedProjectId) return;
    
    setSaving(true);
    
    try {
      // Always get the authenticated user from Supabase auth first
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authUser) {
        console.error('Error getting authenticated user:', authError || 'No user found');
        throw authError || new Error('No user found');
      }
      
      const userId = authUser.id;
      
      // Use upsert instead of update to ensure consistency and avoid conflicts
      const { error } = await supabaseClient
        .from('notes')
        .upsert({ 
          id: noteToSave.id,
          project_id: selectedProjectId,
          content: contentToSave, 
          updated_at: new Date().toISOString(),
          user_id: userId
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      
      // Update local note
      setNote({ ...noteToSave, content: contentToSave, updated_at: new Date().toISOString() });
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  // Save link to database when citation is inserted
  const saveLink = async (fileId: string, exhibitId: string) => {
    if (!selectedProjectId || !note) return;
    
    try {
      // Always get the authenticated user from Supabase auth first
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authUser) {
        console.error('Error getting authenticated user:', authError || 'No user found');
        throw authError || new Error('No user found');
      }
      
      const userId = authUser.id;
      
      const linkData = {
        project_id: selectedProjectId,
        user_id: userId,
        source_file_id: fileId,
        source_details_json: {
          type: 'exhibit',
          exhibitId: exhibitId,
        },
        target_context_json: {
          note_id: note.id,
        },
      };
      
      const { data, error } = await supabaseClient
        .from('links')
        .insert(linkData)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Link saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error saving link:', error);
    }
  };

  // TinyMCE configuration
  const editorConfig = {
    height: '100%', // Keep 100% height
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
      'save', 'autoresize', 'pagebreak', 'nonbreaking', 'quickbars',
      'emoticons', 'directionality', 'visualchars', 'codesample'
    ],
    toolbar: [
      'undo redo | fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify',
      'bullist numlist outdent indent | link image media table codesample | pagebreak nonbreaking | removeformat | cite fullscreen code'
    ],
    toolbar_mode: 'sliding', // Makes toolbar responsive
    toolbar_sticky: true, // Keep toolbar visible when scrolling
    // Add base_url to ensure TinyMCE can find its resources
    base_url: '/tinymce',
    // Add skin_url to ensure TinyMCE can find its skin
    skin_url: '/tinymce/skins/ui/oxide',
    // Add content_css to ensure TinyMCE loads the proper CSS for the editor content
    content_css: [
      '/tinymce/skins/content/default/content.min.css',
      '/tinymce/tinymce-custom.css' // Path to our custom CSS in public directory
    ],
    // Add license key for TinyMCE
    license_key: 'gpl',
    inline_styles: true,
    extended_valid_elements: 'a[*]',
    resize: false, // Disable resize handle 
    branding: false, // Remove TinyMCE branding
    promotion: false, // Remove promotion link
    statusbar: true, // Show status bar
    min_height: 500, // Set minimum height
    autoresize_bottom_margin: 50, // Add space at the bottom when using autoresize
    // Word count and indicator
    wordcount_countcharacters: true,
    wordcount_cleanregex: /[0-9.(),;:!?%#$?\x27\x22_+=\\\/\-]*/g,
    // Setup editor
    setup: (editor) => {
      // Store editor instance for later use
      editor.on('init', () => {
        setEditorInstance(editor);
        
        // Add clean editor styling
        const editorContainer = editor.getContainer();
        if (editorContainer) {
          editorContainer.style.border = 'none';
          editorContainer.style.boxShadow = 'rgba(0, 0, 0, 0.05) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px 0px';
          editorContainer.style.borderRadius = '4px';
        }
        
        // Make editor body use the full height
        const editorBody = editor.getBody();
        if (editorBody) {
          editorBody.style.minHeight = '90vh'; 
        }
      });
      
      // Add custom cite button
      editor.ui.registry.addButton('cite', {
        text: 'Cite Exhibit',
        tooltip: 'Insert citation to an exhibit',
        onAction: () => {
          setCitationFinderOpen(true);
        }
      });
      
      // Auto-save indication
      let saveTimer = null;
      editor.on('KeyUp', () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          // This will trigger the content change handler which handles saving
          editor.fire('change');
        }, 1000);
      });
      
      // Add citation click handler
      editor.on('click', (e) => {
        const clickedEl = e.target as HTMLElement;
        
        if (clickedEl.classList.contains('exhibit-citation')) {
          e.preventDefault();
          
          const fileId = clickedEl.getAttribute('data-file-id');
          const exhibitId = clickedEl.getAttribute('data-exhibit-id');
          
          if (fileId) {
            // Activate the file in the right panel
            setLinkActivation({
              fileId,
              page: undefined, // Will be set by the viewer if applicable
              timestamp: undefined, // Will be set by the viewer if applicable
            });
          }
        }
      });
    }
  };

  // Editor change handler
  const handleEditorChange = (newContent: string) => {
    setContent(newContent);
  };

  // Citation insertion handler
  const handleInsertCitation = async (exhibitId: string, fileId: string) => {
    setCitationFinderOpen(false);
    
    // Get the file details
    const file = files.find(f => f.id === fileId);
    const displayName = file?.exhibit_id || exhibitId;
    
    // Save link to database
    await saveLink(fileId, displayName);
    
    // Insert the citation at cursor position
    const citation = `<a href="#" data-exhibit-id="${displayName}" data-file-id="${fileId}" class="exhibit-citation">[Exhibit ${displayName}]</a>`;
    
    // Get editor instance
    if (editorInstance) {
      editorInstance.execCommand('mceInsertContent', false, citation);
    }
  };

  // Toggle AI suggestions panel
  const handleAnalyzeContent = () => {
    if (!isSuggestionPanelOpen) {
      toggleSuggestionPanel();
    }
  };

  if (!selectedProjectId) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Welcome to Clarity Hub
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Select a project from the left panel to get started
        </Typography>
      </Box>
    );
  }
  
  if (!selectedNoteId) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 4,
          textAlign: 'center',
        }}
      >
        <NoteAddOutlined sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No note selected
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select a note or create a new one to start editing
        </Typography>
        <Button variant="contained" color="primary">
          Create New Note
        </Button>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">
          Note Title
        </Typography>
      </Paper>
      
      {/* Editor container */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
        }}
      >
        <Typography variant="body1" paragraph>
          This is where the TinyMCE editor will be integrated.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The editor will support:
        </Typography>
        <ul>
          <li>Rich text formatting</li>
          <li>Exhibit reference links with tooltips</li>
          <li>AI-powered writing assistance</li>
          <li>Automatic citation generation</li>
        </ul>
        
        {selectedFileId && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Selected File ID: {selectedFileId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You can reference this file using exhibit links in the editor.
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Editor Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'hidden', 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 0,
        width: '100%',
        height: '100%',
      }}>
        {loading && selectedProjectId ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
          }}>
            <CircularProgress />
          </Box>
        ) : !selectedProjectId ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            p: 3,
            opacity: 0, // Keep hidden as we'll show the WelcomePlaceholder from CenterPanelWrapper instead
          }}>
            {/* Empty placeholder - this should never be seen */}
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden', minHeight: 0 }}>
            <Editor
              apiKey={import.meta.env.VITE_TINYMCE_API_KEY as string}
              value={content}
              onEditorChange={handleEditorChange}
              init={editorConfig}
              // Add onInit handler to log successful initialization
              onInit={(evt, editor) => {
                console.log('TinyMCE initialized successfully');
                setEditorInstance(editor);
                if (editor.getContainer()) {
                  editor.getContainer().setAttribute('data-test', 'note-editor');
                }
              }}
              // Add onError handler to catch any editor loading errors
              onLoadError={(err) => {
                console.error('TinyMCE failed to load:', err);
              }}
            />
          </Box>
        )}
        
        {/* Action buttons */}
        {selectedProjectId && !loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 1000,
          }}>
            <Tooltip title="Analyze with AI">
              <span>
                <IconButton
                  onClick={handleAnalyzeContent}
                  color={isSuggestionPanelOpen ? 'primary' : 'default'}
                  sx={{ 
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'background.default' }
                  }}
                  disabled={!content || content.length < 100}
                >
                  <AnalyzeIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
        
        {/* Saving indicator */}
        {saving && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: 10, 
            right: 10,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            p: 0.5,
            px: 1,
            borderRadius: 1,
            boxShadow: 1,
          }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="caption">Saving changes...</Typography>
          </Box>
        )}
      </Box>
      
      {/* Suggestion Panel */}
      {isSuggestionPanelOpen && (
        <Box sx={{ 
          height: '30%', 
          borderTop: 1, 
          borderColor: 'divider',
          overflow: 'auto',
          p: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">AI Suggestions</Typography>
            <IconButton size="small" onClick={toggleSuggestionPanel}>
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <SuggestionPanel content={content} />
        </Box>
      )}
      
      {/* Citation Finder Dialog */}
      <CitationFinder
        open={isCitationFinderOpen}
        onClose={() => setCitationFinderOpen(false)}
        onSelectFile={handleInsertCitation}
      />
    </Box>
  );
};

export default CenterPanel; 
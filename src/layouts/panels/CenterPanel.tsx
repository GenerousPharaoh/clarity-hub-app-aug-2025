import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AnalyzeIcon,
  NoteAddOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import useAppStore from '../../store';
import { supabase as supabaseClient } from '../../lib/supabase';
import { Note, Link } from '../../types';
import SuggestionPanel from '../../components/ai/SuggestionPanel';
import LegalRichTextEditor from '../../components/editor/LegalRichTextEditor';
import { $getRoot } from 'lexical';
import { debounce } from 'lodash';

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
  const [editorState, setEditorState] = useState<any>(null);
  const fetchedRef = useRef(false);
  
  // Use individual selectors instead of object destructuring
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const selectedFileId = useAppStore((state) => state.selectedFileId);
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

  // Auto-save content changes (temporarily disabled while using LegalRichTextEditor)
  // The LegalRichTextEditor handles its own auto-save functionality
  // useEffect(() => {
  //   if (note && content !== note.content) {
  //     debouncedSaveNote(note, content);
  //   }
  // }, [content, note, debouncedSaveNote]);

  // Handle Lexical editor state changes  
  const handleEditorStateChange = useCallback((newEditorState: any) => {
    setEditorState(newEditorState);
    // Extract plain text content for auto-save and AI suggestions
    const textContent = newEditorState.read(() => $getRoot().getTextContent());
    setContent(textContent);
    
    // For now, we'll rely on the LegalRichTextEditor's own auto-save
    // In the future, we could integrate this with our note system
    console.log('Editor content updated:', textContent.length, 'characters');
  }, []);

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

  // Handle citation clicks from the Lexical editor
  const handleCitationClick = useCallback((payload: any) => {
    console.log('Citation clicked:', payload);
    
    if (payload.fileId) {
      // Activate the file in the right panel
      setLinkActivation({
        type: 'citation',
        fileId: payload.fileId,
        exhibitId: payload.exhibitId,
        targetPage: payload.pageNumber,
        timestamp: Date.now(),
      });
    }
  }, [setLinkActivation]);


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
  
  // For notes, we use selectedProjectId since each project has one note per user
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'background.paper',
      }}
    >
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
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <LegalRichTextEditor
            onCitationClick={handleCitationClick}
          />
        </Box>
      )}
      
      {/* Floating AI Assistant button */}
      {selectedProjectId && !loading && content && content.length > 100 && (
          <Box sx={{ 
            position: 'fixed', 
            bottom: 80, 
            right: 24,
            zIndex: 1000,
          }}>
            <Tooltip title="AI Assistant">
              <IconButton
                onClick={handleAnalyzeContent}
                sx={{ 
                  bgcolor: isSuggestionPanelOpen ? 'primary.main' : 'background.paper',
                  color: isSuggestionPanelOpen ? 'white' : 'primary.main',
                  boxShadow: 3,
                  width: 56,
                  height: 56,
                  '&:hover': { 
                    bgcolor: isSuggestionPanelOpen ? 'primary.dark' : 'primary.light',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <AnalyzeIcon />
              </IconButton>
            </Tooltip>
          </Box>
      )}
      
      {/* Saving indicator - subtle and unobtrusive */}
      {saving && (
        <Box sx={{ 
          position: 'fixed', 
          bottom: 20, 
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          p: 0.5,
          px: 2,
          borderRadius: 20,
          zIndex: 1000,
        }}>
          <CircularProgress size={14} sx={{ mr: 1, color: 'white' }} />
          <Typography variant="caption">Saving...</Typography>
        </Box>
      )}
      
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
    </Box>
  );
};

export default CenterPanel; 
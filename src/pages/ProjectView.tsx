import { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Tabs, Tab, Button, Divider } from '@mui/material';
import { useParams } from 'react-router-dom';
import useAppStore from '../store';
import { supabase as supabaseClient } from '../lib/supabase';
import { Editor } from '@tinymce/tinymce-react';
import { FileUpload, Delete, ContentCopy, NoteAdd, Gavel } from '@mui/icons-material';
import { LegalCaseManager } from '../components/legal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      style={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [noteContent, setNoteContent] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  
  // Get project details from store
  const selectedProject = useAppStore((state) => 
    state.projects.find(p => p.id === projectId) || null
  );
  const selectedFile = useAppStore((state) => state.selectedFileId);
  const user = useAppStore((state) => state.user);
  
  // Load notes content when component mounts
  useEffect(() => {
    if (projectId && user) {
      loadProjectNotes();
    }
  }, [projectId, user]);
  
  // Load project notes
  const loadProjectNotes = async () => {
    if (!projectId || !user) return;
    
    try {
      setLoadingNote(true);
      
      // Check if note exists for this project
      const { data, error } = await supabaseClient
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // Note exists
        setNoteContent(data.content || '');
        setNoteId(data.id);
      } else {
        // Create new note
        const { data: newNote, error: createError } = await supabaseClient
          .from('notes')
          .insert({
            project_id: projectId,
            owner_id: user.id,
            user_id: user.id,
            content: ''
          })
          .select()
          .single();
          
        if (createError) throw createError;
        
        if (newNote) {
          setNoteId(newNote.id);
          setNoteContent('');
        }
      }
    } catch (err) {
      console.error('Error loading project notes:', err);
    } finally {
      setLoadingNote(false);
    }
  };
  
  // Save notes to database
  const saveNotes = async (content: string) => {
    if (!noteId || !projectId || !user) return;
    
    try {
      setSaveStatus('saving');
      
      const { error } = await supabaseClient
        .from('notes')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);
        
      if (error) throw error;
      
      setSaveStatus('saved');
      
      // Reset saved status after 2 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (err) {
      console.error('Error saving notes:', err);
      setSaveStatus('error');
    }
  };
  
  // Handle editor content change
  const handleEditorChange = (content: string) => {
    setNoteContent(content);
    
    // Debounced save
    const timeoutId = setTimeout(() => {
      saveNotes(content);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  };
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Project header */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" component="h1">
            {selectedProject?.name || 'Project'}
          </Typography>
          {selectedProject && (
            <Typography variant="body2" color="text.secondary">
              Created {new Date(selectedProject.created_at).toLocaleDateString()}
            </Typography>
          )}
        </Box>
        
        <Box>
          <Button
            variant="contained"
            startIcon={<FileUpload />}
            size="small"
            sx={{ mr: 1 }}
          >
            Upload Files
          </Button>
          <Button
            variant="outlined"
            startIcon={<NoteAdd />}
            size="small"
          >
            Add Note
          </Button>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Workpad" />
          <Tab label="Timeline" />
          <Tab label="Summary" />
          <Tab icon={<Gavel />} label="Legal Management" iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Workpad Tab */}
      <TabPanel value={activeTab} index={0}>
        {loadingNote ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 'calc(100% - 40px)' }}>
            <Editor
              apiKey="q6pu1qv40eyr40jy40uf09aic0zax3jbmtuufeonppzbxmpk"
              onInit={(evt, editor) => (editorRef.current = editor)}
              initialValue={noteContent}
              onEditorChange={handleEditorChange}
              init={{
                height: '100%',
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                skin: 'oxide',
                content_css: 'default',
                setup: (editor) => {
                  editor.ui.registry.addButton('inserttimestamp', {
                    text: 'Add timestamp',
                    onAction: () => {
                      editor.insertContent(`<time datetime="${new Date().toISOString()}">${new Date().toLocaleString()}</time>`);
                    }
                  });
                }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              {saveStatus === 'saving' && <Typography variant="caption">Saving...</Typography>}
              {saveStatus === 'saved' && <Typography variant="caption" color="success.main">Saved</Typography>}
              {saveStatus === 'error' && <Typography variant="caption" color="error">Error saving</Typography>}
            </Box>
          </Box>
        )}
      </TabPanel>
      
      {/* Timeline Tab */}
      <TabPanel value={activeTab} index={1}>
        <Typography variant="body1">
          Timeline view will be implemented here.
        </Typography>
      </TabPanel>
      
      {/* Summary Tab */}
      <TabPanel value={activeTab} index={2}>
        <Typography variant="body1">
          Project summary will be implemented here.
        </Typography>
      </TabPanel>
      
      {/* Legal Management Tab */}
      <TabPanel value={activeTab} index={3}>
        {projectId && <LegalCaseManager projectId={projectId} />}
      </TabPanel>
    </Box>
  );
} 
import { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Grid, Card, CardContent, CardActions, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress, Divider, Chip, Stack } from '@mui/material';
import { Add as AddIcon, Folder as FolderIcon } from '@mui/icons-material';
import useAppStore from '../store';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const projects = useAppStore((state) => state.projects);
  const setProjects = useAppStore((state) => state.setProjects);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  
  // Fetch projects when component mounts
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);
  
  // Fetch projects from Supabase
  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          owner_id: user.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add to projects list
      setProjects([data, ...projects]);
      setNewProjectName('');
      setProjectDialogOpen(false);
      
      // Navigate to the new project
      navigate(`/projects/${data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Open a project
  const handleOpenProject = (projectId: string) => {
    setSelectedProject(projectId);
    navigate(`/projects/${projectId}`);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Legal Case Management Dashboard
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setProjectDialogOpen(true)}
        >
          New Legal Case
        </Button>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : projects.length > 0 ? (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2">
                      {project.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </Typography>
                  
                  {project.is_ai_organized && (
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Chip size="small" label="AI Organized" color="primary" variant="outlined" />
                    </Stack>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    Open Case
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <FolderIcon sx={{ fontSize: 40, color: '#6366F1' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No legal cases yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Create your first legal case to start managing documents with our three-panel citation system
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setProjectDialogOpen(true)}
          >
            Create Legal Case
          </Button>
        </Box>
      )}
      
      {/* New Legal Case Dialog */}
      <Dialog open={isProjectDialogOpen} onClose={() => setProjectDialogOpen(false)}>
        <DialogTitle>Create New Legal Case</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name for your new legal case. You'll be able to upload documents, create citations, and manage evidence using our three-panel workflow.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Case Name"
            placeholder="e.g., Smith v. Jones Contract Dispute"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained" 
            disabled={!newProjectName.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : "Create Legal Case"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
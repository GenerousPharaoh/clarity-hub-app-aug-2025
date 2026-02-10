import { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, CardActionArea, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress, Chip, Stack, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add as AddIcon, Folder as FolderIcon, ArrowForward } from '@mui/icons-material';
import useAppStore from '../store';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  const projects = useAppStore((state) => state.projects);
  const setProjects = useAppStore((state) => state.setProjects);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

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

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .insert({ name: newProjectName.trim(), owner_id: user.id })
        .select()
        .single();
      if (error) throw error;
      setProjects([data, ...projects]);
      setNewProjectName('');
      setProjectDialogOpen(false);
      navigate(`/projects/${data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (projectId: string) => {
    setSelectedProject(projectId);
    navigate(`/projects/${projectId}`);
  };

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
    }}>
      {/* Header */}
      <Box sx={{
        px: 4,
        pt: 4,
        pb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}
          >
            {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {projects.length > 0
              ? `${projects.length} legal case${projects.length !== 1 ? 's' : ''}`
              : 'Get started by creating your first case'
            }
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setProjectDialogOpen(true)}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            px: 2.5,
            fontWeight: 600,
            fontSize: '0.8125rem',
          }}
        >
          New Case
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ px: 4, pb: 4, flex: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : projects.length > 0 ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2,
          }}>
            {projects.map((project) => (
              <Card
                key={project.id}
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  transition: 'all 180ms ease',
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleOpenProject(project.id)}
                  sx={{ p: 2.5 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FolderIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {project.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(project.created_at).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </Typography>
                      {project.is_ai_organized && (
                        <Chip
                          size="small"
                          label="AI"
                          sx={{
                            ml: 1,
                            height: 18,
                            fontSize: '0.625rem',
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                          }}
                        />
                      )}
                    </Box>
                    <ArrowForward sx={{
                      fontSize: 16,
                      color: 'text.disabled',
                      mt: 0.5,
                      opacity: 0,
                      transition: 'opacity 150ms ease',
                      '.MuiCardActionArea-root:hover &': { opacity: 1 },
                    }} />
                  </Box>
                </CardActionArea>
              </Card>
            ))}

            {/* Create new card */}
            <Card
              elevation={0}
              sx={{
                border: '1px dashed',
                borderColor: alpha(theme.palette.text.disabled, 0.3),
                borderRadius: '12px',
                transition: 'all 180ms ease',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                },
              }}
            >
              <CardActionArea
                onClick={() => setProjectDialogOpen(true)}
                sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 88,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <AddIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={500}>
                    New Case
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Box>
        ) : (
          /* Empty state */
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 10,
          }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.16)} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <FolderIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, letterSpacing: '-0.01em' }}>
              Create your first case
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}
            >
              Organize evidence, build arguments, and manage exhibits in a three-panel workspace.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setProjectDialogOpen(true)}
              sx={{
                textTransform: 'none',
                borderRadius: '10px',
                px: 3,
                fontWeight: 600,
              }}
            >
              Create Legal Case
            </Button>
          </Box>
        )}
      </Box>

      {/* Dialog */}
      <Dialog
        open={isProjectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '12px', maxWidth: 420 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>New Legal Case</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: '0.875rem' }}>
            Name your case to start uploading documents and building arguments.
          </DialogContentText>
          <TextField
            autoFocus
            label="Case Name"
            placeholder="e.g., Smith v. Jones"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newProjectName.trim()) handleCreateProject();
            }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '10px' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setProjectDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProjectName.trim() || loading}
            sx={{ textTransform: 'none', borderRadius: '10px', px: 3 }}
          >
            {loading ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

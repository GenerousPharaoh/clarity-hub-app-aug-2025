import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Skeleton,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Project } from '../../types';
import { useNavigate } from 'react-router-dom';

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  loading: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (projectName: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProjectId,
  loading,
  onSelectProject,
  onCreateProject,
  onRefresh,
}) => {
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Handle project creation
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCreateProject(newProjectName);
      setNewProjectName('');
      setProjectDialogOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    onSelectProject(projectId);
    navigate(`/projects/${projectId}`);
  };

  // Refresh projects list
  const handleRefresh = async () => {
    await onRefresh();
  };

  return (
    <>
      {/* Projects section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 8 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Projects
        </Typography>
        <div>
          <Tooltip title="Refresh projects">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Create new project">
            <IconButton 
              onClick={() => setProjectDialogOpen(true)} 
              size="small" 
              color="primary"
              data-test="create-project-button"
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Projects list */}
      <List
        sx={{
          width: '100%',
          bgcolor: 'background.paper',
          overflow: 'auto',
          '& .MuiListItemButton-root.Mui-selected': {
            bgcolor: 'action.selected',
            borderLeft: '3px solid',
            borderLeftColor: 'primary.main',
            pl: 1.75, // Compensate for the border
          },
        }}
        component="nav"
        aria-label="projects list"
      >
        {loading ? (
          // Loading skeletons
          Array.from(new Array(3)).map((_, index) => (
            <ListItem key={`skeleton-${index}`} disablePadding>
              <ListItemButton disabled>
                <ListItemText
                  primary={<Skeleton width="80%" />}
                  secondary={<Skeleton width="40%" />}
                />
              </ListItemButton>
            </ListItem>
          ))
        ) : projects.length === 0 ? (
          // Empty state
          <ListItem>
            <ListItemText
              primary="No projects found"
              secondary={
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setProjectDialogOpen(true)}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Create your first project
                </Button>
              }
            />
          </ListItem>
        ) : (
          // Project list
          <>
            {projects.map((project) => (
              <ListItem key={project.id} disablePadding divider>
                <ListItemButton
                  selected={selectedProjectId === project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  data-test={`project-item-${project.id}`}
                >
                  <ListItemText
                    primary={project.name}
                    secondary={
                      <Typography variant="caption" color="text.secondary" component="span">
                        {new Date(project.created_at).toLocaleDateString()}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>

      {/* New Project Dialog */}
      <Dialog
        open={isProjectDialogOpen}
        onClose={() => !isSubmitting && setProjectDialogOpen(false)}
        aria-labelledby="create-project-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="create-project-dialog-title">
          Create New Project
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name for your new project. This will be used to organize your files and notes.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="project-name"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            disabled={isSubmitting}
            inputProps={{ maxLength: 50 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newProjectName.trim()) {
                handleCreateProject();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setProjectDialogOpen(false)}
            color="inherit"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            color="primary"
            variant="contained"
            disabled={!newProjectName.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProjectList; 
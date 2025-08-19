import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Collapse,
  IconButton,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import {
  FolderOpen as FolderOpenIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Folder as FolderIcon,
  GroupAdd as GroupAddIcon,
} from '@mui/icons-material';
import useAppStore from '../store';

// Define the Project type if not imported
interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  owner_id: string;
}

interface DemoProjectsListProps {
  className?: string;
}

const DemoProjectsList: React.FC<DemoProjectsListProps> = ({ className }) => {
  const [expanded, setExpanded] = useState(true);

  // Get projects and selected project from store
  const projects = useAppStore(state => state.projects);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const setSelectedProject = useAppStore(state => state.setSelectedProject);

  // Create a sample project
  const handleCreateProject = () => {
    // Generate new UUID-like ID
    const newId = `demo-project-${Math.floor(Math.random() * 1000000)}`;
    
    // Create new project
    const newProject = {
      id: newId,
      name: `New Project ${projects.length + 1}`,
      description: 'A new sample project',
      created_at: new Date().toISOString(),
      owner_id: '00000000-0000-0000-0000-000000000000'
    };
    
    // Add project to store
    useAppStore.setState(state => ({
      projects: [...state.projects, newProject],
      selectedProjectId: newId
    }));
  };

  return (
    <Paper 
      elevation={0}
      className={className}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Section Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          bgcolor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FolderOpenIcon sx={{ mr: 1, opacity: 0.7 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Projects
          </Typography>
          <Chip 
            label={projects.length} 
            size="small" 
            sx={{ ml: 1, height: 20, minWidth: 20 }} 
          />
        </Box>
        
        <Box>
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label="toggle projects"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Projects List */}
      <Collapse in={expanded}>
        <Box
          sx={{
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          <List dense disablePadding>
            {projects.map(project => (
              <ListItem key={project.id} disablePadding>
                <ListItemButton
                  selected={project.id === selectedProjectId}
                  onClick={() => setSelectedProject(project.id)}
                  sx={{
                    py: 1.5,
                    borderLeft: project.id === selectedProjectId ? 3 : 0,
                    borderLeftColor: 'primary.main',
                    '&.Mui-selected': {
                      bgcolor: theme => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FolderIcon color={project.id === selectedProjectId ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={project.name}
                    secondary={
                      project.description ? (
                        <Typography variant="caption" noWrap>
                          {project.description}
                        </Typography>
                      ) : null
                    }
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: project.id === selectedProjectId ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        
        <Divider />
        
        {/* Project Actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
            sx={{ flex: 1, mr: 1 }}
          >
            New Project
          </Button>
          <Tooltip title="Invite Team Member">
            <IconButton color="primary" size="small">
              <GroupAddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default DemoProjectsList;
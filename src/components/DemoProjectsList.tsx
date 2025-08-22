import React, { useState, useEffect, useCallback } from 'react';
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
  searchQuery?: string;
}

const DemoProjectsList: React.FC<DemoProjectsListProps> = ({ className, searchQuery = '' }) => {
  const [expanded, setExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Get projects and selected project from store
  const projects = useAppStore(state => state.projects);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const setSelectedProject = useAppStore(state => state.setSelectedProject);
  const files = useAppStore(state => state.files);
  
  // Filter projects based on search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      (project.description && project.description.toLowerCase().includes(query))
    );
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            handleCreateProject();
            break;
        }
      }
      // Arrow navigation for projects
      if (projects.length > 0 && document.activeElement?.closest('[data-testid^="project-item-"]')) {
        const currentIndex = projects.findIndex(p => p.id === selectedProjectId);
        if (e.key === 'ArrowDown' && currentIndex < projects.length - 1) {
          e.preventDefault();
          setSelectedProject(projects[currentIndex + 1].id);
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          e.preventDefault();
          setSelectedProject(projects[currentIndex - 1].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [projects, selectedProjectId, setSelectedProject]);

  // Create a sample project with loading state
  const handleCreateProject = useCallback(() => {
    setIsCreating(true);
    // Prompt for project name
    const projectName = prompt('Enter project name:', `Case ${projects.length + 1}`);
    if (!projectName) return;
    
    // Generate new UUID-like ID
    const newId = `demo-project-${Date.now()}`;
    
    // Create new project
    const newProject = {
      id: newId,
      name: projectName,
      description: prompt('Enter project description (optional):', '') || undefined,
      created_at: new Date().toISOString(),
      owner_id: '00000000-0000-0000-0000-000000000000'
    };
    
    // Simulate creation delay
    setTimeout(() => {
      // Add project to store and auto-select it (which will auto-select first file)
      useAppStore.setState(state => ({
        projects: [...state.projects, newProject],
        selectedProjectId: newId
      }));
      
      setIsCreating(false);
      console.log(`Created new project: ${projectName}`);
    }, 800);
  }, [projects.length]);

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
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      {/* Section Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          bgcolor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.02)',
          transition: 'background-color 0.2s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FolderOpenIcon sx={{ mr: 1, opacity: 0.7 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Projects
          </Typography>
          <Chip 
            label={filteredProjects.length} 
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
            sx={{
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.1)',
                bgcolor: 'action.hover',
              },
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Projects List */}
      <Collapse 
        in={expanded}
        timeout={300}
        sx={{
          '& .MuiCollapse-wrapperInner': {
            transition: 'opacity 0.2s ease',
          },
        }}
      >
        <Box>
          {filteredProjects.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'No projects match your search' : 'No projects yet'}
              </Typography>
            </Box>
          ) : (
          <List dense disablePadding>
            {filteredProjects.map((project, index) => {
              const projectFileCount = files.filter(f => f.project_id === project.id).length;
              return (
                <ListItem key={project.id} disablePadding>
                  <ListItemButton
                    selected={project.id === selectedProjectId}
                    onClick={() => setSelectedProject(project.id)}
                    data-testid={`project-item-${project.id}`}
                    sx={{
                      py: 1,
                      borderLeft: project.id === selectedProjectId ? 3 : 0,
                      borderLeftColor: 'primary.main',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: theme => theme.palette.mode === 'dark'
                          ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      },
                      '&.Mui-selected': {
                        bgcolor: theme => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                        transform: 'translateX(4px)',
                        boxShadow: theme => theme.palette.mode === 'dark'
                          ? '0 4px 12px rgba(67, 129, 250, 0.3)'
                          : '0 4px 12px rgba(67, 129, 250, 0.2)',
                        '&:hover': {
                          transform: 'translateX(6px)',
                        },
                      },
                      '&:active': {
                        transform: 'scale(0.98) translateX(2px)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FolderIcon 
                        color={project.id === selectedProjectId ? 'primary' : 'inherit'}
                        sx={{
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: project.id === selectedProjectId ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{project.name}</span>
                          {projectFileCount > 0 && (
                            <Chip 
                              label={projectFileCount} 
                              size="small" 
                              sx={{ 
                                height: 18, 
                                minWidth: 18,
                                fontSize: '0.65rem',
                                '& .MuiChip-label': { px: 0.5 }
                              }} 
                            />
                          )}
                        </Box>
                      }
                      secondary={project.description || null}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: project.id === selectedProjectId ? 600 : 400,
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        noWrap: true,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          )}
        </Box>
        
        <Divider />
        
        {/* Project Actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 0.5,
          }}
        >
          <Button
            variant="text"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
            disabled={isCreating}
            sx={{ 
              flex: 1, 
              mr: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 1,
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            {isCreating ? 'Creating...' : 'New Project (Ctrl+N)'}
          </Button>
          <Tooltip title="Invite Team Member">
            <IconButton 
              color="primary" 
              size="small" 
              onClick={() => {
                const email = prompt('Enter team member email address:');
                if (email && email.includes('@')) {
                  alert(`Invitation sent to ${email}!\n\nIn a real application, this would:\n• Send an email invitation\n• Add user to project permissions\n• Set up collaborative access`);
                } else if (email) {
                  alert('Please enter a valid email address');
                }
              }}
            >
              <GroupAddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default DemoProjectsList;
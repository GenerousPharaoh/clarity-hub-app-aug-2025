import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  Fade,
} from '@mui/material';
import {
  Close,
  Folder,
  Description,
  Group,
  CheckCircle,
} from '@mui/icons-material';
import useAppStore from '../store';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    type: 'legal',
    tags: [] as string[],
    collaborators: [] as string[],
  });
  const [currentTag, setCurrentTag] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { addProject, setSelectedProject } = useAppStore();

  const steps = ['Basic Info', 'Details', 'Review'];

  const handleNext = () => {
    if (activeStep === 0 && !projectData.name) {
      setError('Project name is required');
      return;
    }
    setError('');
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleCreate = () => {
    const newProject = {
      id: `project-${Date.now()}`,
      name: projectData.name,
      description: projectData.description,
      created_at: new Date().toISOString(),
      owner_id: 'demo-user',
      goal_type: projectData.type,
      tags: projectData.tags,
      collaborators: projectData.collaborators,
    };
    
    addProject(newProject);
    setSelectedProject(newProject.id);
    setSuccess(true);
    
    setTimeout(() => {
      onClose();
      setActiveStep(0);
      setProjectData({
        name: '',
        description: '',
        type: 'legal',
        tags: [],
        collaborators: [],
      });
      setSuccess(false);
    }, 1500);
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      setProjectData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProjectData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={projectData.name}
              onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Smith vs. Johnson Case"
              margin="normal"
              autoFocus
              error={!!error}
              helperText={error}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Project Type</InputLabel>
              <Select
                value={projectData.type}
                onChange={(e) => setProjectData(prev => ({ ...prev, type: e.target.value }))}
                label="Project Type"
              >
                <MenuItem value="legal">Legal Case</MenuItem>
                <MenuItem value="contract">Contract Review</MenuItem>
                <MenuItem value="research">Research Project</MenuItem>
                <MenuItem value="compliance">Compliance Audit</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Description"
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the project..."
              margin="normal"
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="Add Tags"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={addTag}
              placeholder="Press Enter to add tags"
              margin="normal"
              helperText="Tags help organize your projects"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {projectData.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => removeTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            {success ? (
              <Fade in={success}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" color="success.main">
                    Project Created Successfully!
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Review your project details before creating
                </Alert>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Folder sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Project Name
                    </Typography>
                    <Typography variant="h6">
                      {projectData.name || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Description sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>
                      {projectData.description || 'No description provided'}
                    </Typography>
                  </Box>
                </Box>
                {projectData.tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {projectData.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Create New Project
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.500',
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent()}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleBack} 
          disabled={activeStep === 0 || success}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button 
            onClick={handleCreate} 
            variant="contained"
            disabled={success}
          >
            Create Project
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateProjectDialog;
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  styled,
  alpha,
} from '@mui/material';
import {
  Close,
  Folder,
  Description,
  Group,
  CheckCircle,
} from '@mui/icons-material';
import { ProfessionalButton, ProfessionalTextField, ProfessionalCard } from './ui';
import { designTokens, professionalAnimations } from '../theme/index';
import useAppStore from '../store';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

// Professional styled dialog with enhanced aesthetics
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: designTokens.borderRadius.xl,
    boxShadow: theme.palette.mode === 'dark' 
      ? designTokens.shadows.dark.xl 
      : designTokens.shadows.interactive,
    border: `1px solid ${theme.palette.divider}`,
    backgroundImage: 'none',
    overflow: 'hidden',
  },
}));

// Professional dialog title with improved typography
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: designTokens.spacing[6],
  paddingBottom: designTokens.spacing[4],
  fontSize: designTokens.typography.fontSize.xl,
  fontWeight: designTokens.typography.fontWeight.semibold,
  color: theme.palette.text.primary,
  fontFamily: designTokens.typography.fontFamily.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  
  '& .MuiIconButton-root': {
    position: 'absolute',
    right: designTokens.spacing[4],
    top: designTokens.spacing[4],
    color: theme.palette.text.secondary,
    transition: professionalAnimations.createTransition(['color', 'background-color']),
    
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      color: theme.palette.text.primary,
    },
  },
}));

// Professional dialog content with proper spacing
const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: designTokens.spacing[6],
  paddingTop: designTokens.spacing[5],
  paddingBottom: designTokens.spacing[5],
  
  '&.MuiDialogContent-dividers': {
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

// Professional dialog actions with enhanced styling
const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: designTokens.spacing[6],
  paddingTop: designTokens.spacing[4],
  gap: designTokens.spacing[3],
  borderTop: `1px solid ${theme.palette.divider}`,
  
  '& .spacer': {
    flex: 1,
  },
}));

// Professional stepper with enhanced styling
const StyledStepper = styled(Stepper)(({ theme }) => ({
  marginBottom: designTokens.spacing[6],
  
  '& .MuiStepLabel-label': {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium,
    fontFamily: designTokens.typography.fontFamily.primary,
    
    '&.Mui-active': {
      color: theme.palette.primary.main,
      fontWeight: designTokens.typography.fontWeight.semibold,
    },
    
    '&.Mui-completed': {
      color: theme.palette.success.main,
    },
  },
  
  '& .MuiStepIcon-root': {
    fontSize: '1.5rem',
    
    '&.Mui-active': {
      color: theme.palette.primary.main,
    },
    
    '&.Mui-completed': {
      color: theme.palette.success.main,
    },
  },
}));

// Professional review section styling
const ReviewSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: designTokens.spacing[4],
  padding: designTokens.spacing[4],
  borderRadius: designTokens.borderRadius.lg,
  backgroundColor: theme.palette.mode === 'dark' 
    ? designTokens.colors.dark[100]
    : designTokens.colors.neutral[50],
  border: `1px solid ${theme.palette.divider}`,
  transition: professionalAnimations.createTransition(['background-color']),
  
  '& .icon': {
    marginRight: designTokens.spacing[3],
    color: theme.palette.primary.main,
    fontSize: '1.25rem',
  },
  
  '& .content': {
    flex: 1,
    minWidth: 0,
  },
  
  '& .label': {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: designTokens.typography.letterSpacing.wider,
    marginBottom: designTokens.spacing[1],
  },
  
  '& .value': {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.normal,
    color: theme.palette.text.primary,
    lineHeight: designTokens.typography.lineHeight.relaxed,
  },
}));

// Professional success animation
const SuccessContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: designTokens.spacing[8],
  
  '& .success-icon': {
    fontSize: '4rem',
    marginBottom: designTokens.spacing[4],
    color: theme.palette.success.main,
    animation: `${professionalAnimations.keyframes.scaleIn} ${designTokens.animations.duration.slow} ${designTokens.animations.easing.easeOut}`,
  },
  
  '& .success-text': {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: theme.palette.success.main,
    animation: `${professionalAnimations.keyframes.fadeIn} ${designTokens.animations.duration.slow} ${designTokens.animations.easing.easeOut} 200ms both`,
  },
}));

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
            <ProfessionalTextField
              fullWidth
              label="Project Name"
              value={projectData.name}
              onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Smith vs. Johnson Case"
              clearable
              autoFocus
              error={!!error}
              helperText={error}
              sx={{ marginBottom: designTokens.spacing[4] }}
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
            <ProfessionalTextField
              fullWidth
              label="Description"
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the project..."
              multiline
              rows={4}
              clearable
              sx={{ marginBottom: designTokens.spacing[4] }}
            />
            <ProfessionalTextField
              fullWidth
              label="Add Tags"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={addTag}
              placeholder="Press Enter to add tags"
              helperText="Tags help organize your projects"
              clearable
              sx={{ marginBottom: designTokens.spacing[3] }}
            />
            <Box sx={{ mt: designTokens.spacing[3], display: 'flex', flexWrap: 'wrap', gap: designTokens.spacing[2] }}>
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
            <SuccessContainer>
            <CheckCircle className="success-icon" />
            <Typography className="success-text">
            Project Created Successfully!
            </Typography>
            </SuccessContainer>
            </Fade>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Review your project details before creating
                </Alert>
                <ReviewSection>
                  <Folder className="icon" />
                  <Box className="content">
                    <Typography className="label">
                      Project Name
                    </Typography>
                    <Typography className="value">
                      {projectData.name || 'Not specified'}
                    </Typography>
                  </Box>
                </ReviewSection>
                <ReviewSection>
                  <Description className="icon" />
                  <Box className="content">
                    <Typography className="label">
                      Description
                    </Typography>
                    <Typography className="value">
                      {projectData.description || 'No description provided'}
                    </Typography>
                  </Box>
                </ReviewSection>
                {projectData.tags.length > 0 && (
                  <ReviewSection>
                    <Box className="content">
                      <Typography className="label">
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: designTokens.spacing[2] }}>
                        {projectData.tags.map(tag => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small"
                            sx={{
                              backgroundColor: alpha(designTokens.colors.primary[500], 0.08),
                              color: designTokens.colors.primary[500],
                              fontSize: designTokens.typography.fontSize.xs,
                              fontWeight: designTokens.typography.fontWeight.medium,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </ReviewSection>
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
    <StyledDialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <StyledDialogTitle>
        Create New Project
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </StyledDialogTitle>
      
      <StyledDialogContent dividers>
        <StyledStepper activeStep={activeStep}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </StyledStepper>
        
        {renderStepContent()}
      </StyledDialogContent>
      
      <StyledDialogActions>
        <ProfessionalButton 
          variant="text"
          onClick={handleBack} 
          disabled={activeStep === 0 || success}
        >
          Back
        </ProfessionalButton>
        <Box className="spacer" />
        <ProfessionalButton 
          variant="outlined" 
          onClick={onClose}
        >
          Cancel
        </ProfessionalButton>
        {activeStep === steps.length - 1 ? (
          <ProfessionalButton 
            variant="contained"
            onClick={handleCreate} 
            disabled={success}
            loading={success}
          >
            Create Project
          </ProfessionalButton>
        ) : (
          <ProfessionalButton 
            variant="contained"
            onClick={handleNext}
          >
            Next
          </ProfessionalButton>
        )}
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default CreateProjectDialog;
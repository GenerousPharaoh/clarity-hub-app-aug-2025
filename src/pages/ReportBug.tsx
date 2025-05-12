import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Divider,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  IconButton,
  Grid,
  Stack
} from '@mui/material';
import { 
  BugReport, 
  ArrowBack, 
  Send,
  Description,
  Category,
  HighlightOff,
  Screenshot,
  AttachFile
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import errorHandlingService from '../services/errorHandlingService';
import { useAuth } from '../contexts/AuthContext';

// Bug categories
const bugCategories = [
  { id: 'ui', label: 'User Interface' },
  { id: 'performance', label: 'Performance' },
  { id: 'functionality', label: 'Functionality' },
  { id: 'data', label: 'Data/Content' },
  { id: 'auth', label: 'Authentication/Permissions' },
  { id: 'other', label: 'Other' }
];

// Bug severity levels
const bugSeverityLevels = [
  { id: 'low', label: 'Low - Minor issue, doesn\'t affect work' },
  { id: 'medium', label: 'Medium - Affects work but has workaround' },
  { id: 'high', label: 'High - Significantly impacts work' },
  { id: 'critical', label: 'Critical - Completely blocks work' }
];

const ReportBug: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    severity: 'medium',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    includeSystemInfo: true,
    includeRecentErrors: true,
    includeScreenshot: false
  });
  const [files, setFiles] = useState<File[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Get recent errors from error service
  const recentErrors = errorHandlingService.getErrorHistory();
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear error for this field if it exists
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Get only image files and limit to 3 files
      const imageFiles = Array.from(e.target.files).filter(
        file => file.type.startsWith('image/')
      ).slice(0, 3);
      
      setFiles(prev => [...prev, ...imageFiles]);
      
      // Set the includeScreenshot flag to true if files were uploaded
      if (imageFiles.length > 0) {
        setFormData(prev => ({ ...prev, includeScreenshot: true }));
      }
    }
  };
  
  // Remove a file from the upload list
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    // If no files remain, update the includeScreenshot state
    if (files.length === 1) {
      setFormData(prev => ({ ...prev, includeScreenshot: false }));
    }
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Please provide a title for the bug report';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Please describe the issue';
    }
    
    if (!formData.category) {
      errors.category = 'Please select a category';
    }
    
    setFormErrors(errors);
    
    return Object.keys(errors).length === 0;
  };
  
  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Collect system information if enabled
      const systemInfo = formData.includeSystemInfo
        ? {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dateTime: new Date().toISOString()
          }
        : null;
      
      // Collect recent errors if enabled
      const errorLogs = formData.includeRecentErrors
        ? recentErrors.slice(0, 5).map(err => err.toJSON())
        : null;
      
      // Prepare report data
      const reportData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        stepsToReproduce: formData.stepsToReproduce,
        expectedBehavior: formData.expectedBehavior,
        actualBehavior: formData.actualBehavior,
        systemInfo,
        errorLogs,
        userId: user?.id,
        userEmail: user?.email,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        hasAttachments: files.length > 0
      };
      
      // For demo purposes, just log the data we'd send
      console.log('Bug report data:', reportData);
      console.log('Files to upload:', files);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSubmitSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          category: '',
          severity: 'medium',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: '',
          includeSystemInfo: true,
          includeRecentErrors: true,
          includeScreenshot: false
        });
        setFiles([]);
        setSubmitting(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting bug report:', error);
      setSubmitting(false);
      
      // Handle error with error service
      errorHandlingService.captureError(
        error instanceof Error ? error : new Error('Failed to submit bug report'),
        { context: 'bug_report_submission' }
      );
    }
  };
  
  // Close the success message
  const handleCloseSuccess = () => {
    setSubmitSuccess(false);
    
    // Navigate back after successful submission
    navigate(-1);
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 2, sm: 4 }, 
          borderRadius: 2,
          border: theme => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => navigate(-1)} 
            sx={{ mr: 2 }}
            aria-label="Go back"
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BugReport color="error" sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography variant="h5" component="h1" fontWeight={600}>
              Report a Bug
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Please provide as much detail as possible to help us identify and fix the issue quickly.
          All fields marked with * are required.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bug Title*"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!formErrors.title}
                helperText={formErrors.title || 'Provide a brief, descriptive title for the issue'}
                required
                InputProps={{
                  startAdornment: <Description fontSize="small" color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            
            {/* Category & Severity */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.category}>
                <InputLabel id="category-label">Category*</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  startAdornment={<Category fontSize="small" color="action" sx={{ mr: 1 }} />}
                  label="Category*"
                >
                  {bugCategories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {formErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="severity-label">Severity</InputLabel>
                <Select
                  labelId="severity-label"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  label="Severity"
                >
                  {bugSeverityLevels.map(level => (
                    <MenuItem key={level.id} value={level.id}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bug Description*"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={!!formErrors.description}
                helperText={formErrors.description || 'Describe what happened and what you expected to happen'}
                multiline
                rows={4}
                required
              />
            </Grid>
            
            {/* Steps to Reproduce */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Steps to Reproduce"
                name="stepsToReproduce"
                value={formData.stepsToReproduce}
                onChange={handleChange}
                helperText="Provide step-by-step instructions on how to reproduce the issue"
                multiline
                rows={3}
              />
            </Grid>
            
            {/* Expected & Actual Behavior */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expected Behavior"
                name="expectedBehavior"
                value={formData.expectedBehavior}
                onChange={handleChange}
                helperText="What you expected to happen"
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Actual Behavior"
                name="actualBehavior"
                value={formData.actualBehavior}
                onChange={handleChange}
                helperText="What actually happened"
                multiline
                rows={2}
              />
            </Grid>
            
            {/* File Upload */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Attachments (Optional)
                </Typography>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Screenshot />}
                  sx={{ mr: 2 }}
                >
                  Add Screenshots
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleFileUpload}
                  />
                </Button>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Up to 3 image files, max 5MB each
                </Typography>
              </Box>
              
              {/* File List */}
              {files.length > 0 && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Attached Files ({files.length})
                  </Typography>
                  
                  <Stack spacing={1}>
                    {files.map((file, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 1,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <AttachFile fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
                        <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => removeFile(index)}
                          aria-label="Remove file"
                        >
                          <HighlightOff fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Grid>
            
            {/* Additional Options */}
            <Grid item xs={12}>
              <Box sx={{ mt: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.includeSystemInfo}
                      onChange={handleCheckboxChange}
                      name="includeSystemInfo"
                    />
                  }
                  label="Include system information (browser, OS, screen size)"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.includeRecentErrors}
                      onChange={handleCheckboxChange}
                      name="includeRecentErrors"
                    />
                  }
                  label="Include recent error logs"
                />
              </Box>
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{ mr: 2 }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<Send />}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Success Message */}
      <Snackbar
        open={submitSuccess}
        autoHideDuration={5000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSuccess}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Thank you! Your bug report has been submitted successfully.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReportBug; 
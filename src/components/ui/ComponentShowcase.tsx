import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Stack,
  Alert,
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Rating,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Badge,
  Avatar,
  styled,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { 
  ProfessionalButton, 
  ProfessionalTextField, 
  ProfessionalCard,
  designTokens 
} from './index';

// Professional showcase container
const ShowcaseSection = styled(Box)(({ theme }) => ({
  marginBottom: designTokens.spacing[10],
  
  '& .section-title': {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: theme.palette.text.primary,
    marginBottom: designTokens.spacing[6],
    fontFamily: designTokens.typography.fontFamily.primary,
  },
  
  '& .section-subtitle': {
    fontSize: designTokens.typography.fontSize.sm,
    color: theme.palette.text.secondary,
    marginBottom: designTokens.spacing[4],
    lineHeight: designTokens.typography.lineHeight.relaxed,
  },
  
  '& .component-group': {
    padding: designTokens.spacing[6],
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: designTokens.spacing[4],
  },
  
  '& .component-label': {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: designTokens.typography.letterSpacing.wider,
    marginBottom: designTokens.spacing[3],
  },
}));

// Sample data for tables
const sampleTableData = [
  { id: 1, name: 'Smith v. Johnson', status: 'Active', priority: 'High', date: '2024-01-15' },
  { id: 2, name: 'Contract Review - ABC Corp', status: 'Review', priority: 'Medium', date: '2024-01-12' },
  { id: 3, name: 'Compliance Audit', status: 'Completed', priority: 'Low', date: '2024-01-10' },
];

export const ComponentShowcase: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [switchValue, setSwitchValue] = React.useState(false);
  const [sliderValue, setSliderValue] = React.useState(50);
  const [ratingValue, setRatingValue] = React.useState(4);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: designTokens.spacing[6] }}>
      <Box sx={{ textAlign: 'center', marginBottom: designTokens.spacing[10] }}>
        <Typography 
          variant="h2" 
          sx={{
            fontSize: designTokens.typography.fontSize['4xl'],
            fontWeight: designTokens.typography.fontWeight.bold,
            marginBottom: designTokens.spacing[4],
          }}
        >
          Professional Design System
        </Typography>
        <Typography 
          sx={{
            fontSize: designTokens.typography.fontSize.lg,
            color: 'text.secondary',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: designTokens.typography.lineHeight.relaxed,
          }}
        >
          Google Docs-inspired components for legal case management software with 
          professional aesthetics and micro-interactions.
        </Typography>
      </Box>

      {/* Buttons Section */}
      <ShowcaseSection>
        <Typography className="section-title">Buttons</Typography>
        <Typography className="section-subtitle">
          Professional button components with hover effects and loading states
        </Typography>
        
        <Box className="component-group">
          <Typography className="component-label">Button Variants</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <ProfessionalButton variant="contained">
              Contained
            </ProfessionalButton>
            <ProfessionalButton variant="outlined">
              Outlined
            </ProfessionalButton>
            <ProfessionalButton variant="text">
              Text
            </ProfessionalButton>
            <ProfessionalButton variant="soft">
              Soft
            </ProfessionalButton>
          </Stack>
        </Box>
        
        <Box className="component-group">
          <Typography className="component-label">Button Sizes</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <ProfessionalButton size="small" variant="contained">
              Small
            </ProfessionalButton>
            <ProfessionalButton size="medium" variant="contained">
              Medium
            </ProfessionalButton>
            <ProfessionalButton size="large" variant="contained">
              Large
            </ProfessionalButton>
          </Stack>
        </Box>
        
        <Box className="component-group">
          <Typography className="component-label">Button States</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <ProfessionalButton variant="contained" icon={<AddIcon />}>
              With Icon
            </ProfessionalButton>
            <ProfessionalButton variant="contained" loading>
              Loading
            </ProfessionalButton>
            <ProfessionalButton variant="contained" disabled>
              Disabled
            </ProfessionalButton>
            <ProfessionalButton variant="outlined" rounded>
              Rounded
            </ProfessionalButton>
          </Stack>
        </Box>
      </ShowcaseSection>

      {/* Cards Section */}
      <ShowcaseSection>
        <Typography className="section-title">Cards</Typography>
        <Typography className="section-subtitle">
          Professional card components with different variants and hover effects
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <ProfessionalCard 
              variant="elevated"
              header="Elevated Card"
              actions={
                <>
                  <ProfessionalButton variant="text" size="small">
                    Edit
                  </ProfessionalButton>
                  <ProfessionalButton variant="contained" size="small">
                    View
                  </ProfessionalButton>
                </>
              }
            >
              This is an elevated card with shadow and hover effects. Perfect for 
              displaying important content that needs to stand out.
            </ProfessionalCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <ProfessionalCard 
              variant="outlined"
              header="Outlined Card"
              interactive
              onClick={() => console.log('Card clicked')}
            >
              This is an outlined card that's interactive. Click on it to see the 
              hover and focus effects in action.
            </ProfessionalCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <ProfessionalCard variant="filled" header="Filled Card">
              This is a filled card with a subtle background color. Great for 
              secondary content or grouped information.
            </ProfessionalCard>
          </Grid>
        </Grid>
      </ShowcaseSection>

      {/* Text Fields Section */}
      <ShowcaseSection>
        <Typography className="section-title">Text Fields</Typography>
        <Typography className="section-subtitle">
          Professional input components with enhanced focus states and validation
        </Typography>
        
        <Box className="component-group">
          <Typography className="component-label">Field Variants</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ProfessionalTextField
                fullWidth
                label="Outlined Field"
                placeholder="Enter text..."
                clearable
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ProfessionalTextField
                fullWidth
                label="With Helper Text"
                placeholder="Enter text..."
                helperText="This is helper text"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ProfessionalTextField
                fullWidth
                label="Error State"
                placeholder="Enter text..."
                error
                helperText="This field has an error"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ProfessionalTextField
                fullWidth
                label="Password Field"
                type="password"
                passwordToggle
                placeholder="Enter password..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ProfessionalTextField
                fullWidth
                label="Multiline Field"
                multiline
                rows={3}
                placeholder="Enter long text..."
                clearable
              />
            </Grid>
          </Grid>
        </Box>
      </ShowcaseSection>

      {/* Material-UI Components with Professional Theme */}
      <ShowcaseSection>
        <Typography className="section-title">Enhanced MUI Components</Typography>
        <Typography className="section-subtitle">
          Standard Material-UI components enhanced with professional styling
        </Typography>
        
        <Box className="component-group">
          <Typography className="component-label">Navigation & Controls</Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Overview" />
                <Tab label="Documents" />
                <Tab label="Timeline" />
                <Tab label="Settings" />
              </Tabs>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={switchValue} 
                      onChange={(e) => setSwitchValue(e.target.checked)} 
                    />
                  } 
                  label="Enable notifications" 
                />
                <Box sx={{ width: '100%' }}>
                  <Typography gutterBottom>Progress</Typography>
                  <LinearProgress variant="determinate" value={75} />
                </Box>
                <Box sx={{ width: '100%' }}>
                  <Typography gutterBottom>Slider</Typography>
                  <Slider 
                    value={sliderValue} 
                    onChange={(e, value) => setSliderValue(value as number)}
                  />
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Box>
        
        <Box className="component-group">
          <Typography className="component-label">Feedback & Display</Typography>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Alert severity="success">Success message with professional styling</Alert>
              <Alert severity="warning">Warning message for important notices</Alert>
              <Alert severity="error">Error message with clear indication</Alert>
              <Alert severity="info">Info message for additional context</Alert>
            </Stack>
            
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Chip label="Active" color="success" />
              <Chip label="Pending" color="warning" />
              <Chip label="Priority" color="error" />
              <Chip label="Draft" variant="outlined" onDelete={() => {}} />
              <Badge badgeContent={4} color="primary">
                <Avatar><PersonIcon /></Avatar>
              </Badge>
            </Stack>
            
            <Box>
              <Typography gutterBottom>Rating Component</Typography>
              <Rating 
                value={ratingValue} 
                onChange={(e, value) => setRatingValue(value || 0)}
                icon={<StarIcon fontSize="inherit" />}
              />
            </Box>
          </Stack>
        </Box>
        
        <Box className="component-group">
          <Typography className="component-label">Collapsible Content</Typography>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Case Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                This accordion contains detailed information about the case, 
                including key documents, timeline, and involved parties.
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Document History</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                View all document revisions, comments, and collaboration history 
                for this case.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      </ShowcaseSection>

      {/* Data Display Section */}
      <ShowcaseSection>
        <Typography className="section-title">Data Display</Typography>
        <Typography className="section-subtitle">
          Professional tables and data presentation components
        </Typography>
        
        <Box className="component-group">
          <Typography className="component-label">Professional Table</Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Case Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleTableData.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell component="th" scope="row">
                      <Typography fontWeight="medium">{row.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={row.status} 
                        color={row.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={row.priority}
                        color={row.priority === 'High' ? 'error' : row.priority === 'Medium' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <ProfessionalButton 
                          size="small" 
                          variant="text" 
                          icon={<EditIcon />}
                        >
                          Edit
                        </ProfessionalButton>
                        <ProfessionalButton 
                          size="small" 
                          variant="text" 
                          icon={<DeleteIcon />}
                        >
                          Delete
                        </ProfessionalButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </ShowcaseSection>

      {/* Color Palette Section */}
      <ShowcaseSection>
        <Typography className="section-title">Color System</Typography>
        <Typography className="section-subtitle">
          Professional color palette optimized for legal document work
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box className="component-group">
              <Typography className="component-label">Primary Colors</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <Box
                    key={shade}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      backgroundColor: designTokens.colors.primary[shade as keyof typeof designTokens.colors.primary],
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: shade > 500 ? 'white' : 'black',
                    }}
                  >
                    {shade}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box className="component-group">
              <Typography className="component-label">Semantic Colors</Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    backgroundColor: designTokens.colors.success[500] 
                  }} />
                  <Typography>Success</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    backgroundColor: designTokens.colors.warning[500] 
                  }} />
                  <Typography>Warning</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    backgroundColor: designTokens.colors.error[500] 
                  }} />
                  <Typography>Error</Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </ShowcaseSection>
    </Box>
  );
};

export default ComponentShowcase;
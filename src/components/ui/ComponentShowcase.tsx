import React, { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Stack,
  Chip,
  Slider,
  Switch,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  InputLabel,
  Alert,
  AlertTitle,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Tabs,
  Tab,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  Rating,
  styled,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { 
  ProfessionalButton, 
  ProfessionalTextField, 
  ProfessionalCard
} from './index';

// Professional showcase container
const ShowcaseSection = styled(Box)(({ theme }) => ({
  marginBottom: '2.5rem',
  
  '& .section-title': {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: '1.5rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  '& .section-description': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginBottom: '1rem',
    lineHeight: 1.6,
  },
  
  '& .component-demo': {
    padding: '1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: '1rem',
  },
  
  '& .demo-label': {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
}));

// Sample data for demonstrations
const sampleMenuItems = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

const ComponentShowcase: React.FC = () => {
  const [sliderValue, setSliderValue] = useState(50);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectValue, setSelectValue] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [ratingValue, setRatingValue] = useState(4);
  const [textFieldValue, setTextFieldValue] = useState('');
  const [radioValue, setRadioValue] = useState('option1');

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectValue(event.target.value);
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
      <Box sx={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <Typography
          variant="h2"
          sx={{
            fontSize: '3rem',
            fontWeight: 700,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Professional Component Library
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{
            fontSize: '1.125rem',
            maxWidth: 800,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Google Docs-inspired design system for the LegalCaseNavigator.
          Premium components with professional styling and smooth micro-interactions.
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Buttons Section */}
      <ShowcaseSection>
        <Typography className="section-title">Professional Buttons</Typography>
        <Typography className="section-description">
          Enhanced buttons with loading states, icons, and professional hover effects.
        </Typography>
        
        <Box className="component-demo">
          <Typography className="demo-label">Button Variants</Typography>
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

        <Box className="component-demo">
          <Typography className="demo-label">Button Sizes</Typography>
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

        <Box className="component-demo">
          <Typography className="demo-label">With Icons</Typography>
          <Stack direction="row" spacing={2}>
            <ProfessionalButton
              variant="contained"
              icon={<SaveIcon />}
            >
              Save
            </ProfessionalButton>
            <ProfessionalButton
              variant="outlined"
              icon={<EditIcon />}
            >
              Edit
            </ProfessionalButton>
            <ProfessionalButton
              variant="soft"
              icon={<AddIcon />}
            >
              Add New
            </ProfessionalButton>
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Loading States</Typography>
          <Stack direction="row" spacing={2}>
            <ProfessionalButton
              variant="contained"
              loading
            >
              Loading...
            </ProfessionalButton>
            <ProfessionalButton
              variant="outlined"
              loading
            >
              Processing
            </ProfessionalButton>
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Disabled States</Typography>
          <Stack direction="row" spacing={2}>
            <ProfessionalButton
              variant="contained"
              disabled
            >
              Disabled
            </ProfessionalButton>
            <ProfessionalButton
              variant="outlined"
              disabled
            >
              Disabled
            </ProfessionalButton>
          </Stack>
        </Box>
      </ShowcaseSection>

      <Divider sx={{ my: 4 }} />

      {/* Text Fields Section */}
      <ShowcaseSection>
        <Typography className="section-title">Professional Text Fields</Typography>
        <Typography className="section-description">
          Enhanced input fields with clear buttons, password toggles, and professional styling.
        </Typography>
        
        <Box className="component-demo">
          <Typography className="demo-label">Field Variants</Typography>
          <Stack spacing={2}>
            <ProfessionalTextField
              label="Outlined Input"
              variant="outlined"
              placeholder="Enter text..."
              value={textFieldValue}
              onChange={(e) => setTextFieldValue(e.target.value)}
              clearable
            />
            <ProfessionalTextField
              label="Filled Input"
              variant="filled"
              placeholder="Enter text..."
            />
            <ProfessionalTextField
              label="Standard Input"
              variant="standard"
              placeholder="Enter text..."
            />
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Special Fields</Typography>
          <Stack spacing={2}>
            <ProfessionalTextField
              label="Password Field"
              type="password"
              variant="outlined"
              passwordToggle
              helperText="Must be at least 8 characters"
            />
            <ProfessionalTextField
              label="With Error"
              variant="outlined"
              error
              helperText="This field is required"
            />
            <ProfessionalTextField
              label="Disabled Field"
              variant="outlined"
              disabled
              value="Cannot edit this"
            />
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Multiline Fields</Typography>
          <ProfessionalTextField
            label="Comments"
            variant="outlined"
            multiline
            rows={4}
            placeholder="Enter your comments here..."
            helperText="Maximum 500 characters"
          />
        </Box>
      </ShowcaseSection>

      <Divider sx={{ my: 4 }} />

      {/* Cards Section */}
      <ShowcaseSection>
        <Typography className="section-title">Professional Cards</Typography>
        <Typography className="section-description">
          Enhanced cards with variants, interactivity, and professional styling.
        </Typography>
        
        <Box className="component-demo">
          <Typography className="demo-label">Card Variants</Typography>
          <Stack spacing={2}>
            <ProfessionalCard variant="elevated">
              <Typography variant="h6" gutterBottom>Elevated Card</Typography>
              <Typography variant="body2" color="text.secondary">
                This card has a subtle shadow that gives it an elevated appearance.
                Perfect for highlighting important content.
              </Typography>
            </ProfessionalCard>
            
            <ProfessionalCard variant="outlined">
              <Typography variant="h6" gutterBottom>Outlined Card</Typography>
              <Typography variant="body2" color="text.secondary">
                This card uses a border instead of shadow for a cleaner look.
                Great for list items and secondary content.
              </Typography>
            </ProfessionalCard>
            
            <ProfessionalCard variant="filled">
              <Typography variant="h6" gutterBottom>Filled Card</Typography>
              <Typography variant="body2" color="text.secondary">
                This card has a subtle background color for visual separation.
                Ideal for grouping related content.
              </Typography>
            </ProfessionalCard>
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Interactive Cards</Typography>
          <ProfessionalCard
            variant="elevated"
            interactive
            hover
            onClick={() => setShowSnackbar(true)}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: '#2563eb' }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Click Me!</Typography>
                <Typography variant="body2" color="text.secondary">
                  This card is interactive with hover effects
                </Typography>
              </Box>
              <IconButton size="small">
                <ExpandMoreIcon />
              </IconButton>
            </Stack>
          </ProfessionalCard>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Loading Card</Typography>
          <ProfessionalCard variant="elevated" loading>
            <Typography variant="h6" gutterBottom>Loading Content...</Typography>
            <Typography variant="body2" color="text.secondary">
              This card shows a loading state while content is being fetched.
            </Typography>
          </ProfessionalCard>
        </Box>
      </ShowcaseSection>

      <Divider sx={{ my: 4 }} />

      {/* Additional Components */}
      <ShowcaseSection>
        <Typography className="section-title">Additional Components</Typography>
        <Typography className="section-description">
          Other Material-UI components with professional styling applied.
        </Typography>
        
        <Box className="component-demo">
          <Typography className="demo-label">Form Controls</Typography>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Select Option</InputLabel>
              <Select
                value={selectValue}
                label="Select Option"
                onChange={handleSelectChange}
              >
                {sampleMenuItems.map((item) => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>Slider: {sliderValue}</Typography>
              <Slider
                value={sliderValue}
                onChange={(_, value) => setSliderValue(value as number)}
                valueLabelDisplay="auto"
                color="primary"
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={switchChecked}
                  onChange={(e) => setSwitchChecked(e.target.checked)}
                />
              }
              label="Toggle Setting"
            />

            <FormControl>
              <FormLabel>Radio Options</FormLabel>
              <RadioGroup
                value={radioValue}
                onChange={(e) => setRadioValue(e.target.value)}
              >
                <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
                <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
                <FormControlLabel value="option3" control={<Radio />} label="Option 3" />
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="I agree to the terms"
            />
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Feedback Components</Typography>
          <Stack spacing={2}>
            <Alert severity="success">
              <AlertTitle>Success</AlertTitle>
              Operation completed successfully!
            </Alert>
            <Alert severity="info">
              <AlertTitle>Information</AlertTitle>
              Here's some helpful information for you.
            </Alert>
            <Alert severity="warning">
              <AlertTitle>Warning</AlertTitle>
              Please review this important notice.
            </Alert>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              Something went wrong. Please try again.
            </Alert>
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Progress Indicators</Typography>
          <Stack spacing={3}>
            <Box>
              <Typography gutterBottom>Linear Progress</Typography>
              <LinearProgress variant="determinate" value={65} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={40} />
              <Typography>Loading...</Typography>
            </Box>
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Navigation</Typography>
          <Tabs
            value={selectedTab}
            onChange={(_, value) => setSelectedTab(value)}
            variant="fullWidth"
          >
            <Tab label="Tab One" />
            <Tab label="Tab Two" />
            <Tab label="Tab Three" />
          </Tabs>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Data Display</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Chip label="Default" />
            <Chip label="Primary" color="primary" />
            <Chip label="Success" color="success" />
            <Chip label="Warning" color="warning" />
            <Chip label="Error" color="error" />
            <Chip label="Deletable" onDelete={() => {}} />
            <Chip
              avatar={<Avatar>A</Avatar>}
              label="With Avatar"
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Interactive Elements</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title="Save Document">
              <IconButton color="primary">
                <SaveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Document">
              <IconButton>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Document">
              <IconButton color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Badge badgeContent={4} color="primary">
              <IconButton>
                <StarIcon />
              </IconButton>
            </Badge>
            <Box>
              <Typography component="legend">Rating</Typography>
              <Rating
                value={ratingValue}
                onChange={(_, value) => setRatingValue(value || 0)}
              />
            </Box>
          </Stack>
        </Box>

        <Box className="component-demo">
          <Typography className="demo-label">Color Palette</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <Box
                key={shade}
                sx={{
                  width: 60,
                  height: 60,
                  backgroundColor: shade === 500 ? '#2563eb' : `rgba(37, 99, 235, ${shade / 1000})`,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: shade >= 500 ? 'white' : 'black',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {shade}
              </Box>
            ))}
          </Stack>
          
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip 
              label="Success" 
              sx={{ 
                backgroundColor: '#10b981',
                color: 'white' 
              }} 
            />
            <Chip 
              label="Warning" 
              sx={{ 
                backgroundColor: '#f59e0b',
                color: 'white' 
              }} 
            />
            <Chip 
              label="Error" 
              sx={{ 
                backgroundColor: '#ef4444',
                color: 'white' 
              }} 
            />
          </Stack>
        </Box>
      </ShowcaseSection>

      {/* Snackbar for interactions */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message="Card clicked! This is an interactive element."
      />
    </Box>
  );
};

export default ComponentShowcase;
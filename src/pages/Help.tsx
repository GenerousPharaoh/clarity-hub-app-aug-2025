import React from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  alpha,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  HelpOutline,
  ContactSupport,
  Book,
  VideoLibrary,
  Email,
  Phone,
  Chat,
  CheckCircle,
} from '@mui/icons-material';

const Help = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const faqs = [
    {
      question: 'How do I create a new project?',
      answer: 'To create a new project, use the project dropdown in the top navigation bar and select "Create New Project". Enter a name and optional description, then click Create.',
      category: 'Getting Started'
    },
    {
      question: 'How do I upload files?',
      answer: 'You can upload files by clicking the "Upload" button in the left panel, or by dragging and dropping files directly into the file area.',
      category: 'Files'
    },
    {
      question: 'Can I collaborate with team members?',
      answer: 'Yes! You can invite team members to your projects. Each member can have different permission levels for viewing and editing.',
      category: 'Collaboration'
    },
    {
      question: 'How do I export my documents?',
      answer: 'Navigate to the file you want to export, click the menu icon, and select "Export". You can choose from various formats including PDF, Word, and plain text.',
      category: 'Files'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, all data is encrypted both in transit and at rest. We use industry-standard security protocols to protect your legal documents.',
      category: 'Security'
    },
    {
      question: 'How do I organize my files?',
      answer: 'Files are organized within projects. You can create multiple projects to separate different cases or matters, and use the search feature to quickly find specific files.',
      category: 'Organization'
    },
  ];

  const supportOptions = [
    {
      icon: <Email />,
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      action: 'support@clarityhub.com',
      buttonText: 'Send Email',
    },
    {
      icon: <Chat />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Available Mon-Fri, 9AM-5PM',
      buttonText: 'Start Chat',
    },
    {
      icon: <Phone />,
      title: 'Phone Support',
      description: 'Talk to a support specialist',
      action: '1-800-CLARITY',
      buttonText: 'Call Now',
    },
  ];

  const resources = [
    { icon: <Book />, title: 'Documentation', description: 'Comprehensive guides and tutorials' },
    { icon: <VideoLibrary />, title: 'Video Tutorials', description: 'Step-by-step video walkthroughs' },
    { icon: <ContactSupport />, title: 'Community Forum', description: 'Connect with other users' },
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
          Help & Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find answers, get support, and learn how to make the most of Clarity Hub
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
            },
          }}
        />
      </Paper>

      <Grid container spacing={3}>
        {/* FAQs Section */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Frequently Asked Questions
            </Typography>
            
            {filteredFaqs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <HelpOutline sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  No results found for "{searchQuery}"
                </Typography>
              </Box>
            ) : (
              filteredFaqs.map((faq, index) => (
                <Accordion 
                  key={index}
                  elevation={0}
                  sx={{ 
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:before': {
                      display: 'none',
                    },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography sx={{ flex: 1 }}>{faq.question}</Typography>
                      <Chip 
                        label={faq.category} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 2 }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Paper>
        </Grid>

        {/* Support Options */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Contact Support
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {supportOptions.map((option, index) => (
                <Card 
                  key={index}
                  elevation={0}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box 
                        sx={{ 
                          p: 1, 
                          borderRadius: 1, 
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          mr: 2,
                        }}
                      >
                        {React.cloneElement(option.icon, { sx: { color: 'primary.main' } })}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {option.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                      {option.action}
                    </Typography>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      size="small"
                      sx={{
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                        }
                      }}
                    >
                      {option.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>

          {/* Resources */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Resources
            </Typography>
            
            <List disablePadding>
              {resources.map((resource, index) => (
                <ListItemButton 
                  key={index}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    {resource.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={resource.title}
                    secondary={resource.description}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Tips */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          mt: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Tips
        </Typography>
        <Grid container spacing={2}>
          {[
            'Use keyboard shortcuts for faster navigation (Ctrl+N for new file)',
            'Drag and drop files directly into the file panel',
            'Use the search bar to quickly find files across all projects',
            'Click the project dropdown to switch between cases',
          ].map((tip, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 20, mt: 0.5 }} />
                <Typography variant="body2">{tip}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Help;
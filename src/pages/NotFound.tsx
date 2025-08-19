import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { ArrowBack, ErrorOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Paper
        elevation={2}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 2,
          maxWidth: '600px',
          width: '100%'
        }}
      >
        <ErrorOutline 
          sx={{ 
            fontSize: 80, 
            color: 'error.main',
            opacity: 0.8,
            mb: 4
          }} 
        />
        <Typography variant="h3" component="h1" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The page you're looking for doesn't exist or you may not have permission to view it.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 
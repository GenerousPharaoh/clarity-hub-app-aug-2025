import React from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { Description as DocumentIcon } from '@mui/icons-material';

interface DocumentViewerProps {
  url: string;
  fileName?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  url,
  fileName,
  onLoad,
  onError
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Generate mock document content
  const generateMockContent = () => {
    return (
      <Box sx={{ 
        p: 4, 
        bgcolor: 'background.paper', 
        borderRadius: 1, 
        boxShadow: 1,
        width: '100%',
        maxWidth: 800,
        mx: 'auto',
      }}>
        <Typography variant="h5" gutterBottom>
          Document Title
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Author: Demo User | Date: May 16, 2025
        </Typography>
        
        <Typography variant="body1" paragraph>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Section 1: Introduction
        </Typography>
        
        <Typography variant="body1" paragraph>
          Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Donec non enim in turpis pulvinar facilisis. Ut felis.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Section 2: Methodology
        </Typography>
        
        <Typography variant="body1" paragraph>
          Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus. Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi.
        </Typography>
        
        <Box 
          sx={{ 
            borderLeft: 4, 
            borderColor: 'primary.main', 
            pl: 2, 
            py: 1, 
            my: 3,
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="body1" fontStyle="italic">
            Note: This is a demo document viewer. In a real application, this would display the actual document content.
          </Typography>
        </Box>
      </Box>
    );
  };
  
  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      
      // Call onLoad handler
      if (onLoad) {
        onLoad();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [onLoad]);
  
  // Handle errors
  React.useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error, onError]);
  
  return (
    <Box 
      sx={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with file name */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <DocumentIcon sx={{ mr: 1 }} />
        <Typography variant="subtitle2">
          {fileName || 'Document Viewer'}
        </Typography>
      </Paper>
      
      {/* Document content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: 2,
          bgcolor: 'background.default'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            {error}
          </Alert>
        ) : (
          generateMockContent()
        )}
      </Box>
    </Box>
  );
};

export default DocumentViewer;
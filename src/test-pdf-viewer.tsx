import React from 'react';
import PDFViewer from './components/viewers/PDFViewer';
import { Box, Typography, Paper } from '@mui/material';

const TestPDFViewer = () => {
  const handleLoad = () => {
    console.log('PDF loaded successfully!');
  };

  const handleError = (error: Error) => {
    console.error('PDF load error:', error);
  };

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        PDF Viewer Test
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>
          This is a test of the PDF Viewer component with a local file. 
          If this loads correctly, the problem is with the file fetching logic, not the viewer itself.
        </Typography>
      </Paper>
      
      <Box sx={{ flexGrow: 1, border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
        <PDFViewer 
          url="/test.pdf" 
          fileName="test.pdf"
          onLoad={handleLoad}
          onError={handleError}
        />
      </Box>
    </Box>
  );
};

export default TestPDFViewer; 
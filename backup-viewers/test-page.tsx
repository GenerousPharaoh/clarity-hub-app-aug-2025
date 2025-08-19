import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Paper, Typography, Stack, MenuItem, Select, FormControl, InputLabel, Divider, Grid, Card, CardContent, CardHeader, CardMedia, Alert } from '@mui/material';
import { Description, PictureAsPdf, Image as ImageIcon, AudioFile, VideoFile, TextSnippet, Article } from '@mui/icons-material';
import UniversalFileViewer from './UniversalFileViewer';
import { publicUrl } from '../../utils/publicUrl';
import MainLayout from '../../layouts/MainLayout';
import useAppStore from '../../store';

// Function to get the correct URL for a test file
const getTestFileUrl = (path: string): string => {
  // For this testing environment, use the public/test-files directory
  return `/test-files/${path}`;
};

// Custom file record format to match what UniversalFileViewer expects
interface TestFileRecord {
  id: string;
  name: string;
  storage_path: string;
  file_type: string;
  content_type: string;
  size: number;
  project_id: string;
  metadata?: any;
  exhibit_id?: string;
  // Add special test URL for test page
  testUrl?: string;
}

// Test project
const TEST_PROJECT = {
  id: 'test-project-1',
  name: 'Test File Viewer Project',
  description: 'A project to test file viewers',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: 'test-user'
};

// Available test files from the test-files directory
const TEST_FILES: TestFileRecord[] = [
  {
    id: '1',
    name: 'sample-pdf.pdf',
    storage_path: 'sample-pdf.pdf',
    file_type: 'pdf',
    content_type: 'application/pdf',
    size: 5000,
    project_id: TEST_PROJECT.id,
    exhibit_id: 'EX001',
    testUrl: getTestFileUrl('sample-pdf.pdf')
  },
  {
    id: '2',
    name: 'test-document.pdf',
    storage_path: 'test-document.pdf',
    file_type: 'pdf',
    content_type: 'application/pdf',
    size: 10000,
    project_id: TEST_PROJECT.id,
    exhibit_id: 'EX002',
    testUrl: getTestFileUrl('test-document.pdf')
  },
  {
    id: '3',
    name: 'test-image.jpg',
    storage_path: 'test-image.jpg',
    file_type: 'image',
    content_type: 'image/jpeg',
    size: 3000,
    project_id: TEST_PROJECT.id,
    exhibit_id: 'EX003',
    testUrl: getTestFileUrl('test-image.jpg')
  },
  {
    id: '4',
    name: 'sample-text.txt',
    storage_path: 'sample-text.txt',
    file_type: 'text',
    content_type: 'text/plain',
    size: 65,
    project_id: TEST_PROJECT.id,
    exhibit_id: 'EX004',
    testUrl: getTestFileUrl('sample-text.txt')
  },
  {
    id: '5',
    name: 'audio-sample.mp3',
    storage_path: 'audio-sample.mp3',
    file_type: 'audio',
    content_type: 'audio/mpeg',
    size: 184749,
    project_id: TEST_PROJECT.id,
    exhibit_id: 'EX005',
    testUrl: getTestFileUrl('audio-sample.mp3')
  },
  {
    id: '6',
    name: 'video-sample.mp4',
    storage_path: 'video-sample.mp4',
    file_type: 'video',
    content_type: 'video/mp4',
    size: 371052,
    project_id: TEST_PROJECT.id,
    exhibit_id: 'EX006',
    testUrl: getTestFileUrl('video-sample.mp4')
  }
];

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'pdf':
      return <PictureAsPdf color="error" />;
    case 'image':
      return <ImageIcon color="primary" />;
    case 'audio':
      return <AudioFile color="success" />;
    case 'video':
      return <VideoFile color="secondary" />;
    case 'text':
      return <TextSnippet color="info" />;
    default:
      return <Article />;
  }
}

const TestPage = () => {
  const setSelectedFile = useAppStore(state => state.setSelectedFile);
  const setFiles = useAppStore(state => state.setFiles);
  const setProjects = useAppStore(state => state.setProjects);
  const setSelectedProject = useAppStore(state => state.setSelectedProject);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Initialize test files and project in store when component mounts
  useEffect(() => {
    // Add test project to the store
    setProjects([TEST_PROJECT]);
    setSelectedProject(TEST_PROJECT.id);
    
    // Add test files to the store
    setFiles(TEST_FILES);
  }, [setFiles, setProjects, setSelectedProject]);

  const handleFileClick = (fileId: string) => {
    setSelectedFileId(fileId);
    setSelectedFile(fileId);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        File Viewer Test Page
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        This test page demonstrates the file viewers working in the right panel of the application.
        Click on any file card below to load it in the right panel.
      </Alert>

      <Grid container spacing={3}>
        {TEST_FILES.map((file) => (
          <Grid item xs={12} sm={6} md={4} key={file.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
                border: selectedFileId === file.id ? '2px solid #4a6cf7' : 'none',
              }}
              onClick={() => handleFileClick(file.id)}
            >
              <CardHeader
                avatar={getFileIcon(file.file_type)}
                title={file.name}
                subheader={`Exhibit ID: ${file.exhibit_id}`}
              />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Type: {file.content_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {(file.size / 1024).toFixed(1)} KB
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1">
          Select any file above to see it displayed in the right panel of the application.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This demonstrates how the file viewers work within the main application layout.
        </Typography>
      </Box>
    </Container>
  );
};

export default TestPage; 
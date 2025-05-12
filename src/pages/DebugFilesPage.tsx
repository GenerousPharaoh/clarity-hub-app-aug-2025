import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Paper, Typography, Button, CircularProgress, Divider } from '@mui/material';
import DebugRightPanel from '../layouts/panels/DebugRightPanel';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabaseClient } from '../lib/supabase';

// Debug page for file viewing issues
const DebugFilesPage: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Load files for testing
  useEffect(() => {
    async function loadFiles() {
      try {
        setLoading(true);
        
        // Get all projects first
        const { data: projects, error: projectError } = await supabaseClient
          .from('projects')
          .select('id, name')
          .limit(5);
        
        if (projectError) throw projectError;
        
        if (!projects || projects.length === 0) {
          setError('No projects found. Please create a project first.');
          setLoading(false);
          return;
        }
        
        // Get files from each project
        const allFiles = [];
        
        for (const project of projects) {
          const { data: projectFiles, error: filesError } = await supabaseClient
            .from('files')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (filesError) {
            console.error(`Error loading files for project ${project.id}:`, filesError);
            continue;
          }
          
          if (projectFiles && projectFiles.length > 0) {
            // Add project info to each file
            const filesWithProject = projectFiles.map(file => ({
              ...file,
              project_name: project.name
            }));
            
            allFiles.push(...filesWithProject);
          }
        }
        
        setFiles(allFiles);
      } catch (error) {
        console.error('Error loading files:', error);
        setError('Failed to load files. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadFiles();
  }, []);
  
  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    navigate(`/debug-files?fileId=${fileId}`);
  };
  
  return (
    <Container maxWidth="xl" sx={{ height: '100vh', py: 3 }}>
      <Typography variant="h4" gutterBottom>
        File Viewer Debug
      </Typography>
      
      <Typography variant="body1" paragraph>
        This page helps diagnose issues with file viewing. Select a file from the list to test viewing it.
      </Typography>
      
      <Grid container spacing={2} sx={{ height: 'calc(100% - 100px)' }}>
        {/* Left panel - File list */}
        <Grid item xs={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%', 
              overflow: 'auto', 
              p: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Test Files
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : files.length === 0 ? (
              <Typography>No files available for testing.</Typography>
            ) : (
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {files.map((file) => (
                  <Paper
                    key={file.id}
                    elevation={searchParams.get('fileId') === file.id ? 3 : 1}
                    sx={{
                      p: 2,
                      mb: 2,
                      cursor: 'pointer',
                      bgcolor: searchParams.get('fileId') === file.id ? 'action.selected' : 'background.paper',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => handleFileSelect(file.id)}
                  >
                    <Typography variant="subtitle1" noWrap>
                      {file.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {file.project_name}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {file.content_type || 'Unknown type'}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ 
                      mt: 1, 
                      wordBreak: 'break-all',
                      whiteSpace: 'normal' 
                    }}>
                      {file.storage_path?.substring(0, 45)}
                      {file.storage_path?.length > 45 ? '...' : ''}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Right panel - File viewer */}
        <Grid item xs={9}>
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <DebugRightPanel />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DebugFilesPage; 
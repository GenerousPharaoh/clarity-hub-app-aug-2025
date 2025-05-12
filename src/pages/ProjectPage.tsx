import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Share,
  MoreVert,
  FileUpload,
  InsertDriveFile,
  Description,
  Chat,
  Search,
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import FilesManager from '../components/FilesManager';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  owner_id: string;
}

interface ProjectPageParams {
  projectId: string;
}

enum ProjectTab {
  FILES = 'files',
  DOCUMENTS = 'documents',
  CHAT = 'chat',
  SEARCH = 'search',
}

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<any>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTab>(ProjectTab.FILES);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setError('Project ID is missing');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError('Project not found');
        } else {
          setProject(data);
        }
      } catch (error: any) {
        console.error('Error fetching project:', error);
        setError(error.message || 'An error occurred while fetching the project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: ProjectTab) => {
    setActiveTab(newValue);
  };

  // Handle back to projects list
  const handleBack = () => {
    navigate('/');
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case ProjectTab.FILES:
        return projectId ? <FilesManager projectId={projectId} /> : null;
      case ProjectTab.DOCUMENTS:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6">Documents Tab</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage case documents, briefs, and legal forms here
            </Typography>
          </Box>
        );
      case ProjectTab.CHAT:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Chat sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6">Chat & Notes Tab</Typography>
            <Typography variant="body2" color="text.secondary">
              Collaborate with team members and take notes about the case
            </Typography>
          </Box>
        );
      case ProjectTab.SEARCH:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Search sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6">Search Tab</Typography>
            <Typography variant="body2" color="text.secondary">
              Search across all files, documents, and notes in this case
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Project Header */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: 2
          }}
          elevation={1}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            
            {loading ? (
              <Skeleton width={300} height={40} />
            ) : error ? (
              <Typography variant="h5" color="error">
                Error: {error}
              </Typography>
            ) : (
              <Typography variant="h5" sx={{ fontWeight: 500 }}>
                {project?.name || 'Project Details'}
              </Typography>
            )}
          </Box>
          
          <Box>
            <Tooltip title="Edit Project">
              <IconButton>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share Project">
              <IconButton>
                <Share />
              </IconButton>
            </Tooltip>
            <Tooltip title="More Options">
              <IconButton>
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
        
        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="project tabs"
          >
            <Tab label="Files" value={ProjectTab.FILES} />
            <Tab label="Documents" value={ProjectTab.DOCUMENTS} />
            <Tab label="Chat & Notes" value={ProjectTab.CHAT} />
            <Tab label="Search" value={ProjectTab.SEARCH} />
          </Tabs>
        </Box>
        
        {/* Tab Content */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {renderTabContent()}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default ProjectPage; 
import { useEffect, useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Skeleton, useTheme, CircularProgress, Breadcrumbs, Link, useMediaQuery } from '@mui/material';
import { Home as HomeIcon, Menu as MenuIcon, DarkMode, LightMode, ChevronRight, ArrowBack } from '@mui/icons-material';
import { Link as RouterLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../store';
import supabaseClient from '../services/supabaseClient';
import ResizablePanels from '../components/ResizablePanels';
import LeftPanel from './panels/LeftPanel';
import CenterPanelWrapper from './panels/CenterPanelWrapper';
import RightPanelWrapper from './panels/RightPanelWrapper';

export default function ProjectLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Local state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Global state
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const selectedProject = useAppStore((state) => 
    state.projects.find(p => p.id === projectId) || null
  );
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  
  // Fetch project details if not already loaded
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
      
      if (!selectedProject) {
        fetchProjectDetails();
      } else {
        setLoading(false);
      }
    }
  }, [projectId]);
  
  // Fetch project details
  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (error) throw error;
      
      // Add project to store
      if (data) {
        useAppStore.setState(state => ({
          projects: [...state.projects.filter(p => p.id !== data.id), data]
        }));
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Error loading project. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      {/* App Bar */}
      <AppBar 
        position="sticky" 
        color="default"
        elevation={0}
        sx={{ 
          zIndex: theme => theme.zIndex.drawer + 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: theme.palette.mode === 'dark' 
            ? 'rgba(15, 23, 42, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Back button for mobile */}
          {isMobile && (
            <IconButton 
              edge="start" 
              color="inherit" 
              aria-label="back"
              onClick={() => navigate(-1)}
              sx={{ mr: 1 }}
            >
              <ArrowBack />
            </IconButton>
          )}
          
          {/* Navigation breadcrumbs */}
          <Breadcrumbs separator={<ChevronRight fontSize="small" />} aria-label="breadcrumb" sx={{ flexGrow: 1 }}>
            <Link 
              component={RouterLink} 
              to="/" 
              underline="hover" 
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Dashboard
            </Link>
            
            <Typography color="text.primary" sx={{ fontWeight: 500 }}>
              {loading ? (
                <Skeleton width={120} />
              ) : selectedProject ? (
                selectedProject.name
              ) : (
                'Project'
              )}
            </Typography>
          </Breadcrumbs>
          
          {/* Theme toggle */}
          <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
            {themeMode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Main content */}
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        overflow: 'hidden',
        p: { xs: 1, sm: 2 }
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%' 
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%', 
            color: 'error.main' 
          }}>
            {error}
          </Box>
        ) : (
          <ResizablePanels>
            <LeftPanel />
            <CenterPanelWrapper>
              <Outlet />
            </CenterPanelWrapper>
            <RightPanelWrapper />
          </ResizablePanels>
        )}
      </Box>
    </Box>
  );
} 
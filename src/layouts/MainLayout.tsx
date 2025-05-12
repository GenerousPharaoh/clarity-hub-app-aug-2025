import { useEffect, useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar, Container, Tooltip, CircularProgress } from '@mui/material';
import { Menu as MenuIcon, DarkMode, LightMode, Logout, Settings, Dashboard, NotificationsNone } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAppStore from '../store';
import AutoSyncButton from '../components/AutoSyncButton';

// Panels
import LeftPanel from './panels/LeftPanel';
import CenterPanelWrapper from './panels/CenterPanelWrapper';
import RightPanelWrapper from './panels/RightPanelWrapper';
import ResizablePanels from '../components/ResizablePanels';

// Add a custom NavLink component with loading indicator
const NavLink = ({ to, label, icon, onClick }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const handleNavigation = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Call the onClick handler if provided
    if (onClick) onClick();
    
    // Slight delay for visual feedback
    setTimeout(() => {
      navigate(to);
      setLoading(false);
    }, 100);
  };
  
  return (
    <Tooltip title={label} placement="right">
      <IconButton
        color="inherit"
        onClick={handleNavigation}
        disabled={loading}
        sx={{ 
          position: 'relative',
          borderRadius: 1.5,
          transition: 'all 0.2s ease',
          mx: 0.5,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : icon}
      </IconButton>
    </Tooltip>
  );
};

const MainLayout = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { signOut, user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Use individual selectors for each state value to prevent infinite re-renders
  const isLeftPanelOpen = useAppStore((state) => state.isLeftPanelOpen);
  const isRightPanelOpen = useAppStore((state) => state.isRightPanelOpen);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const toggleLeftPanel = useAppStore((state) => state.toggleLeftPanel);
  const toggleRightPanel = useAppStore((state) => state.toggleRightPanel);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const themeMode = useAppStore((state) => state.themeMode);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  const setSelectedFile = useAppStore((state) => state.setSelectedFile);

  // Set the selected project from the URL parameter
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [projectId, setSelectedProject]);

  // Reset selectedFile when selectedProject changes
  useEffect(() => {
    setSelectedFile(null);
  }, [selectedProjectId, setSelectedFile]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
    setSelectedProject(null);
    navigate('/login');
  };

  return (
    <Box 
      component="main" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        width: '100vw',
        overflow: 'hidden', 
        bgcolor: 'background.default',
        backgroundImage: (theme) => theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle at 50% 14%, rgba(96, 165, 250, 0.03) 0%, rgba(0, 0, 0, 0) 60%), linear-gradient(to bottom, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.4) 100%)'
          : 'radial-gradient(circle at 50% 14%, rgba(29, 78, 216, 0.02) 0%, rgba(0, 0, 0, 0) 60%), linear-gradient(to bottom, rgba(249, 250, 251, 0.9) 0%, rgba(243, 244, 246, 0.4) 100%)',
      }}
    >
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(12px)',
          background: theme => theme.palette.mode === 'dark' 
            ? 'rgba(31, 41, 55, 0.7)'
            : 'rgba(255, 255, 255, 0.8)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* App logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleLeftPanel}
              sx={{ 
                mr: 2,
                borderRadius: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ 
                flexGrow: 0, 
                display: { xs: 'none', sm: 'block' },
                fontWeight: 600,
                background: theme => theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, #60A5FA, #A78BFA)'
                  : 'linear-gradient(90deg, #1D4ED8, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mr: 2
              }}
            >
              Clarity Hub
            </Typography>
          </Box>
          
          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Center navigation/action icons */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mx: 2
            }}
          >
            <NavLink
              to="/dashboard"
              label="Dashboard"
              icon={<Dashboard fontSize="small" />}
            />
            
            <NavLink
              to="/notifications"
              label="Notifications"
              icon={<NotificationsNone fontSize="small" />}
            />
            
            <NavLink
              to="/settings"
              label="Settings"
              icon={<Settings fontSize="small" />}
            />
          </Box>
          
          {/* Right side app bar icons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Add the sync button here with improved styling */}
            <Box sx={{ mx: 1 }}>
              <AutoSyncButton variant="icon" showCount />
            </Box>
            
            <IconButton 
              color="inherit" 
              onClick={toggleTheme}
              sx={{ 
                mx: 1,
                borderRadius: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  backgroundColor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {themeMode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ 
                ml: 1,
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                border: '2px solid transparent',
                '&:hover': {
                  borderColor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              <Avatar
                sx={{ 
                  width: 32, 
                  height: 32,
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 0 0 2px rgba(255, 255, 255, 0.1)'
                    : '0 0 0 2px rgba(0, 0, 0, 0.03)'
                }}
                src={user?.user_metadata?.avatar_url}
                alt={user?.email?.charAt(0).toUpperCase() || 'U'}
              >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                elevation: 2,
                sx: {
                  mt: 1.5,
                  overflow: 'visible',
                  borderRadius: 2,
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }}
            >
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, borderRadius: 1, mx: 0.5 }}>
                <Logout fontSize="small" sx={{ mr: 1.5, opacity: 0.7 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="section" sx={{ 
        flexGrow: 1, 
        overflow: 'hidden', 
        position: 'relative',
        transition: 'all 0.3s ease',
        display: 'flex',
        width: '100%',
        height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        mt: { xs: '56px', sm: '64px' }, // push content below the fixed AppBar
        p: { xs: 1.5, sm: 3 } 
      }}>
        <Container 
          maxWidth={false} 
          disableGutters 
          sx={{ 
            maxWidth: '100%', 
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 4px 20px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.04)',
            border: theme => `1px solid ${theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.03)'}`,
          }}
        >
          <ResizablePanels initialSizes={[20, 60, 20]} minSizes={[10, 30, 10]}>
            <LeftPanel />
            <CenterPanelWrapper />
            <RightPanelWrapper />
          </ResizablePanels>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 1.5, 
          px: 2,
          textAlign: 'center', 
          backdropFilter: 'blur(12px)',
          background: theme => theme.palette.mode === 'dark' 
            ? 'rgba(31, 41, 55, 0.7)'
            : 'rgba(255, 255, 255, 0.8)',
          borderTop: 1, 
          borderColor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
          color: 'text.secondary',
          fontSize: '0.75rem',
          minHeight: { xs: 36, sm: 40 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="caption" color="inherit">
          © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'Legal Case Tracker'} • All rights reserved
        </Typography>
      </Box>
    </Box>
  );
};

export default MainLayout; 
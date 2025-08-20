import { useEffect, useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar, Container, Tooltip, CircularProgress, Button, Divider, useTheme } from '@mui/material';
import { Menu as MenuIcon, DarkMode, LightMode, Logout, Settings, Dashboard, NotificationsNone, Apps as AppsIcon } from '@mui/icons-material';
import { useNavigate, useParams, Outlet, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAppStore from '../store';
import AutoSyncButton from '../components/AutoSyncButton';
import { useNotification } from '../contexts/NotificationContext';

// Panels
import LeftPanel from './panels/LeftPanel';
import CenterPanelWrapper from './panels/CenterPanelWrapper';
import RightPanelWrapper from './panels/RightPanelWrapper';
import LegalCaseNavigator from '../components/LegalCaseNavigator';
import DemoLeftPanel from '../components/DemoLeftPanel';

// Add proper type definitions for the NavLink component
interface NavLinkProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

// Add a custom NavLink component with loading indicator
const NavLink = ({ to, label, icon, onClick }: NavLinkProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const handleNavigation = (e: React.MouseEvent<HTMLButtonElement>) => {
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
  const theme = useTheme();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { signOut, user } = useAuth();
  const { showNotification } = useNotification();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

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

  // Open user menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Close user menu
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut();
      handleMenuClose();
      navigate('/auth/login');
      showNotification('Successfully logged out', 'success');
    } catch (error) {
      console.error('Error signing out:', error);
      showNotification('Failed to log out. Please try again.', 'error');
    }
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
        bgcolor: '#0a0f1b', // Deep midnight blue background
      }}
    >
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(20px)',
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', // Dark slate gradient
          color: '#f3f4f6', // High contrast text
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)', // Subtle emerald border
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)', // Enhanced dark shadow
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
              component={RouterLink}
              to="/"
              sx={{ 
                flexGrow: 0, 
                display: { xs: 'none', sm: 'block' },
                fontWeight: 700,
                textDecoration: 'none',
                color: 'transparent',
                background: 'linear-gradient(90deg, #10b981, #34d399)', // Emerald gradient
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(16, 185, 129, 0.3)', // Emerald glow
                mr: 2
              }}
            >
              LEGAL CASE MANAGER PRO
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
              to="/"
              label="Cases Dashboard"
              icon={<Dashboard fontSize="small" />}
            />
          </Box>
          
          {/* Right side app bar icons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Add the sync button here with improved styling */}
            <Box sx={{ mx: 1 }}>
              <AutoSyncButton variant="icon" showCount />
            </Box>
            
            <Tooltip title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}>
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
            </Tooltip>
            
            {/* User avatar and menu */}
            {user ? (
              <>
                <IconButton
                  onClick={handleMenuOpen}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={menuOpen ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? 'true' : undefined}
                >
                  <Avatar 
                    sx={{ width: 36, height: 36 }}
                    src={user.avatar_url || undefined}
                    alt={user.full_name || user.email}
                  >
                    {(user.full_name || user.email || 'U')[0].toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  id="account-menu"
                  open={menuOpen}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                      minWidth: 200,
                      mt: 1.5,
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {user.full_name || 'User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <Logout fontSize="small" sx={{ mr: 2 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={RouterLink}
                to="/auth/login"
                variant="contained"
                color="primary"
                sx={{ ml: 2 }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content - Full viewport without padding */}
      <Box sx={{ 
        flexGrow: 1,
        display: 'flex',
        width: '100vw',
        height: 'calc(100vh - 64px)',
        mt: '64px', // Just below the AppBar
        overflow: 'hidden',
        position: 'relative',
      }}>
        <LegalCaseNavigator
          leftPanel={
            /* Use demo left panel if user is in demo mode, otherwise use regular LeftPanel */
            user?.id === '00000000-0000-0000-0000-000000000000' ? 
              <DemoLeftPanel /> : 
              <LeftPanel />
          }
          centerPanel={
            <CenterPanelWrapper>
              <Outlet />
            </CenterPanelWrapper>
          }
          rightPanel={<RightPanelWrapper />}
          leftPanelConfig={{
            defaultWidth: 320,
            minWidth: 260,
            maxWidth: 500
          }}
          rightPanelConfig={{
            defaultWidth: 420,
            minWidth: 350,
            maxWidth: 700
          }}
        />
      </Box>

      {/* Removed footer to maximize vertical space */}
    </Box>
  );
};

export default MainLayout; 
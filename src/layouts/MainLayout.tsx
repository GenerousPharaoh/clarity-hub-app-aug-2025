import { useEffect, useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar, 
  Container, 
  Tooltip, 
  CircularProgress, 
  Button, 
  Divider, 
  useTheme,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Badge,
  ListItemIcon,
  ListItemText,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  alpha,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  DarkMode, 
  LightMode, 
  Logout, 
  Settings, 
  Dashboard, 
  NotificationsNone, 
  Apps as AppsIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Message as MessageIcon,
  Help as HelpIcon,
  AccountCircle,
  Close as CloseIcon,
  ChevronRight,
  ViewSidebar,
  ViewSidebarRounded,
} from '@mui/icons-material';
import { useNavigate, useParams, Outlet, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAppStore from '../store';
import AutoSyncButton from '../components/AutoSyncButton';
import { useNotification } from '../contexts/NotificationContext';

// Panels
import LeftPanel from './panels/LeftPanel';
import CenterPanelWrapper from './panels/CenterPanelWrapper';
import RightPanelWrapper from './panels/RightPanelWrapper';
import ProfessionalPanelLayout from '../components/ProfessionalPanelLayout';
import CollapsedPanel from '../components/CollapsedPanel';

const MainLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { signOut, user, loading } = useAuth();
  const { showNotification } = useNotification();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  // Store state
  const projects = useAppStore((state) => state.projects);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const themeMode = useAppStore((state) => state.themeMode);
  const setSelectedFile = useAppStore((state) => state.setSelectedFile);
  const isLeftPanelOpen = useAppStore((state) => state.isLeftPanelOpen);
  const isRightPanelOpen = useAppStore((state) => state.isRightPanelOpen);
  const toggleLeftPanel = useAppStore((state) => state.toggleLeftPanel);
  const toggleRightPanel = useAppStore((state) => state.toggleRightPanel);

  // Remove auth checking from MainLayout - let App.tsx handle it

  // Set the selected project from the URL parameter
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [projectId, setSelectedProject]);

  // Keyboard shortcuts for panel toggling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '[') {
          e.preventDefault();
          toggleLeftPanel();
        } else if (e.key === ']') {
          e.preventDefault();
          toggleRightPanel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftPanel, toggleRightPanel]);

  // Reset selectedFile when selectedProject changes
  useEffect(() => {
    setSelectedFile(null);
  }, [selectedProjectId, setSelectedFile]);

  // Handle project change
  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    navigate(`/projects/${projectId}`);
    showNotification(`Switched to project: ${projects.find(p => p.id === projectId)?.name}`, 'info');
  };

  // Create new project
  const handleCreateProject = () => {
    // Don't use browser prompt - redirect to proper project creation UI
    navigate('/dashboard');
    showNotification('Use the project creation dialog to create a new project', 'info');
  };

  // Navigation items for drawer
  const navigationItems = [
    { icon: <HomeIcon />, label: 'Home', path: '/' },
    { icon: <Dashboard />, label: 'Dashboard', path: '/dashboard' },
    { icon: <MessageIcon />, label: 'Messages', path: '/messages' },
    { icon: <Settings />, label: 'Settings', path: '/settings' },
    { icon: <HelpIcon />, label: 'Help & Support', path: '/help' },
  ];

  // Handle user menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle logout
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

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Don't render layout if no user
  if (!user) {
    return null;
  }

  return (
    <Box 
      component="main" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        width: '100vw',
        overflow: 'hidden', 
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Modern App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: 48, px: { xs: 2, sm: 3 }, gap: 1.5 }}>
          {/* Burger Menu */}
          <Tooltip title="Menu">
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ 
                mr: 2,
                color: theme.palette.text.primary,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>

          {/* App Logo/Title */}
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
              mr: 3,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            CLARITY HUB
          </Typography>

          {/* Project Selector */}
          <FormControl
            size="small"
            sx={{
              minWidth: 200,
              mr: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : alpha(theme.palette.primary.main, 0.06),
                border: '1px solid',
                borderColor: theme.palette.divider,
                borderRadius: '8px',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.10),
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              },
            }}
          >
            <Select
              value={selectedProjectId || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              displayEmpty
              renderValue={(value) => {
                if (!value) return <em style={{ color: theme.palette.text.disabled }}>Select a project</em>;
                const project = projects.find(p => p.id === value);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    <span>{project?.name}</span>
                  </Box>
                );
              }}
            >
              <MenuItem value="" disabled>
                <em>Select a project</em>
              </MenuItem>
              <Divider />
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  <ListItemIcon>
                    <FolderIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={project.name}
                    secondary={project.description}
                  />
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={(e) => {
                e.stopPropagation();
                handleCreateProject();
              }}>
                <ListItemIcon>
                  <AddIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary="Create New Project" />
              </MenuItem>
            </Select>
          </FormControl>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Panel Toggles */}
            <Tooltip title="Toggle Left Panel (⌘[)">
              <IconButton
                onClick={() => toggleLeftPanel()}
                sx={{ 
                  color: theme.palette.text.primary,
                  bgcolor: isLeftPanelOpen ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.20),
                  }
                }}
              >
                <ViewSidebar sx={{ transform: 'scaleX(-1)' }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Toggle Right Panel (⌘])">
              <IconButton
                onClick={() => toggleRightPanel()}
                sx={{ 
                  color: theme.palette.text.primary,
                  bgcolor: isRightPanelOpen ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.20),
                  }
                }}
              >
                <ViewSidebar />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            {/* Sync Button */}
            <AutoSyncButton variant="icon" showCount />

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                sx={{ 
                  color: theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  }
                }}
                onClick={() => showNotification('No new notifications', 'info')}
              >
                <Badge badgeContent={0} color="error">
                  <NotificationsNone />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton
                onClick={toggleTheme}
                sx={{ 
                  color: theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  }
                }}
              >
                {themeMode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            {user ? (
              <>
                <IconButton
                  onClick={handleMenuOpen}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '0.9rem',
                    }}
                    src={user.avatar_url || undefined}
                  >
                    {(user.full_name || user.email || 'U')[0].toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      mt: 1.5,
                      minWidth: 200,
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
                  <MenuItem onClick={() => {
                    handleMenuClose();
                    navigate('/profile');
                  }}>
                    <ListItemIcon>
                      <AccountCircle fontSize="small" />
                    </ListItemIcon>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={() => {
                    handleMenuClose();
                    navigate('/settings');
                  }}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={RouterLink}
                to="/auth/login"
                variant="contained"
                size="small"
                sx={{ 
                  ml: 2,
                  bgcolor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  }
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            Navigation
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {navigationItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
                sx={{
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
                <ChevronRight sx={{ color: 'text.secondary' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content with Professional Panel System */}
      <Box sx={{ 
        flexGrow: 1,
        display: 'flex',
        width: '100vw',
        height: 'calc(100vh - 48px)',
        mt: '48px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <ProfessionalPanelLayout
          leftPanel={
            <Box className="panel-content panel-left">
              <LeftPanel />
            </Box>
          }
          leftPanelCollapsed={
            <CollapsedPanel side="left" onExpand={toggleLeftPanel} />
          }
          centerPanel={
            <Box className="panel-content">
              <CenterPanelWrapper>
                <Outlet />
              </CenterPanelWrapper>
            </Box>
          }
          rightPanel={
            <Box className="panel-content panel-right">
              <RightPanelWrapper />
            </Box>
          }
          rightPanelCollapsed={
            <CollapsedPanel side="right" onExpand={toggleRightPanel} />
          }
          leftPanelOpen={isLeftPanelOpen}
          rightPanelOpen={isRightPanelOpen}
          onLeftPanelToggle={toggleLeftPanel}
          onRightPanelToggle={toggleRightPanel}
          onWidthChange={(widths) => {
            // Panel widths changed
          }}
        />
      </Box>
    </Box>
  );
};

export default MainLayout;
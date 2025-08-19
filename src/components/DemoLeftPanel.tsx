import React from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  Home as HomeIcon,
  Inbox as InboxIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import DemoProjectsList from './DemoProjectsList';
import DemoFilesList from './DemoFilesList';
import useAppStore from '../store';

interface DemoLeftPanelProps {
  isCollapsed?: boolean;
}

const DemoLeftPanel: React.FC<DemoLeftPanelProps> = ({ isCollapsed = false }) => {
  const user = useAppStore(state => state.user);
  
  // Navigation items
  const navItems = [
    { icon: <HomeIcon />, text: 'Home', path: '/' },
    { icon: <DashboardIcon />, text: 'Dashboard', path: '/dashboard' },
    { icon: <InboxIcon />, text: 'Messages', path: '/messages' },
    { icon: <SettingsIcon />, text: 'Settings', path: '/settings' },
    { icon: <HelpIcon />, text: 'Help', path: '/help' },
  ];
  
  // If panel is collapsed, show only icons
  if (isCollapsed) {
    return (
      <Box 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          width: '100%',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
        data-test="left-panel"
        data-testid="left-panel"
      >
        <List dense>
          {navItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                sx={{ 
                  justifyContent: 'center',
                  py: 1.5,
                }}
              >
                <Tooltip title={item.text}>
                  <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        p: 2,
      }}
      data-test="left-panel"
      data-testid="left-panel"
    >
      {/* User Profile Section */}
      {user && (
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.02)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            component="img"
            src={user.avatar_url || 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff'}
            alt={user.full_name || user.email}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              mr: 2,
            }}
          />
          <Box>
            <Typography variant="subtitle2">
              {user.full_name || 'Demo User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email || 'demo@example.com'}
            </Typography>
          </Box>
        </Paper>
      )}
      
      {/* Navigation */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
        }}
      >
        <List disablePadding>
          {navItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
      
      {/* Projects Section */}
      <DemoProjectsList />
      
      {/* Files Section */}
      <DemoFilesList sx={{ mt: 2, flex: 1 }} />
    </Box>
  );
};

export default DemoLeftPanel;
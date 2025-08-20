import React, { useState } from 'react';
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
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { 
  Home as HomeIcon,
  Inbox as InboxIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CreateNewFolder,
  CloudUpload,
  Close,
} from '@mui/icons-material';
import DemoProjectsList from './DemoProjectsList';
import DemoFilesList from './DemoFilesList';
import CreateProjectDialog from './CreateProjectDialog';
import FunctionalFileUpload from './FunctionalFileUpload';
import useAppStore from '../store';

interface DemoLeftPanelProps {
  isCollapsed?: boolean;
}

const DemoLeftPanel: React.FC<DemoLeftPanelProps> = ({ isCollapsed = false }) => {
  const user = useAppStore(state => state.user);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation items
  const navItems = [
    { icon: <HomeIcon />, text: 'Home', path: '/', onClick: () => console.log('Navigate to Home') },
    { icon: <DashboardIcon />, text: 'Dashboard', path: '/dashboard', onClick: () => console.log('Navigate to Dashboard') },
    { icon: <InboxIcon />, text: 'Messages', path: '/messages', onClick: () => console.log('Navigate to Messages') },
    { icon: <SettingsIcon />, text: 'Settings', path: '/settings', onClick: () => console.log('Navigate to Settings') },
    { icon: <HelpIcon />, text: 'Help', path: '/help', onClick: () => window.open('https://docs.example.com', '_blank') },
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
      
      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search projects & files..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<CreateNewFolder />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Project
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => setUploadDialogOpen(true)}
          disabled={!selectedProjectId}
        >
          Upload Files
        </Button>
      </Box>
      
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
              <ListItemButton onClick={item.onClick}>
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
      <DemoProjectsList searchQuery={searchQuery} />
      
      {/* Files Section */}
      <DemoFilesList sx={{ mt: 2, flex: 1 }} searchQuery={searchQuery} />
      
      {/* Create Project Dialog */}
      <CreateProjectDialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
      />
      
      {/* Upload Files Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            height: '70vh'
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Upload Files
          <IconButton
            onClick={() => setUploadDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'grey.500',
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <FunctionalFileUpload />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DemoLeftPanel;
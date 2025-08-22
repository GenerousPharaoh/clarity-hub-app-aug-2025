import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  CreateNewFolder,
  CloudUpload,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Inbox as InboxIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store';
import DemoProjectsList from './DemoProjectsList';
import DemoFilesList from './DemoFilesList';
import CreateProjectDialog from './CreateProjectDialog';
// import UploadDialog from './UploadDialog';
// import SettingsDialog from './SettingsDialog';

interface DemoLeftPanelProps {
  className?: string;
  sx?: any;
}

const DemoLeftPanel: React.FC<DemoLeftPanelProps> = ({ className, sx }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const user = useAppStore(state => state.user);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const files = useAppStore(state => state.files);
  const [navExpanded, setNavExpanded] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            // Focus search input
            const searchInput = document.querySelector('input[placeholder*="Search projects"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
            break;
          case 'n':
            e.preventDefault();
            if (!createDialogOpen) setCreateDialogOpen(true);
            break;
          case 'u':
            e.preventDefault();
            if (selectedProjectId) handleFileUpload();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedProjectId, createDialogOpen]);

  // Enhanced drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedProjectId) {
      setDragActive(true);
    }
  }, [selectedProjectId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!selectedProjectId) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFileUpload(droppedFiles);
    }
  }, [selectedProjectId]);

  // Process file upload with progress
  const processFileUpload = useCallback((fileList: File[]) => {
    if (!selectedProjectId) return;
    
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 0;
        const newProgress = prev + Math.random() * 20;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setUploadProgress(null), 500);
          return 100;
        }
        return newProgress;
      });
    }, 200);
    
    // Process files
    const newFiles = Array.from(fileList).map((file, index) => {
      const fileType = file.type.includes('pdf') ? 'pdf' :
                      file.type.includes('image') ? 'image' :
                      file.type.includes('audio') ? 'audio' :
                      file.type.includes('video') ? 'video' :
                      'document';
      
      return {
        id: `file-${Date.now()}-${index}`,
        name: file.name,
        file_type: fileType,
        content_type: file.type || 'application/octet-stream',
        size: file.size,
        project_id: selectedProjectId,
        owner_id: '00000000-0000-0000-0000-000000000000',
        exhibit_id: `${files.length + index + 1}-A`,
        added_at: new Date().toISOString(),
        metadata: {
          tags: ['uploaded', fileType],
          processingStatus: 'completed'
        }
      };
    });
    
    // Add files to store after delay
    setTimeout(() => {
      useAppStore.setState(state => ({
        files: [...state.files, ...newFiles],
        selectedFileId: newFiles[0]?.id || state.selectedFileId
      }));
    }, 800);
  }, [selectedProjectId, files.length]);

  // Enhanced file upload handler
  const handleFileUpload = useCallback(() => {
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.mp3,.mp4,.txt';
    input.onchange = (e) => {
      const fileList = (e.target as HTMLInputElement).files;
      if (fileList && fileList.length > 0) {
        processFileUpload(Array.from(fileList));
      }
    };
    input.click();
  }, [selectedProjectId, processFileUpload]);

  // Navigation items
  const navItems = [
    { icon: <HomeIcon />, text: 'Home', path: '/', onClick: () => navigate('/') },
    { icon: <DashboardIcon />, text: 'Dashboard', path: '/dashboard', onClick: () => navigate('/dashboard') },
    { icon: <InboxIcon />, text: 'Messages', path: '/messages', onClick: () => navigate('/messages') },
    { icon: <SettingsIcon />, text: 'Settings', path: '/settings', onClick: () => navigate('/settings') },
    { icon: <HelpIcon />, text: 'Help', path: '/help', onClick: () => window.open('https://clarity-hub.com/help', '_blank') },
  ];

  return (
    <Box 
      className={className}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        bgcolor: 'background.paper',
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        border: dragActive ? '2px dashed' : 'none',
        borderColor: dragActive ? 'primary.main' : 'transparent',
        ...sx,
      }}
      data-test="left-panel"
      data-testid="left-panel"
    >
      {/* Drag overlay */}
      {dragActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'primary.main',
            opacity: 0.1,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
            Drop files here to upload
          </Typography>
        </Box>
      )}
      
      {/* Upload progress indicator */}
      {uploadProgress !== null && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: 'action.hover',
            zIndex: 1001,
          }}
        >
          <Box
            sx={{
              height: '100%',
              bgcolor: 'primary.main',
              width: `${uploadProgress}%`,
              transition: 'width 0.2s ease',
            }}
          />
        </Box>
      )}
      
      {/* Fixed Header Section */}
      <Box sx={{ flexShrink: 0 }}>
        {/* User Profile Section */}
        {user && (
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              mx: 1,
              mt: 1,
              mb: 1,
              borderRadius: 2,
              bgcolor: theme => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                mr: 1.5,
                bgcolor: 'primary.main',
                fontSize: '1rem',
              }}
            >
              {user.full_name?.[0] || user.email?.[0] || 'U'}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                {user.full_name || 'Demo User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                {user.email || 'demo@example.com'}
              </Typography>
            </Box>
          </Paper>
        )}
        
        {/* Search Bar */}
        <Box sx={{ px: 1, mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search projects & files... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: 1,
                },
                '&.Mui-focused': {
                  transform: 'scale(1.02)',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, px: 1, mb: 1 }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<CreateNewFolder />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ 
              py: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 3,
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            New Project (Ctrl+N)
          </Button>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<CloudUpload />}
            onClick={handleFileUpload}
            disabled={!selectedProjectId || uploadProgress !== null}
            sx={{ 
              py: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 2,
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            {uploadProgress !== null ? 'Uploading...' : 'Upload (Ctrl+U)'}
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
            mx: 1,
            mb: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              backgroundColor: theme => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(0, 0, 0, 0.01)',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              NAVIGATION
            </Typography>
            <IconButton
              size="small"
              onClick={() => setNavExpanded(!navExpanded)}
              sx={{ 
                p: 0.5,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.1)',
                  bgcolor: 'action.hover',
                },
              }}
            >
              {navExpanded ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
            </IconButton>
          </Box>
          
          <List dense sx={{ py: 0.5 }}>
            {navItems.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ px: 0.5 }}>
                {navExpanded ? (
                  <ListItemButton 
                    onClick={item.onClick}
                    sx={{ 
                      py: 0.75,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ variant: 'body2', fontSize: '0.875rem' }}
                    />
                  </ListItemButton>
                ) : (
                  <ListItemButton
                    onClick={item.onClick}
                    sx={{ 
                      justifyContent: 'center',
                      py: 1.5,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Tooltip title={item.text}>
                      <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
                        {item.icon}
                      </ListItemIcon>
                    </Tooltip>
                  </ListItemButton>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
      
      {/* Scrollable Content Section */}
      <Box 
        sx={{ 
          flex: 1,
          minHeight: 0, // Critical for flexbox scrolling
          overflow: 'auto',
          px: 1,
          pb: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          },
        }}
      >
        {/* Projects Section */}
        <DemoProjectsList searchQuery={searchQuery} />
        
        {/* Files Section */}
        <DemoFilesList sx={{ mt: 1 }} searchQuery={searchQuery} />
        
        {/* Keyboard shortcuts tip */}
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: 'action.hover', 
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'action.selected',
            transform: 'scale(1.02)',
          },
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            🚀 Keyboard Shortcuts:
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Ctrl+K: Search • Ctrl+N: New Project • Ctrl+U: Upload
          </Typography>
        </Box>
        
        {/* Add more content to ensure scrolling is needed */}
        <Box sx={{ mt: 1, p: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Recent Activity
          </Typography>
          {[1, 2, 3, 4, 5].map(i => (
            <Box key={i} sx={{ py: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                • Activity item {i}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      
      {/* Dialogs */}
      <CreateProjectDialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
      />
      
      {/* <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        projectId={selectedProjectId || ''}
      />
      
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
      /> */}
    </Box>
  );
};

export default DemoLeftPanel;
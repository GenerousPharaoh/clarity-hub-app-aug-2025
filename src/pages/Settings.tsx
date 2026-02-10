import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Storage,
  Security,
  Notifications,
  Delete,
  CloudUpload,
  Sync,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import useAppStore from '../store';
import { isUsingFallback, resetFallbackMode, syncLocalFilesToCloud } from '../services/storageService';

const Settings: React.FC = () => {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  
  // App store state
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  
  // Local state for settings
  const [settings, setSettings] = useState({
    notifications: true,
    autoSync: true,
    compression: true,
    analytics: false
  });

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSyncToCloud = async () => {
    setSyncingData(true);
    setSyncResult(null);
    
    try {
      const success = await syncLocalFilesToCloud();
      if (success) {
        setSyncResult('All files synced successfully!');
      } else {
        setSyncResult('Some files could not be synced. Please check your internet connection.');
      }
    } catch (error) {
      setSyncResult('Sync failed. Please try again later.');
    } finally {
      setSyncingData(false);
    }
  };

  const handleResetFallback = async () => {
    const success = await resetFallbackMode();
    if (success) {
      setSyncResult('Connection to cloud storage restored!');
    } else {
      setSyncResult('Could not reconnect to cloud storage.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isUsingLocalStorage = isUsingFallback();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Settings
      </Typography>

      {/* User Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2 }}>
            <Typography variant="body1" fontWeight={500}>
              {user?.user_metadata?.full_name || user?.email || 'Demo User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || ''}
            </Typography>
          </Box>
        </Box>
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={handleSignOut}
          sx={{ mt: 1 }}
        >
          Sign Out
        </Button>
      </Paper>

      {/* Storage Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Storage sx={{ mr: 1 }} />
          Storage Status
        </Typography>
        
        {isUsingLocalStorage ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Local Storage Mode Active</AlertTitle>
            Files are being stored locally in your browser. They won't sync across devices.
          </Alert>
        ) : (
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>Cloud Storage Active</AlertTitle>
            Files are being stored in the cloud and will sync across devices.
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Sync />}
            onClick={handleSyncToCloud}
            disabled={syncingData || !isUsingLocalStorage}
            sx={{ mr: 2 }}
          >
            {syncingData ? 'Syncing...' : 'Sync Local Files to Cloud'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={handleResetFallback}
            disabled={!isUsingLocalStorage}
          >
            Reconnect to Cloud Storage
          </Button>
        </Box>

        {syncResult && (
          <Alert 
            severity={syncResult.includes('successfully') ? 'success' : 'warning'} 
            sx={{ mt: 2 }}
          >
            {syncResult}
          </Alert>
        )}
      </Paper>

      {/* Appearance Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Appearance
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Dark Mode"
              secondary="Toggle between light and dark themes"
            />
            <ListItemSecondaryAction>
              <FormControlLabel
                control={
                  <Switch
                    checked={themeMode === 'dark'}
                    onChange={toggleTheme}
                    icon={<LightMode />}
                    checkedIcon={<DarkMode />}
                  />
                }
                label=""
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      {/* Application Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application Settings
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Notifications"
              secondary="Receive notifications about file uploads and updates"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.notifications}
                onChange={() => handleSettingChange('notifications')}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="Auto Sync"
              secondary="Automatically sync files when connection is restored"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.autoSync}
                onChange={() => handleSettingChange('autoSync')}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="File Compression"
              secondary="Compress files before upload to save bandwidth"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.compression}
                onChange={() => handleSettingChange('compression')}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <ListItemText
              primary="Analytics"
              secondary="Help improve the app by sharing anonymous usage data"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.analytics}
                onChange={() => handleSettingChange('analytics')}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      {/* Danger Zone */}
      <Paper sx={{ p: 3, border: '1px solid', borderColor: 'error.main' }}>
        <Typography variant="h6" gutterBottom color="error">
          Danger Zone
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These actions are permanent and cannot be undone.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={() => setDeleteDialogOpen(true)}
        >
          Clear All Local Data
        </Button>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Clear All Local Data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all files stored locally in your browser.
            This action cannot be undone. Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              // TODO: Implement clear local data functionality
              setDeleteDialogOpen(false);
            }} 
            color="error"
            autoFocus
          >
            Delete All Data
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
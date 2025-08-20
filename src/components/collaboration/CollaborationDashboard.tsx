import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Drawer,
  IconButton,
  Fab,
  Badge,
  Tooltip,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  Comment as CommentIcon,
  History as VersionIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

import { useCollaboration } from '../../contexts/CollaborationContext';
import UserPresenceIndicator from './presence/UserPresenceIndicator';
import CursorTracker from './presence/CursorTracker';
import CommentSystem from './comments/CommentSystem';
import VersionControl from './versions/VersionControl';

interface CollaborationDashboardProps {
  projectId: string;
  documentId?: string;
  documentContent?: string;
  containerRef?: React.RefObject<HTMLElement>;
  onDocumentChange?: (content: string) => void;
  compact?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`collaboration-tabpanel-${index}`}
      aria-labelledby={`collaboration-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `collaboration-tab-${index}`,
    'aria-controls': `collaboration-tabpanel-${index}`,
  };
}

const CollaborationDashboard: React.FC<CollaborationDashboardProps> = ({
  projectId,
  documentId,
  documentContent = '',
  containerRef,
  onDocumentChange,
  compact = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state, joinProject, joinDocument, leaveDocument } = useCollaboration();
  
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [unreadCounts, setUnreadCounts] = useState({
    comments: 0,
    activity: 0,
    chat: 0,
  });

  // Join project and document on mount
  useEffect(() => {
    if (projectId) {
      joinProject(projectId);
    }
    
    return () => {
      if (documentId) {
        leaveDocument(documentId);
      }
    };
  }, [projectId, documentId, joinProject, leaveDocument]);

  // Join document when documentId changes
  useEffect(() => {
    if (documentId) {
      joinDocument(documentId);
    }
    
    return () => {
      if (documentId) {
        leaveDocument(documentId);
      }
    };
  }, [documentId, joinDocument, leaveDocument]);

  // Calculate unread counts
  useEffect(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const newComments = state.comments.filter(
      comment => new Date(comment.created_at).getTime() > fiveMinutesAgo
    ).length;

    setUnreadCounts({
      comments: newComments,
      activity: 0,
      chat: 0,
    });
  }, [state.comments]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateVersion = (message: string) => {
    // Implementation would create a new version
    console.log('Creating version:', message);
  };

  const handleRestoreVersion = (version: any) => {
    if (onDocumentChange && version.content) {
      onDocumentChange(version.content);
    }
  };

  const tabsData = [
    {
      label: 'Comments',
      icon: <CommentIcon />,
      badge: unreadCounts.comments,
      component: documentId ? (
        <CommentSystem
          documentId={documentId}
          containerRef={containerRef}
          showResolved={false}
        />
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">
            Select a document to view and add comments
          </Typography>
        </Box>
      ),
    },
    {
      label: 'Versions',
      icon: <VersionIcon />,
      badge: 0,
      component: documentId ? (
        <VersionControl
          documentId={documentId}
          currentContent={documentContent}
          onCreateVersion={handleCreateVersion}
          onRestoreVersion={handleRestoreVersion}
        />
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">
            Select a document to view version history
          </Typography>
        </Box>
      ),
    },
  ];

  const sidebarContent = (
    <Box sx={{ width: 400, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flex: 1 }}>
            Legal Document Collaboration
          </Typography>
          <UserPresenceIndicator
            maxUsers={3}
            size="small"
            variant="compact"
          />
          <IconButton
            edge="end"
            onClick={() => setSidebarOpen(false)}
            sx={{ ml: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabsData.map((tab, index) => (
            <Tab
              key={index}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {tab.badge > 0 ? (
                    <Badge badgeContent={tab.badge} color="primary">
                      {tab.icon}
                    </Badge>
                  ) : (
                    tab.icon
                  )}
                  {!compact && tab.label}
                </Box>
              }
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {tabsData.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* Cursor tracking overlay */}
      {containerRef && documentId && (
        <CursorTracker
          documentId={documentId}
          containerRef={containerRef}
          trackSelection={true}
          showCursorNames={true}
        />
      )}

      {/* Mobile/Desktop Sidebar */}
      {isMobile ? (
        <Drawer
          anchor="right"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Drawer
          anchor="right"
          variant="persistent"
          open={sidebarOpen}
          sx={{
            '& .MuiDrawer-paper': {
              position: 'relative',
              width: 400,
              height: '100vh',
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Floating Action Button when sidebar is closed */}
      {!sidebarOpen && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => setSidebarOpen(true)}
        >
          <Badge
            badgeContent={unreadCounts.comments}
            color="error"
            invisible={unreadCounts.comments === 0}
          >
            <PeopleIcon />
          </Badge>
        </Fab>
      )}

      {/* Connection Status */}
      {!state.isConnected && (
        <Card
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            backgroundColor: 'warning.main',
            color: 'warning.contrastText',
          }}
        >
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2">
              Reconnecting to collaboration server...
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CollaborationDashboard;
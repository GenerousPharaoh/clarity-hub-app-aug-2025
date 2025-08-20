import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  Divider,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Comment as CommentIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Brush as WhiteboardIcon,
  Chat as ChatIcon,
  CheckCircle as ResolvedIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useCollaboration, ProjectActivity } from '../../../contexts/CollaborationContext';

interface ActivityFeedProps {
  projectId: string;
  compact?: boolean;
  maxItems?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
}

interface ActivityItemProps {
  activity: ProjectActivity;
  compact?: boolean;
}

interface ActivityGroupProps {
  date: string;
  activities: ProjectActivity[];
  compact?: boolean;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'document_created':
    case 'document_updated':
    case 'document_deleted':
      return <DocumentIcon />;
    case 'comment_added':
    case 'comment_resolved':
    case 'comment_deleted':
      return <CommentIcon />;
    case 'user_joined':
      return <PersonAddIcon />;
    case 'user_left':
      return <PersonRemoveIcon />;
    case 'permission_changed':
      return <SecurityIcon />;
    case 'version_created':
      return <HistoryIcon />;
    case 'whiteboard_updated':
      return <WhiteboardIcon />;
    case 'chat_message':
      return <ChatIcon />;
    default:
      return <EditIcon />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'document_created':
      return 'success';
    case 'document_updated':
      return 'info';
    case 'document_deleted':
      return 'error';
    case 'comment_added':
      return 'primary';
    case 'comment_resolved':
      return 'success';
    case 'user_joined':
      return 'success';
    case 'user_left':
      return 'warning';
    case 'permission_changed':
      return 'secondary';
    case 'version_created':
      return 'info';
    case 'whiteboard_updated':
      return 'primary';
    case 'chat_message':
      return 'default';
    default:
      return 'default';
  }
};

const getActivityMessage = (activity: ProjectActivity) => {
  const userName = activity.user?.first_name 
    ? `${activity.user.first_name} ${activity.user.last_name || ''}`.trim()
    : 'Someone';

  const details = activity.details || {};

  switch (activity.activity_type) {
    case 'document_created':
      return `${userName} created document "${details.document_name || 'Untitled'}"`;
    case 'document_updated':
      return `${userName} updated document "${details.document_name || 'Untitled'}"`;
    case 'document_deleted':
      return `${userName} deleted document "${details.document_name || 'Untitled'}"`;
    case 'comment_added':
      return `${userName} added a ${details.comment_type || 'comment'}`;
    case 'comment_resolved':
      return `${userName} resolved a comment`;
    case 'comment_deleted':
      return `${userName} deleted a comment`;
    case 'user_joined':
      return `${userName} joined the project`;
    case 'user_left':
      return `${userName} left the project`;
    case 'permission_changed':
      return `${userName} changed permissions for ${details.target_user || 'a user'}`;
    case 'version_created':
      return `${userName} created version ${details.version_number || 'N/A'}`;
    case 'whiteboard_updated':
      return `${userName} updated the whiteboard`;
    case 'chat_message':
      return `${userName} sent a message`;
    default:
      return `${userName} performed an action`;
  }
};

const getDateLabel = (date: Date) => {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMMM d, yyyy');
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const activityIcon = getActivityIcon(activity.activity_type);
  const activityColor = getActivityColor(activity.activity_type);

  const getUserInitials = () => {
    const firstName = activity.user?.first_name || '';
    const lastName = activity.user?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const hasDetails = activity.details && Object.keys(activity.details).length > 0;

  return (
    <ListItem
      sx={{
        alignItems: 'flex-start',
        py: compact ? 0.5 : 1,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            backgroundColor: `${activityColor}.light`,
            color: `${activityColor}.contrastText`,
          }}
        >
          {activityIcon}
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Typography
            variant={compact ? 'body2' : 'body1'}
            sx={{ fontWeight: 500 }}
          >
            {getActivityMessage(activity)}
          </Typography>
        }
        secondary={
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </Typography>
            
            {hasDetails && (
              <Collapse in={expanded}>
                <Box sx={{ mt: 1, p: 1, backgroundColor: 'action.selected', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Details:
                  </Typography>
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '0.75rem', 
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {JSON.stringify(activity.details, null, 2)}
                  </pre>
                </Box>
              </Collapse>
            )}
          </Box>
        }
      />

      {hasDetails && !compact && (
        <ListItemSecondaryAction>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

const ActivityGroup: React.FC<ActivityGroupProps> = ({ date, activities, compact = false }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ flex: 1 }}>
          {date}
        </Typography>
        <Chip
          label={activities.length}
          size="small"
          variant="outlined"
        />
        <IconButton size="small">
          {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={!collapsed}>
        <List dense={compact} sx={{ pl: 1 }}>
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              compact={compact}
            />
          ))}
        </List>
      </Collapse>
      
      <Divider />
    </Box>
  );
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  projectId,
  compact = false,
  maxItems = 50,
  showFilters = true,
  autoRefresh = true,
}) => {
  const { state } = useCollaboration();
  const [filter, setFilter] = useState<string[]>(['all']);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter activities
  const filteredActivities = state.activities.filter(activity => {
    if (filter.includes('all')) return true;
    return filter.includes(activity.activity_type);
  }).slice(0, maxItems);

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = getDateLabel(new Date(activity.created_at));
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ProjectActivity[]>);

  const handleFilterChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string[],
  ) => {
    if (newFilter.length > 0) {
      setFilter(newFilter);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // The activities are automatically refreshed via real-time subscriptions
    // This just provides visual feedback
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Activities are automatically updated via real-time subscriptions
      // This is just for any missed updates
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const unreadCount = filteredActivities.filter(
    activity => new Date(activity.created_at) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
  ).length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              Activity
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="primary">
                <HistoryIcon />
              </Badge>
            )}
          </Box>
          
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        {showFilters && (
          <ToggleButtonGroup
            value={filter}
            onChange={handleFilterChange}
            aria-label="activity filter"
            size="small"
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="document_created">Documents</ToggleButton>
            <ToggleButton value="comment_added">Comments</ToggleButton>
            <ToggleButton value="user_joined">Users</ToggleButton>
            <ToggleButton value="version_created">Versions</ToggleButton>
            <ToggleButton value="chat_message">Chat</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {filteredActivities.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <HistoryIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body1">
              No recent activity to show
            </Typography>
            <Typography variant="body2">
              Activities will appear here as people work on the project
            </Typography>
          </Paper>
        ) : (
          Object.entries(groupedActivities).map(([date, activities]) => (
            <ActivityGroup
              key={date}
              date={date}
              activities={activities}
              compact={compact}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default ActivityFeed;
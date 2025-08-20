import React from 'react';
import {
  Avatar,
  Badge,
  Tooltip,
  Box,
  Typography,
  AvatarGroup,
  Chip,
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Circle as CircleIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useCollaboration, UserPresence } from '../../../contexts/CollaborationContext';

interface UserPresenceIndicatorProps {
  maxUsers?: number;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'compact' | 'detailed' | 'list';
}

interface StatusIndicatorProps {
  status: UserPresence['status'];
  size?: 'small' | 'medium' | 'large';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'medium' }) => {
  const getStatusColor = (status: UserPresence['status']) => {
    switch (status) {
      case 'online':
        return '#4caf50';
      case 'away':
        return '#ff9800';
      case 'offline':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  };

  const getSizeValue = (size: string) => {
    switch (size) {
      case 'small':
        return 8;
      case 'large':
        return 16;
      default:
        return 12;
    }
  };

  return (
    <CircleIcon
      sx={{
        fontSize: getSizeValue(size),
        color: getStatusColor(status),
      }}
    />
  );
};

interface UserAvatarProps {
  user: UserPresence;
  size?: 'small' | 'medium' | 'large';
  showCursor?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'medium', showCursor = false }) => {
  const getAvatarSize = (size: string) => {
    switch (size) {
      case 'small':
        return { width: 24, height: 24 };
      case 'large':
        return { width: 48, height: 48 };
      default:
        return { width: 32, height: 32 };
    }
  };

  const getUserName = (user: UserPresence) => {
    const firstName = user.profile?.first_name || '';
    const lastName = user.profile?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Anonymous';
  };

  const getUserInitials = (user: UserPresence) => {
    const firstName = user.profile?.first_name || '';
    const lastName = user.profile?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'A';
  };

  const getCursorIcon = () => {
    if (!showCursor || !user.current_page) return null;
    
    if (user.current_page.includes('edit')) {
      return <EditIcon fontSize="small" />;
    }
    return <VisibilityIcon fontSize="small" />;
  };

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {getUserName(user)}
          </Typography>
          <Typography variant="caption" color="inherit">
            {user.status === 'online' ? 'Active now' : `Last seen ${new Date(user.last_seen).toLocaleTimeString()}`}
          </Typography>
          {user.current_page && (
            <Typography variant="caption" display="block" color="inherit">
              Viewing: {user.current_page}
            </Typography>
          )}
        </Box>
      }
      arrow
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: size === 'small' ? 12 : 16,
              height: size === 'small' ? 12 : 16,
              backgroundColor: 'white',
              borderRadius: '50%',
              border: '1px solid #e0e0e0',
            }}
          >
            <StatusIndicator status={user.status} size={size} />
          </Box>
        }
      >
        <Avatar
          src={user.profile?.avatar_url}
          alt={getUserName(user)}
          sx={{
            ...getAvatarSize(size),
            border: user.status === 'online' ? '2px solid #4caf50' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          {getUserInitials(user)}
        </Avatar>
      </Badge>
    </Tooltip>
  );
};

const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  maxUsers = 5,
  showDetails = false,
  size = 'medium',
  variant = 'compact',
}) => {
  const { state } = useCollaboration();
  const activeUsers = state.activeUsers.filter(user => user.status === 'online');

  if (activeUsers.length === 0) {
    return null;
  }

  const renderCompactView = () => (
    <AvatarGroup
      max={maxUsers}
      sx={{
        '& .MuiAvatar-root': {
          border: '2px solid white',
          cursor: 'pointer',
        },
      }}
    >
      {activeUsers.map((user) => (
        <UserAvatar key={user.user_id} user={user} size={size} />
      ))}
    </AvatarGroup>
  );

  const renderDetailedView = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AvatarGroup max={3}>
        {activeUsers.slice(0, 3).map((user) => (
          <UserAvatar key={user.user_id} user={user} size={size} showCursor />
        ))}
      </AvatarGroup>
      {activeUsers.length > 0 && (
        <Box sx={{ ml: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} online
          </Typography>
          {showDetails && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              {activeUsers.slice(0, 3).map((user) => (
                <Chip
                  key={user.user_id}
                  label={user.profile?.first_name || 'User'}
                  size="small"
                  variant="outlined"
                  avatar={<StatusIndicator status={user.status} size="small" />}
                />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );

  const renderListView = () => (
    <Stack spacing={1}>
      <Typography variant="subtitle2" color="text.secondary">
        Active Users ({activeUsers.length})
      </Typography>
      {activeUsers.map((user) => (
        <Box
          key={user.user_id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            borderRadius: 1,
            backgroundColor: alpha('#000', 0.02),
            '&:hover': {
              backgroundColor: alpha('#000', 0.04),
            },
          }}
        >
          <UserAvatar user={user} size={size} showCursor />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {user.profile?.first_name} {user.profile?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.current_page ? `Viewing: ${user.current_page}` : 'Active'}
            </Typography>
          </Box>
          <StatusIndicator status={user.status} />
        </Box>
      ))}
    </Stack>
  );

  switch (variant) {
    case 'detailed':
      return renderDetailedView();
    case 'list':
      return renderListView();
    default:
      return renderCompactView();
  }
};

export default UserPresenceIndicator;
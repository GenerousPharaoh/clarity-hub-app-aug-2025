import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  TrendingUp as ActivityIcon,
} from '@mui/icons-material';
import { analyticsService, TeamActivityMetrics as TeamActivityMetricsType } from '../../../services/analyticsService';

interface TeamActivityAnalyticsProps {
  projectId: string;
}

const TeamActivityAnalytics: React.FC<TeamActivityAnalyticsProps> = ({ projectId }) => {
  const [metrics, setMetrics] = useState<TeamActivityMetricsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadMetrics();
    }
  }, [projectId]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getTeamActivityMetrics(projectId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading team activity metrics:', error);
      setError('Failed to load team activity metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No team activity data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Team Activity Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h4">{metrics.totalUsers}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Team Members
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                  <ActivityIcon />
                </Avatar>
                <Typography variant="h4">{metrics.activeUsers}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active This Week
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.light', width: 56, height: 56 }}>
                  <PersonIcon />
                </Avatar>
                <Typography variant="h4">{metrics.collaborationScore.toFixed(0)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Collaboration Score
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Individual Activity
              </Typography>
              <List>
                {metrics.userActivity.map((user, index) => (
                  <ListItem key={user.userId}>
                    <ListItemText
                      primary={user.userName}
                      secondary={`${user.actionsCount} actions • Last active: ${new Date(user.lastActive).toLocaleDateString()}`}
                    />
                    <Chip
                      label={user.actionsCount > 10 ? 'High' : user.actionsCount > 5 ? 'Medium' : 'Low'}
                      color={user.actionsCount > 10 ? 'success' : user.actionsCount > 5 ? 'warning' : 'default'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamActivityAnalytics;
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
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  MonetizationOn as BillableIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';
import { analyticsService, TimeTrackingMetrics } from '../../../services/analyticsService';

interface TimeTrackingAnalyticsProps {
  projectId: string;
}

const TimeTrackingAnalytics: React.FC<TimeTrackingAnalyticsProps> = ({ projectId }) => {
  const [metrics, setMetrics] = useState<TimeTrackingMetrics | null>(null);
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
      const data = await analyticsService.getTimeTrackingMetrics(projectId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading time tracking metrics:', error);
      setError('Failed to load time tracking metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
          No time tracking data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Time Tracking Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                  <ScheduleIcon />
                </Avatar>
                <Typography variant="h5">{formatTime(metrics.totalTimeLogged)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Time Logged
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
                  <BillableIcon />
                </Avatar>
                <Typography variant="h5">{formatTime(metrics.billableTime)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Billable Time
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
                  <TaskIcon />
                </Avatar>
                <Typography variant="h5">{formatTime(metrics.averageSessionLength)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Session
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Time by Task
              </Typography>
              <List dense>
                {metrics.timeByTask.slice(0, 5).map((task) => (
                  <ListItem key={task.taskId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={task.taskTitle}
                      secondary={`${formatTime(task.totalTime)} total • ${((task.billableTime / Math.max(task.totalTime, 1)) * 100).toFixed(0)}% billable`}
                    />
                    <Chip
                      label={formatTime(task.totalTime)}
                      size="small"
                      color="primary"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Time by User
              </Typography>
              <List dense>
                {metrics.timeByUser.slice(0, 5).map((user) => (
                  <ListItem key={user.userId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={user.userName}
                      secondary={`${formatTime(user.totalTime)} total • ${formatTime(user.averageDaily)}/day avg`}
                    />
                    <Chip
                      label={`${((user.billableTime / Math.max(user.totalTime, 1)) * 100).toFixed(0)}% billable`}
                      size="small"
                      color="success"
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

export default TimeTrackingAnalytics;
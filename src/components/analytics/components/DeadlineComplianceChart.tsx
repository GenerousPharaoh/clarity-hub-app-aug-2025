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
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { analyticsService, DeadlineComplianceMetrics } from '../../../services/analyticsService';

interface DeadlineComplianceChartProps {
  projectId: string;
}

const DeadlineComplianceChart: React.FC<DeadlineComplianceChartProps> = ({ projectId }) => {
  const [metrics, setMetrics] = useState<DeadlineComplianceMetrics | null>(null);
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
      const data = await analyticsService.getDeadlineComplianceMetrics(projectId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading deadline compliance metrics:', error);
      setError('Failed to load deadline compliance metrics');
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
          No deadline compliance data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Deadline Compliance
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Compliance
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography>Compliance Rate</Typography>
                    <Typography variant="h6" color="primary">
                      {metrics.complianceRate.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.complianceRate}
                    color={metrics.complianceRate > 80 ? 'success' : metrics.complianceRate > 60 ? 'warning' : 'error'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Stack alignItems="center" spacing={1}>
                      <Avatar sx={{ bgcolor: 'success.light' }}>
                        <CheckIcon color="success" />
                      </Avatar>
                      <Typography variant="h6">{metrics.metDeadlines}</Typography>
                      <Typography variant="caption" textAlign="center">
                        Met
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={4}>
                    <Stack alignItems="center" spacing={1}>
                      <Avatar sx={{ bgcolor: 'error.light' }}>
                        <ErrorIcon color="error" />
                      </Avatar>
                      <Typography variant="h6">{metrics.missedDeadlines}</Typography>
                      <Typography variant="caption" textAlign="center">
                        Missed
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={4}>
                    <Stack alignItems="center" spacing={1}>
                      <Avatar sx={{ bgcolor: 'warning.light' }}>
                        <WarningIcon color="warning" />
                      </Avatar>
                      <Typography variant="h6">{metrics.upcomingDeadlines}</Typography>
                      <Typography variant="caption" textAlign="center">
                        Upcoming
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Deadline Types
              </Typography>
              <List dense>
                {Object.entries(metrics.deadlinesByType).map(([type, stats]) => (
                  <ListItem key={type} sx={{ px: 0 }}>
                    <ListItemText
                      primary={type.replace('_', ' ').toUpperCase()}
                      secondary={`${stats.total} total • ${stats.met} met • ${stats.missed} missed`}
                    />
                    <Chip
                      label={`${((stats.met / Math.max(stats.total, 1)) * 100).toFixed(0)}%`}
                      color={stats.met / Math.max(stats.total, 1) > 0.8 ? 'success' : 'warning'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {metrics.criticalMissed > 0 && (
          <Grid item xs={12}>
            <Alert severity="error">
              {metrics.criticalMissed} critical deadline{metrics.criticalMissed > 1 ? 's' : ''} missed. 
              Review case priorities and resource allocation.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DeadlineComplianceChart;
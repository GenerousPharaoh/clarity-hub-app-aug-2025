import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Assignment as TaskIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  InsertDriveFile as FileIcon,
  Security as EvidenceIcon,
  Event as DeadlineIcon,
} from '@mui/icons-material';
import { analyticsService, CaseProgressMetrics as CaseProgressMetricsType } from '../../../services/analyticsService';

interface CaseProgressMetricsProps {
  projectId: string;
}

const CaseProgressMetrics: React.FC<CaseProgressMetricsProps> = ({ projectId }) => {
  const [metrics, setMetrics] = useState<CaseProgressMetricsType | null>(null);
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
      const data = await analyticsService.getCaseProgressMetrics(projectId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading case progress metrics:', error);
      setError('Failed to load case progress metrics');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'down':
        return <TrendingDownIcon color="error" fontSize="small" />;
      case 'stable':
        return <TrendingFlatIcon color="action" fontSize="small" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'error';
      case 'stable':
        return 'default';
    }
  };

  const getProgressColor = (percentage: number): 'primary' | 'warning' | 'error' => {
    if (percentage >= 75) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'error';
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
          No case progress data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Case Progress Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Main Progress Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Overall Progress</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {getTrendIcon(metrics.progressTrend)}
                    <Chip
                      label={`${metrics.progressTrend} trend`}
                      color={getTrendColor(metrics.progressTrend) as any}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Stack>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Completion Rate
                    </Typography>
                    <Typography variant="h4" color={`${getProgressColor(metrics.completionRate)}.main`}>
                      {metrics.completionRate.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.completionRate}
                    color={getProgressColor(metrics.completionRate)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Stack alignItems="center" spacing={1}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <TaskIcon color="primary" />
                      </Avatar>
                      <Typography variant="h6">{metrics.totalTasks}</Typography>
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        Total Tasks
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Stack alignItems="center" spacing={1}>
                      <Avatar sx={{ bgcolor: 'success.light' }}>
                        <CheckCircleIcon color="success" />
                      </Avatar>
                      <Typography variant="h6">{metrics.completedTasks}</Typography>
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        Completed
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Stack alignItems="center" spacing={1}>
                      <Avatar sx={{ bgcolor: 'warning.light' }}>
                        <ScheduleIcon color="warning" />
                      </Avatar>
                      <Typography variant="h6">{metrics.inProgressTasks}</Typography>
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        In Progress
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Stack alignItems="center" spacing={1}>
                      <Avatar sx={{ bgcolor: 'error.light' }}>
                        <WarningIcon color="error" />
                      </Avatar>
                      <Typography variant="h6">{metrics.overdueTasks}</Typography>
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        Overdue
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>

                {metrics.averageCompletionTime > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Average Completion Time
                    </Typography>
                    <Typography variant="h6">
                      {metrics.averageCompletionTime.toFixed(1)} days
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Metrics Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Deadlines Card */}
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.light' }}>
                    <DeadlineIcon color="warning" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Deadlines</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Upcoming & Critical
                    </Typography>
                  </Box>
                </Stack>

                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Upcoming Deadlines"
                      secondary="Next 30 days"
                    />
                    <Chip
                      label={metrics.upcomingDeadlines}
                      color={metrics.upcomingDeadlines > 5 ? 'warning' : 'primary'}
                      size="small"
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Critical Deadlines"
                      secondary="High priority"
                    />
                    <Chip
                      label={metrics.criticalDeadlines}
                      color={metrics.criticalDeadlines > 0 ? 'error' : 'success'}
                      size="small"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Documents & Evidence Card */}
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.light' }}>
                    <FileIcon color="info" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Case Materials</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Documents & Evidence
                    </Typography>
                  </Box>
                </Stack>

                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Documents Uploaded"
                      secondary="Total files"
                    />
                    <Typography variant="h6" color="primary">
                      {metrics.documentsUploaded}
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Evidence Collected"
                      secondary="Evidence records"
                    />
                    <Typography variant="h6" color="secondary">
                      {metrics.evidenceCollected}
                    </Typography>
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Progress Insights */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Insights
                </Typography>

                <Stack spacing={2}>
                  {metrics.completionRate > 75 && (
                    <Alert severity="success" variant="outlined">
                      Excellent progress! You're on track to meet your goals.
                    </Alert>
                  )}

                  {metrics.overdueTasks > 0 && (
                    <Alert severity="warning" variant="outlined">
                      {metrics.overdueTasks} overdue task{metrics.overdueTasks > 1 ? 's' : ''} need{metrics.overdueTasks === 1 ? 's' : ''} attention.
                    </Alert>
                  )}

                  {metrics.criticalDeadlines > 0 && (
                    <Alert severity="error" variant="outlined">
                      {metrics.criticalDeadlines} critical deadline{metrics.criticalDeadlines > 1 ? 's' : ''} approaching.
                    </Alert>
                  )}

                  {metrics.progressTrend === 'up' && (
                    <Alert severity="info" variant="outlined">
                      Progress is accelerating. Keep up the momentum!
                    </Alert>
                  )}

                  {metrics.progressTrend === 'down' && metrics.completionRate < 50 && (
                    <Alert severity="warning" variant="outlined">
                      Progress has slowed. Consider reviewing task priorities.
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CaseProgressMetrics;
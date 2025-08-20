import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  InsertDriveFile as FilesIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { format, subDays } from 'date-fns';
import useAppStore from '../../store';
import { analyticsService, OverviewMetrics } from '../../services/analyticsService';
import CaseProgressMetrics from './components/CaseProgressMetrics';
import DocumentStatistics from './components/DocumentStatistics';
import TeamActivityAnalytics from './components/TeamActivityAnalytics';
import DeadlineComplianceChart from './components/DeadlineComplianceChart';
import TimeTrackingAnalytics from './components/TimeTrackingAnalytics';
import AnalyticsExportDialog from './components/AnalyticsExportDialog';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AnalyticsDashboard: React.FC = () => {
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const selectedProjectId = useAppStore(state => state.selectedProjectId);

  useEffect(() => {
    if (selectedProjectId) {
      loadOverviewMetrics();
    }
  }, [selectedProjectId]);

  const loadOverviewMetrics = async () => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      setError(null);
      
      const metrics = await analyticsService.getOverviewMetrics(selectedProjectId);
      setOverviewMetrics(metrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading overview metrics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'primary';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
        return <CheckCircleIcon color="success" />;
      case 'good':
        return <TrendingUpIcon color="primary" />;
      case 'fair':
        return <WarningIcon color="warning" />;
      case 'poor':
        return <ErrorIcon color="error" />;
      default:
        return <TrendingFlatIcon color="disabled" />;
    }
  };

  const renderOverviewCard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' = 'primary',
    subtitle?: string,
    trend?: 'up' | 'down' | 'stable'
  ) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
            {icon}
          </Avatar>
        </Stack>
        
        {trend && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
            {trend === 'up' && <TrendingUpIcon fontSize="small" color="success" />}
            {trend === 'down' && <TrendingDownIcon fontSize="small" color="error" />}
            {trend === 'stable' && <TrendingFlatIcon fontSize="small" color="action" />}
            <Typography variant="caption" color="text.secondary">
              {trend === 'up' && 'Trending up'}
              {trend === 'down' && 'Trending down'}
              {trend === 'stable' && 'Stable'}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  if (!selectedProjectId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Select a project to view analytics
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights and metrics for your case
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm')}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={() => setExportDialogOpen(true)}
            disabled={!overviewMetrics}
          >
            Export
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            variant="contained"
            onClick={loadOverviewMetrics}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && !overviewMetrics && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {overviewMetrics && (
        <>
          {/* Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              {renderOverviewCard(
                'Case Progress',
                `${overviewMetrics.caseProgress.toFixed(1)}%`,
                <AssessmentIcon />,
                'primary',
                'Overall completion rate'
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              {renderOverviewCard(
                'Documents Processed',
                overviewMetrics.documentsProcessed,
                <FilesIcon />,
                'secondary',
                'Total files in case'
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              {renderOverviewCard(
                'Upcoming Deadlines',
                overviewMetrics.deadlinesUpcoming,
                <ScheduleIcon />,
                overviewMetrics.deadlinesUpcoming > 5 ? 'warning' : 'success',
                'Next 30 days'
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              {renderOverviewCard(
                'Team Activity',
                overviewMetrics.teamActivity,
                <PeopleIcon />,
                'primary',
                'Active team members'
              )}
            </Grid>
          </Grid>

          {/* System Health */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                {getSystemHealthIcon(overviewMetrics.systemHealth)}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">
                    System Health: {overviewMetrics.systemHealth.charAt(0).toUpperCase() + overviewMetrics.systemHealth.slice(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall project health based on progress, deadlines, and activity
                  </Typography>
                </Box>
                <Chip
                  label={overviewMetrics.systemHealth.toUpperCase()}
                  color={getSystemHealthColor(overviewMetrics.systemHealth) as any}
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Detailed Analytics Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
                <Tab label="Case Progress" icon={<AssessmentIcon />} />
                <Tab label="Documents" icon={<FilesIcon />} />
                <Tab label="Team Activity" icon={<PeopleIcon />} />
                <Tab label="Deadlines" icon={<ScheduleIcon />} />
                <Tab label="Time Tracking" icon={<DateRangeIcon />} />
              </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
              <CaseProgressMetrics projectId={selectedProjectId} />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <DocumentStatistics projectId={selectedProjectId} />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <TeamActivityAnalytics projectId={selectedProjectId} />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <DeadlineComplianceChart projectId={selectedProjectId} />
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
              <TimeTrackingAnalytics projectId={selectedProjectId} />
            </TabPanel>
          </Card>
        </>
      )}

      {/* Export Dialog */}
      <AnalyticsExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        projectId={selectedProjectId}
        overviewMetrics={overviewMetrics}
      />
    </Box>
  );
};

export default AnalyticsDashboard;
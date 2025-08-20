import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Button,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  Error as ErrorIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  Notes as NotesIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays, parseISO, subDays } from 'date-fns';
import {
  LegalTask,
  LegalDeadline,
  LegalContact,
  LegalNote,
  EvidenceRecord,
  LegalTimeline,
  CaseStats,
  File,
} from '../../types';

interface CaseStatusDashboardProps {
  projectId: string;
  tasks: LegalTask[];
  deadlines: LegalDeadline[];
  contacts: LegalContact[];
  notes: LegalNote[];
  evidence: EvidenceRecord[];
  timeline: LegalTimeline[];
  files: File[];
  onNavigateToTasks: () => void;
  onNavigateToDeadlines: () => void;
  onNavigateToContacts: () => void;
  onNavigateToNotes: () => void;
  onNavigateToEvidence: () => void;
  onNavigateToTimeline: () => void;
}

const CaseStatusDashboard: React.FC<CaseStatusDashboardProps> = ({
  projectId,
  tasks,
  deadlines,
  contacts,
  notes,
  evidence,
  timeline,
  files,
  onNavigateToTasks,
  onNavigateToDeadlines,
  onNavigateToContacts,
  onNavigateToNotes,
  onNavigateToEvidence,
  onNavigateToTimeline,
}) => {
  const getCaseStats = (): CaseStats => {
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length;
    
    const now = new Date();
    const upcomingDeadlines = deadlines.filter(deadline => {
      if (deadline.status === 'completed') return false;
      const dueDate = parseISO(deadline.due_date);
      return isAfter(dueDate, now) && isBefore(dueDate, addDays(now, 30));
    }).length;
    
    const overdueDeadlines = deadlines.filter(deadline => {
      if (deadline.status === 'completed') return false;
      return isAfter(now, parseISO(deadline.due_date));
    }).length;
    
    const recentActivityCount = [
      ...tasks.filter(t => isAfter(parseISO(t.created_at), subDays(now, 7))),
      ...notes.filter(n => isAfter(parseISO(n.created_at), subDays(now, 7))),
      ...timeline.filter(t => isAfter(parseISO(t.created_at), subDays(now, 7))),
    ].length;

    return {
      total_files: files.length,
      total_evidence: evidence.length,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      upcoming_deadlines: upcomingDeadlines,
      overdue_deadlines: overdueDeadlines,
      recent_activity_count: recentActivityCount,
    };
  };

  const getUpcomingDeadlines = () => {
    const now = new Date();
    return deadlines
      .filter(deadline => {
        if (deadline.status === 'completed') return false;
        const dueDate = parseISO(deadline.due_date);
        return isAfter(dueDate, now) && isBefore(dueDate, addDays(now, 14));
      })
      .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime())
      .slice(0, 5);
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks
      .filter(task => {
        if (task.status === 'completed' || !task.due_date) return false;
        return isAfter(now, parseISO(task.due_date));
      })
      .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime())
      .slice(0, 5);
  };

  const getRecentActivity = () => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    
    const activities = [
      ...tasks
        .filter(t => isAfter(parseISO(t.created_at), sevenDaysAgo))
        .map(t => ({ type: 'task', item: t, date: t.created_at })),
      ...notes
        .filter(n => isAfter(parseISO(n.created_at), sevenDaysAgo))
        .map(n => ({ type: 'note', item: n, date: n.created_at })),
      ...timeline
        .filter(t => isAfter(parseISO(t.created_at), sevenDaysAgo))
        .map(t => ({ type: 'timeline', item: t, date: t.created_at })),
      ...evidence
        .filter(e => isAfter(parseISO(e.created_at), sevenDaysAgo))
        .map(e => ({ type: 'evidence', item: e, date: e.created_at })),
    ];

    return activities
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 10);
  };

  const getTaskProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'completed').length;
    return (completed / tasks.length) * 100;
  };

  const getContactsByRole = () => {
    return contacts.reduce((acc, contact) => {
      acc[contact.role] = (acc[contact.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getPriorityTasks = () => {
    return tasks
      .filter(task => task.status !== 'completed' && (task.priority === 'high' || task.priority === 'urgent'))
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <AssignmentIcon />;
      case 'note':
        return <NotesIcon />;
      case 'timeline':
        return <EventIcon />;
      case 'evidence':
        return <SecurityIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'primary';
      case 'note':
        return 'info';
      case 'timeline':
        return 'warning';
      case 'evidence':
        return 'error';
      default:
        return 'default';
    }
  };

  const stats = getCaseStats();
  const upcomingDeadlines = getUpcomingDeadlines();
  const overdueTasks = getOverdueTasks();
  const recentActivity = getRecentActivity();
  const priorityTasks = getPriorityTasks();
  const contactsByRole = getContactsByRole();

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Case Status Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <DescriptionIcon />
              </Avatar>
              <Typography variant="h4" color="primary">
                {stats.total_files}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Files
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1 }}>
                <SecurityIcon />
              </Avatar>
              <Typography variant="h4" color="error">
                {stats.total_evidence}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Evidence Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <CheckCircleIcon />
              </Avatar>
              <Typography variant="h4" color="success">
                {stats.completed_tasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <WarningIcon />
              </Avatar>
              <Typography variant="h4" color="warning">
                {stats.overdue_deadlines}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue Deadlines
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      {(stats.overdue_deadlines > 0 || overdueTasks.length > 0) && (
        <Box sx={{ mb: 3 }}>
          {stats.overdue_deadlines > 0 && (
            <Alert severity="error" sx={{ mb: 1 }}>
              You have {stats.overdue_deadlines} overdue deadline(s). Review immediately!
            </Alert>
          )}
          {overdueTasks.length > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              You have {overdueTasks.length} overdue task(s). Check your task list.
            </Alert>
          )}
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Task Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Task Progress</Typography>
                <Button size="small" onClick={onNavigateToTasks}>View All</Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ flexGrow: 1, mr: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={getTaskProgress()}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(getTaskProgress())}%
                </Typography>
              </Box>
              <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                <Grid item xs={4}>
                  <Typography variant="h6" color="success.main">
                    {stats.completed_tasks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h6" color="primary.main">
                    {stats.pending_tasks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h6" color="error.main">
                    {overdueTasks.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Deadlines */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Upcoming Deadlines</Typography>
                <Button size="small" onClick={onNavigateToDeadlines}>View All</Button>
              </Box>
              {upcomingDeadlines.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No upcoming deadlines in the next 14 days
                </Typography>
              ) : (
                <List dense>
                  {upcomingDeadlines.map((deadline) => {
                    const daysUntil = Math.ceil(
                      (parseISO(deadline.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <ListItem key={deadline.id} divider>
                        <ListItemIcon>
                          {deadline.is_critical ? (
                            <ErrorIcon color="error" />
                          ) : (
                            <ScheduleIcon color={daysUntil <= 3 ? 'warning' : 'primary'} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={deadline.title}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                {format(parseISO(deadline.due_date), 'MMM d')}
                              </Typography>
                              <Chip
                                label={`${daysUntil} days`}
                                size="small"
                                color={daysUntil <= 3 ? 'warning' : 'default'}
                                variant="outlined"
                              />
                              {deadline.is_critical && (
                                <Chip label="CRITICAL" size="small" color="error" variant="filled" />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* High Priority Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">High Priority Tasks</Typography>
                <Button size="small" onClick={onNavigateToTasks}>View All</Button>
              </Box>
              {priorityTasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No high priority tasks
                </Typography>
              ) : (
                <List dense>
                  {priorityTasks.map((task) => (
                    <ListItem key={task.id} divider>
                      <ListItemIcon>
                        <AssignmentIcon color={task.priority === 'urgent' ? 'error' : 'warning'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={task.priority.toUpperCase()}
                              size="small"
                              color={task.priority === 'urgent' ? 'error' : 'warning'}
                              variant="filled"
                            />
                            <Chip
                              label={task.task_type.replace('_', ' ').toUpperCase()}
                              size="small"
                              variant="outlined"
                            />
                            {task.due_date && (
                              <Typography variant="body2" color="text.secondary">
                                Due: {format(parseISO(task.due_date), 'MMM d')}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Contact Summary</Typography>
                <Button size="small" onClick={onNavigateToContacts}>View All</Button>
              </Box>
              {contacts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No contacts added yet
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {Object.entries(contactsByRole).map(([role, count]) => (
                    <Grid item xs={6} key={role}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {role.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity (Last 7 Days)
              </Typography>
              {recentActivity.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No recent activity
                </Typography>
              ) : (
                <List>
                  {recentActivity.map((activity, index) => (
                    <ListItem key={index} divider={index < recentActivity.length - 1}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: `${getActivityColor(activity.type)}.main`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {activity.type === 'task' && `Task: ${(activity.item as LegalTask).title}`}
                              {activity.type === 'note' && `Note: ${(activity.item as LegalNote).title}`}
                              {activity.type === 'timeline' && `Timeline: ${(activity.item as LegalTimeline).title}`}
                              {activity.type === 'evidence' && `Evidence: Exhibit ${(activity.item as EvidenceRecord).exhibit_number}`}
                            </Typography>
                            <Chip
                              label={activity.type.toUpperCase()}
                              size="small"
                              color={getActivityColor(activity.type)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={format(parseISO(activity.date), 'MMM d, yyyy h:mm a')}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CaseStatusDashboard;
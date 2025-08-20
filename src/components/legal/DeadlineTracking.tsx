import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  InputAdornment,
  Tooltip,
  Alert,
  Badge,
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays, parseISO, differenceInDays } from 'date-fns';
import { LegalDeadline, LegalTask } from '../../types';

interface DeadlineTrackingProps {
  projectId: string;
  deadlines: LegalDeadline[];
  tasks: LegalTask[];
  onCreateDeadline: (deadline: Omit<LegalDeadline, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => void;
  onUpdateDeadline: (id: string, updates: Partial<LegalDeadline>) => void;
  onDeleteDeadline: (id: string) => void;
}

const DeadlineTracking: React.FC<DeadlineTrackingProps> = ({
  projectId,
  deadlines,
  tasks,
  onCreateDeadline,
  onUpdateDeadline,
  onDeleteDeadline,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<LegalDeadline | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LegalDeadline['status'] | 'all'>('all');
  const [showOnlyUpcoming, setShowOnlyUpcoming] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline_type: 'other' as LegalDeadline['deadline_type'],
    due_date: '',
    reminder_dates: [] as string[],
    is_critical: false,
    status: 'pending' as LegalDeadline['status'],
    related_task_id: '',
  });
  const [newReminderDate, setNewReminderDate] = useState('');

  const handleOpenDialog = (deadline?: LegalDeadline) => {
    if (deadline) {
      setEditingDeadline(deadline);
      setFormData({
        title: deadline.title,
        description: deadline.description || '',
        deadline_type: deadline.deadline_type,
        due_date: deadline.due_date,
        reminder_dates: deadline.reminder_dates || [],
        is_critical: deadline.is_critical,
        status: deadline.status,
        related_task_id: deadline.related_task_id || '',
      });
    } else {
      setEditingDeadline(null);
      setFormData({
        title: '',
        description: '',
        deadline_type: 'other',
        due_date: '',
        reminder_dates: [],
        is_critical: false,
        status: 'pending',
        related_task_id: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDeadline(null);
    setNewReminderDate('');
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.due_date) return;

    const deadlineData = {
      project_id: projectId,
      title: formData.title,
      description: formData.description || undefined,
      deadline_type: formData.deadline_type,
      due_date: formData.due_date,
      reminder_dates: formData.reminder_dates,
      is_critical: formData.is_critical,
      status: formData.status,
      related_task_id: formData.related_task_id || undefined,
    };

    if (editingDeadline) {
      onUpdateDeadline(editingDeadline.id, deadlineData);
    } else {
      onCreateDeadline(deadlineData);
    }

    handleCloseDialog();
  };

  const addReminderDate = () => {
    if (newReminderDate && !formData.reminder_dates.includes(newReminderDate)) {
      setFormData(prev => ({
        ...prev,
        reminder_dates: [...prev.reminder_dates, newReminderDate].sort()
      }));
      setNewReminderDate('');
    }
  };

  const removeReminderDate = (dateToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      reminder_dates: prev.reminder_dates.filter(date => date !== dateToRemove)
    }));
  };

  const getDeadlineStatus = (deadline: LegalDeadline) => {
    if (deadline.status === 'completed') return 'completed';
    if (deadline.status === 'missed') return 'missed';
    if (deadline.status === 'extended') return 'extended';
    
    const dueDate = parseISO(deadline.due_date);
    const now = new Date();
    
    if (isAfter(now, dueDate)) return 'overdue';
    if (isBefore(dueDate, addDays(now, 7))) return 'due_soon';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'overdue':
      case 'missed':
        return 'error';
      case 'due_soon':
        return 'warning';
      case 'extended':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'overdue':
      case 'missed':
        return <ErrorIcon />;
      case 'due_soon':
        return <WarningIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getDaysUntilDue = (deadline: LegalDeadline) => {
    return differenceInDays(parseISO(deadline.due_date), new Date());
  };

  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId);
  };

  // Filter deadlines
  const filteredDeadlines = deadlines.filter(deadline => {
    const matchesSearch = deadline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (deadline.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || deadline.status === statusFilter;
    const matchesUpcoming = !showOnlyUpcoming || getDeadlineStatus(deadline) !== 'completed';
    return matchesSearch && matchesStatus && matchesUpcoming;
  });

  // Sort deadlines by due date
  const sortedDeadlines = filteredDeadlines.sort((a, b) => {
    // Critical deadlines first
    if (a.is_critical && !b.is_critical) return -1;
    if (!a.is_critical && b.is_critical) return 1;
    
    // Then by due date
    return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
  });

  // Group deadlines by status
  const deadlinesByStatus = sortedDeadlines.reduce((groups, deadline) => {
    const status = getDeadlineStatus(deadline);
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(deadline);
    return groups;
  }, {} as Record<string, LegalDeadline[]>);

  const getDeadlineStats = () => {
    const total = deadlines.length;
    const overdue = deadlines.filter(d => getDeadlineStatus(d) === 'overdue').length;
    const dueSoon = deadlines.filter(d => getDeadlineStatus(d) === 'due_soon').length;
    const completed = deadlines.filter(d => d.status === 'completed').length;
    
    return { total, overdue, dueSoon, completed };
  };

  const stats = getDeadlineStats();

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Deadline Tracking
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Deadline Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {stats.overdue}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overdue
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.dueSoon}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Due Soon
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
          </Grid>
          {stats.total > 0 && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(stats.completed / stats.total) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search deadlines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as LegalDeadline['status'] | 'all')}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="missed">Missed</MenuItem>
                <MenuItem value="extended">Extended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyUpcoming}
                  onChange={(e) => setShowOnlyUpcoming(e.target.checked)}
                />
              }
              label="Show Only Upcoming"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              fullWidth
            >
              Add Deadline
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {sortedDeadlines.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || statusFilter !== 'all' || showOnlyUpcoming 
                ? 'No matching deadlines' 
                : 'No deadlines'
              }
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || statusFilter !== 'all' || showOnlyUpcoming
                ? 'Try adjusting your search or filters'
                : 'Create your first deadline to track important dates'
              }
            </Typography>
            {!searchTerm && statusFilter === 'all' && !showOnlyUpcoming && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Deadline
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <List>
          {sortedDeadlines.map((deadline) => {
            const status = getDeadlineStatus(deadline);
            const daysUntil = getDaysUntilDue(deadline);
            const relatedTask = deadline.related_task_id ? getTaskById(deadline.related_task_id) : null;

            return (
              <Card key={deadline.id} sx={{ mb: 2 }}>
                <ListItem>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    {deadline.is_critical ? (
                      <Badge color="error" variant="dot">
                        {getStatusIcon(status)}
                      </Badge>
                    ) : (
                      getStatusIcon(status)
                    )}
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" component="span">
                          {deadline.title}
                        </Typography>
                        <Chip
                          label={deadline.deadline_type.replace('_', ' ').toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getStatusColor(status)}
                          variant="filled"
                        />
                        {deadline.is_critical && (
                          <Chip
                            label="CRITICAL"
                            size="small"
                            color="error"
                            variant="filled"
                            icon={<WarningIcon />}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon fontSize="small" />
                            <Typography variant="body2" color={status === 'overdue' ? 'error.main' : 'text.secondary'}>
                              Due: {format(parseISO(deadline.due_date), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                          {status !== 'completed' && status !== 'missed' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon fontSize="small" />
                              <Typography 
                                variant="body2" 
                                color={daysUntil < 0 ? 'error.main' : daysUntil <= 7 ? 'warning.main' : 'text.secondary'}
                              >
                                {daysUntil < 0 
                                  ? `${Math.abs(daysUntil)} days overdue`
                                  : daysUntil === 0 
                                    ? 'Due today'
                                    : `${daysUntil} days remaining`
                                }
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        
                        {deadline.description && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {deadline.description}
                          </Typography>
                        )}

                        {deadline.reminder_dates && deadline.reminder_dates.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <NotificationsIcon fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Reminders: {deadline.reminder_dates.map(date => format(parseISO(date), 'MMM d')).join(', ')}
                            </Typography>
                          </Box>
                        )}

                        {relatedTask && (
                          <Typography variant="body2" color="text.secondary">
                            Related Task: {relatedTask.title}
                          </Typography>
                        )}

                        {status === 'overdue' && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            This deadline is overdue! Consider updating the status or extending the deadline.
                          </Alert>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit Deadline">
                      <IconButton
                        edge="end"
                        onClick={() => handleOpenDialog(deadline)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Deadline">
                      <IconButton
                        edge="end"
                        onClick={() => onDeleteDeadline(deadline.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </Card>
            );
          })}
        </List>
      )}

      <Fab
        color="primary"
        aria-label="add deadline"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDeadline ? 'Edit Deadline' : 'Add Deadline'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Deadline Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Deadline Type</InputLabel>
                  <Select
                    value={formData.deadline_type}
                    label="Deadline Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline_type: e.target.value as LegalDeadline['deadline_type'] }))}
                  >
                    <MenuItem value="court_filing">Court Filing</MenuItem>
                    <MenuItem value="discovery">Discovery</MenuItem>
                    <MenuItem value="statute_of_limitations">Statute of Limitations</MenuItem>
                    <MenuItem value="appeal">Appeal</MenuItem>
                    <MenuItem value="response">Response</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Due Date"
                  type="date"
                  fullWidth
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as LegalDeadline['status'] }))}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="missed">Missed</MenuItem>
                    <MenuItem value="extended">Extended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Related Task</InputLabel>
                  <Select
                    value={formData.related_task_id}
                    label="Related Task"
                    onChange={(e) => setFormData(prev => ({ ...prev, related_task_id: e.target.value }))}
                  >
                    <MenuItem value="">None</MenuItem>
                    {tasks.map((task) => (
                      <MenuItem key={task.id} value={task.id}>
                        {task.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_critical}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_critical: e.target.checked }))}
                />
              }
              label="Critical Deadline"
            />

            {/* Reminder Dates */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Reminder Dates
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                {formData.reminder_dates.map((date, index) => (
                  <Chip
                    key={index}
                    label={format(parseISO(date), 'MMM d, yyyy')}
                    size="small"
                    onDelete={() => removeReminderDate(date)}
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  type="date"
                  size="small"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button size="small" onClick={addReminderDate}>Add Reminder</Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.due_date}
          >
            {editingDeadline ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeadlineTracking;
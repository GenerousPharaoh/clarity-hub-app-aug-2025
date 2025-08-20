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
  Checkbox,
  LinearProgress,
  Paper,
  Divider,
  Tooltip,
  Badge,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays, parseISO } from 'date-fns';
import { LegalTask, LegalContact } from '../../types';

interface TaskManagementProps {
  projectId: string;
  tasks: LegalTask[];
  contacts: LegalContact[];
  onCreateTask: (task: Omit<LegalTask, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => void;
  onUpdateTask: (id: string, updates: Partial<LegalTask>) => void;
  onDeleteTask: (id: string) => void;
}

const TaskManagement: React.FC<TaskManagementProps> = ({
  projectId,
  tasks,
  contacts,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LegalTask | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LegalTask['status'] | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<LegalTask['priority'] | 'all'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'other' as LegalTask['task_type'],
    priority: 'medium' as LegalTask['priority'],
    status: 'pending' as LegalTask['status'],
    assigned_to: '',
    due_date: '',
    related_contact_id: '',
    related_file_id: '',
  });

  const handleOpenDialog = (task?: LegalTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        task_type: task.task_type,
        priority: task.priority,
        status: task.status,
        assigned_to: task.assigned_to || '',
        due_date: task.due_date || '',
        related_contact_id: task.related_contact_id || '',
        related_file_id: task.related_file_id || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        task_type: 'other',
        priority: 'medium',
        status: 'pending',
        assigned_to: '',
        due_date: '',
        related_contact_id: '',
        related_file_id: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = () => {
    if (!formData.title) return;

    const taskData = {
      project_id: projectId,
      title: formData.title,
      description: formData.description || undefined,
      task_type: formData.task_type,
      priority: formData.priority,
      status: formData.status,
      assigned_to: formData.assigned_to || undefined,
      due_date: formData.due_date || undefined,
      completion_date: formData.status === 'completed' ? new Date().toISOString() : undefined,
      related_contact_id: formData.related_contact_id || undefined,
      related_file_id: formData.related_file_id || undefined,
    };

    if (editingTask) {
      onUpdateTask(editingTask.id, taskData);
    } else {
      onCreateTask(taskData);
    }

    handleCloseDialog();
  };

  const handleTaskStatusChange = (taskId: string, newStatus: LegalTask['status']) => {
    const completionDate = newStatus === 'completed' ? new Date().toISOString() : undefined;
    onUpdateTask(taskId, { 
      status: newStatus,
      completion_date: completionDate
    });
  };

  const getPriorityColor = (priority: LegalTask['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: LegalTask['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'pending':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTaskTypeIcon = (type: LegalTask['task_type']) => {
    switch (type) {
      case 'filing':
        return <AssignmentIcon />;
      case 'court_appearance':
        return <EventIcon />;
      case 'meeting':
        return <PersonIcon />;
      case 'deadline':
        return <WarningIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const isTaskOverdue = (task: LegalTask) => {
    if (!task.due_date || task.status === 'completed') return false;
    return isAfter(new Date(), parseISO(task.due_date));
  };

  const isTaskDueSoon = (task: LegalTask) => {
    if (!task.due_date || task.status === 'completed') return false;
    const dueDate = parseISO(task.due_date);
    return isBefore(new Date(), dueDate) && isBefore(dueDate, addDays(new Date(), 3));
  };

  const getContactById = (contactId: string) => {
    return contacts.find(contact => contact.id === contactId);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group tasks by status
  const tasksByStatus = filteredTasks.reduce((groups, task) => {
    const status = task.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(task);
    return groups;
  }, {} as Record<LegalTask['status'], LegalTask[]>);

  // Sort tasks within each group by priority and due date
  Object.keys(tasksByStatus).forEach(status => {
    tasksByStatus[status as LegalTask['status']].sort((a, b) => {
      // First sort by priority
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Then by due date
      if (a.due_date && b.due_date) {
        return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      
      return 0;
    });
  });

  const getTaskProgress = () => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    return total === 0 ? 0 : (completed / total) * 100;
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Task Management
        </Typography>
      </Box>

      {/* Progress Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Progress Overview
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={getTaskProgress()}
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary">
              {Math.round(getTaskProgress())}%
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">
                Total Tasks
              </Typography>
              <Typography variant="h6">{tasks.length}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
              <Typography variant="h6" color="success.main">
                {tasks.filter(t => t.status === 'completed').length}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
              <Typography variant="h6" color="primary.main">
                {tasks.filter(t => t.status === 'in_progress').length}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">
                Overdue
              </Typography>
              <Typography variant="h6" color="error.main">
                {tasks.filter(t => isTaskOverdue(t)).length}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tasks..."
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
                onChange={(e) => setStatusFilter(e.target.value as LegalTask['status'] | 'all')}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value as LegalTask['priority'] | 'all')}
              >
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              fullWidth
            >
              Add Task
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'No matching tasks' 
                : 'No tasks'
              }
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first task to track case work'
              }
            </Typography>
            {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {(['pending', 'in_progress', 'completed', 'cancelled'] as LegalTask['status'][])
            .filter(status => tasksByStatus[status]?.length > 0)
            .map(status => (
              <Card key={status}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                    {status.replace('_', ' ')} ({tasksByStatus[status].length})
                  </Typography>
                  <List disablePadding>
                    {tasksByStatus[status].map((task, index) => {
                      const isOverdue = isTaskOverdue(task);
                      const isDueSoon = isTaskDueSoon(task);
                      const relatedContact = task.related_contact_id ? getContactById(task.related_contact_id) : null;

                      return (
                        <React.Fragment key={task.id}>
                          <ListItem>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mr: 2 }}>
                              <Checkbox
                                checked={task.status === 'completed'}
                                onChange={(e) => handleTaskStatusChange(
                                  task.id, 
                                  e.target.checked ? 'completed' : 'pending'
                                )}
                                color="success"
                              />
                            </Box>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  {getTaskTypeIcon(task.task_type)}
                                  <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                      color: task.status === 'completed' ? 'text.secondary' : 'inherit'
                                    }}
                                  >
                                    {task.title}
                                  </Typography>
                                  <Chip
                                    label={task.priority.toUpperCase()}
                                    size="small"
                                    color={getPriorityColor(task.priority)}
                                    variant="outlined"
                                  />
                                  {isOverdue && (
                                    <Badge color="error" variant="dot">
                                      <Chip
                                        label="OVERDUE"
                                        size="small"
                                        color="error"
                                        variant="filled"
                                      />
                                    </Badge>
                                  )}
                                  {isDueSoon && !isOverdue && (
                                    <Chip
                                      label="DUE SOON"
                                      size="small"
                                      color="warning"
                                      variant="filled"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  {task.description && (
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      {task.description}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Chip
                                      label={task.task_type.replace('_', ' ').toUpperCase()}
                                      size="small"
                                      variant="outlined"
                                    />
                                    {task.due_date && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <ScheduleIcon fontSize="small" />
                                        <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.secondary'}>
                                          Due: {format(parseISO(task.due_date), 'MMM d, yyyy')}
                                        </Typography>
                                      </Box>
                                    )}
                                    {task.assigned_to && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <PersonIcon fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">
                                          {task.assigned_to}
                                        </Typography>
                                      </Box>
                                    )}
                                    {relatedContact && (
                                      <Typography variant="body2" color="text.secondary">
                                        Contact: {relatedContact.name}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Tooltip title="Edit Task">
                                <IconButton
                                  edge="end"
                                  onClick={() => handleOpenDialog(task)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Task">
                                <IconButton
                                  edge="end"
                                  onClick={() => onDeleteTask(task.id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < tasksByStatus[status].length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                </CardContent>
              </Card>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="add task"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'Add Task'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Task Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Task Type</InputLabel>
                  <Select
                    value={formData.task_type}
                    label="Task Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value as LegalTask['task_type'] }))}
                  >
                    <MenuItem value="filing">Filing</MenuItem>
                    <MenuItem value="discovery">Discovery</MenuItem>
                    <MenuItem value="research">Research</MenuItem>
                    <MenuItem value="meeting">Meeting</MenuItem>
                    <MenuItem value="court_appearance">Court Appearance</MenuItem>
                    <MenuItem value="deadline">Deadline</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as LegalTask['priority'] }))}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as LegalTask['status'] }))}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
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
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Assigned To"
                  fullWidth
                  value={formData.assigned_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                  placeholder="Enter name or email"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Related Contact</InputLabel>
                  <Select
                    value={formData.related_contact_id}
                    label="Related Contact"
                    onChange={(e) => setFormData(prev => ({ ...prev, related_contact_id: e.target.value }))}
                  >
                    <MenuItem value="">None</MenuItem>
                    {contacts.map((contact) => (
                      <MenuItem key={contact.id} value={contact.id}>
                        {contact.name} ({contact.role.replace('_', ' ')})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title}
          >
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskManagement;
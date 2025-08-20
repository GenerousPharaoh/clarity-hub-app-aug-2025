import React, { useState, useEffect } from 'react';
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
  Fab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Add as AddIcon,
  Event as EventIcon,
  Gavel as GavelIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { LegalTimeline } from '../../types';

interface CaseTimelineProps {
  projectId: string;
  timelineEvents: LegalTimeline[];
  onCreateEvent: (event: Omit<LegalTimeline, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => void;
  onUpdateEvent: (id: string, updates: Partial<LegalTimeline>) => void;
  onDeleteEvent: (id: string) => void;
}

const CaseTimeline: React.FC<CaseTimelineProps> = ({
  projectId,
  timelineEvents,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LegalTimeline | null>(null);
  const [showCompletedEvents, setShowCompletedEvents] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'other' as LegalTimeline['event_type'],
    event_date: '',
    is_deadline: false,
    is_completed: false,
  });

  // Sort events by date
  const sortedEvents = timelineEvents
    .filter(event => showCompletedEvents || !event.is_completed)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const handleOpenDialog = (event?: LegalTimeline) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        event_date: event.event_date,
        is_deadline: event.is_deadline,
        is_completed: event.is_completed,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        event_type: 'other',
        event_date: '',
        is_deadline: false,
        is_completed: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.event_date) return;

    const eventData = {
      project_id: projectId,
      title: formData.title,
      description: formData.description,
      event_type: formData.event_type,
      event_date: formData.event_date,
      is_deadline: formData.is_deadline,
      is_completed: formData.is_completed,
    };

    if (editingEvent) {
      onUpdateEvent(editingEvent.id, eventData);
    } else {
      onCreateEvent(eventData);
    }

    handleCloseDialog();
  };

  const getEventIcon = (eventType: LegalTimeline['event_type'], isDeadline: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    }
    if (isDeadline) {
      return <WarningIcon sx={{ color: 'error.main' }} />;
    }
    
    switch (eventType) {
      case 'filing':
        return <AssignmentIcon sx={{ color: 'primary.main' }} />;
      case 'hearing':
      case 'trial':
        return <GavelIcon sx={{ color: 'warning.main' }} />;
      default:
        return <EventIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getEventColor = (event: LegalTimeline) => {
    if (event.is_completed) return 'success';
    if (event.is_deadline && isAfter(new Date(), new Date(event.event_date))) return 'error';
    if (event.is_deadline && isBefore(new Date(), addDays(new Date(event.event_date), 7))) return 'warning';
    return 'primary';
  };

  const getTimelineDotColor = (event: LegalTimeline) => {
    if (event.is_completed) return 'success';
    if (event.is_deadline && isAfter(new Date(), new Date(event.event_date))) return 'error';
    if (event.is_deadline && isBefore(new Date(), addDays(new Date(event.event_date), 7))) return 'warning';
    return 'primary';
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Case Timeline
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showCompletedEvents}
              onChange={(e) => setShowCompletedEvents(e.target.checked)}
            />
          }
          label="Show Completed"
        />
      </Box>

      {sortedEvents.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Timeline Events
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create your first timeline event to track case progress
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Timeline position="right">
          {sortedEvents.map((event, index) => (
            <TimelineItem key={event.id}>
              <TimelineSeparator>
                <TimelineDot color={getTimelineDotColor(event)}>
                  {getEventIcon(event.event_type, event.is_deadline, event.is_completed)}
                </TimelineDot>
                {index < sortedEvents.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h3">
                        {event.title}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(event)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteEvent(event.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {format(new Date(event.event_date), 'MMMM d, yyyy')}
                    </Typography>

                    {event.description && (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {event.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={event.event_type.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={getEventColor(event)}
                        variant="outlined"
                      />
                      {event.is_deadline && (
                        <Chip
                          label="DEADLINE"
                          size="small"
                          color="error"
                          variant="filled"
                        />
                      )}
                      {event.is_completed && (
                        <Chip
                          label="COMPLETED"
                          size="small"
                          color="success"
                          variant="filled"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}

      <Fab
        color="primary"
        aria-label="add event"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Edit Timeline Event' : 'Add Timeline Event'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Event Title"
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

            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.event_type}
                label="Event Type"
                onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value as LegalTimeline['event_type'] }))}
              >
                <MenuItem value="filing">Filing</MenuItem>
                <MenuItem value="hearing">Hearing</MenuItem>
                <MenuItem value="deadline">Deadline</MenuItem>
                <MenuItem value="discovery">Discovery</MenuItem>
                <MenuItem value="settlement">Settlement</MenuItem>
                <MenuItem value="trial">Trial</MenuItem>
                <MenuItem value="appeal">Appeal</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Event Date"
              type="date"
              fullWidth
              value={formData.event_date}
              onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_deadline: e.target.checked }))}
                  />
                }
                label="Is Deadline"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_completed}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_completed: e.target.checked }))}
                  />
                }
                label="Completed"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.event_date}
          >
            {editingEvent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseTimeline;
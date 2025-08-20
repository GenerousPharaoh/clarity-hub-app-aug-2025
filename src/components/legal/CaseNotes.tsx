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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notes as NotesIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Attachment as AttachmentIcon,
  Schedule as ScheduleIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { LegalNote, LegalContact, LegalTask, File } from '../../types';

interface CaseNotesProps {
  projectId: string;
  notes: LegalNote[];
  contacts: LegalContact[];
  tasks: LegalTask[];
  files: File[];
  onCreateNote: (note: Omit<LegalNote, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => void;
  onUpdateNote: (id: string, updates: Partial<LegalNote>) => void;
  onDeleteNote: (id: string) => void;
}

const CaseNotes: React.FC<CaseNotesProps> = ({
  projectId,
  notes,
  contacts,
  tasks,
  files,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<LegalNote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LegalNote['category'] | 'all'>('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other' as LegalNote['category'],
    tags: [] as string[],
    related_contact_id: '',
    related_task_id: '',
    related_file_id: '',
  });
  const [newTag, setNewTag] = useState('');

  const handleOpenDialog = (note?: LegalNote) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags || [],
        related_contact_id: note.related_contact_id || '',
        related_task_id: note.related_task_id || '',
        related_file_id: note.related_file_id || '',
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        category: 'other',
        tags: [],
        related_contact_id: '',
        related_task_id: '',
        related_file_id: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingNote(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.content) return;

    const noteData = {
      project_id: projectId,
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      related_contact_id: formData.related_contact_id || undefined,
      related_task_id: formData.related_task_id || undefined,
      related_file_id: formData.related_file_id || undefined,
    };

    if (editingNote) {
      onUpdateNote(editingNote.id, noteData);
    } else {
      onCreateNote(noteData);
    }

    handleCloseDialog();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getCategoryColor = (category: LegalNote['category']) => {
    switch (category) {
      case 'discovery':
        return 'primary';
      case 'meeting':
        return 'secondary';
      case 'research':
        return 'info';
      case 'strategy':
        return 'warning';
      case 'client_communication':
        return 'success';
      case 'court_notes':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: LegalNote['category']) => {
    switch (category) {
      case 'discovery':
        return <AttachmentIcon />;
      case 'meeting':
        return <PersonIcon />;
      case 'research':
        return <NotesIcon />;
      case 'strategy':
        return <AssignmentIcon />;
      case 'client_communication':
        return <PersonIcon />;
      case 'court_notes':
        return <ScheduleIcon />;
      default:
        return <NotesIcon />;
    }
  };

  const getContactById = (contactId: string) => {
    return contacts.find(contact => contact.id === contactId);
  };

  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId);
  };

  const getFileById = (fileId: string) => {
    return files.find(file => file.id === fileId);
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group notes by category
  const notesByCategory = filteredNotes.reduce((groups, note) => {
    const category = note.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(note);
    return groups;
  }, {} as Record<LegalNote['category'], LegalNote[]>);

  // Sort notes within each group by creation date (newest first)
  Object.keys(notesByCategory).forEach(category => {
    notesByCategory[category as LegalNote['category']].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Case Notes
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search notes..."
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
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value as LegalNote['category'] | 'all')}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="discovery">Discovery</MenuItem>
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="research">Research</MenuItem>
                <MenuItem value="strategy">Strategy</MenuItem>
                <MenuItem value="client_communication">Client Communication</MenuItem>
                <MenuItem value="court_notes">Court Notes</MenuItem>
                <MenuItem value="other">Other</MenuItem>
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
              Add Note
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <NotesIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || categoryFilter !== 'all' ? 'No matching notes' : 'No case notes'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first note to track case information'
              }
            </Typography>
            {!searchTerm && categoryFilter === 'all' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(notesByCategory).map(([category, categoryNotes]) => (
            <Card key={category}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getCategoryIcon(category as LegalNote['category'])}
                  <Typography variant="h6" sx={{ ml: 1, textTransform: 'capitalize' }}>
                    {category.replace('_', ' ')} ({categoryNotes.length})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {categoryNotes.map((note) => {
                    const relatedContact = note.related_contact_id ? getContactById(note.related_contact_id) : null;
                    const relatedTask = note.related_task_id ? getTaskById(note.related_task_id) : null;
                    const relatedFile = note.related_file_id ? getFileById(note.related_file_id) : null;

                    return (
                      <Accordion key={note.id}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                            <Avatar sx={{ bgcolor: `${getCategoryColor(note.category)}.main`, mr: 2 }}>
                              {getCategoryIcon(note.category)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" component="span">
                                {note.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="div">
                                {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={note.category.replace('_', ' ').toUpperCase()}
                                size="small"
                                color={getCategoryColor(note.category)}
                                variant="outlined"
                              />
                              {note.tags && note.tags.map((tag, index) => (
                                <Chip
                                  key={index}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  icon={<LabelIcon />}
                                />
                              ))}
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Note Content */}
                            <Box>
                              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {note.content}
                              </Typography>
                            </Box>

                            {/* Related Items */}
                            {(relatedContact || relatedTask || relatedFile) && (
                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  Related Items
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {relatedContact && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <PersonIcon fontSize="small" />
                                      <Typography variant="body2">
                                        Contact: {relatedContact.name} ({relatedContact.role.replace('_', ' ')})
                                      </Typography>
                                    </Box>
                                  )}
                                  {relatedTask && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <AssignmentIcon fontSize="small" />
                                      <Typography variant="body2">
                                        Task: {relatedTask.title}
                                      </Typography>
                                    </Box>
                                  )}
                                  {relatedFile && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <AttachmentIcon fontSize="small" />
                                      <Typography variant="body2">
                                        File: {relatedFile.name}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            )}

                            {/* Actions */}
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleOpenDialog(note)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => onDeleteNote(note.id)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="add note"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNote ? 'Edit Note' : 'Add Note'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Note Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as LegalNote['category'] }))}
              >
                <MenuItem value="discovery">Discovery</MenuItem>
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="research">Research</MenuItem>
                <MenuItem value="strategy">Strategy</MenuItem>
                <MenuItem value="client_communication">Client Communication</MenuItem>
                <MenuItem value="court_notes">Court Notes</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Note Content"
              fullWidth
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              placeholder="Enter your detailed notes here..."
            />

            {/* Tags */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    onDelete={() => removeTag(tag)}
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button size="small" onClick={addTag}>Add</Button>
              </Box>
            </Box>

            {/* Related Items */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Related File</InputLabel>
                  <Select
                    value={formData.related_file_id}
                    label="Related File"
                    onChange={(e) => setFormData(prev => ({ ...prev, related_file_id: e.target.value }))}
                  >
                    <MenuItem value="">None</MenuItem>
                    {files.map((file) => (
                      <MenuItem key={file.id} value={file.id}>
                        {file.name}
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
            disabled={!formData.title || !formData.content}
          >
            {editingNote ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseNotes;
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
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  Visibility as VisibilityIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { LegalContact } from '../../types';

interface ContactManagementProps {
  projectId: string;
  contacts: LegalContact[];
  onCreateContact: (contact: Omit<LegalContact, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => void;
  onUpdateContact: (id: string, updates: Partial<LegalContact>) => void;
  onDeleteContact: (id: string) => void;
}

const ContactManagement: React.FC<ContactManagementProps> = ({
  projectId,
  contacts,
  onCreateContact,
  onUpdateContact,
  onDeleteContact,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<LegalContact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<LegalContact['role'] | 'all'>('all');
  const [formData, setFormData] = useState({
    name: '',
    role: 'other' as LegalContact['role'],
    email: '',
    phone: '',
    address: '',
    organization: '',
    bar_number: '',
    specialty: '',
    notes: '',
  });

  const handleOpenDialog = (contact?: LegalContact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        role: contact.role,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        organization: contact.organization || '',
        bar_number: contact.bar_number || '',
        specialty: contact.specialty || '',
        notes: contact.notes || '',
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        role: 'other',
        email: '',
        phone: '',
        address: '',
        organization: '',
        bar_number: '',
        specialty: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = () => {
    if (!formData.name) return;

    const contactData = {
      project_id: projectId,
      name: formData.name,
      role: formData.role,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      organization: formData.organization || undefined,
      bar_number: formData.bar_number || undefined,
      specialty: formData.specialty || undefined,
      notes: formData.notes || undefined,
    };

    if (editingContact) {
      onUpdateContact(editingContact.id, contactData);
    } else {
      onCreateContact(contactData);
    }

    handleCloseDialog();
  };

  const getRoleIcon = (role: LegalContact['role']) => {
    switch (role) {
      case 'client':
        return <PersonIcon />;
      case 'opposing_counsel':
        return <GavelIcon />;
      case 'witness':
        return <VisibilityIcon />;
      case 'expert':
        return <SchoolIcon />;
      case 'judge':
        return <GavelIcon />;
      case 'court_staff':
        return <GroupIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role: LegalContact['role']) => {
    switch (role) {
      case 'client':
        return 'primary';
      case 'opposing_counsel':
        return 'error';
      case 'witness':
        return 'info';
      case 'expert':
        return 'success';
      case 'judge':
        return 'warning';
      case 'court_staff':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRoleDisplayName = (role: LegalContact['role']) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filter contacts based on search term and role
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.organization?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (contact.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || contact.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Group contacts by role
  const groupedContacts = filteredContacts.reduce((groups, contact) => {
    const role = contact.role;
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(contact);
    return groups;
  }, {} as Record<LegalContact['role'], LegalContact[]>);

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Contact Management
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search contacts..."
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
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                label="Filter by Role"
                onChange={(e) => setRoleFilter(e.target.value as LegalContact['role'] | 'all')}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="client">Client</MenuItem>
                <MenuItem value="opposing_counsel">Opposing Counsel</MenuItem>
                <MenuItem value="witness">Witness</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
                <MenuItem value="judge">Judge</MenuItem>
                <MenuItem value="court_staff">Court Staff</MenuItem>
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
              Add Contact
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filteredContacts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || roleFilter !== 'all' ? 'No matching contacts' : 'No contacts'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || roleFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add contacts to manage case participants'
              }
            </Typography>
            {!searchTerm && roleFilter === 'all' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Contact
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(groupedContacts).map(([role, roleContacts]) => (
            <Card key={role}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getRoleIcon(role as LegalContact['role'])}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {getRoleDisplayName(role as LegalContact['role'])} ({roleContacts.length})
                  </Typography>
                </Box>
                <List disablePadding>
                  {roleContacts.map((contact, index) => (
                    <React.Fragment key={contact.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${getRoleColor(contact.role)}.main` }}>
                            {contact.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {contact.name}
                              </Typography>
                              <Chip
                                label={getRoleDisplayName(contact.role)}
                                size="small"
                                color={getRoleColor(contact.role)}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              {contact.organization && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <BusinessIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {contact.organization}
                                  </Typography>
                                </Box>
                              )}
                              {contact.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <EmailIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {contact.email}
                                  </Typography>
                                </Box>
                              )}
                              {contact.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <PhoneIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {contact.phone}
                                  </Typography>
                                </Box>
                              )}
                              {contact.bar_number && (
                                <Typography variant="body2" color="text.secondary">
                                  Bar #: {contact.bar_number}
                                </Typography>
                              )}
                              {contact.specialty && (
                                <Typography variant="body2" color="text.secondary">
                                  Specialty: {contact.specialty}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Edit Contact">
                            <IconButton
                              edge="end"
                              onClick={() => handleOpenDialog(contact)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Contact">
                            <IconButton
                              edge="end"
                              onClick={() => onDeleteContact(contact.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < roleContacts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="add contact"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingContact ? 'Edit Contact' : 'Add Contact'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Full Name"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as LegalContact['role'] }))}
                  >
                    <MenuItem value="client">Client</MenuItem>
                    <MenuItem value="opposing_counsel">Opposing Counsel</MenuItem>
                    <MenuItem value="witness">Witness</MenuItem>
                    <MenuItem value="expert">Expert</MenuItem>
                    <MenuItem value="judge">Judge</MenuItem>
                    <MenuItem value="court_staff">Court Staff</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Organization/Firm"
                  fullWidth
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </Grid>
              {(formData.role === 'opposing_counsel' || formData.role === 'other') && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Bar Number"
                      fullWidth
                      value={formData.bar_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, bar_number: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Specialty"
                      fullWidth
                      value={formData.specialty}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                      placeholder="e.g., Family Law, Criminal Defense"
                    />
                  </Grid>
                </>
              )}
              {formData.role === 'expert' && (
                <Grid item xs={12}>
                  <TextField
                    label="Area of Expertise"
                    fullWidth
                    value={formData.specialty}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="e.g., Forensic Accounting, Medical Expert"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this contact"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name}
          >
            {editingContact ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactManagement;
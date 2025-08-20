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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fab,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Link as LinkIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { EvidenceRecord, ChainOfCustodyEntry, File } from '../../types';

interface EvidenceManagementProps {
  projectId: string;
  evidenceRecords: EvidenceRecord[];
  files: File[];
  onCreateEvidence: (evidence: Omit<EvidenceRecord, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => void;
  onUpdateEvidence: (id: string, updates: Partial<EvidenceRecord>) => void;
  onDeleteEvidence: (id: string) => void;
  onAddChainOfCustody: (evidenceId: string, entry: Omit<ChainOfCustodyEntry, 'id'>) => void;
  onViewFile: (fileId: string) => void;
}

const EvidenceManagement: React.FC<EvidenceManagementProps> = ({
  projectId,
  evidenceRecords,
  files,
  onCreateEvidence,
  onUpdateEvidence,
  onDeleteEvidence,
  onAddChainOfCustody,
  onViewFile,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustodyDialogOpen, setIsCustodyDialogOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<EvidenceRecord | null>(null);
  const [selectedEvidenceForCustody, setSelectedEvidenceForCustody] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    file_id: '',
    exhibit_number: '',
    evidence_type: 'document' as EvidenceRecord['evidence_type'],
    description: '',
    is_privileged: false,
    is_work_product: false,
    tags: [] as string[],
  });
  const [custodyFormData, setCustodyFormData] = useState({
    action: 'received' as ChainOfCustodyEntry['action'],
    person_name: '',
    person_role: '',
    date_time: new Date().toISOString().slice(0, 16),
    location: '',
    notes: '',
  });
  const [newTag, setNewTag] = useState('');

  const handleOpenDialog = (evidence?: EvidenceRecord) => {
    if (evidence) {
      setEditingEvidence(evidence);
      setFormData({
        file_id: evidence.file_id,
        exhibit_number: evidence.exhibit_number,
        evidence_type: evidence.evidence_type,
        description: evidence.description || '',
        is_privileged: evidence.is_privileged,
        is_work_product: evidence.is_work_product,
        tags: evidence.tags || [],
      });
    } else {
      setEditingEvidence(null);
      setFormData({
        file_id: '',
        exhibit_number: '',
        evidence_type: 'document',
        description: '',
        is_privileged: false,
        is_work_product: false,
        tags: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEvidence(null);
  };

  const handleOpenCustodyDialog = (evidenceId: string) => {
    setSelectedEvidenceForCustody(evidenceId);
    setCustodyFormData({
      action: 'received',
      person_name: '',
      person_role: '',
      date_time: new Date().toISOString().slice(0, 16),
      location: '',
      notes: '',
    });
    setIsCustodyDialogOpen(true);
  };

  const handleCloseCustodyDialog = () => {
    setIsCustodyDialogOpen(false);
    setSelectedEvidenceForCustody(null);
  };

  const handleSubmit = () => {
    if (!formData.file_id || !formData.exhibit_number) return;

    const evidenceData = {
      project_id: projectId,
      file_id: formData.file_id,
      exhibit_number: formData.exhibit_number,
      evidence_type: formData.evidence_type,
      description: formData.description,
      is_privileged: formData.is_privileged,
      is_work_product: formData.is_work_product,
      tags: formData.tags,
      chain_of_custody: editingEvidence ? editingEvidence.chain_of_custody : [],
    };

    if (editingEvidence) {
      onUpdateEvidence(editingEvidence.id, evidenceData);
    } else {
      onCreateEvidence(evidenceData);
    }

    handleCloseDialog();
  };

  const handleCustodySubmit = () => {
    if (!selectedEvidenceForCustody || !custodyFormData.person_name || !custodyFormData.date_time) return;

    onAddChainOfCustody(selectedEvidenceForCustody, {
      evidence_id: selectedEvidenceForCustody,
      action: custodyFormData.action,
      person_name: custodyFormData.person_name,
      person_role: custodyFormData.person_role,
      date_time: custodyFormData.date_time,
      location: custodyFormData.location,
      notes: custodyFormData.notes,
    });

    handleCloseCustodyDialog();
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

  const getFileById = (fileId: string) => {
    return files.find(file => file.id === fileId);
  };

  const getEvidenceTypeIcon = (type: EvidenceRecord['evidence_type']) => {
    switch (type) {
      case 'document':
        return <GavelIcon />;
      case 'photo':
      case 'video':
      case 'audio':
        return <VisibilityIcon />;
      case 'digital':
        return <SecurityIcon />;
      default:
        return <GavelIcon />;
    }
  };

  const getEvidenceTypeColor = (type: EvidenceRecord['evidence_type']) => {
    switch (type) {
      case 'document':
        return 'primary';
      case 'photo':
      case 'video':
      case 'audio':
        return 'secondary';
      case 'digital':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Evidence Management
        </Typography>
      </Box>

      {evidenceRecords.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <GavelIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Evidence Records
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Tag files as evidence and manage chain of custody
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Evidence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {evidenceRecords.map((evidence) => {
            const linkedFile = getFileById(evidence.file_id);
            return (
              <Accordion key={evidence.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      {getEvidenceTypeIcon(evidence.evidence_type)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="span">
                        Exhibit {evidence.exhibit_number}
                      </Typography>
                      {linkedFile && (
                        <Typography variant="body2" color="text.secondary" component="div">
                          {linkedFile.name}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={evidence.evidence_type.toUpperCase()}
                        size="small"
                        color={getEvidenceTypeColor(evidence.evidence_type)}
                        variant="outlined"
                      />
                      {evidence.is_privileged && (
                        <Chip
                          label="PRIVILEGED"
                          size="small"
                          color="error"
                          variant="filled"
                          icon={<SecurityIcon />}
                        />
                      )}
                      {evidence.is_work_product && (
                        <Chip
                          label="WORK PRODUCT"
                          size="small"
                          color="warning"
                          variant="filled"
                        />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Evidence Details */}
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Evidence Details
                      </Typography>
                      {evidence.description && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {evidence.description}
                        </Typography>
                      )}
                      {evidence.tags && evidence.tags.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {evidence.tags.map((tag, index) => (
                            <Chip key={index} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                      )}
                    </Box>

                    {/* Chain of Custody */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1">
                          Chain of Custody
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<HistoryIcon />}
                          onClick={() => handleOpenCustodyDialog(evidence.id)}
                        >
                          Add Entry
                        </Button>
                      </Box>
                      {evidence.chain_of_custody.length === 0 ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          No chain of custody entries. Add entries to maintain evidence integrity.
                        </Alert>
                      ) : (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date/Time</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Person</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Notes</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {evidence.chain_of_custody
                                .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
                                .map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell>
                                    {format(new Date(entry.date_time), 'MMM d, yyyy h:mm a')}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={entry.action.replace('_', ' ').toUpperCase()}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2">
                                        {entry.person_name}
                                      </Typography>
                                      {entry.person_role && (
                                        <Typography variant="caption" color="text.secondary">
                                          {entry.person_role}
                                        </Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>{entry.location || '—'}</TableCell>
                                  <TableCell>{entry.notes || '—'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {linkedFile && (
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => onViewFile(evidence.file_id)}
                        >
                          View File
                        </Button>
                      )}
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(evidence)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => onDeleteEvidence(evidence.id)}
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
      )}

      <Fab
        color="primary"
        aria-label="add evidence"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Evidence Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEvidence ? 'Edit Evidence Record' : 'Add Evidence Record'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Linked File</InputLabel>
              <Select
                value={formData.file_id}
                label="Linked File"
                onChange={(e) => setFormData(prev => ({ ...prev, file_id: e.target.value }))}
                required
              >
                {files.map((file) => (
                  <MenuItem key={file.id} value={file.id}>
                    {file.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Exhibit Number"
              fullWidth
              value={formData.exhibit_number}
              onChange={(e) => setFormData(prev => ({ ...prev, exhibit_number: e.target.value }))}
              required
              placeholder="e.g., A-1, B-42, etc."
            />

            <FormControl fullWidth>
              <InputLabel>Evidence Type</InputLabel>
              <Select
                value={formData.evidence_type}
                label="Evidence Type"
                onChange={(e) => setFormData(prev => ({ ...prev, evidence_type: e.target.value as EvidenceRecord['evidence_type'] }))}
              >
                <MenuItem value="document">Document</MenuItem>
                <MenuItem value="photo">Photo</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="physical">Physical</MenuItem>
                <MenuItem value="digital">Digital</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_privileged}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_privileged: e.target.checked }))}
                  />
                }
                label="Attorney-Client Privileged"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_work_product}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_work_product: e.target.checked }))}
                  />
                }
                label="Work Product"
              />
            </Box>

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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.file_id || !formData.exhibit_number}
          >
            {editingEvidence ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chain of Custody Dialog */}
      <Dialog open={isCustodyDialogOpen} onClose={handleCloseCustodyDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Chain of Custody Entry</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={custodyFormData.action}
                label="Action"
                onChange={(e) => setCustodyFormData(prev => ({ ...prev, action: e.target.value as ChainOfCustodyEntry['action'] }))}
              >
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="transferred">Transferred</MenuItem>
                <MenuItem value="analyzed">Analyzed</MenuItem>
                <MenuItem value="copied">Copied</MenuItem>
                <MenuItem value="returned">Returned</MenuItem>
                <MenuItem value="destroyed">Destroyed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Person Name"
              fullWidth
              value={custodyFormData.person_name}
              onChange={(e) => setCustodyFormData(prev => ({ ...prev, person_name: e.target.value }))}
              required
            />

            <TextField
              label="Person Role"
              fullWidth
              value={custodyFormData.person_role}
              onChange={(e) => setCustodyFormData(prev => ({ ...prev, person_role: e.target.value }))}
              placeholder="e.g., Attorney, Investigator, Lab Tech"
            />

            <TextField
              label="Date & Time"
              type="datetime-local"
              fullWidth
              value={custodyFormData.date_time}
              onChange={(e) => setCustodyFormData(prev => ({ ...prev, date_time: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              label="Location"
              fullWidth
              value={custodyFormData.location}
              onChange={(e) => setCustodyFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Law Office, Evidence Room"
            />

            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={custodyFormData.notes}
              onChange={(e) => setCustodyFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional details about this custody action"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCustodyDialog}>Cancel</Button>
          <Button
            onClick={handleCustodySubmit}
            variant="contained"
            disabled={!custodyFormData.person_name || !custodyFormData.date_time}
          >
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EvidenceManagement;
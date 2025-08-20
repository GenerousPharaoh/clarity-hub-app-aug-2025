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
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  FileCopy as FileCopyIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  Public as PublicIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { DocumentTemplate, TemplateVariable } from '../../types';

interface DocumentTemplatesProps {
  projectId: string;
  templates: DocumentTemplate[];
  onCreateTemplate: (template: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => void;
  onUpdateTemplate: (id: string, updates: Partial<DocumentTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onUseTemplate: (template: DocumentTemplate, variables: Record<string, string>) => void;
}

const DocumentTemplates: React.FC<DocumentTemplatesProps> = ({
  projectId,
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseTemplate,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUseDialogOpen, setIsUseDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentTemplate['template_type'] | 'all'>('all');
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'other' as DocumentTemplate['template_type'],
    content: '',
    variables: [] as TemplateVariable[],
    is_system: false,
  });
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [newVariable, setNewVariable] = useState<TemplateVariable>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    default_value: '',
    options: [],
  });

  // Default templates for legal documents
  const defaultTemplates = [
    {
      name: 'Motion to Dismiss',
      template_type: 'motion' as const,
      content: `MOTION TO DISMISS

TO THE HONORABLE COURT:

NOW COMES {{plaintiff_name}}, by and through undersigned counsel, and respectfully moves this Honorable Court to dismiss the complaint filed by {{defendant_name}} for the following reasons:

I. STATEMENT OF THE CASE

{{case_statement}}

II. LEGAL STANDARD

{{legal_standard}}

III. ARGUMENT

{{argument}}

IV. CONCLUSION

For the foregoing reasons, {{plaintiff_name}} respectfully requests that this Honorable Court grant this Motion to Dismiss.

Respectfully submitted,

{{attorney_name}}
{{bar_number}}
{{law_firm}}
{{address}}
{{phone}}
{{email}}

Attorney for {{plaintiff_name}}`,
      variables: [
        { name: 'plaintiff_name', label: 'Plaintiff Name', type: 'text', required: true },
        { name: 'defendant_name', label: 'Defendant Name', type: 'text', required: true },
        { name: 'case_statement', label: 'Case Statement', type: 'textarea', required: true },
        { name: 'legal_standard', label: 'Legal Standard', type: 'textarea', required: true },
        { name: 'argument', label: 'Argument', type: 'textarea', required: true },
        { name: 'attorney_name', label: 'Attorney Name', type: 'text', required: true },
        { name: 'bar_number', label: 'Bar Number', type: 'text', required: true },
        { name: 'law_firm', label: 'Law Firm', type: 'text', required: true },
        { name: 'address', label: 'Address', type: 'textarea', required: true },
        { name: 'phone', label: 'Phone', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'text', required: true },
      ] as TemplateVariable[],
    },
    {
      name: 'Discovery Request',
      template_type: 'discovery_request' as const,
      content: `PLAINTIFF'S FIRST REQUEST FOR PRODUCTION OF DOCUMENTS

TO: {{opposing_party}}

YOU ARE HEREBY REQUESTED to produce and permit inspection and copying of the following documents and things:

{{request_items}}

These requests are continuing in nature. If you obtain additional responsive documents after serving your responses, you are requested to serve supplemental responses.

DEFINITIONS AND INSTRUCTIONS:

1. "Document" means any written, recorded, or graphic matter, however produced or reproduced.

2. "You" or "your" refers to {{opposing_party}} and all agents, employees, representatives, and attorneys.

3. Please produce documents as they are kept in the usual course of business or organize and label them to correspond with the categories in this request.

Respectfully submitted,

{{attorney_name}}
{{bar_number}}
Attorney for {{client_name}}`,
      variables: [
        { name: 'opposing_party', label: 'Opposing Party', type: 'text', required: true },
        { name: 'request_items', label: 'Request Items', type: 'textarea', required: true },
        { name: 'attorney_name', label: 'Attorney Name', type: 'text', required: true },
        { name: 'bar_number', label: 'Bar Number', type: 'text', required: true },
        { name: 'client_name', label: 'Client Name', type: 'text', required: true },
      ] as TemplateVariable[],
    },
    {
      name: 'Client Letter Template',
      template_type: 'correspondence' as const,
      content: `{{date}}

{{client_name}}
{{client_address}}

Dear {{client_name}},

{{opening_paragraph}}

{{main_content}}

{{closing_paragraph}}

If you have any questions or concerns, please do not hesitate to contact me.

Sincerely,

{{attorney_name}}
{{title}}
{{law_firm}}`,
      variables: [
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'client_name', label: 'Client Name', type: 'text', required: true },
        { name: 'client_address', label: 'Client Address', type: 'textarea', required: true },
        { name: 'opening_paragraph', label: 'Opening Paragraph', type: 'textarea', required: true },
        { name: 'main_content', label: 'Main Content', type: 'textarea', required: true },
        { name: 'closing_paragraph', label: 'Closing Paragraph', type: 'textarea', required: true },
        { name: 'attorney_name', label: 'Attorney Name', type: 'text', required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'law_firm', label: 'Law Firm', type: 'text', required: true },
      ] as TemplateVariable[],
    },
  ];

  const handleOpenDialog = (template?: DocumentTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        template_type: template.template_type,
        content: template.content,
        variables: template.variables,
        is_system: template.is_system,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        template_type: 'other',
        content: '',
        variables: [],
        is_system: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setNewVariable({
      name: '',
      label: '',
      type: 'text',
      required: false,
      default_value: '',
      options: [],
    });
  };

  const handleOpenUseDialog = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    const initialValues: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialValues[variable.name] = variable.default_value || '';
    });
    setVariableValues(initialValues);
    setIsUseDialogOpen(true);
  };

  const handleCloseUseDialog = () => {
    setIsUseDialogOpen(false);
    setSelectedTemplate(null);
    setVariableValues({});
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.content) return;

    const templateData = {
      name: formData.name,
      template_type: formData.template_type,
      content: formData.content,
      variables: formData.variables,
      is_system: formData.is_system,
    };

    if (editingTemplate) {
      onUpdateTemplate(editingTemplate.id, templateData);
    } else {
      onCreateTemplate(templateData);
    }

    handleCloseDialog();
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    onUseTemplate(selectedTemplate, variableValues);
    handleCloseUseDialog();
  };

  const addVariable = () => {
    if (!newVariable.name || !newVariable.label) return;

    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, { ...newVariable }]
    }));

    setNewVariable({
      name: '',
      label: '',
      type: 'text',
      required: false,
      default_value: '',
      options: [],
    });
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const createDefaultTemplates = () => {
    defaultTemplates.forEach(template => {
      onCreateTemplate({
        ...template,
        is_system: true,
      });
    });
  };

  const getTemplateTypeColor = (type: DocumentTemplate['template_type']) => {
    switch (type) {
      case 'motion':
        return 'primary';
      case 'discovery_request':
        return 'secondary';
      case 'correspondence':
        return 'info';
      case 'pleading':
        return 'warning';
      case 'brief':
        return 'error';
      case 'contract':
        return 'success';
      default:
        return 'default';
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || template.template_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group templates by type
  const templatesByType = filteredTemplates.reduce((groups, template) => {
    const type = template.template_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(template);
    return groups;
  }, {} as Record<DocumentTemplate['template_type'], DocumentTemplate[]>);

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Document Templates
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates..."
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
              <InputLabel>Template Type</InputLabel>
              <Select
                value={typeFilter}
                label="Template Type"
                onChange={(e) => setTypeFilter(e.target.value as DocumentTemplate['template_type'] | 'all')}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="motion">Motion</MenuItem>
                <MenuItem value="discovery_request">Discovery Request</MenuItem>
                <MenuItem value="correspondence">Correspondence</MenuItem>
                <MenuItem value="pleading">Pleading</MenuItem>
                <MenuItem value="brief">Brief</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
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
              Add Template
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            {templates.length === 0 && (
              <Button
                variant="outlined"
                onClick={createDefaultTemplates}
                fullWidth
              >
                Load Defaults
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || typeFilter !== 'all' ? 'No matching templates' : 'No document templates'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create templates to standardize your legal documents'
              }
            </Typography>
            {!searchTerm && typeFilter === 'all' && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Template
                </Button>
                <Button
                  variant="outlined"
                  onClick={createDefaultTemplates}
                >
                  Load Default Templates
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(templatesByType).map(([type, typeTemplates]) => (
            <Card key={type}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                  {type.replace('_', ' ')} ({typeTemplates.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {typeTemplates.map((template) => (
                    <Accordion key={template.id}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                          <DescriptionIcon sx={{ mr: 2 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="span">
                              {template.name}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={template.template_type.replace('_', ' ').toUpperCase()}
                              size="small"
                              color={getTemplateTypeColor(template.template_type)}
                              variant="outlined"
                            />
                            {template.is_system && (
                              <Chip
                                label="SYSTEM"
                                size="small"
                                color="info"
                                variant="filled"
                                icon={<PublicIcon />}
                              />
                            )}
                            <Chip
                              label={`${template.variables.length} Variables`}
                              size="small"
                              variant="outlined"
                              icon={<CodeIcon />}
                            />
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Template Preview */}
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Template Content
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {template.content.substring(0, 500)}
                                {template.content.length > 500 && '...'}
                              </Typography>
                            </Paper>
                          </Box>

                          {/* Variables */}
                          {template.variables.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Variables ({template.variables.length})
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {template.variables.map((variable, index) => (
                                  <Chip
                                    key={index}
                                    label={`{{${variable.name}}}`}
                                    size="small"
                                    variant="outlined"
                                    color={variable.required ? 'primary' : 'default'}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Actions */}
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              startIcon={<FileCopyIcon />}
                              onClick={() => handleOpenUseDialog(template)}
                              variant="contained"
                            >
                              Use Template
                            </Button>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleOpenDialog(template)}
                            >
                              Edit
                            </Button>
                            {!template.is_system && (
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => onDeleteTemplate(template.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="add template"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Template Editor Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Add Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Template Name"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Template Type</InputLabel>
                  <Select
                    value={formData.template_type}
                    label="Template Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value as DocumentTemplate['template_type'] }))}
                  >
                    <MenuItem value="motion">Motion</MenuItem>
                    <MenuItem value="discovery_request">Discovery Request</MenuItem>
                    <MenuItem value="correspondence">Correspondence</MenuItem>
                    <MenuItem value="pleading">Pleading</MenuItem>
                    <MenuItem value="brief">Brief</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Template Content"
              fullWidth
              multiline
              rows={12}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              placeholder="Enter your template content here. Use {{variable_name}} for variables."
              sx={{ fontFamily: 'monospace' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_system}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_system: e.target.checked }))}
                />
              }
              label="System Template (available to all users)"
            />

            {/* Variables Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Template Variables
              </Typography>
              
              {/* Existing Variables */}
              {formData.variables.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {formData.variables.map((variable, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2">
                              <strong>{variable.name}</strong> - {variable.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Type: {variable.type} | Required: {variable.required ? 'Yes' : 'No'}
                              {variable.default_value && ` | Default: ${variable.default_value}`}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => removeVariable(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {/* Add New Variable */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Add New Variable
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Variable Name"
                        size="small"
                        fullWidth
                        value={newVariable.name}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value.replace(/\s+/g, '_').toLowerCase() }))}
                        placeholder="variable_name"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Display Label"
                        size="small"
                        fullWidth
                        value={newVariable.label}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Display Label"
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={newVariable.type}
                          label="Type"
                          onChange={(e) => setNewVariable(prev => ({ ...prev, type: e.target.value as TemplateVariable['type'] }))}
                        >
                          <MenuItem value="text">Text</MenuItem>
                          <MenuItem value="textarea">Textarea</MenuItem>
                          <MenuItem value="date">Date</MenuItem>
                          <MenuItem value="number">Number</MenuItem>
                          <MenuItem value="select">Select</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        label="Default Value"
                        size="small"
                        fullWidth
                        value={newVariable.default_value}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, default_value: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={newVariable.required}
                              onChange={(e) => setNewVariable(prev => ({ ...prev, required: e.target.checked }))}
                              size="small"
                            />
                          }
                          label="Required"
                        />
                        <Button size="small" onClick={addVariable}>Add</Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.content}
          >
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog open={isUseDialogOpen} onClose={handleCloseUseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Use Template: {selectedTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Fill in the variables below to generate your document:
              </Typography>
              
              {selectedTemplate.variables.map((variable) => (
                <Box key={variable.name}>
                  {variable.type === 'textarea' ? (
                    <TextField
                      label={variable.label}
                      fullWidth
                      multiline
                      rows={3}
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => setVariableValues(prev => ({ ...prev, [variable.name]: e.target.value }))}
                      required={variable.required}
                      placeholder={variable.default_value}
                    />
                  ) : variable.type === 'select' ? (
                    <FormControl fullWidth>
                      <InputLabel>{variable.label}</InputLabel>
                      <Select
                        value={variableValues[variable.name] || ''}
                        label={variable.label}
                        onChange={(e) => setVariableValues(prev => ({ ...prev, [variable.name]: e.target.value }))}
                        required={variable.required}
                      >
                        {variable.options?.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      label={variable.label}
                      type={variable.type === 'date' ? 'date' : variable.type === 'number' ? 'number' : 'text'}
                      fullWidth
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => setVariableValues(prev => ({ ...prev, [variable.name]: e.target.value }))}
                      required={variable.required}
                      placeholder={variable.default_value}
                      InputLabelProps={variable.type === 'date' ? { shrink: true } : undefined}
                    />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUseDialog}>Cancel</Button>
          <Button
            onClick={handleUseTemplate}
            variant="contained"
            startIcon={<FileCopyIcon />}
          >
            Generate Document
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentTemplates;
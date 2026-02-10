import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Divider,
  Stack,
  Badge,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  History as HistoryIcon,
  Restore as RestoreIcon,
  Compare as CompareIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  content_diff?: {
    additions: number;
    deletions: number;
    changes: Array<{
      type: 'add' | 'remove' | 'modify';
      line: number;
      content: string;
      previous?: string;
    }>;
  };
  author_id: string;
  commit_message?: string;
  file_size: number;
  checksum: string;
  created_at: string;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface VersionControlProps {
  documentId: string;
  currentContent?: string;
  onRestoreVersion?: (version: DocumentVersion) => void;
  onCreateVersion?: (message: string) => void;
}

interface DiffViewerProps {
  version1: DocumentVersion;
  version2: DocumentVersion;
  open: boolean;
  onClose: () => void;
}

interface CreateVersionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  currentContent: string;
  lastVersion?: DocumentVersion;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ version1, version2, open, onClose }) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  const renderDiffContent = () => {
    if (!version2.content_diff) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No diff data available for this version.
          </Typography>
        </Paper>
      );
    }

    const { changes } = version2.content_diff;

    if (viewMode === 'unified') {
      return (
        <Paper sx={{ p: 2, backgroundColor: theme.palette.background.default, fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {changes.map((change, index) => (
            <Box
              key={index}
              sx={{
                py: 0.5,
                px: 1,
                backgroundColor:
                  change.type === 'add' ? alpha(theme.palette.success.main, 0.08) :
                  change.type === 'remove' ? alpha(theme.palette.error.main, 0.08) :
                  'transparent',
                borderLeft: `3px solid ${
                  change.type === 'add' ? theme.palette.success.main :
                  change.type === 'remove' ? theme.palette.error.main :
                  theme.palette.info.main
                }`,
                mb: 0.5,
              }}
            >
              <Typography
                component="span"
                sx={{
                  color:
                    change.type === 'add' ? theme.palette.success.dark :
                    change.type === 'remove' ? theme.palette.error.dark :
                    theme.palette.info.dark,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                {change.type === 'add' ? '+ ' : change.type === 'remove' ? '- ' : '  '}
                Line {change.line}: {change.content}
              </Typography>
              {change.type === 'modify' && change.previous && (
                <Typography
                  component="div"
                  sx={{
                    color: theme.palette.error.dark,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    opacity: 0.7,
                  }}
                >
                  - {change.previous}
                </Typography>
              )}
            </Box>
          ))}
        </Paper>
      );
    }

    // Side-by-side view
    return (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Version {version1.version_number}
          </Typography>
          <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
            {version1.content}
          </Box>
        </Paper>
        
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Version {version2.version_number}
          </Typography>
          <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
            {version2.content}
          </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Compare Versions {version1.version_number} → {version2.version_number}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={viewMode === 'unified' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('unified')}
            >
              Unified
            </Button>
            <Button
              size="small"
              variant={viewMode === 'side-by-side' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </Button>
          </Stack>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2}>
            {version2.content_diff && (
              <>
                <Chip
                  label={`+${version2.content_diff.additions} additions`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`-${version2.content_diff.deletions} deletions`}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              </>
            )}
          </Stack>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {renderDiffContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="outlined" startIcon={<ExportIcon />}>
          Export Diff
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CreateVersionDialog: React.FC<CreateVersionDialogProps> = ({
  open,
  onClose,
  onSubmit,
  currentContent,
  lastVersion,
}) => {
  const [message, setMessage] = useState('');
  const [autoMessage, setAutoMessage] = useState('');

  useEffect(() => {
    if (lastVersion && currentContent) {
      // Generate auto commit message based on changes
      const contentLength = currentContent.length;
      const lastLength = lastVersion.content.length;
      const sizeDiff = contentLength - lastLength;
      
      if (sizeDiff > 0) {
        setAutoMessage(`Added ${sizeDiff} characters`);
      } else if (sizeDiff < 0) {
        setAutoMessage(`Removed ${Math.abs(sizeDiff)} characters`);
      } else {
        setAutoMessage('Minor edits');
      }
    }
  }, [currentContent, lastVersion]);

  const handleSubmit = () => {
    const commitMessage = message.trim() || autoMessage || 'Version update';
    onSubmit(commitMessage);
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Version</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Commit Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={autoMessage || 'Describe your changes...'}
          margin="normal"
          helperText="Describe what changed in this version"
        />
        
        {lastVersion && (
          <Paper sx={{ mt: 2, p: 2, backgroundColor: 'action.hover' }}>
            <Typography variant="subtitle2" gutterBottom>
              Changes since v{lastVersion.version_number}:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentContent.length - lastVersion.content.length > 0 ? '+ ' : ''}
              {currentContent.length - lastVersion.content.length} characters
            </Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create Version
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const VersionControl: React.FC<VersionControlProps> = ({
  documentId,
  currentContent = '',
  onRestoreVersion,
  onCreateVersion,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareDialog, setCompareDialog] = useState<{
    open: boolean;
    version1?: DocumentVersion;
    version2?: DocumentVersion;
  }>({ open: false });
  const [createVersionDialog, setCreateVersionDialog] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  // Load versions
  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      // This would be a real API call
      const mockVersions: DocumentVersion[] = [
        {
          id: 'v3',
          document_id: documentId,
          version_number: 3,
          content: 'Latest content with more changes...',
          content_diff: {
            additions: 5,
            deletions: 2,
            changes: [
              { type: 'add', line: 1, content: 'New introduction paragraph' },
              { type: 'modify', line: 5, content: 'Updated methodology section', previous: 'Old methodology section' },
              { type: 'remove', line: 10, content: 'Removed outdated information' },
            ],
          },
          author_id: 'user1',
          commit_message: 'Added new introduction and updated methodology',
          file_size: 2048,
          checksum: 'abc123',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          author: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: undefined,
          },
        },
        {
          id: 'v2',
          document_id: documentId,
          version_number: 2,
          content: 'Updated content with some changes...',
          content_diff: {
            additions: 3,
            deletions: 1,
            changes: [
              { type: 'add', line: 3, content: 'Added new section' },
              { type: 'remove', line: 8, content: 'Removed old paragraph' },
            ],
          },
          author_id: 'user2',
          commit_message: 'Minor content updates',
          file_size: 1536,
          checksum: 'def456',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          author: {
            first_name: 'Jane',
            last_name: 'Smith',
            avatar_url: undefined,
          },
        },
        {
          id: 'v1',
          document_id: documentId,
          version_number: 1,
          content: 'Initial content...',
          author_id: 'user1',
          commit_message: 'Initial version',
          file_size: 1024,
          checksum: 'ghi789',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          author: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: undefined,
          },
        },
      ];
      setVersions(mockVersions);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]; // Keep last selected and new one
      }
      return [...prev, versionId];
    });
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      const version1 = versions.find(v => v.id === selectedVersions[0]);
      const version2 = versions.find(v => v.id === selectedVersions[1]);
      
      if (version1 && version2) {
        setCompareDialog({
          open: true,
          version1: version1.version_number < version2.version_number ? version1 : version2,
          version2: version1.version_number > version2.version_number ? version1 : version2,
        });
      }
    }
  };

  const handleCreateVersion = (message: string) => {
    if (onCreateVersion) {
      onCreateVersion(message);
    }
    // Reload versions after creating
    loadVersions();
  };

  const handleRestoreVersion = (version: DocumentVersion) => {
    if (onRestoreVersion) {
      onRestoreVersion(version);
    }
  };

  const getUserName = (author?: DocumentVersion['author']) => {
    if (!author) return 'Unknown';
    return `${author.first_name} ${author.last_name}`.trim();
  };

  const getUserInitials = (author?: DocumentVersion['author']) => {
    if (!author) return 'U';
    return `${author.first_name.charAt(0)}${author.last_name.charAt(0)}`.toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return <Typography>Loading versions...</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            <Typography variant="h6">
              Version History
            </Typography>
            <Badge badgeContent={versions.length} color="primary">
              <Box />
            </Badge>
          </Box>
          
          <Stack direction="row" spacing={1}>
            {selectedVersions.length === 2 && (
              <Button
                variant="outlined"
                startIcon={<CompareIcon />}
                onClick={handleCompareVersions}
                size="small"
              >
                Compare
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateVersionDialog(true)}
              size="small"
            >
              Save Version
            </Button>
          </Stack>
        </Box>

        {selectedVersions.length > 0 && (
          <Paper sx={{ p: 2, mb: 2, backgroundColor: 'action.hover' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedVersions.length === 1 
                ? 'Select another version to compare'
                : `Selected versions: ${selectedVersions.map(id => 
                    versions.find(v => v.id === id)?.version_number
                  ).join(' & ')}`
              }
            </Typography>
          </Paper>
        )}

        <List>
          {versions.map((version, index) => (
            <ListItem
              key={version.id}
              sx={{
                border: 1,
                borderColor: selectedVersions.includes(version.id) ? 'primary.main' : 'divider',
                borderRadius: 1,
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={() => handleVersionSelect(version.id)}
            >
              <ListItemAvatar>
                <Avatar src={version.author?.avatar_url}>
                  {getUserInitials(version.author)}
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      Version {version.version_number}
                    </Typography>
                    {version.content_diff && (
                      <Stack direction="row" spacing={0.5}>
                        <Chip
                          label={`+${version.content_diff.additions}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                        <Chip
                          label={`-${version.content_diff.deletions}`}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      </Stack>
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {version.commit_message || 'No commit message'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getUserName(version.author)} • {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })} • {formatFileSize(version.file_size)}
                    </Typography>
                  </Box>
                }
              />
              
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="View content">
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Restore this version">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreVersion(version);
                      }}
                    >
                      <RestoreIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Download">
                    <IconButton size="small">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {versions.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <HistoryIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body1">
              No versions saved yet
            </Typography>
            <Typography variant="body2">
              Create your first version to start tracking changes
            </Typography>
          </Paper>
        )}
      </CardContent>

      {compareDialog.version1 && compareDialog.version2 && (
        <DiffViewer
          version1={compareDialog.version1}
          version2={compareDialog.version2}
          open={compareDialog.open}
          onClose={() => setCompareDialog({ open: false })}
        />
      )}

      <CreateVersionDialog
        open={createVersionDialog}
        onClose={() => setCreateVersionDialog(false)}
        onSubmit={handleCreateVersion}
        currentContent={currentContent}
        lastVersion={versions[0]}
      />
    </Card>
  );
};

export default VersionControl;
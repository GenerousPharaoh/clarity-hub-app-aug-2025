import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  Storage as StorageIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { analyticsService, DocumentStatistics as DocumentStatisticsType } from '../../../services/analyticsService';

interface DocumentStatisticsProps {
  projectId: string;
}

const DocumentStatistics: React.FC<DocumentStatisticsProps> = ({ projectId }) => {
  const [metrics, setMetrics] = useState<DocumentStatisticsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadMetrics();
    }
  }, [projectId]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getDocumentStatistics(projectId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading document statistics:', error);
      setError('Failed to load document statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No document statistics available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Document Statistics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                File Overview
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Total Files</Typography>
                  <Typography variant="h6">{metrics.totalFiles}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Total Size</Typography>
                  <Typography variant="h6">{formatFileSize(metrics.totalSize)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Average File Size</Typography>
                  <Typography>{formatFileSize(metrics.averageFileSize)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Recent Uploads (7 days)</Typography>
                  <Chip label={metrics.recentUploads} color="primary" size="small" />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                File Types
              </Typography>
              <List dense>
                {Object.entries(metrics.fileTypeBreakdown).map(([type, count]) => (
                  <ListItem key={type} sx={{ px: 0 }}>
                    <ListItemText primary={type.toUpperCase()} />
                    <Chip label={count} size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search Index Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Stack alignItems="center" spacing={1}>
                    <Avatar sx={{ bgcolor: 'success.light' }}>
                      <FileIcon color="success" />
                    </Avatar>
                    <Typography variant="h6">{metrics.indexedFiles}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Indexed Files
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack alignItems="center" spacing={1}>
                    <Avatar sx={{ bgcolor: 'warning.light' }}>
                      <UploadIcon color="warning" />
                    </Avatar>
                    <Typography variant="h6">{metrics.unindexedFiles}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending Index
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
              {metrics.unindexedFiles > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {metrics.unindexedFiles} files are still being processed for search indexing.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentStatistics;
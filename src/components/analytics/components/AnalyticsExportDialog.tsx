import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Stack,
  Typography,
  Alert,
  LinearProgress,
  Box,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TableChart as CsvIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { analyticsService, OverviewMetrics } from '../../../services/analyticsService';

interface AnalyticsExportDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  overviewMetrics?: OverviewMetrics | null;
}

const AnalyticsExportDialog: React.FC<AnalyticsExportDialogProps> = ({
  open,
  onClose,
  projectId,
  overviewMetrics
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['caseProgress', 'documents']);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(25);
      setError(null);

      const csvData = await analyticsService.exportAnalyticsToCSV(projectId, selectedMetrics);
      setExportProgress(75);

      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportProgress(100);
      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export analytics data');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Analytics</DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          {isExporting && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Exporting analytics data...
              </Typography>
              <LinearProgress variant="determinate" value={exportProgress} />
            </Box>
          )}

          <FormControl component="fieldset">
            <FormLabel component="legend">Export Format</FormLabel>
            <RadioGroup
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
            >
              <FormControlLabel
                value="csv"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CsvIcon fontSize="small" />
                    <span>CSV - Spreadsheet compatible</span>
                  </Stack>
                }
              />
              <FormControlLabel
                value="pdf"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PdfIcon fontSize="small" />
                    <span>PDF - Formatted report</span>
                  </Stack>
                }
              />
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset">
            <FormLabel component="legend">Include Metrics</FormLabel>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedMetrics.includes('caseProgress')}
                    onChange={() => handleMetricToggle('caseProgress')}
                  />
                }
                label="Case Progress Metrics"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedMetrics.includes('documents')}
                    onChange={() => handleMetricToggle('documents')}
                  />
                }
                label="Document Statistics"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedMetrics.includes('deadlines')}
                    onChange={() => handleMetricToggle('deadlines')}
                  />
                }
                label="Deadline Compliance"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedMetrics.includes('team')}
                    onChange={() => handleMetricToggle('team')}
                  />
                }
                label="Team Activity"
              />
            </Stack>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={isExporting || selectedMetrics.length === 0}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnalyticsExportDialog;
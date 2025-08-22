import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  FindInPage as FindInPageIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Gavel as GavelIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  GetApp as GetAppIcon,
  Share as ShareIcon,
  FilterList as FilterListIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useProjectAnalysisSummary, useSimilarDocuments } from '../../hooks/useSemanticSearch';
import { useProcessedContent } from '../../hooks/useProjectFiles';
import ProcessingStatus from '../ProcessingStatus';

interface AIEnhancedExhibitManagerProps {
  projectId: string;
  selectedFileId?: string;
  onFileSelect?: (fileId: string) => void;
  className?: string;
}

const AIEnhancedExhibitManager: React.FC<AIEnhancedExhibitManagerProps> = ({
  projectId,
  selectedFileId,
  onFileSelect,
  className
}) => {
  const [showProcessingDetails, setShowProcessingDetails] = useState(false);
  const [selectedExhibitId, setSelectedExhibitId] = useState<string | null>(null);

  const {
    data: projectSummary,
    isLoading: summaryLoading,
    refetch: refetchSummary
  } = useProjectAnalysisSummary(projectId);

  const {
    data: processedContent,
    isLoading: contentLoading
  } = useProcessedContent(selectedFileId || '');

  const {
    data: similarDocs,
    isLoading: similarLoading
  } = useSimilarDocuments(projectId, selectedFileId || '', !!selectedFileId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'primary';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getProcessingStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'processing': return <SpeedIcon />;
      case 'failed': return <ErrorIcon />;
      default: return <WarningIcon />;
    }
  };

  return (
    <Box className={className}>
      {/* Project Analysis Summary */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <PsychologyIcon color="primary" fontSize="large" />
            <Typography variant="h5" fontWeight={600}>
              AI-Enhanced Case Management
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => refetchSummary()}
            disabled={summaryLoading}
            variant="outlined"
            size="small"
          >
            Refresh Analysis
          </Button>
        </Box>

        {summaryLoading ? (
          <LinearProgress sx={{ mb: 2 }} />
        ) : projectSummary ? (
          <Grid container spacing={3}>
            {/* Processing Statistics */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Processing Status
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`${projectSummary.processingStats.completed} Completed`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      icon={<SpeedIcon />}
                      label={`${projectSummary.processingStats.processing} Processing`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<WarningIcon />}
                      label={`${projectSummary.processingStats.pending} Pending`}
                      color="warning"
                      variant="outlined"
                    />
                    {projectSummary.processingStats.failed > 0 && (
                      <Chip
                        icon={<ErrorIcon />}
                        label={`${projectSummary.processingStats.failed} Failed`}
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total Processed Documents: {projectSummary.totalProcessedDocuments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Document Types */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Document Types
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {projectSummary.documentTypes.slice(0, 6).map(({ type, count }) => (
                      <Chip
                        key={type}
                        label={`${type.replace('_', ' ').toUpperCase()} (${count})`}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Parties */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <PeopleIcon />
                    Key Parties
                  </Typography>
                  <List dense>
                    {projectSummary.topParties.slice(0, 5).map(({ party, count }) => (
                      <ListItem key={party} sx={{ px: 0 }}>
                        <ListItemText
                          primary={party}
                          secondary={`Mentioned in ${count} documents`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Deadlines */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <CalendarIcon />
                    Recent Deadlines
                  </Typography>
                  <List dense>
                    {projectSummary.recentDeadlines.slice(0, 5).map((deadline, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText
                          primary={deadline.description}
                          secondary={`${formatDate(deadline.date)} - ${deadline.file_name}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">
            <Typography>
              No analysis data available yet. Upload and process documents to see AI insights.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Selected File Analysis */}
      {selectedFileId && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <FindInPageIcon />
            Document Analysis
          </Typography>

          {contentLoading ? (
            <LinearProgress />
          ) : processedContent ? (
            <Box>
              {/* Document Summary */}
              {processedContent.ai_summary && (
                <Alert severity="info" icon={<PsychologyIcon />} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    AI Summary
                  </Typography>
                  <Typography variant="body2">
                    {processedContent.ai_summary}
                  </Typography>
                </Alert>
              )}

              {/* Document Metadata */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {processedContent.document_type && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Chip
                      icon={<AssignmentIcon />}
                      label={`Type: ${processedContent.document_type}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Grid>
                )}
                {processedContent.confidence_scores?.overallAnalysis && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Chip
                      icon={<SpeedIcon />}
                      label={`Confidence: ${Math.round(processedContent.confidence_scores.overallAnalysis * 100)}%`}
                      color="secondary"
                      variant="outlined"
                    />
                  </Grid>
                )}
              </Grid>

              {/* Detailed Analysis */}
              <Box>
                {/* Parties */}
                {processedContent.parties_mentioned && processedContent.parties_mentioned.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PeopleIcon />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Parties Mentioned ({processedContent.parties_mentioned.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {processedContent.parties_mentioned.map((party, index) => (
                          <Chip key={index} label={party} variant="outlined" size="small" />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Key Dates */}
                {processedContent.key_dates && processedContent.key_dates.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarIcon />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Key Dates ({processedContent.key_dates.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {processedContent.key_dates.map((dateItem, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={`${formatDate(dateItem.date)} - ${dateItem.description}`}
                              secondary={`Confidence: ${Math.round((dateItem.confidence || 0.5) * 100)}%`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Legal Terms */}
                {processedContent.legal_terms && processedContent.legal_terms.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <GavelIcon />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Legal Terms ({processedContent.legal_terms.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {processedContent.legal_terms.map((term, index) => (
                          <Chip key={index} label={term} variant="outlined" size="small" />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Deadlines */}
                {processedContent.deadlines && processedContent.deadlines.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TimelineIcon />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Deadlines ({processedContent.deadlines.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {processedContent.deadlines.map((deadline, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CalendarIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary={deadline.description}
                              secondary={`${formatDate(deadline.date)} - Type: ${deadline.type}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            </Box>
          ) : (
            <ProcessingStatus
              fileId={selectedFileId}
              fileName="Selected Document"
              showDetailedInsights={true}
            />
          )}

          {/* Similar Documents */}
          {similarDocs && similarDocs.results.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <FindInPageIcon />
                Similar Documents ({similarDocs.results.length})
              </Typography>
              <List>
                {similarDocs.results.slice(0, 5).map((doc, index) => (
                  <ListItemButton
                    key={doc.file_id}
                    onClick={() => onFileSelect?.(doc.file_id)}
                  >
                    <ListItemIcon>
                      <FindInPageIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.file_name}
                      secondary={`${Math.round(doc.similarity_score * 100)}% similar - ${doc.document_type}`}
                    />
                    <Badge
                      badgeContent={`${Math.round(doc.similarity_score * 100)}%`}
                      color="secondary"
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      )}

      {/* Processing Details Dialog */}
      <Dialog
        open={showProcessingDetails}
        onClose={() => setShowProcessingDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          AI Processing Details
        </DialogTitle>
        <DialogContent>
          {selectedFileId ? (
            <ProcessingStatus
              fileId={selectedFileId}
              fileName="Document"
              showDetailedInsights={true}
            />
          ) : (
            <Typography>No file selected for detailed processing view.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProcessingDetails(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIEnhancedExhibitManager;
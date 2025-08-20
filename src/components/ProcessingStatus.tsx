import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Hourglass as HourglassIcon,
  Psychology as PsychologyIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useFileProcessingStatus, useProcessedContent } from '../hooks/useProjectFiles';

interface ProcessingStatusProps {
  fileId: string;
  fileName: string;
  onRetryProcessing?: () => void;
  showDetailedInsights?: boolean;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  fileId,
  fileName,
  onRetryProcessing,
  showDetailedInsights = false
}) => {
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useFileProcessingStatus(fileId);
  const { data: processedContent, isLoading: contentLoading } = useProcessedContent(fileId);

  const getStatusColor = (processingStatus: string) => {
    switch (processingStatus) {
      case 'completed': return 'success';
      case 'processing': return 'primary';
      case 'failed': return 'error';
      case 'retry': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (processingStatus: string) => {
    switch (processingStatus) {
      case 'completed': return <CheckCircleIcon />;
      case 'processing': return <HourglassIcon />;
      case 'failed': return <ErrorIcon />;
      default: return <HourglassIcon />;
    }
  };

  const getProgressValue = (processingStatus: string) => {
    switch (processingStatus) {
      case 'completed': return 100;
      case 'processing': return 60;
      case 'failed': return 0;
      case 'retry': return 30;
      default: return 10;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatConfidenceScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  if (statusLoading || contentLoading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <HourglassIcon color="action" />
            <Typography variant="body2">Loading processing status...</Typography>
          </Box>
          <LinearProgress sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  const processingStatus = status?.processing_status || 'pending';

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Basic Status Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            {getStatusIcon(processingStatus)}
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                AI Processing Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fileName}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
              color={getStatusColor(processingStatus)}
              size="small"
            />
            {(processingStatus === 'failed' || processingStatus === 'retry') && onRetryProcessing && (
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetryProcessing}
                variant="outlined"
              >
                Retry
              </Button>
            )}
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => refetchStatus()}
              variant="text"
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={getProgressValue(processingStatus)}
          color={getStatusColor(processingStatus)}
          sx={{ mb: 2 }}
        />

        {/* Processing Times */}
        {status && (
          <Box mb={2}>
            {status.processing_started_at && (
              <Typography variant="caption" display="block" color="text.secondary">
                Started: {formatDate(status.processing_started_at)}
              </Typography>
            )}
            {status.processing_completed_at && (
              <Typography variant="caption" display="block" color="text.secondary">
                Completed: {formatDate(status.processing_completed_at)}
              </Typography>
            )}
          </Box>
        )}

        {/* Error Message */}
        {processingStatus === 'failed' && status?.processing_error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Processing failed: {status.processing_error}
            </Typography>
          </Alert>
        )}

        {/* AI Summary */}
        {processedContent?.ai_summary && (
          <Alert severity="info" icon={<PsychologyIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              AI Summary
            </Typography>
            <Typography variant="body2">
              {processedContent.ai_summary}
            </Typography>
          </Alert>
        )}

        {/* Document Type */}
        {processedContent?.document_type && (
          <Box mb={2}>
            <Chip
              label={`Document Type: ${processedContent.document_type}`}
              variant="outlined"
              size="small"
            />
          </Box>
        )}

        {/* Detailed Insights */}
        {showDetailedInsights && processedContent && processingStatus === 'completed' && (
          <Box>
            <Divider sx={{ my: 2 }} />
            
            {/* Parties Mentioned */}
            {processedContent.parties_mentioned && processedContent.parties_mentioned.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={600}>
                    Parties Mentioned ({processedContent.parties_mentioned.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {processedContent.parties_mentioned.map((party, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={party} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Key Dates */}
            {processedContent.key_dates && processedContent.key_dates.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={600}>
                    Key Dates ({processedContent.key_dates.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {processedContent.key_dates.map((dateItem, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${dateItem.date} - ${dateItem.description}`}
                          secondary={`Confidence: ${formatConfidenceScore(dateItem.confidence || 0.5)}`}
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
                  <Typography variant="body2" fontWeight={600}>
                    Legal Terms ({processedContent.legal_terms.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {processedContent.legal_terms.map((term, index) => (
                      <Chip key={index} label={term} size="small" variant="outlined" />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Deadlines */}
            {processedContent.deadlines && processedContent.deadlines.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={600}>
                    Deadlines ({processedContent.deadlines.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {processedContent.deadlines.map((deadline, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${deadline.date} - ${deadline.description}`}
                          secondary={`Type: ${deadline.type}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Citations */}
            {processedContent.citations && processedContent.citations.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={600}>
                    Legal Citations ({processedContent.citations.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {processedContent.citations.map((citation, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={citation} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* AI Insights */}
            {processedContent.ai_insights && Object.keys(processedContent.ai_insights).length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={600}>
                    AI Insights
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {processedContent.ai_insights.mainPurpose && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Purpose:</strong> {processedContent.ai_insights.mainPurpose}
                      </Typography>
                    )}
                    
                    {processedContent.ai_insights.keyPoints && Array.isArray(processedContent.ai_insights.keyPoints) && (
                      <Box mb={2}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Key Points:
                        </Typography>
                        <List dense>
                          {processedContent.ai_insights.keyPoints.map((point, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={point} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {processedContent.ai_insights.legalImplications && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Legal Implications:</strong> {processedContent.ai_insights.legalImplications}
                      </Typography>
                    )}

                    {processedContent.ai_insights.actionItems && Array.isArray(processedContent.ai_insights.actionItems) && (
                      <Box>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Action Items:
                        </Typography>
                        <List dense>
                          {processedContent.ai_insights.actionItems.map((action, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={action} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Confidence Scores */}
            {processedContent.confidence_scores && Object.keys(processedContent.confidence_scores).length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight={600}>
                    Confidence Scores
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {Object.entries(processedContent.confidence_scores).map(([key, score]) => (
                      <ListItem key={key}>
                        <ListItemText
                          primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          secondary={
                            <LinearProgress
                              variant="determinate"
                              value={(score as number) * 100}
                              sx={{ mt: 1 }}
                            />
                          }
                        />
                        <Typography variant="body2" color="text.secondary">
                          {formatConfidenceScore(score as number)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}

        {/* Search Ready Indicator */}
        {processedContent?.content_embedding && (
          <Box mt={2}>
            <Alert severity="success" icon={<SearchIcon />}>
              <Typography variant="body2">
                Document is ready for semantic search and AI-powered analysis
              </Typography>
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
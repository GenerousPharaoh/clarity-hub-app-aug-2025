import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  Button,
  Alert,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  ExpandMore, 
  AnalyticsOutlined, 
  PersonOutline, 
  DateRangeOutlined,
  GavelOutlined,
  SummarizeOutlined,
  FactCheckOutlined,
  AutoAwesomeOutlined
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { FileRecord } from '../../hooks/useProjectFiles';

interface FileAnalyzerProps {
  file: FileRecord | null;
}

interface AnalysisResult {
  summary?: string;
  documentType?: string;
  keyEntities?: Array<{name: string; role: string}>;
  keyDates?: Array<{date: string; significance: string}>;
  legalIssues?: string[];
  keyFacts?: string[];
  relevantLaw?: string[];
  suggestedKeywords?: string[];
}

const FileAnalyzer: React.FC<FileAnalyzerProps> = ({ file }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // Get any existing analysis from file metadata
  useEffect(() => {
    if (file?.metadata?.documentAnalysis) {
      setAnalysis(file.metadata.documentAnalysis);
    } else {
      setAnalysis(null);
    }
  }, [file]);

  const handleAnalyze = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the analyze-file Edge Function
      const response = await supabase.functions.invoke('analyze-file', {
        body: { fileId: file.id }
      });
      
      if (response.error) {
        throw new Error(`Analysis failed: ${response.error.message}`);
      }

      // Check if we got a valid analysis result
      if (response.data?.analysis) {
        setAnalysis(response.data.analysis);
      } else {
        throw new Error('No analysis data received');
      }
    } catch (err: any) {
      console.error('Error analyzing file:', err);
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
        <CircularProgress />
        <Typography variant="body1">
          Analyzing your document with AI...
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This may take a minute for large documents
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleAnalyze}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          The AI analysis couldn't be completed. This could be due to the file format, size, or temporary service issues.
        </Typography>
      </Box>
    );
  }

  // Render when no file is selected
  if (!file) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Select a file to analyze its content with AI
        </Typography>
      </Box>
    );
  }

  // Render when no analysis exists yet
  if (!analysis) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <AnalyticsOutlined sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7 }} />
        <Typography variant="h6">
          AI Document Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
          Use AI to extract key information, identify entities, and summarize the content of this document.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleAnalyze}
          disableElevation
        >
          Analyze Document
        </Button>
      </Box>
    );
  }

  // Render analysis results
  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
          <SummarizeOutlined color="primary" />
          <Typography variant="h6">Document Summary</Typography>
        </Box>
        <Typography variant="body2">
          {analysis.summary || 'No summary available'}
        </Typography>
        
        {analysis.documentType && (
          <Box sx={{ mt: 2 }}>
            <Chip 
              label={`Document Type: ${analysis.documentType}`} 
              color="primary" 
              variant="outlined" 
              size="small" 
            />
          </Box>
        )}
      </Paper>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonOutline color="primary" />
            <Typography variant="subtitle1">Key Entities</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {analysis.keyEntities && analysis.keyEntities.length > 0 ? (
            <List dense disablePadding>
              {analysis.keyEntities.map((entity, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={entity.name}
                    secondary={entity.role}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No entities identified
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DateRangeOutlined color="primary" />
            <Typography variant="subtitle1">Important Dates</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {analysis.keyDates && analysis.keyDates.length > 0 ? (
            <List dense disablePadding>
              {analysis.keyDates.map((date, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={date.date}
                    secondary={date.significance}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No important dates identified
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GavelOutlined color="primary" />
            <Typography variant="subtitle1">Legal Issues</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {analysis.legalIssues && analysis.legalIssues.length > 0 ? (
            <List dense disablePadding>
              {analysis.legalIssues.map((issue, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText primary={issue} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No legal issues identified
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FactCheckOutlined color="primary" />
            <Typography variant="subtitle1">Key Facts</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {analysis.keyFacts && analysis.keyFacts.length > 0 ? (
            <List dense disablePadding>
              {analysis.keyFacts.map((fact, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText primary={fact} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No key facts identified
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {analysis.suggestedKeywords && analysis.suggestedKeywords.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <AutoAwesomeOutlined fontSize="small" color="primary" />
            <Typography variant="subtitle2">Suggested Keywords</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {analysis.suggestedKeywords.map((keyword, index) => (
              <Chip 
                key={index} 
                label={keyword} 
                size="small" 
                variant="outlined" 
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default FileAnalyzer; 
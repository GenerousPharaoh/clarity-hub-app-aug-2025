import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  IconButton,
  Alert,
  Stack,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  AutoAwesome,
  ErrorOutline,
  Psychology,
  PsychologyAlt,
  Cancel,
} from '@mui/icons-material';
import { supabase as supabaseClient } from '../../lib/supabase';
import { File as FileType } from '../../types';
import useAppStore from '../../store';
import { demoAI } from '../../services/demoAIService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Entity {
  entity_text: string;
  entity_type: string;
}

interface AIAssistPanelProps {
  fileId: string;
}

interface AnalysisResult {
  summary: string;
  documentType: string;
  keyEntities: { name: string; role: string }[];
  keyDates: { date: string; significance: string }[];
  legalIssues: string[];
  keyFacts: string[];
  relevantLaw: string[];
  suggestedKeywords: string[];
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-assist-tabpanel-${index}`}
      aria-labelledby={`ai-assist-tab-${index}`}
      style={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AIAssistPanel = ({ fileId }: AIAssistPanelProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  const files = useAppStore((state) => state.files);
  const selectedFile = files.find(file => file.id === fileId);
  
  // Check if file has already been analyzed
  useEffect(() => {
    if (selectedFile?.metadata?.analysis) {
      setAnalysis(selectedFile.metadata.analysis as AnalysisResult);
    } else {
      setAnalysis(null);
    }
  }, [selectedFile]);
  
  const handleAnalyze = async () => {
    if (!fileId || !selectedFile) return;
    
    try {
      setAnalyzing(true);
      setError(null);
      
      // Use demo AI for demo mode
      if (window.DEMO_MODE) {
        // Simulate analysis with demo AI
        const demoAnalysis = await demoAI.analyzeDocument(
          '', // Empty content for demo
          selectedFile.name,
          selectedFile.content_type || '',
          `Analyzing file ${selectedFile.id}`
        );
        
        const analysisResult: AnalysisResult = {
          summary: demoAnalysis.summary,
          documentType: demoAnalysis.documentType,
          keyEntities: demoAnalysis.keyEntities.map(e => ({ name: e, role: 'Entity' })),
          keyDates: [],
          legalIssues: ['Document review required', 'Legal compliance check needed'],
          keyFacts: demoAnalysis.insights.map(i => i.description),
          relevantLaw: [],
          suggestedKeywords: demoAnalysis.keyEntities
        };
        
        setAnalysis(analysisResult);
        
        // Update file metadata in store
        useAppStore.getState().updateFile(selectedFile.id, {
          metadata: {
            ...selectedFile.metadata,
            analysis: analysisResult,
            analyzed_at: new Date().toISOString()
          }
        });
      } else {
        // Call the analyze-file edge function for real mode
        const { data, error } = await supabaseClient.functions.invoke('analyze-file', {
          body: { fileId }
        });
        
        if (error) throw new Error(error.message);
        
        if (data?.analysis) {
          setAnalysis(data.analysis);
          
          // Update the file metadata with the analysis
          const updateResult = await supabaseClient
            .from('files')
            .update({
              metadata: {
                ...selectedFile?.metadata,
                analysis: data.analysis,
                analyzed_at: new Date().toISOString()
              }
            })
            .eq('id', fileId);
            
          if (updateResult.error) {
            console.error('Error updating file metadata:', updateResult.error);
          }
        } else {
          throw new Error('No analysis results returned');
        }
      }
    } catch (err) {
      console.error('Error analyzing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze file');
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Summary" />
          <Tab label="Entities" />
          <Tab label="Key Facts" />
        </Tabs>
      </Box>
      
      {!analysis && !analyzing && !error && (
        <Box 
          sx={{ 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center'
          }}
        >
          <PsychologyAlt sx={{ fontSize: 48, color: 'primary.main', mb: 2, opacity: 0.7 }} />
          <Typography variant="h6" gutterBottom>AI Analysis</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Analyze this document to extract key information like entities, dates, and legal issues
          </Typography>
          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            Analyze Document
          </Button>
        </Box>
      )}
      
      {analyzing && (
        <Box 
          sx={{ 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%' 
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>Analyzing Document</Typography>
          <Typography variant="body2" color="text.secondary">
            This may take up to a minute depending on document size
          </Typography>
        </Box>
      )}
      
      {error && (
        <Box sx={{ p: 3 }}>
          <Alert 
            severity="error" 
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
        </Box>
      )}
      
      {analysis && (
        <>
          {/* Summary Tab */}
          <Box
            role="tabpanel"
            hidden={activeTab !== 0}
            sx={{ 
              flexGrow: 1, 
              display: activeTab !== 0 ? 'none' : 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              p: 3
            }}
          >
            <Typography variant="h6" gutterBottom>Document Summary</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="body1">{analysis.summary}</Typography>
            </Paper>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Document Type</Typography>
              <Chip label={analysis.documentType} />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Legal Issues</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {analysis.legalIssues.map((issue, index) => (
                  <Chip key={index} label={issue} color="primary" variant="outlined" />
                ))}
              </Stack>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>Relevant Laws & Regulations</Typography>
              <Stack direction="column" spacing={1}>
                {analysis.relevantLaw.map((law, index) => (
                  <Typography key={index} variant="body2">• {law}</Typography>
                ))}
              </Stack>
            </Box>
          </Box>
          
          {/* Entities Tab */}
          <Box
            role="tabpanel"
            hidden={activeTab !== 1}
            sx={{ 
              flexGrow: 1, 
              display: activeTab !== 1 ? 'none' : 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              p: 3
            }}
          >
            <Typography variant="h6" gutterBottom>Key Entities</Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>People & Organizations</Typography>
              {analysis.keyEntities.length > 0 ? (
                analysis.keyEntities.map((entity, index) => (
                  <Paper 
                    key={index} 
                    variant="outlined" 
                    sx={{ p: 2, mb: 2 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">{entity.name}</Typography>
                      <Chip size="small" label={entity.role} />
                    </Box>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No entities identified</Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>Important Dates</Typography>
              {analysis.keyDates.length > 0 ? (
                analysis.keyDates.map((date, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ p: 2, mb: 2 }}
                  >
                    <Typography variant="subtitle2">{date.date}</Typography>
                    <Typography variant="body2" color="text.secondary">{date.significance}</Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No important dates identified</Typography>
              )}
            </Box>
          </Box>
          
          {/* Key Facts Tab */}
          <Box
            role="tabpanel"
            hidden={activeTab !== 2}
            sx={{ 
              flexGrow: 1, 
              display: activeTab !== 2 ? 'none' : 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              p: 3
            }}
          >
            <Typography variant="h6" gutterBottom>Key Facts</Typography>
            
            <Box sx={{ mb: 4 }}>
              {analysis.keyFacts.length > 0 ? (
                <Stack direction="column" spacing={2}>
                  {analysis.keyFacts.map((fact, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{ p: 2 }}
                    >
                      <Typography variant="body1">• {fact}</Typography>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No key facts identified</Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>Suggested Keywords</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {analysis.suggestedKeywords.map((keyword, index) => (
                  <Chip key={index} label={keyword} color="secondary" variant="outlined" />
                ))}
              </Stack>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default AIAssistPanel; 
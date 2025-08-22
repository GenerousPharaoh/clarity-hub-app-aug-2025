import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Divider,
  Button,
  Collapse,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Clear,
  Speed,
  Psychology,
  Refresh,
  ExpandMore,
  ExpandLess,
  Download,
  Search,
  AutoAwesome,
} from '@mui/icons-material';
import { chatbotService, CHAT_MODES } from '../services/chatbotService';
import { pdfExtractionService } from '../services/pdfExtractionService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: string;
  sources?: any[];
  processingTime?: number;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'fast' | 'deep'>('fast');
  const [error, setError] = useState<string | null>(null);
  const [isKnowledgeReady, setIsKnowledgeReady] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize knowledge base on mount
  useEffect(() => {
    initializeKnowledge();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeKnowledge = async () => {
    try {
      const knowledge = await chatbotService.initializeKnowledge();
      setIsKnowledgeReady(true);
      setStats(knowledge.metadata);
    } catch (error) {
      console.error('Failed to initialize knowledge base:', error);
      setError('Failed to initialize AI knowledge base');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isKnowledgeReady) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatbotService.processQuery(input, mode);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        mode: response.mode,
        sources: response.sources,
        processingTime: response.processingTime,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
      setError('Failed to get response from AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    chatbotService.clearHistory();
  };

  const handleExtractPDFs = async () => {
    setIsLoading(true);
    try {
      const result = await pdfExtractionService.extractAllPDFs();
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ PDF Extraction Complete!\n\n• Successfully extracted: ${result.success} files\n• Failed: ${result.failed} files\n• Total processed: ${result.total} files\n\nThe knowledge base has been updated with the extracted content.`,
        timestamp: new Date(),
      }]);
      
      // Refresh knowledge base
      await initializeKnowledge();
    } catch (error) {
      console.error('PDF extraction failed:', error);
      setError('Failed to extract PDF content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await chatbotService.search(input, 5);
      
      if (results.length === 0) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `No results found for "${input}"`,
          timestamp: new Date(),
        }]);
      } else {
        const resultText = results.map((r, i) => 
          `${i + 1}. **${r.type === 'exhibit' ? `Exhibit ${r.exhibit_id}:` : ''} ${r.name}**\n   Relevance: ${r.relevance}`
        ).join('\n\n');
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🔍 Search Results for "${input}":\n\n${resultText}`,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6">Legal AI Assistant</Typography>
              <Typography variant="caption" color="text.secondary">
                Powered by Google Gemini
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(e, newMode) => newMode && setMode(newMode)}
              size="small"
            >
              <ToggleButton value="fast">
                <Tooltip title={CHAT_MODES.fast.description}>
                  <Speed fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="deep">
                <Tooltip title={CHAT_MODES.deep.description}>
                  <Psychology fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title="Clear Chat">
              <IconButton onClick={handleClearChat} size="small">
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Knowledge Base Stats */}
        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            onClick={() => setShowStats(!showStats)}
            startIcon={showStats ? <ExpandLess /> : <ExpandMore />}
          >
            Knowledge Base Status
          </Button>
          
          <Collapse in={showStats}>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {isKnowledgeReady ? (
                <>
                  <Chip 
                    label={`${stats?.documentCount || 0} Documents`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`${stats?.exhibitCount || 0} Exhibits`} 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`${stats?.projectCount || 0} Projects`} 
                    size="small" 
                    color="info" 
                    variant="outlined" 
                  />
                  <Button
                    size="small"
                    startIcon={<Download />}
                    onClick={handleExtractPDFs}
                    disabled={isLoading}
                  >
                    Extract PDFs
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Refresh />}
                    onClick={initializeKnowledge}
                    disabled={isLoading}
                  >
                    Refresh
                  </Button>
                </>
              ) : (
                <CircularProgress size={20} />
              )}
            </Box>
          </Collapse>
        </Box>
      </Paper>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}>
            <AutoAwesome sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              Ask me anything about your legal documents
            </Typography>
            <Typography variant="body2" color="text.secondary">
              I can help analyze cases, find exhibits, and answer legal questions
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  gap: 2,
                  mb: 2,
                  alignItems: 'flex-start',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.role === 'user' ? 'secondary.main' : 'primary.main',
                    width: 32,
                    height: 32,
                  }}
                >
                  {message.role === 'user' ? <Person /> : <SmartToy />}
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </Typography>
                    {message.mode && (
                      <Chip 
                        label={message.mode} 
                        size="small" 
                        variant="outlined"
                        icon={message.mode.includes('Fast') ? <Speed /> : <Psychology />}
                      />
                    )}
                    {message.processingTime && (
                      <Typography variant="caption" color="text.secondary">
                        {(message.processingTime / 1000).toFixed(1)}s
                      </Typography>
                    )}
                  </Box>
                  
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        '& strong': { fontWeight: 600 },
                      }}
                      dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                    />
                    
                    {message.sources && message.sources.length > 0 && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Referenced Sources:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {message.sources.map((source, i) => (
                            <Chip
                              key={i}
                              label={source.exhibitId || source.name}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2 }}>
          {error}
        </Alert>
      )}

      {/* Input area */}
      <Paper elevation={3} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={isKnowledgeReady ? "Ask about your legal documents..." : "Initializing..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isKnowledgeReady || isLoading}
            multiline
            maxRows={4}
            size="small"
          />
          
          <Tooltip title="Search Knowledge Base">
            <IconButton 
              onClick={handleSearch}
              disabled={!isKnowledgeReady || isLoading || !input.trim()}
              color="primary"
            >
              <Search />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={`Send (${CHAT_MODES[mode].name})`}>
            <IconButton 
              onClick={handleSend}
              disabled={!isKnowledgeReady || isLoading || !input.trim()}
              color="primary"
            >
              {isLoading ? <CircularProgress size={24} /> : <Send />}
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </Box>
  );
};

export default AIChat;
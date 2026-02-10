/**
 * Adaptive Legal AI Chat - Personalized AI Assistant
 * 
 * AI chat interface that learns from user's case data and adapts responses
 * to their specific legal practice and communication style.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Divider,
  Menu,
  MenuItem,
  List,
  ListItem,
  Alert,
  Button,
  Tooltip,
  CircularProgress,
  Fade,
  Collapse,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  Psychology as AIIcon,
  Person as UserIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandIcon,
  Lightbulb as InsightIcon,
  Link as CitationIcon,
  AutoAwesome as PersonalizedIcon,
  Gavel as GavelIcon,
  Search as SearchIcon,
  EditNote as EditNoteIcon,
  Summarize as SummarizeIcon,
} from '@mui/icons-material';
import { animationKeyframes } from '../../theme/animations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { supabase } from '../../lib/supabase';
import { AdaptiveAIService, UserAIProfile, PersonalizedResponse } from '../../services/adaptiveAIService';
import { legalKnowledge } from '../../services/legalKnowledgeService';
import { aiRouter } from '../../services/aiRouter';
import useAppStore from '../../store';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: File[];
  citations?: any[];
  insights?: any[];
  personalizedInsights?: any[];
  timestamp: Date;
  feedback?: 'positive' | 'negative';
  tokens_used?: number;
  modelUsed?: 'gemini' | 'gpt';
}

interface ConversationContext {
  id: string;
  title: string;
  message_count: number;
  last_message_at: string;
}

const suggestedPrompts = [
  { icon: <GavelIcon sx={{ fontSize: 20 }} />, label: 'Analyze case strength', description: 'Evaluate strengths and weaknesses' },
  { icon: <SearchIcon sx={{ fontSize: 20 }} />, label: 'Find relevant precedents', description: 'Search landmark case law' },
  { icon: <EditNoteIcon sx={{ fontSize: 20 }} />, label: 'Draft a legal argument', description: 'Build a persuasive position' },
  { icon: <SummarizeIcon sx={{ fontSize: 20 }} />, label: 'Summarize uploaded evidence', description: 'Key findings overview' },
];

export const AdaptiveLegalAIChat: React.FC = () => {
  const theme = useTheme();
  const user = useAppStore(state => state.user);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserAIProfile | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ConversationContext | null>(null);
  const [aiService] = useState(() => new AdaptiveAIService());
  const [attachments, setAttachments] = useState<File[]>([]);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [feedbackMenu, setFeedbackMenu] = useState<{ messageId: string; anchorEl: HTMLElement } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user profile and conversation on mount
  useEffect(() => {
    if (user && user.id && selectedProjectId) {
      initializeChat();
    }
  }, [user, selectedProjectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    try {
      await initializeProductionChat();
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const initializeProductionChat = async () => {
    // Load user AI profile
    const profile = await aiService.getUserAIProfile(user.id);
    setUserProfile(profile);

    // Load or create conversation for this project
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', selectedProjectId)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single();

    if (conversation) {
      setCurrentConversation(conversation);
      await loadConversationMessages(conversation.id);
    } else {
      // Create new conversation
      const { data: newConversation } = await supabase
        .from('ai_conversations')
        .insert({
          project_id: selectedProjectId,
          user_id: user.id,
          title: 'New Legal Discussion'
        })
        .select()
        .single();

      if (newConversation) {
        setCurrentConversation(newConversation);
        await addWelcomeMessage(profile);
      }
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    const { data: chatMessages } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (chatMessages) {
      const formattedMessages: ChatMessage[] = chatMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        citations: msg.citations || [],
        insights: msg.insights || [],
        timestamp: new Date(msg.created_at),
        tokens_used: msg.tokens_used
      }));
      setMessages(formattedMessages);
    }
  };

  const addWelcomeMessage = async (profile: UserAIProfile) => {
    const welcomeMessage: ChatMessage = {
      id: uuid(),
      role: 'assistant',
      content: `Hello! I'm your personalized legal AI assistant. I've learned about your practice in ${profile.legal_specialties.join(', ')} and I'm ready to help with your case analysis, document review, and legal research.

I can analyze any files you upload, help draft documents, find relevant precedents from your case history, and provide insights tailored to your legal practice. 

What would you like to work on today?`,
      personalizedInsights: [
        {
          title: 'Personalized for You',
          description: `Customized for ${profile.legal_specialties.join(', ')} practice`,
          type: 'info'
        }
      ],
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
    
    if (currentConversation) {
      await saveMessageToDatabase(welcomeMessage, currentConversation.id);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    if (!currentConversation || !userProfile) return;

    const userMessage: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: inputValue,
      attachments: [...attachments],
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Save user message
      await saveMessageToDatabase(userMessage, currentConversation.id);

      // Smart route: picks Gemini for general queries, GPT-5.2 for deep legal reasoning
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Get user's case-specific context in parallel with routing
      const userContext = await getUserRelevantContext(inputValue);
      const caseContextStr = userContext
        .map((c: any) => c.content?.substring(0, 300))
        .filter(Boolean)
        .join('\n');

      const routerResult = await aiRouter.routeQuery({
        query: inputValue,
        conversationHistory,
        caseContext: caseContextStr || undefined,
      });

      const aiMessage: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content: routerResult.response,
        citations: routerResult.citations,
        insights: [],
        timestamp: new Date(),
        modelUsed: routerResult.model,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message
      await saveMessageToDatabase(aiMessage, currentConversation.id);

      // Record interaction for learning
      await recordUserInteraction(userMessage, aiMessage, userContext);

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please check that your AI API keys are configured and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserRelevantContext = async (query: string): Promise<any[]> => {
    if (!user || !query) return [];

    try {
      // Generate embedding for the query
      const embedding = await aiService.generateEmbedding(query);
      
      // Search user's embeddings
      const { data: context } = await supabase.rpc('match_user_content', {
        user_id_param: user.id,
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 5,
        project_filter: selectedProjectId
      });

      return context || [];
    } catch (error) {
      console.error('Failed to get user context:', error);
      return [];
    }
  };

  const getLegalKnowledgeContext = async (query: string): Promise<string> => {
    if (!query || query.length < 5) return '';
    try {
      return await legalKnowledge.buildLegalContext(query);
    } catch {
      return '';
    }
  };

  const saveMessageToDatabase = async (message: ChatMessage, conversationId: string) => {
    await supabase
      .from('ai_messages')
      .insert({
        id: message.id,
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        attachments: message.attachments?.map(f => ({ name: f.name, type: f.type, size: f.size })) || [],
        citations: message.citations || [],
        insights: message.insights || [],
        tokens_used: message.tokens_used
      });
  };

  const recordUserInteraction = async (userMessage: ChatMessage, aiMessage: ChatMessage, context: any[]) => {
    await supabase
      .from('user_ai_interactions')
      .insert({
        user_id: user.id,
        interaction_type: 'query',
        query_text: userMessage.content,
        ai_response: aiMessage.content,
        context_used: { context_items: context.map(c => c.id) },
        learning_signal: {
          tokens_used: aiMessage.tokens_used,
          response_quality: 'pending_feedback',
          context_relevance: context.length > 0 ? 'high' : 'low'
        }
      });
  };

  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));

    // Record feedback for learning
    await supabase
      .from('user_ai_interactions')
      .insert({
        user_id: user.id,
        interaction_type: 'feedback',
        user_feedback: { type: feedback, message_id: messageId },
        learning_signal: {
          feedback_type: feedback,
          improvement_areas: feedback === 'negative' ? ['accuracy', 'relevance'] : []
        }
      });

    setFeedbackMenu(null);
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleInsightExpansion = (messageId: string) => {
    setExpandedInsights(prev => {
      const updated = new Set(prev);
      if (updated.has(messageId)) {
        updated.delete(messageId);
      } else {
        updated.add(messageId);
      }
      return updated;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: alpha(theme.palette.primary.main, 0.03),
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            width: 36,
            height: 36,
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
          }}>
            <AIIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
              Legal AI Assistant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userProfile?.legal_specialties.length ?
                `Specialized in ${userProfile.legal_specialties.join(', ')}` :
                'Learning your practice areas'
              }
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              icon={<PersonalizedIcon />}
              label="Personalized"
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Suggested prompts when chat is empty */}
        {messages.length === 0 && !isLoading && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1.5,
              maxWidth: 440,
              width: '100%',
              px: 2,
            }}>
              {suggestedPrompts.map((prompt) => (
                <Box
                  key={prompt.label}
                  onClick={() => {
                    setInputValue(prompt.label);
                    // Small delay so user sees the value before sending
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                    },
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 1 }}>{prompt.icon}</Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, mb: 0.5 }}>
                    {prompt.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {prompt.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <List>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                px: 0,
                '&:hover .message-actions': { opacity: 1 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  width: '100%',
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    ...(message.role === 'user'
                      ? { bgcolor: 'grey.300', width: 32, height: 32 }
                      : {
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                          width: 32,
                          height: 32,
                        }),
                  }}
                >
                  {message.role === 'user' ? <UserIcon sx={{ fontSize: 18 }} /> : <AIIcon sx={{ fontSize: 18 }} />}
                </Avatar>

                <Box
                  sx={{
                    maxWidth: '85%',
                    p: 2.5,
                    ...(message.role === 'user'
                      ? {
                          background: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          borderRadius: '16px 16px 4px 16px',
                          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.dark, 0.25)}`,
                        }
                      : {
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: '16px 16px 16px 4px',
                          bgcolor: 'background.paper',
                        }),
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      '& p': { margin: '0.5em 0' },
                      '& ul, & ol': { paddingLeft: '1.5em' },
                      '& li': { marginBottom: '0.25em' },
                      '& strong': { fontWeight: 600 },
                      '& code': {
                        backgroundColor: message.role === 'user' ? alpha(theme.palette.common.white, 0.15) : 'action.hover',
                        padding: '0.2em 0.4em',
                        borderRadius: '3px',
                        fontSize: '0.9em',
                      },
                      '& pre': {
                        backgroundColor: message.role === 'user' ? alpha(theme.palette.common.white, 0.1) : 'action.hover',
                        padding: '1em',
                        borderRadius: '4px',
                        overflow: 'auto',
                      },
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </Box>

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Citations:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        {message.citations.map((citation, index) => (
                          <Chip
                            key={index}
                            icon={<CitationIcon />}
                            label={citation.title || `Citation ${index + 1}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'all 150ms ease',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                                borderColor: theme.palette.primary.main,
                                transform: 'translateY(-1px)',
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Personalized Insights */}
                  {message.insights && message.insights.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        startIcon={<InsightIcon />}
                        endIcon={<ExpandIcon />}
                        size="small"
                        onClick={() => toggleInsightExpansion(message.id)}
                      >
                        {message.insights.length} Personalized Insights
                      </Button>

                      <Collapse in={expandedInsights.has(message.id)}>
                        <Box sx={{ mt: 1 }}>
                          {message.insights.map((insight, index) => (
                            <Alert key={index} severity="info" sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                <strong>{insight.title}</strong>: {insight.description}
                              </Typography>
                            </Alert>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  )}

                  {/* Message Actions — show on hover */}
                  {message.role === 'assistant' && (
                    <Box
                      className="message-actions"
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        mt: 2,
                        alignItems: 'center',
                        opacity: 0,
                        transition: 'opacity 150ms ease',
                      }}
                    >
                      <Tooltip title="Copy response">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(message.content)}
                          sx={{
                            borderRadius: '6px',
                            '&:hover': { color: 'primary.main' },
                          }}
                        >
                          <CopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Helpful">
                        <IconButton
                          size="small"
                          color={message.feedback === 'positive' ? 'success' : 'default'}
                          onClick={() => handleFeedback(message.id, 'positive')}
                          sx={{
                            borderRadius: '6px',
                            '&:hover': { color: 'success.main' },
                          }}
                        >
                          <ThumbUpIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Not helpful">
                        <IconButton
                          size="small"
                          color={message.feedback === 'negative' ? 'error' : 'default'}
                          onClick={() => handleFeedback(message.id, 'negative')}
                          sx={{
                            borderRadius: '6px',
                            '&:hover': { color: 'error.main' },
                          }}
                        >
                          <ThumbDownIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      {message.modelUsed && (
                        <Chip
                          label={message.modelUsed === 'gpt' ? 'GPT-5.2' : 'Gemini'}
                          size="small"
                          sx={{
                            ml: 1,
                            height: 24,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            ...(message.modelUsed === 'gpt'
                              ? {
                                  background: alpha(theme.palette.primary.main, 0.08),
                                  color: theme.palette.primary.main,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                }
                              : {
                                  background: alpha(theme.palette.primary.main, 0.08),
                                  color: theme.palette.primary.main,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                }),
                          }}
                        />
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </ListItem>
          ))}

          {/* Typing indicator — animated dots */}
          {isLoading && (
            <ListItem sx={{ px: 0 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Avatar
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    width: 32,
                    height: 32,
                  }}
                >
                  <AIIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '16px 16px 16px 4px',
                      bgcolor: 'background.paper',
                      px: 2.5,
                      py: 2,
                      display: 'flex',
                      gap: 0.75,
                      alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.primary.main, 0.4),
                          animation: `${animationKeyframes.typingDot} 1.4s ease-in-out infinite`,
                          animationDelay: `${i * 150}ms`,
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', ml: 1 }}>
                    Thinking...
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Attachments:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => removeAttachment(index)}
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2, bgcolor: 'background.paper' }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.txt"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            px: 1.5,
            py: 0.5,
            transition: 'all 150ms ease',
            '&:focus-within': {
              borderColor: alpha(theme.palette.primary.main, 0.3),
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.06)}`,
            },
          }}
        >
          <IconButton onClick={handleAttachFile} disabled={isLoading} size="small">
            <AttachIcon fontSize="small" />
          </IconButton>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask about your cases..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="standard"
            size="small"
            InputProps={{ disableUnderline: true }}
            sx={{ '& .MuiInputBase-root': { py: 0.75 } }}
          />

          <IconButton
            onClick={handleSendMessage}
            disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}
            size="small"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              color: theme.palette.primary.contrastText,
              borderRadius: '12px',
              width: 36,
              height: 36,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              },
              '&.Mui-disabled': {
                background: 'action.disabledBackground',
                color: 'action.disabled',
              },
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 0.75, fontSize: '0.65rem' }}>
          Enter to send, Shift+Enter for new line
        </Typography>
      </Box>
    </Box>
  );
};

export default AdaptiveLegalAIChat;
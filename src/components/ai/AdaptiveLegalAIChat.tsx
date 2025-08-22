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
  Collapse
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
  AutoAwesome as PersonalizedIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { supabase } from '../../lib/supabase';
import { AdaptiveAIService, UserAIProfile, PersonalizedResponse } from '../../services/adaptiveAIService';
import useAppStore from '../../store';
import demoStorage from '../../services/demoStorageService';

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
}

interface ConversationContext {
  id: string;
  title: string;
  message_count: number;
  last_message_at: string;
}

export const AdaptiveLegalAIChat: React.FC = () => {
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
    const isDemoMode = user.id === '00000000-0000-0000-0000-000000000000';
    
    try {
      if (isDemoMode) {
        await initializeDemoChat();
      } else {
        await initializeProductionChat();
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const initializeDemoChat = async () => {
    // Create demo AI profile
    const profile: UserAIProfile = {
      id: 'demo-profile',
      user_id: user.id,
      legal_specialties: ['Corporate Law', 'Contract Disputes', 'Commercial Litigation'],
      writing_style_analysis: {
        tone: 'professional',
        formality: 'high',
        preferred_structures: ['IRAC', 'chronological'],
        citation_style: 'bluebook'
      },
      case_patterns: {
        common_case_types: ['contract_breach', 'corporate_governance'],
        typical_outcomes: ['settlement', 'motion_granted'],
        jurisdiction_focus: ['federal', 'delaware']
      },
      interaction_preferences: {
        communication_style: 'detailed',
        response_length: 'comprehensive', 
        expertise_level: 'senior_partner'
      },
      knowledge_domains: {
        primary_domains: ['contract_law', 'corporate_law', 'litigation'],
        specialization_depth: 'expert'
      },
      ai_learning_metadata: {
        total_interactions: 25,
        learning_progress: { contract_analysis: 0.85, brief_writing: 0.92 }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setUserProfile(profile);

    // Load demo conversation from local storage
    const demoConversations = await demoStorage.getConversations(selectedProjectId);
    
    if (demoConversations.length > 0) {
      const conversation = demoConversations[0];
      setCurrentConversation({
        id: conversation.id,
        project_id: conversation.project_id,
        user_id: user.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        last_message_at: conversation.updated_at
      });
      
      // Load messages from conversation
      const formattedMessages: ChatMessage[] = conversation.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        citations: msg.citations || [],
        insights: msg.insights || [],
        timestamp: new Date(msg.timestamp),
        tokens_used: msg.tokens_used || 0
      }));
      setMessages(formattedMessages);
    } else {
      // Create new demo conversation
      const newConversation = {
        id: uuid(),
        project_id: selectedProjectId,
        title: 'AI Legal Assistant - Demo',
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await demoStorage.saveConversation(newConversation);
      setCurrentConversation({
        id: newConversation.id,
        project_id: newConversation.project_id,
        user_id: user.id,
        title: newConversation.title,
        created_at: newConversation.created_at,
        updated_at: newConversation.updated_at,
        last_message_at: newConversation.updated_at
      });
      
      // Add welcome message for demo
      await addDemoWelcomeMessage(profile);
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

  const addDemoWelcomeMessage = async (profile: UserAIProfile) => {
    const welcomeMessage: ChatMessage = {
      id: uuid(),
      role: 'assistant',
      content: `Welcome to Clarity Hub's AI Legal Assistant! 🎯

I'm your personalized AI assistant, trained in ${profile.legal_specialties.join(', ')}. I'm here to help you with:

• **Document Analysis**: Upload files and get intelligent insights
• **Case Strategy**: Develop arguments and identify key legal issues  
• **Research Assistance**: Find relevant precedents and authorities
• **Brief Writing**: Help draft motions, briefs, and legal documents
• **Evidence Review**: Organize and analyze exhibits

**Demo Features Available:**
✅ Real file upload with persistent storage
✅ AI-powered document analysis
✅ Exhibit management with smart numbering
✅ Conversation history that persists across sessions
✅ Professional legal document editing

Try asking me about your case, uploading a document, or requesting help with legal research. Everything you do here will be saved and persist across browser sessions!

What would you like to work on first?`,
      personalizedInsights: [
        {
          title: 'Demo Mode Active',
          description: 'Full-featured demo with persistent data storage',
          type: 'info'
        },
        {
          title: 'Legal Expertise',
          description: `Specialized in ${profile.legal_specialties.join(', ')}`,
          type: 'success'
        }
      ],
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
    
    // Save to demo storage
    const conversation = await demoStorage.getConversations(selectedProjectId);
    if (conversation.length > 0) {
      const updatedConversation = {
        ...conversation[0],
        messages: [welcomeMessage],
        updated_at: new Date().toISOString()
      };
      await demoStorage.saveConversation(updatedConversation);
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

      // Get user's relevant context
      const userContext = await getUserRelevantContext(inputValue);

      // Generate AI response
      const aiResponse = await aiService.generatePersonalizedResponse({
        userMessage: inputValue,
        userProfile,
        userContext,
        conversationHistory: messages.slice(-10), // Last 10 messages for context
        attachments
      });

      const aiMessage: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content: aiResponse.content,
        insights: aiResponse.personalizedInsights || [],
        citations: aiResponse.citations || [],
        timestamp: new Date(),
        tokens_used: aiResponse.learningSignals?.tokens_used
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message
      await saveMessageToDatabase(aiMessage, currentConversation.id);

      // Record interaction for learning
      await recordUserInteraction(userMessage, aiMessage, userContext);

    } catch (error) {
      console.error('Failed to generate AI response:', error);
      const errorMessage: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
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
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AIIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">
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
      </Paper>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <List>
          {messages.map((message) => (
            <ListItem key={message.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', px: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  width: '100%',
                  gap: 1
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.role === 'user' ? 'grey.300' : 'primary.main',
                    width: 32,
                    height: 32
                  }}
                >
                  {message.role === 'user' ? <UserIcon /> : <AIIcon />}
                </Avatar>

                <Paper
                  elevation={1}
                  sx={{
                    maxWidth: '80%',
                    p: 2,
                    bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    mb: 1
                  }}
                >
                  <Box 
                    sx={{ 
                      '& p': { margin: '0.5em 0' },
                      '& ul, & ol': { paddingLeft: '1.5em' },
                      '& li': { marginBottom: '0.25em' },
                      '& strong': { fontWeight: 600 },
                      '& code': { 
                        backgroundColor: 'action.hover',
                        padding: '0.2em 0.4em',
                        borderRadius: '3px',
                        fontSize: '0.9em'
                      },
                      '& pre': {
                        backgroundColor: 'action.hover',
                        padding: '1em',
                        borderRadius: '4px',
                        overflow: 'auto'
                      }
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

                  {/* Message Actions */}
                  {message.role === 'assistant' && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center' }}>
                      <Tooltip title="Copy response">
                        <IconButton size="small" onClick={() => copyToClipboard(message.content)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Helpful">
                        <IconButton 
                          size="small" 
                          color={message.feedback === 'positive' ? 'success' : 'default'}
                          onClick={() => handleFeedback(message.id, 'positive')}
                        >
                          <ThumbUpIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Not helpful">
                        <IconButton 
                          size="small"
                          color={message.feedback === 'negative' ? 'error' : 'default'}
                          onClick={() => handleFeedback(message.id, 'negative')}
                        >
                          <ThumbDownIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </ListItem>
          ))}
          
          {isLoading && (
            <ListItem sx={{ justifyContent: 'center' }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Analyzing with your case context...
              </Typography>
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
      <Paper elevation={2} sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          
          <IconButton onClick={handleAttachFile} disabled={isLoading}>
            <AttachIcon />
          </IconButton>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask about your cases, upload documents, or request legal analysis..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />

          <IconButton 
            onClick={handleSendMessage} 
            disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}
            color="primary"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdaptiveLegalAIChat;
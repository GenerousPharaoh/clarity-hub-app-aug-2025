import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

// Types for collaboration state
export interface UserPresence {
  id: string;
  user_id: string;
  project_id: string;
  document_id?: string;
  status: 'online' | 'away' | 'offline';
  cursor_position?: {
    line: number;
    column: number;
    selection?: { start: number; end: number };
  };
  current_page?: string;
  last_seen: string;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface DocumentComment {
  id: string;
  document_id: string;
  project_id: string;
  author_id: string;
  parent_id?: string;
  content: string;
  comment_type: 'comment' | 'highlight' | 'sticky_note' | 'suggestion';
  position?: {
    page: number;
    x: number;
    y: number;
    selection?: { start: number; end: number };
  };
  metadata?: any;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  replies?: DocumentComment[];
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string;
  activity_type: string;
  target_id?: string;
  target_type?: string;
  details?: any;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface ChatMessage {
  id: string;
  project_id: string;
  thread_id?: string;
  author_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system' | 'mention';
  metadata?: any;
  edited: boolean;
  edited_at?: string;
  created_at: string;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface CollaborationState {
  activeUsers: UserPresence[];
  comments: DocumentComment[];
  activities: ProjectActivity[];
  chatMessages: ChatMessage[];
  currentDocument?: string;
  currentProject?: string;
  isConnected: boolean;
  channels: Map<string, RealtimeChannel>;
}

type CollaborationAction =
  | { type: 'SET_ACTIVE_USERS'; payload: UserPresence[] }
  | { type: 'ADD_USER'; payload: UserPresence }
  | { type: 'UPDATE_USER'; payload: UserPresence }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'SET_COMMENTS'; payload: DocumentComment[] }
  | { type: 'ADD_COMMENT'; payload: DocumentComment }
  | { type: 'UPDATE_COMMENT'; payload: DocumentComment }
  | { type: 'DELETE_COMMENT'; payload: string }
  | { type: 'SET_ACTIVITIES'; payload: ProjectActivity[] }
  | { type: 'ADD_ACTIVITY'; payload: ProjectActivity }
  | { type: 'SET_CHAT_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CURRENT_DOCUMENT'; payload: string | undefined }
  | { type: 'SET_CURRENT_PROJECT'; payload: string | undefined }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CHANNEL'; payload: { key: string; channel: RealtimeChannel } }
  | { type: 'REMOVE_CHANNEL'; payload: string };

const initialState: CollaborationState = {
  activeUsers: [],
  comments: [],
  activities: [],
  chatMessages: [],
  currentDocument: undefined,
  currentProject: undefined,
  isConnected: false,
  channels: new Map(),
};

function collaborationReducer(state: CollaborationState, action: CollaborationAction): CollaborationState {
  switch (action.type) {
    case 'SET_ACTIVE_USERS':
      return { ...state, activeUsers: action.payload };
    
    case 'ADD_USER':
      return {
        ...state,
        activeUsers: [...state.activeUsers.filter(u => u.user_id !== action.payload.user_id), action.payload],
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        activeUsers: state.activeUsers.map(user =>
          user.user_id === action.payload.user_id ? { ...user, ...action.payload } : user
        ),
      };
    
    case 'REMOVE_USER':
      return {
        ...state,
        activeUsers: state.activeUsers.filter(user => user.user_id !== action.payload),
      };
    
    case 'SET_COMMENTS':
      return { ...state, comments: action.payload };
    
    case 'ADD_COMMENT':
      return { ...state, comments: [action.payload, ...state.comments] };
    
    case 'UPDATE_COMMENT':
      return {
        ...state,
        comments: state.comments.map(comment =>
          comment.id === action.payload.id ? { ...comment, ...action.payload } : comment
        ),
      };
    
    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: state.comments.filter(comment => comment.id !== action.payload),
      };
    
    case 'SET_ACTIVITIES':
      return { ...state, activities: action.payload };
    
    case 'ADD_ACTIVITY':
      return { ...state, activities: [action.payload, ...state.activities] };
    
    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.payload };
    
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    
    case 'UPDATE_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: state.chatMessages.map(message =>
          message.id === action.payload.id ? { ...message, ...action.payload } : message
        ),
      };
    
    case 'SET_CURRENT_DOCUMENT':
      return { ...state, currentDocument: action.payload };
    
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_CHANNEL':
      const newChannels = new Map(state.channels);
      newChannels.set(action.payload.key, action.payload.channel);
      return { ...state, channels: newChannels };
    
    case 'REMOVE_CHANNEL':
      const updatedChannels = new Map(state.channels);
      const channel = updatedChannels.get(action.payload);
      if (channel) {
        channel.unsubscribe();
      }
      updatedChannels.delete(action.payload);
      return { ...state, channels: updatedChannels };
    
    default:
      return state;
  }
}

interface CollaborationContextType {
  state: CollaborationState;
  // Presence methods
  updatePresence: (projectId: string, documentId?: string, cursorPosition?: any) => Promise<void>;
  setUserOffline: () => Promise<void>;
  
  // Comment methods
  addComment: (comment: Omit<DocumentComment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateComment: (commentId: string, updates: Partial<DocumentComment>) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  
  // Activity methods
  addActivity: (activity: Omit<ProjectActivity, 'id' | 'created_at'>) => Promise<void>;
  
  // Chat methods
  sendMessage: (message: Omit<ChatMessage, 'id' | 'created_at' | 'author_id'>) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  
  // Connection methods
  joinProject: (projectId: string) => Promise<void>;
  leaveProject: (projectId: string) => Promise<void>;
  joinDocument: (documentId: string) => Promise<void>;
  leaveDocument: (documentId: string) => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(collaborationReducer, initialState);
  const { user } = useAuth();

  // Update presence function
  const updatePresence = useCallback(async (
    projectId: string,
    documentId?: string,
    cursorPosition?: any
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('update_user_presence', {
        p_project_id: projectId,
        p_document_id: documentId,
        p_status: 'online',
        p_cursor_position: cursorPosition,
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Set user offline
  const setUserOffline = useCallback(async () => {
    if (!user || !state.currentProject) return;

    try {
      await supabase.rpc('update_user_presence', {
        p_project_id: state.currentProject,
        p_status: 'offline',
      });
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }, [user, state.currentProject]);

  // Comment methods
  const addComment = useCallback(async (comment: Omit<DocumentComment, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('document_comments')
        .insert({
          ...comment,
          author_id: user.id,
        })
        .select('*, author:profiles(first_name, last_name, avatar_url)')
        .single();

      if (error) throw error;
      dispatch({ type: 'ADD_COMMENT', payload: data });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [user]);

  const updateComment = useCallback(async (commentId: string, updates: Partial<DocumentComment>) => {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .update(updates)
        .eq('id', commentId)
        .select('*, author:profiles(first_name, last_name, avatar_url)')
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_COMMENT', payload: data });
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('document_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      dispatch({ type: 'DELETE_COMMENT', payload: commentId });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }, []);

  const resolveComment = useCallback(async (commentId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('document_comments')
        .update({
          resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .select('*, author:profiles(first_name, last_name, avatar_url)')
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_COMMENT', payload: data });
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  }, [user]);

  // Activity methods
  const addActivity = useCallback(async (activity: Omit<ProjectActivity, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('project_activities')
        .insert({
          ...activity,
          user_id: user.id,
        })
        .select('*, user:profiles(first_name, last_name, avatar_url)')
        .single();

      if (error) throw error;
      dispatch({ type: 'ADD_ACTIVITY', payload: data });
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  }, [user]);

  // Chat methods
  const sendMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'created_at' | 'author_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          ...message,
          author_id: user.id,
        })
        .select('*, author:profiles(first_name, last_name, avatar_url)')
        .single();

      if (error) throw error;
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: data });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [user]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          content,
          edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select('*, author:profiles(first_name, last_name, avatar_url)')
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_CHAT_MESSAGE', payload: data });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }, []);

  // Connection methods
  const joinProject = useCallback(async (projectId: string) => {
    if (!user) return;

    try {
      // Leave previous project if any
      if (state.currentProject) {
        await leaveProject(state.currentProject);
      }

      dispatch({ type: 'SET_CURRENT_PROJECT', payload: projectId });

      // Subscribe to project presence
      const presenceChannel = supabase
        .channel(`project_presence:${projectId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `project_id=eq.${projectId}`,
        }, (payload) => {
          console.log('Presence change:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            dispatch({ type: 'UPDATE_USER', payload: payload.new as UserPresence });
          } else if (payload.eventType === 'DELETE') {
            dispatch({ type: 'REMOVE_USER', payload: payload.old.user_id });
          }
        })
        .subscribe();

      dispatch({ type: 'SET_CHANNEL', payload: { key: `presence:${projectId}`, channel: presenceChannel } });

      // Subscribe to project activities
      const activityChannel = supabase
        .channel(`project_activities:${projectId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'project_activities',
          filter: `project_id=eq.${projectId}`,
        }, (payload) => {
          dispatch({ type: 'ADD_ACTIVITY', payload: payload.new as ProjectActivity });
        })
        .subscribe();

      dispatch({ type: 'SET_CHANNEL', payload: { key: `activities:${projectId}`, channel: activityChannel } });

      // Subscribe to project chat
      const chatChannel = supabase
        .channel(`project_chat:${projectId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            dispatch({ type: 'ADD_CHAT_MESSAGE', payload: payload.new as ChatMessage });
          } else if (payload.eventType === 'UPDATE') {
            dispatch({ type: 'UPDATE_CHAT_MESSAGE', payload: payload.new as ChatMessage });
          }
        })
        .subscribe();

      dispatch({ type: 'SET_CHANNEL', payload: { key: `chat:${projectId}`, channel: chatChannel } });

      // Load initial data
      await Promise.all([
        loadPresence(projectId),
        loadActivities(projectId),
        loadChatMessages(projectId),
      ]);

      // Update own presence
      await updatePresence(projectId);

      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error) {
      console.error('Error joining project:', error);
    }
  }, [user, state.currentProject, updatePresence]);

  const leaveProject = useCallback(async (projectId: string) => {
    try {
      // Set user offline
      await setUserOffline();

      // Unsubscribe from all project channels
      const channelsToRemove = [
        `presence:${projectId}`,
        `activities:${projectId}`,
        `chat:${projectId}`,
      ];

      channelsToRemove.forEach(key => {
        dispatch({ type: 'REMOVE_CHANNEL', payload: key });
      });

      dispatch({ type: 'SET_CURRENT_PROJECT', payload: undefined });
      dispatch({ type: 'SET_CONNECTED', payload: false });
    } catch (error) {
      console.error('Error leaving project:', error);
    }
  }, [setUserOffline]);

  const joinDocument = useCallback(async (documentId: string) => {
    if (!user || !state.currentProject) return;

    try {
      dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: documentId });

      // Subscribe to document comments
      const commentsChannel = supabase
        .channel(`document_comments:${documentId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'document_comments',
          filter: `document_id=eq.${documentId}`,
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            dispatch({ type: 'ADD_COMMENT', payload: payload.new as DocumentComment });
          } else if (payload.eventType === 'UPDATE') {
            dispatch({ type: 'UPDATE_COMMENT', payload: payload.new as DocumentComment });
          } else if (payload.eventType === 'DELETE') {
            dispatch({ type: 'DELETE_COMMENT', payload: payload.old.id });
          }
        })
        .subscribe();

      dispatch({ type: 'SET_CHANNEL', payload: { key: `comments:${documentId}`, channel: commentsChannel } });

      // Load initial comments
      await loadComments(documentId);

      // Update presence with document
      await updatePresence(state.currentProject, documentId);
    } catch (error) {
      console.error('Error joining document:', error);
    }
  }, [user, state.currentProject, updatePresence]);

  const leaveDocument = useCallback(async (documentId: string) => {
    try {
      // Unsubscribe from document channels
      dispatch({ type: 'REMOVE_CHANNEL', payload: `comments:${documentId}` });
      dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: undefined });

      // Update presence without document
      if (state.currentProject) {
        await updatePresence(state.currentProject);
      }
    } catch (error) {
      console.error('Error leaving document:', error);
    }
  }, [state.currentProject, updatePresence]);

  // Helper functions to load data
  const loadPresence = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*, profile:profiles(first_name, last_name, avatar_url)')
        .eq('project_id', projectId)
        .eq('status', 'online');

      if (error) throw error;
      dispatch({ type: 'SET_ACTIVE_USERS', payload: data || [] });
    } catch (error) {
      console.error('Error loading presence:', error);
    }
  };

  const loadComments = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*, author:profiles(first_name, last_name, avatar_url)')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      dispatch({ type: 'SET_COMMENTS', payload: data || [] });
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadActivities = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_activities')
        .select('*, user:profiles(first_name, last_name, avatar_url)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      dispatch({ type: 'SET_ACTIVITIES', payload: data || [] });
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const loadChatMessages = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, author:profiles(first_name, last_name, avatar_url)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      dispatch({ type: 'SET_CHAT_MESSAGES', payload: data || [] });
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all channels
      state.channels.forEach((channel) => {
        channel.unsubscribe();
      });
      
      // Set user offline
      if (user && state.currentProject) {
        setUserOffline();
      }
    };
  }, [user, state.currentProject, state.channels, setUserOffline]);

  const value: CollaborationContextType = {
    state,
    updatePresence,
    setUserOffline,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    addActivity,
    sendMessage,
    editMessage,
    joinProject,
    leaveProject,
    joinDocument,
    leaveDocument,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}
import type { Tables } from './database';

// Database row types (match actual Supabase schema exactly)
export type Project = Tables<'projects'>;
export type FileRecord = Tables<'files'>;
export type Note = Tables<'notes'>;
export type Profile = Tables<'profiles'>;
export type ExhibitMarker = Tables<'exhibit_markers'>;
export type DocumentChunk = Tables<'document_chunks'>;
export type ChatMessageRow = Tables<'chat_messages'>;

// App-level user type (derived from Supabase Auth + profile)
export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

// AI Chat types (UI representation)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: 'gemini' | 'gpt';
  timestamp: Date;
  fileContext?: string;
}

// Panel state
export interface PanelWidths {
  left: number;
  center: number;
  right: number;
}

// File viewer type
export type ViewerFileType = 'pdf' | 'image' | 'audio' | 'video' | 'text' | 'unsupported';

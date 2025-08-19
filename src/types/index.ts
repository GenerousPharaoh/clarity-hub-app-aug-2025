// Common types used throughout the application

// User type
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_admin?: boolean;
}

// Project type
export interface Project {
  id: string;
  name: string;
  owner_id: string;
  goal_type?: string;
  created_at: string;
  is_ai_organized?: boolean;
  description?: string;
}

// File type
export interface File {
  id: string;
  project_id: string;
  name: string;
  exhibit_id?: string;
  storage_path: string;
  content_type: string;
  size: number;
  file_type: string;
  metadata: Record<string, any>;
  added_at: string;
  owner_id: string;
  uploaded_by_user_id?: string;
}

// Link activation type for handling deep linking to specific parts of files
export interface LinkActivation {
  fileId: string;
  selectionInfo?: SelectionInfo;
  timestamp?: number;
  exhibitId?: string;
}

// Selection info for capturing text selections
export interface SelectionInfo {
  text: string;
  pageNumber?: number;
  boundingRect?: DOMRect;
  timestamp?: number;
}

// Search filters for file searching
export interface SearchFilters {
  searchTerm?: string;
  fileTypes?: string[];
  tags?: string[];
  entities?: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
  searchType?: 'semantic' | 'exact' | 'combined';
}

// AI analysis result interface
export interface AnalysisResult {
  summary: string;
  documentType: string;
  keyEntities: { name: string; role: string }[];
  keyDates: { date: string; significance: string }[];
  legalIssues: string[];
  keyFacts: string[];
  relevantLaw: string[];
  suggestedKeywords: string[];
}

// Entity type for extracted entities
export interface Entity {
  entity_text: string;
  entity_type: string;
  confidence?: number;
}

// FileRecord type for file upload hook
export interface FileRecord {
  id: string;
  project_id: string;
  name: string;
  exhibit_id?: string;
  storage_path: string;
  content_type: string;
  size: number;
  file_type: string;
  metadata: Record<string, any>;
  added_at: string;
  owner_id: string;
  uploaded_by_user_id?: string;
}

// Note type
export interface Note {
  id: string;
  project_id: string;
  owner_id: string;
  user_id: string;
  content: string;
  updated_at: string;
}

export interface Link {
  id: string;
  project_id: string;
  owner_id: string;
  source_file_id: string | null;
  source_details_json: {
    type: 'exhibit' | 'custom';
    text?: string;
    exhibitId?: string;
    [key: string]: any;
  };
  target_context_json: {
    page?: number;
    timestamp?: number;
    [key: string]: any;
  };
}

export interface DocumentChunk {
  id: string;
  file_id: string;
  project_id: string;
  owner_id: string;
  chunk_text: string;
  embedding?: unknown; // vector type
}

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'invited' | 'active' | 'rejected';
}

// Application state types
export interface FileWithUrl extends File {
  url?: string;
  thumbnailUrl?: string;
}

// API response types
export interface AiSuggestionResponse {
  suggestions: {
    category: string;
    text: string;
  }[];
}

export interface QaResponse {
  answer: string;
  sources: string[];
}

export interface FileNameSuggestionResponse {
  suggestedNames: string[];
  nextExhibitId: string;
} 
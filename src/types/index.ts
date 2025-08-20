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
  type?: 'citation' | 'selection' | 'general';
  fileId: string | null;
  selectionInfo?: SelectionInfo;
  timestamp?: number;
  exhibitId?: string;
  targetPage?: number;
  exhibitReference?: string;
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
  authors?: string[];
  evidenceStatus?: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
  searchType?: 'semantic' | 'exact' | 'combined';
  includePrivileged?: boolean;
  includeWorkProduct?: boolean;
  exactMatch?: boolean;
  caseSensitive?: boolean;
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

// Legal Case Management Types

export interface LegalCase {
  id: string;
  project_id: string;
  case_number: string;
  case_title: string;
  case_type: 'civil' | 'criminal' | 'family' | 'corporate' | 'immigration' | 'other';
  status: 'active' | 'closed' | 'pending' | 'on_hold';
  court_name?: string;
  judge_name?: string;
  filing_date?: string;
  trial_date?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface LegalContact {
  id: string;
  project_id: string;
  name: string;
  role: 'client' | 'opposing_counsel' | 'witness' | 'expert' | 'judge' | 'court_staff' | 'other';
  email?: string;
  phone?: string;
  address?: string;
  organization?: string;
  bar_number?: string;
  specialty?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface LegalTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  task_type: 'filing' | 'discovery' | 'research' | 'meeting' | 'court_appearance' | 'deadline' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  due_date?: string;
  completion_date?: string;
  related_contact_id?: string;
  related_file_id?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface LegalNote {
  id: string;
  project_id: string;
  title: string;
  content: string;
  category: 'discovery' | 'meeting' | 'research' | 'strategy' | 'client_communication' | 'court_notes' | 'other';
  tags?: string[];
  related_contact_id?: string;
  related_task_id?: string;
  related_file_id?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface LegalTimeline {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  event_type: 'filing' | 'hearing' | 'deadline' | 'discovery' | 'settlement' | 'trial' | 'appeal' | 'other';
  event_date: string;
  is_deadline: boolean;
  is_completed: boolean;
  related_task_id?: string;
  related_contact_id?: string;
  related_file_id?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface EvidenceRecord {
  id: string;
  file_id: string;
  project_id: string;
  exhibit_number: string;
  evidence_type: 'document' | 'photo' | 'video' | 'audio' | 'physical' | 'digital' | 'other';
  chain_of_custody: ChainOfCustodyEntry[];
  description?: string;
  is_privileged: boolean;
  is_work_product: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface ChainOfCustodyEntry {
  id: string;
  evidence_id: string;
  action: 'received' | 'transferred' | 'analyzed' | 'copied' | 'returned' | 'destroyed';
  person_name: string;
  person_role?: string;
  date_time: string;
  location?: string;
  notes?: string;
  signature?: string;
}

export interface LegalDeadline {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  deadline_type: 'court_filing' | 'discovery' | 'statute_of_limitations' | 'appeal' | 'response' | 'other';
  due_date: string;
  reminder_dates: string[];
  is_critical: boolean;
  status: 'pending' | 'completed' | 'missed' | 'extended';
  related_task_id?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  template_type: 'motion' | 'discovery_request' | 'correspondence' | 'pleading' | 'brief' | 'contract' | 'other';
  content: string;
  variables: TemplateVariable[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'textarea';
  required: boolean;
  default_value?: string;
  options?: string[];
}

export interface CaseStats {
  total_files: number;
  total_evidence: number;
  completed_tasks: number;
  pending_tasks: number;
  upcoming_deadlines: number;
  overdue_deadlines: number;
  recent_activity_count: number;
}

// Exhibit Management Types
export interface Exhibit {
  id: string;
  exhibit_id: string; // e.g., "1A", "2B", "15C"
  project_id: string;
  title?: string;
  description?: string;
  exhibit_type: 'document' | 'photo' | 'video' | 'audio' | 'physical' | 'digital' | 'other';
  date_created?: string;
  source?: string;
  is_key_evidence: boolean;
  files: ExhibitFile[];
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface ExhibitFile {
  id: string;
  file_id: string;
  exhibit_id: string;
  page_number?: number;
  section?: string;
  is_primary: boolean; // Main file for this exhibit
  created_at: string;
}

export interface CitationHistory {
  id: string;
  exhibit_id: string;
  exhibit_reference: string; // e.g., "1A", "2B:15"
  target_file_id?: string;
  target_page?: number;
  last_accessed: string;
  access_count: number;
}

// Enhanced LinkActivation for exhibit navigation
export interface ExhibitLinkActivation extends LinkActivation {
  type: 'citation' | 'selection' | 'general';
  exhibitId: string;
  exhibitReference: string; // Full citation like "1A" or "2B:15"
  targetPage?: number;
  navigationType: 'exhibit_click' | 'citation_click' | 'quick_nav';
  sourceContext?: 'editor' | 'exhibit_list' | 'breadcrumb';
} 
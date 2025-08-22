-- Knowledge Base Schema for Clarity Hub
-- Adapted from CPO project for legal document management

-- =====================================================
-- DOCUMENT CONTENT EXTRACTION
-- =====================================================

-- Store extracted text content from PDFs and other documents
CREATE TABLE IF NOT EXISTS document_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  content TEXT,
  metadata JSONB,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(file_id, page_number)
);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS idx_document_content_search 
  ON document_content USING GIN (to_tsvector('english', content));

-- Index for file lookups
CREATE INDEX IF NOT EXISTS idx_document_content_file 
  ON document_content(file_id, page_number);

-- =====================================================
-- DOCUMENT VERSIONING
-- =====================================================

-- Main documents table with versioning support
CREATE TABLE IF NOT EXISTS versioned_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  document_type TEXT DEFAULT 'legal_document',
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document versions
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES versioned_documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL, -- Store rich text editor state
  plain_text TEXT, -- For search and preview
  word_count INTEGER DEFAULT 0,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true,
  UNIQUE(document_id, version)
);

-- =====================================================
-- EXHIBIT MANAGEMENT
-- =====================================================

-- Enhanced exhibit tracking
CREATE TABLE IF NOT EXISTS exhibit_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  exhibit_id TEXT NOT NULL UNIQUE,
  exhibit_category TEXT, -- e.g., 'evidence', 'correspondence', 'legal', 'medical'
  date_referenced DATE,
  description TEXT,
  tags TEXT[],
  importance_level INTEGER DEFAULT 3, -- 1-5 scale
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exhibit citations in documents
CREATE TABLE IF NOT EXISTS exhibit_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES versioned_documents(id) ON DELETE CASCADE,
  exhibit_id TEXT REFERENCES exhibit_registry(exhibit_id) ON DELETE CASCADE,
  citation_format TEXT DEFAULT 'bracket', -- bracket, superscript, footnote
  display_text TEXT,
  position_data JSONB, -- Store position info from editor
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, exhibit_id)
);

-- =====================================================
-- KNOWLEDGE ENTITIES & RELATIONSHIPS
-- =====================================================

-- Knowledge entities (people, organizations, concepts)
CREATE TABLE IF NOT EXISTS knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'person', 'organization', 'concept', 'event'
  entity_name TEXT NOT NULL,
  description TEXT,
  attributes JSONB, -- Flexible storage for entity-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_name)
);

-- Entity relationships
CREATE TABLE IF NOT EXISTS entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id UUID REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  to_entity_id UUID REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'related_to', 'employed_by', 'represents', etc.
  strength FLOAT DEFAULT 1.0, -- Relationship strength/weight
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

-- Link entities to exhibits
CREATE TABLE IF NOT EXISTS entity_exhibit_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  exhibit_id TEXT REFERENCES exhibit_registry(exhibit_id) ON DELETE CASCADE,
  relevance_score FLOAT DEFAULT 1.0,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, exhibit_id)
);

-- =====================================================
-- AI TRAINING & QUERY PATTERNS
-- =====================================================

-- Store successful query patterns for optimization
CREATE TABLE IF NOT EXISTS query_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  query_type TEXT, -- 'legal', 'factual', 'timeline', 'relationship'
  response_quality_score FLOAT,
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI conversation history
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  conversation_data JSONB NOT NULL, -- Store full conversation
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TIMELINE EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_time TIME,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT, -- 'legal', 'medical', 'correspondence', 'meeting'
  is_critical BOOLEAN DEFAULT false,
  key_points TEXT[],
  significance TEXT,
  related_exhibits TEXT[], -- Array of exhibit_ids
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCUMENT COMMENTS & ANNOTATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES versioned_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  parent_id UUID REFERENCES document_comments(id), -- For threaded discussions
  user_id UUID REFERENCES auth.users(id),
  comment_text TEXT NOT NULL,
  selection_data JSONB, -- Store selected text and position
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACCESS LOGGING
-- =====================================================

CREATE TABLE IF NOT EXISTS document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES versioned_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('view', 'edit', 'comment', 'export', 'share')),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_document_versions_current 
  ON document_versions(document_id) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_exhibit_registry_exhibit_id 
  ON exhibit_registry(exhibit_id);

CREATE INDEX IF NOT EXISTS idx_timeline_events_project_date 
  ON timeline_events(project_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_entity_relationships_from 
  ON entity_relationships(from_entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_relationships_to 
  ON entity_relationships(to_entity_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_project 
  ON ai_conversations(user_id, project_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE versioned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibit_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibit_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_exhibit_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your needs)

-- Document content: viewable by authenticated users
CREATE POLICY "Users can view document content" ON document_content
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage document content" ON document_content
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Versioned documents: users can manage their own
CREATE POLICY "Users can manage their documents" ON versioned_documents
  FOR ALL USING (auth.uid() = created_by OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can view published documents" ON versioned_documents
  FOR SELECT USING (is_published = true OR auth.uid() = created_by);

-- Document versions: follow document permissions
CREATE POLICY "Users can manage document versions" ON document_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM versioned_documents 
      WHERE versioned_documents.id = document_versions.document_id 
      AND (versioned_documents.created_by = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

-- Exhibits: viewable by all authenticated users
CREATE POLICY "Users can view exhibits" ON exhibit_registry
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage exhibits" ON exhibit_registry
  FOR ALL USING (auth.uid() IS NOT NULL);

-- AI conversations: users can only see their own
CREATE POLICY "Users can view their AI conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Timeline events: project-based access
CREATE POLICY "Users can manage timeline events" ON timeline_events
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Comments: users can manage their own
CREATE POLICY "Users can manage their comments" ON document_comments
  FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Access logs: only viewable by document owners
CREATE POLICY "Document owners can view access logs" ON document_access_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM versioned_documents 
      WHERE versioned_documents.id = document_access_log.document_id 
      AND versioned_documents.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can log their access" ON document_access_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_versioned_documents_updated_at 
  BEFORE UPDATE ON versioned_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exhibit_registry_updated_at 
  BEFORE UPDATE ON exhibit_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_entities_updated_at 
  BEFORE UPDATE ON knowledge_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_events_updated_at 
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_comments_updated_at 
  BEFORE UPDATE ON document_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically version documents
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
DECLARE
  new_version INTEGER;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version), 0) + 1 
  INTO new_version 
  FROM document_versions 
  WHERE document_id = NEW.id;
  
  -- Set all existing versions to not current
  UPDATE document_versions 
  SET is_current = false 
  WHERE document_id = NEW.id;
  
  -- This trigger doesn't insert; the app logic should handle version creation
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Projects table (enhance existing if needed)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  document_type TEXT DEFAULT 'legal_document',
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Document content with versioning
CREATE TABLE IF NOT EXISTS document_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL, -- Lexical editor state
  plain_text TEXT, -- For search and preview
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  is_current BOOLEAN DEFAULT true,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, version)
);

-- Files/Exhibits table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  storage_bucket TEXT DEFAULT 'files',
  mime_type TEXT,
  sha256_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document citations (links between documents and files)
CREATE TABLE IF NOT EXISTS document_citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  citation_key TEXT NOT NULL,
  page_number INTEGER,
  timestamp_seconds INTEGER, -- For audio/video files
  position_data JSONB, -- Lexical position info
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, citation_key)
);

-- Document collaborators
CREATE TABLE IF NOT EXISTS document_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'editor', 'owner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_document_content_document_id ON document_content(document_id);
CREATE INDEX IF NOT EXISTS idx_document_content_current ON document_content(document_id, is_current);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_document_id ON files(document_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_citations_document_id ON document_citations(document_id);
CREATE INDEX IF NOT EXISTS idx_citations_file_id ON document_citations(file_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);
CREATE INDEX IF NOT EXISTS idx_document_content_search ON document_content USING gin(
  to_tsvector('english', coalesce(plain_text, ''))
);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = created_by);

-- Documents policies
CREATE POLICY "Users can view documents in their projects" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = documents.project_id 
      AND projects.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_collaborators.document_id = documents.id
      AND document_collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents in their projects" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = documents.project_id 
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_collaborators.document_id = documents.id
      AND document_collaborators.user_id = auth.uid()
      AND document_collaborators.permission_level IN ('editor', 'owner')
    )
  );

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (created_by = auth.uid());

-- Document content policies
CREATE POLICY "Users can view document content" ON document_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_content.document_id
      AND (
        documents.created_by = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM document_collaborators
          WHERE document_collaborators.document_id = documents.id
          AND document_collaborators.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create document content" ON document_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_content.document_id
      AND (
        documents.created_by = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM document_collaborators
          WHERE document_collaborators.document_id = documents.id
          AND document_collaborators.user_id = auth.uid()
          AND document_collaborators.permission_level IN ('editor', 'owner')
        )
      )
    )
  );

-- Files policies
CREATE POLICY "Users can view files in their projects" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = files.project_id 
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their projects" ON files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = files.project_id 
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own files" ON files
  FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own files" ON files
  FOR DELETE USING (uploaded_by = auth.uid());

-- Activity log policies
CREATE POLICY "Users can view their own activity" ON activity_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert activity logs" ON activity_log
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
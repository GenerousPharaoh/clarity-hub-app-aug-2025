-- =====================================================
-- Smart Document Classification (extend files table)
-- =====================================================
ALTER TABLE files ADD COLUMN IF NOT EXISTS classification_metadata JSONB DEFAULT NULL;
ALTER TABLE files ADD COLUMN IF NOT EXISTS classification_confidence FLOAT DEFAULT NULL;
ALTER TABLE files ADD COLUMN IF NOT EXISTS classification_source TEXT DEFAULT 'ai';
ALTER TABLE files ADD COLUMN IF NOT EXISTS classified_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_files_classification_metadata ON files USING GIN (classification_metadata);
CREATE INDEX IF NOT EXISTS idx_files_document_type ON files(document_type);

-- =====================================================
-- Timeline Events
-- =====================================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  date_end DATE,
  date_precision TEXT NOT NULL DEFAULT 'exact' CHECK (date_precision IN ('exact','month','year','approximate','inferred')),
  date_text TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('employment','legal_proceeding','correspondence','medical','financial','regulatory','contractual','other')),
  event_type TEXT NOT NULL DEFAULT 'other' CHECK (event_type IN ('communication','filing','decision','agreement','termination','payment','complaint','hearing','meeting','other')),
  significance TEXT DEFAULT 'medium' CHECK (significance IN ('high','medium','low')),
  parties TEXT[],
  source_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  source_quote TEXT,
  page_reference INTEGER,
  extraction_method TEXT NOT NULL DEFAULT 'ai' CHECK (extraction_method IN ('ai','manual','imported')),
  confidence REAL DEFAULT 0.8,
  is_verified BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_select" ON timeline_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects_users WHERE project_id = timeline_events.project_id AND user_id = auth.uid())
);
CREATE POLICY "timeline_insert" ON timeline_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects_users WHERE project_id = timeline_events.project_id AND user_id = auth.uid())
);
CREATE POLICY "timeline_update" ON timeline_events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects_users WHERE project_id = timeline_events.project_id AND user_id = auth.uid())
);
CREATE POLICY "timeline_delete" ON timeline_events FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects_users WHERE project_id = timeline_events.project_id AND user_id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_project_date ON timeline_events(project_id, date);
CREATE INDEX IF NOT EXISTS idx_timeline_events_source_file ON timeline_events(source_file_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_category ON timeline_events(category);

-- =====================================================
-- Exhibit Compendiums
-- =====================================================
CREATE TABLE IF NOT EXISTS compendiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Exhibit Book',
  court_name TEXT,
  file_number TEXT,
  case_name TEXT,
  party_name TEXT,
  counsel_name TEXT,
  counsel_address TEXT,
  tab_style TEXT DEFAULT 'letter',
  include_cover_page BOOLEAN DEFAULT true,
  include_index BOOLEAN DEFAULT true,
  include_tab_dividers BOOLEAN DEFAULT true,
  include_page_numbers BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft',
  generated_file_path TEXT,
  generated_at TIMESTAMPTZ,
  error_message TEXT,
  page_count INTEGER,
  file_size_bytes BIGINT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE compendiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compendiums_select" ON compendiums FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects_users WHERE project_id = compendiums.project_id AND user_id = auth.uid())
);
CREATE POLICY "compendiums_insert" ON compendiums FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects_users WHERE project_id = compendiums.project_id AND user_id = auth.uid())
);
CREATE POLICY "compendiums_update" ON compendiums FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects_users WHERE project_id = compendiums.project_id AND user_id = auth.uid())
);
CREATE POLICY "compendiums_delete" ON compendiums FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects_users WHERE project_id = compendiums.project_id AND user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS compendium_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compendium_id UUID NOT NULL REFERENCES compendiums(id) ON DELETE CASCADE,
  exhibit_marker_id UUID REFERENCES exhibit_markers(id) ON DELETE CASCADE,
  tab_label TEXT,
  display_title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  start_page INTEGER,
  end_page INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE compendium_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compendium_entries_all" ON compendium_entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM compendiums c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = compendium_id AND (p.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM projects_users pu WHERE pu.project_id = p.id AND pu.user_id = auth.uid()
    ))
  )
);

-- Add sort_order to exhibit_markers for general ordering
ALTER TABLE exhibit_markers ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

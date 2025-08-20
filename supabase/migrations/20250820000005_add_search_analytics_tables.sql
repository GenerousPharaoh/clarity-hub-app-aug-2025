-- Advanced Search and Analytics Enhancement Migration
-- This migration adds support for enhanced search capabilities and analytics

-- File tags table for better organization and filtering
CREATE TABLE IF NOT EXISTS file_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(file_id, tag)
);

-- Search queries table for saving and tracking searches
CREATE TABLE IF NOT EXISTS saved_search_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_global BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recent searches table for search suggestions
CREATE TABLE IF NOT EXISTS recent_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    search_term TEXT NOT NULL,
    search_filters JSONB DEFAULT '{}'::jsonb,
    results_count INTEGER DEFAULT 0,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activity logs table for analytics and audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'file_upload', 'file_view', 'search', 'task_create', 'deadline_complete', etc.
    resource_type TEXT, -- 'file', 'task', 'note', 'deadline', etc.
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    duration_ms INTEGER, -- For timing actions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics metrics table for pre-computed analytics
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'case_progress', 'deadline_compliance', 'file_stats', etc.
    metric_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    metric_date DATE NOT NULL,
    metric_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(project_id, metric_type, metric_period, metric_date)
);

-- File content search table for full-text search
CREATE TABLE IF NOT EXISTS file_content_search (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    extracted_text TEXT NOT NULL,
    page_number INTEGER,
    text_embedding vector(768), -- For semantic search
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Task time tracking for time analytics
CREATE TABLE IF NOT EXISTS task_time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES legal_tasks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    description TEXT,
    billable BOOLEAN DEFAULT FALSE,
    rate_per_hour DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Search result highlights for better UX
CREATE TABLE IF NOT EXISTS search_result_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_session_id UUID NOT NULL,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    highlight_text TEXT NOT NULL,
    context_before TEXT,
    context_after TEXT,
    page_number INTEGER,
    position_start INTEGER,
    position_end INTEGER,
    relevance_score FLOAT DEFAULT 0.0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_tags_file_id ON file_tags(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_project_id ON file_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag);

CREATE INDEX IF NOT EXISTS idx_saved_searches_project_id ON saved_search_queries(project_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_owner_id ON saved_search_queries(owner_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_usage ON saved_search_queries(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_recent_searches_user_id ON recent_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_searches_project_id ON recent_searches(project_id);
CREATE INDEX IF NOT EXISTS idx_recent_searches_date ON recent_searches(searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_metrics_project_id ON analytics_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type_date ON analytics_metrics(metric_type, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_file_content_search_file_id ON file_content_search(file_id);
CREATE INDEX IF NOT EXISTS idx_file_content_search_project_id ON file_content_search(project_id);

CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_project_id ON task_time_logs(project_id);

-- Full-text search index for file content
CREATE INDEX IF NOT EXISTS idx_file_content_search_text ON file_content_search USING gin(to_tsvector('english', extracted_text));

-- Row Level Security policies
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_content_search ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_result_highlights ENABLE ROW LEVEL SECURITY;

-- File tags policies
CREATE POLICY "Users can view file tags in their projects" 
    ON file_tags FOR SELECT 
    USING (owner_id = auth.uid() OR 
          project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          ));

CREATE POLICY "Users can manage file tags in their projects" 
    ON file_tags FOR ALL 
    USING (owner_id = auth.uid());

-- Saved search queries policies
CREATE POLICY "Users can view saved searches in their projects" 
    ON saved_search_queries FOR SELECT 
    USING (owner_id = auth.uid() OR 
          (is_global = true AND project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          )));

CREATE POLICY "Users can manage their saved searches" 
    ON saved_search_queries FOR ALL 
    USING (owner_id = auth.uid());

-- Recent searches policies
CREATE POLICY "Users can view their recent searches" 
    ON recent_searches FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their recent searches" 
    ON recent_searches FOR ALL 
    USING (user_id = auth.uid());

-- Activity logs policies
CREATE POLICY "Users can view activity in their projects" 
    ON activity_logs FOR SELECT 
    USING (user_id = auth.uid() OR 
          project_id IN (
              SELECT id FROM projects WHERE owner_id = auth.uid()
          ) OR 
          project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          ));

CREATE POLICY "Users can create activity logs" 
    ON activity_logs FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- Analytics metrics policies
CREATE POLICY "Users can view analytics for their projects" 
    ON analytics_metrics FOR SELECT 
    USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    ) OR 
    project_id IN (
        SELECT project_id FROM project_collaborators 
        WHERE user_id = auth.uid() AND status = 'active'
    ));

CREATE POLICY "Project owners can manage analytics metrics" 
    ON analytics_metrics FOR ALL 
    USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    ));

-- File content search policies
CREATE POLICY "Users can view file content search in their projects" 
    ON file_content_search FOR SELECT 
    USING (owner_id = auth.uid() OR 
          project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          ));

CREATE POLICY "Users can manage file content search in their projects" 
    ON file_content_search FOR ALL 
    USING (owner_id = auth.uid());

-- Task time logs policies
CREATE POLICY "Users can view task time logs in their projects" 
    ON task_time_logs FOR SELECT 
    USING (user_id = auth.uid() OR 
          project_id IN (
              SELECT id FROM projects WHERE owner_id = auth.uid()
          ) OR 
          project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          ));

CREATE POLICY "Users can manage their task time logs" 
    ON task_time_logs FOR ALL 
    USING (user_id = auth.uid());

-- Search result highlights policies
CREATE POLICY "All users can manage search highlights" 
    ON search_result_highlights FOR ALL 
    USING (true);

-- Function to automatically create activity logs
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert activity log for various operations
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_logs (user_id, project_id, action_type, resource_type, resource_id, metadata)
        VALUES (
            COALESCE(NEW.owner_id, NEW.user_id, auth.uid()),
            NEW.project_id,
            TG_TABLE_NAME || '_create',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object('operation', 'create', 'table', TG_TABLE_NAME)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO activity_logs (user_id, project_id, action_type, resource_type, resource_id, metadata)
        VALUES (
            COALESCE(NEW.owner_id, NEW.user_id, auth.uid()),
            NEW.project_id,
            TG_TABLE_NAME || '_update',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object('operation', 'update', 'table', TG_TABLE_NAME)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activity_logs (user_id, project_id, action_type, resource_type, resource_id, metadata)
        VALUES (
            COALESCE(OLD.owner_id, OLD.user_id, auth.uid()),
            OLD.project_id,
            TG_TABLE_NAME || '_delete',
            TG_TABLE_NAME,
            OLD.id,
            jsonb_build_object('operation', 'delete', 'table', TG_TABLE_NAME)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for activity logging
CREATE TRIGGER trigger_log_file_activity
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER trigger_log_task_activity
    AFTER INSERT OR UPDATE OR DELETE ON legal_tasks
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER trigger_log_deadline_activity
    AFTER INSERT OR UPDATE OR DELETE ON legal_deadlines
    FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up recent searches older than 30 days
    DELETE FROM recent_searches 
    WHERE searched_at < NOW() - INTERVAL '30 days';
    
    -- Clean up activity logs older than 90 days (keep for audit purposes)
    DELETE FROM activity_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up search result highlights without sessions
    DELETE FROM search_result_highlights 
    WHERE id NOT IN (
        SELECT DISTINCT srh.id 
        FROM search_result_highlights srh
        JOIN recent_searches rs ON rs.id::text = srh.search_session_id::text
        WHERE rs.searched_at > NOW() - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
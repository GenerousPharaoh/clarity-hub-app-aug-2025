-- AI Processing Pipeline Tables

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Processed Content table to store AI analysis results
CREATE TABLE IF NOT EXISTS processed_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Processing status and metadata
    processing_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Extracted content
    extracted_text TEXT,
    extracted_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- AI Analysis Results
    document_type TEXT CHECK (document_type IN ('contract', 'motion', 'correspondence', 'pleading', 'discovery', 'evidence', 'legal_brief', 'court_order', 'deposition', 'transcript', 'exhibit', 'other')),
    ai_summary TEXT,
    ai_insights JSONB DEFAULT '{}'::jsonb,
    
    -- Legal-specific extracted information
    parties_mentioned TEXT[],
    key_dates JSONB DEFAULT '[]'::jsonb,
    legal_terms TEXT[],
    deadlines JSONB DEFAULT '[]'::jsonb,
    citations TEXT[],
    
    -- Confidence scores
    confidence_scores JSONB DEFAULT '{}'::jsonb,
    
    -- Vector embeddings for semantic search
    content_embedding VECTOR(1536), -- OpenAI/Vertex AI standard embedding size
    summary_embedding VECTOR(1536),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- File Processing Queue table for managing async processing
CREATE TABLE IF NOT EXISTS file_processing_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    processing_type TEXT NOT NULL CHECK (processing_type IN ('ocr', 'transcription', 'analysis', 'embeddings', 'full')),
    priority INTEGER DEFAULT 5 NOT NULL CHECK (priority >= 1 AND priority <= 10),
    status TEXT NOT NULL DEFAULT 'queued' 
        CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0 NOT NULL,
    max_attempts INTEGER DEFAULT 3 NOT NULL,
    
    -- Processing metadata
    processing_metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Search Analytics table to track and improve AI search
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Search details
    search_query TEXT NOT NULL,
    search_type TEXT NOT NULL CHECK (search_type IN ('text', 'semantic', 'hybrid', 'legal')),
    search_filters JSONB DEFAULT '{}'::jsonb,
    
    -- Results and interaction
    results_count INTEGER NOT NULL DEFAULT 0,
    clicked_results UUID[],
    search_duration_ms INTEGER,
    
    -- AI enhancements
    query_expansion TEXT,
    suggested_terms TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- AI Processing Logs for debugging and monitoring
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    processing_type TEXT NOT NULL,
    log_level TEXT NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processed_content_file_id ON processed_content(file_id);
CREATE INDEX IF NOT EXISTS idx_processed_content_project_id ON processed_content(project_id);
CREATE INDEX IF NOT EXISTS idx_processed_content_processing_status ON processed_content(processing_status);
CREATE INDEX IF NOT EXISTS idx_processed_content_document_type ON processed_content(document_type);
CREATE INDEX IF NOT EXISTS idx_processed_content_parties ON processed_content USING GIN(parties_mentioned);
CREATE INDEX IF NOT EXISTS idx_processed_content_legal_terms ON processed_content USING GIN(legal_terms);
CREATE INDEX IF NOT EXISTS idx_processed_content_citations ON processed_content USING GIN(citations);
CREATE INDEX IF NOT EXISTS idx_processed_content_extracted_text ON processed_content USING GIN(to_tsvector('english', extracted_text));

-- Vector similarity search indexes
CREATE INDEX IF NOT EXISTS idx_processed_content_embedding ON processed_content USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_processed_content_summary_embedding ON processed_content USING ivfflat (summary_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_file_processing_queue_status ON file_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_file_processing_queue_scheduled_for ON file_processing_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_file_processing_queue_priority ON file_processing_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_file_processing_queue_file_id ON file_processing_queue(file_id);

CREATE INDEX IF NOT EXISTS idx_search_analytics_project_id ON search_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_file_id ON ai_processing_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_log_level ON ai_processing_logs(log_level);

-- Enable RLS on all new tables
ALTER TABLE processed_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Processed Content
CREATE POLICY "Users can view processed content they own or have access to"
    ON processed_content FOR SELECT
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert processed content for their projects"
    ON processed_content FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can update processed content they own or have editor access"
    ON processed_content FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can delete processed content they own"
    ON processed_content FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for File Processing Queue
CREATE POLICY "Users can view queue items for their projects"
    ON file_processing_queue FOR SELECT
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert queue items for their projects"
    ON file_processing_queue FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "System can update queue items"
    ON file_processing_queue FOR UPDATE
    USING (true); -- Allow system updates for processing

CREATE POLICY "Users can delete queue items they own"
    ON file_processing_queue FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for Search Analytics
CREATE POLICY "Users can view their own search analytics"
    ON search_analytics FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own search analytics"
    ON search_analytics FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for AI Processing Logs
CREATE POLICY "Users can view processing logs for their files"
    ON ai_processing_logs FOR SELECT
    USING (
        file_id IN (
            SELECT f.id FROM files f
            JOIN projects p ON f.project_id = p.id
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id
            WHERE (f.owner_id = auth.uid() OR p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "System can insert processing logs"
    ON ai_processing_logs FOR INSERT
    WITH CHECK (true); -- Allow system to insert logs

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_processed_content_updated_at BEFORE UPDATE ON processed_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create helper functions for AI processing

-- Function to queue file for processing
CREATE OR REPLACE FUNCTION queue_file_for_processing(
    p_file_id UUID,
    p_project_id UUID,
    p_processing_type TEXT DEFAULT 'full',
    p_priority INTEGER DEFAULT 5
) RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    INSERT INTO file_processing_queue (
        file_id,
        project_id,
        processing_type,
        priority,
        owner_id
    ) VALUES (
        p_file_id,
        p_project_id,
        p_processing_type,
        p_priority,
        auth.uid()
    ) RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next file for processing
CREATE OR REPLACE FUNCTION get_next_processing_job()
RETURNS TABLE (
    id UUID,
    file_id UUID,
    project_id UUID,
    processing_type TEXT,
    file_storage_path TEXT,
    file_content_type TEXT,
    file_size BIGINT
) AS $$
BEGIN
    RETURN QUERY
    UPDATE file_processing_queue fpq
    SET 
        status = 'processing',
        started_at = NOW(),
        attempts = attempts + 1
    FROM files f
    WHERE fpq.file_id = f.id
        AND fpq.status = 'queued'
        AND fpq.scheduled_for <= NOW()
        AND fpq.attempts < fpq.max_attempts
        AND fpq.id = (
            SELECT fpq2.id 
            FROM file_processing_queue fpq2
            WHERE fpq2.status = 'queued'
                AND fpq2.scheduled_for <= NOW()
                AND fpq2.attempts < fpq2.max_attempts
            ORDER BY fpq2.priority DESC, fpq2.created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
    RETURNING fpq.id, fpq.file_id, fpq.project_id, fpq.processing_type, f.storage_path, f.content_type, f.size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for semantic search
CREATE OR REPLACE FUNCTION search_documents_semantic(
    p_project_id UUID,
    p_query_embedding VECTOR(1536),
    p_similarity_threshold FLOAT DEFAULT 0.7,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    file_id UUID,
    file_name TEXT,
    document_type TEXT,
    ai_summary TEXT,
    similarity_score FLOAT,
    extracted_text TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        pc.document_type,
        pc.ai_summary,
        (1 - (pc.content_embedding <=> p_query_embedding))::FLOAT as similarity_score,
        pc.extracted_text
    FROM processed_content pc
    JOIN files f ON pc.file_id = f.id
    WHERE pc.project_id = p_project_id
        AND pc.content_embedding IS NOT NULL
        AND (1 - (pc.content_embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY pc.content_embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log AI processing events
CREATE OR REPLACE FUNCTION log_ai_processing(
    p_file_id UUID,
    p_processing_type TEXT,
    p_log_level TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    INSERT INTO ai_processing_logs (
        file_id,
        processing_type,
        log_level,
        message,
        metadata
    ) VALUES (
        p_file_id,
        p_processing_type,
        p_log_level,
        p_message,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add processing status to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' 
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS document_type TEXT;

-- Create index on new files columns
CREATE INDEX IF NOT EXISTS idx_files_processing_status ON files(processing_status);
CREATE INDEX IF NOT EXISTS idx_files_document_type ON files(document_type);
-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- User AI profiles and learning data
CREATE TABLE user_ai_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  legal_specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  writing_style_analysis JSONB DEFAULT '{}'::JSONB,
  case_patterns JSONB DEFAULT '{}'::JSONB,
  interaction_preferences JSONB DEFAULT '{"response_length": "medium", "detail_level": "standard", "citation_style": "bluebook"}'::JSONB,
  knowledge_domains JSONB DEFAULT '{}'::JSONB,
  ai_learning_metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-specific embeddings namespace  
CREATE TABLE user_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('document', 'file', 'conversation', 'pattern', 'insight')),
  source_id UUID NOT NULL,
  content_chunk TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 dimensions
  user_context JSONB DEFAULT '{}'::JSONB,
  relevance_score FLOAT DEFAULT 1.0,
  access_frequency INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI conversation history
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual chat messages
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::JSONB,
  citations JSONB DEFAULT '[]'::JSONB,
  insights JSONB DEFAULT '[]'::JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI insights and case analysis
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES auth.users(id),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'connection', 'theory', 'timeline', 'risk', 'opportunity')),
  title TEXT NOT NULL,
  description TEXT,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_files UUID[],
  evidence JSONB DEFAULT '{}'::JSONB,
  user_feedback JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File processing status and queue
CREATE TABLE file_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  file_id UUID REFERENCES files(id),
  processing_stages JSONB DEFAULT '["upload", "extract", "analyze", "embed", "personalize"]'::JSONB,
  current_stage TEXT DEFAULT 'upload',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  ai_analysis_result JSONB DEFAULT '{}'::JSONB,
  user_specific_insights JSONB DEFAULT '{}'::JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- User AI interactions for learning
CREATE TABLE user_ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('query', 'feedback', 'correction', 'preference', 'upload')),
  query_text TEXT,
  ai_response TEXT,
  user_feedback JSONB DEFAULT '{}'::JSONB,
  context_used JSONB DEFAULT '{}'::JSONB,
  learning_signal JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_embeddings_user_id ON user_embeddings(user_id);
CREATE INDEX idx_user_embeddings_project_id ON user_embeddings(project_id);
CREATE INDEX idx_user_embeddings_source ON user_embeddings(source_type, source_id);
CREATE INDEX idx_user_embeddings_relevance ON user_embeddings(relevance_score DESC);

CREATE INDEX idx_ai_conversations_user_project ON ai_conversations(user_id, project_id);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

CREATE INDEX idx_ai_insights_user_project ON ai_insights(user_id, project_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type, confidence_score DESC);

CREATE INDEX idx_file_processing_user ON file_processing_queue(user_id, current_stage);
CREATE INDEX idx_user_interactions_user ON user_ai_interactions(user_id, created_at DESC);

-- Vector similarity search function for user-specific content
CREATE OR REPLACE FUNCTION match_user_content(
  user_id_param UUID,
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 10,
  project_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  user_context JSONB,
  similarity FLOAT,
  source_type TEXT,
  source_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content_chunk as content,
    e.user_context,
    1 - (e.embedding <=> query_embedding) as similarity,
    e.source_type,
    e.source_id
  FROM user_embeddings e
  WHERE 
    e.user_id = user_id_param
    AND (project_filter IS NULL OR e.project_id = project_filter)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to update user profile learning
CREATE OR REPLACE FUNCTION update_user_ai_learning(
  user_id_param UUID,
  learning_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_ai_profiles (user_id, ai_learning_metadata, updated_at)
  VALUES (user_id_param, learning_data, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET
    ai_learning_metadata = user_ai_profiles.ai_learning_metadata || learning_data,
    updated_at = NOW();
END;
$$;

-- RLS Policies for security
ALTER TABLE user_ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own AI data
CREATE POLICY "Users can manage their own AI profiles" ON user_ai_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own embeddings" ON user_embeddings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access messages from their conversations" ON ai_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_messages.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own insights" ON ai_insights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own file processing" ON file_processing_queue
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interactions" ON user_ai_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations 
  SET 
    message_count = message_count + 1,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_stats_trigger
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();

-- Function to initialize user AI profile
CREATE OR REPLACE FUNCTION initialize_user_ai_profile(user_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  profile_id UUID;
BEGIN
  INSERT INTO user_ai_profiles (user_id)
  VALUES (user_id_param)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;
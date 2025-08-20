-- Migration for Real-time Collaboration Features
-- This migration adds all necessary tables for comprehensive collaboration functionality

-- Enable realtime for existing tables
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE files;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  document_id UUID REFERENCES files(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  cursor_position JSONB, -- { line: number, column: number, selection: {start, end} }
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  current_page TEXT, -- which page/section they're viewing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Comments and Annotations Table
CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES document_comments(id) ON DELETE CASCADE, -- for replies
  content TEXT NOT NULL,
  comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'highlight', 'sticky_note', 'suggestion')),
  position JSONB, -- { page: number, x: number, y: number, selection: {start, end} }
  metadata JSONB, -- additional data like highlight color, resolved status, etc.
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Activity Feed Table
CREATE TABLE IF NOT EXISTS project_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'document_created', 'document_updated', 'document_deleted',
    'comment_added', 'comment_resolved', 'comment_deleted',
    'user_joined', 'user_left', 'permission_changed',
    'version_created', 'whiteboard_updated', 'chat_message'
  )),
  target_id UUID, -- ID of the target (document, comment, etc.)
  target_type TEXT, -- type of target (document, comment, etc.)
  details JSONB, -- activity-specific details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Workspace Permissions Table (extends projects_users with more granular permissions)
CREATE TABLE IF NOT EXISTS workspace_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permissions JSONB DEFAULT '{}', -- { read: true, write: true, comment: true, admin: false, share: false }
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(project_id, user_id)
);

-- Document Versions Table
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_diff JSONB, -- structured diff from previous version
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  commit_message TEXT,
  file_size BIGINT,
  checksum TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(document_id, version_number)
);

-- Collaborative Whiteboard Table
CREATE TABLE IF NOT EXISTS project_whiteboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Whiteboard',
  content JSONB DEFAULT '{"elements": [], "appState": {}}', -- fabric.js or similar whiteboard data
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Team Chat Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  thread_id UUID, -- for threaded conversations
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'mention')),
  metadata JSONB, -- for file attachments, mentions, etc.
  edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Document Collaboration Sessions Table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  session_token UUID DEFAULT uuid_generate_v4(),
  active_users JSONB DEFAULT '[]', -- array of user IDs currently in session
  operational_transform JSONB DEFAULT '[]', -- OT operations queue
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_project_id ON user_presence(project_id);
CREATE INDEX idx_user_presence_document_id ON user_presence(document_id);
CREATE INDEX idx_user_presence_status ON user_presence(status);

CREATE INDEX idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX idx_document_comments_project_id ON document_comments(project_id);
CREATE INDEX idx_document_comments_author_id ON document_comments(author_id);
CREATE INDEX idx_document_comments_parent_id ON document_comments(parent_id);
CREATE INDEX idx_document_comments_resolved ON document_comments(resolved);

CREATE INDEX idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX idx_project_activities_user_id ON project_activities(user_id);
CREATE INDEX idx_project_activities_type ON project_activities(activity_type);
CREATE INDEX idx_project_activities_created_at ON project_activities(created_at DESC);

CREATE INDEX idx_workspace_permissions_project_id ON workspace_permissions(project_id);
CREATE INDEX idx_workspace_permissions_user_id ON workspace_permissions(user_id);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_number ON document_versions(document_id, version_number);

CREATE INDEX idx_whiteboards_project_id ON project_whiteboards(project_id);

CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

CREATE INDEX idx_collaboration_sessions_document_id ON collaboration_sessions(document_id);
CREATE INDEX idx_collaboration_sessions_project_id ON collaboration_sessions(project_id);

-- Enable RLS for all new tables
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User Presence
CREATE POLICY "Users can view presence in their projects"
  ON user_presence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE user_presence.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own presence"
  ON user_presence FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Comments
CREATE POLICY "Users can view comments in their projects"
  ON document_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE document_comments.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create comments in their projects"
  ON document_comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE document_comments.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own comments"
  ON document_comments FOR UPDATE
  USING (auth.uid() = author_id);

-- RLS Policies for Activities
CREATE POLICY "Users can view activities in their projects"
  ON project_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE project_activities.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create activities in their projects"
  ON project_activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE project_activities.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

-- RLS Policies for Workspace Permissions
CREATE POLICY "Users can view permissions in their projects"
  ON workspace_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE workspace_permissions.project_id = p.id 
      AND p.owner_id = auth.uid()
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Project owners can manage permissions"
  ON workspace_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE workspace_permissions.project_id = p.id 
      AND p.owner_id = auth.uid()
    )
  );

-- RLS Policies for Document Versions
CREATE POLICY "Users can view versions in their projects"
  ON document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM files f
      JOIN projects p ON f.project_id = p.id
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE document_versions.document_id = f.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create versions in their projects"
  ON document_versions FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM files f
      JOIN projects p ON f.project_id = p.id
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE document_versions.document_id = f.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

-- RLS Policies for Whiteboards
CREATE POLICY "Users can view whiteboards in their projects"
  ON project_whiteboards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE project_whiteboards.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage whiteboards in their projects"
  ON project_whiteboards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE project_whiteboards.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

-- RLS Policies for Chat Messages
CREATE POLICY "Users can view chat in their projects"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE chat_messages.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their projects"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE chat_messages.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can edit their own messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = author_id);

-- RLS Policies for Collaboration Sessions
CREATE POLICY "Users can view sessions in their projects"
  ON collaboration_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE collaboration_sessions.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage sessions in their projects"
  ON collaboration_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE collaboration_sessions.project_id = p.id 
      AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

-- Enable realtime for new collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE document_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE project_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE document_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE project_whiteboards;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;

-- Create functions for automatic activity tracking
CREATE OR REPLACE FUNCTION track_document_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_activities (project_id, user_id, activity_type, target_id, target_type, details)
    VALUES (NEW.project_id, NEW.added_by, 'document_created', NEW.id, 'document', 
            json_build_object('document_name', NEW.name, 'file_type', NEW.file_type));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.content IS DISTINCT FROM NEW.content THEN
      INSERT INTO project_activities (project_id, user_id, activity_type, target_id, target_type, details)
      VALUES (NEW.project_id, NEW.added_by, 'document_updated', NEW.id, 'document',
              json_build_object('document_name', NEW.name));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO project_activities (project_id, user_id, activity_type, target_id, target_type, details)
    VALUES (OLD.project_id, auth.uid(), 'document_deleted', OLD.id, 'document',
            json_build_object('document_name', OLD.name));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document activity tracking
DROP TRIGGER IF EXISTS track_document_activity_trigger ON files;
CREATE TRIGGER track_document_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON files
  FOR EACH ROW EXECUTE FUNCTION track_document_activity();

-- Create function for comment activity tracking
CREATE OR REPLACE FUNCTION track_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_activities (project_id, user_id, activity_type, target_id, target_type, details)
    VALUES (NEW.project_id, NEW.author_id, 'comment_added', NEW.id, 'comment',
            json_build_object('comment_type', NEW.comment_type, 'document_id', NEW.document_id));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.resolved IS DISTINCT FROM NEW.resolved AND NEW.resolved = true THEN
      INSERT INTO project_activities (project_id, user_id, activity_type, target_id, target_type, details)
      VALUES (NEW.project_id, NEW.resolved_by, 'comment_resolved', NEW.id, 'comment',
              json_build_object('document_id', NEW.document_id));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comment activity tracking
DROP TRIGGER IF EXISTS track_comment_activity_trigger ON document_comments;
CREATE TRIGGER track_comment_activity_trigger
  AFTER INSERT OR UPDATE ON document_comments
  FOR EACH ROW EXECUTE FUNCTION track_comment_activity();

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  p_project_id UUID,
  p_document_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT 'online',
  p_cursor_position JSONB DEFAULT NULL,
  p_current_page TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, project_id, document_id, status, cursor_position, current_page, updated_at)
  VALUES (auth.uid(), p_project_id, p_document_id, p_status, p_cursor_position, p_current_page, NOW())
  ON CONFLICT (user_id, project_id, COALESCE(document_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET
    status = p_status,
    cursor_position = p_cursor_position,
    current_page = p_current_page,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old presence data
CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence 
  SET status = 'offline'
  WHERE last_seen < NOW() - INTERVAL '5 minutes' 
  AND status != 'offline';
  
  DELETE FROM user_presence 
  WHERE status = 'offline' 
  AND updated_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
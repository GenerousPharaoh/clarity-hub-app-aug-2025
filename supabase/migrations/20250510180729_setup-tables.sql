-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for vector embeddings (if needed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create projects table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  goal_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create projects_users join table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS projects_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(project_id, user_id)
);

-- Create files table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  content TEXT,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_deleted BOOLEAN DEFAULT false
);

-- Create document_chunks table for AI search (if it doesn't exist)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create exhibit_markers table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS exhibit_markers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  exhibit_id TEXT NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(project_id, exhibit_id)
);

-- Create notes table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Setup RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibit_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for accessing data
-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects: Users can select projects they created or are members of
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = id AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = id AND pu.user_id = auth.uid() AND pu.role = 'editor'
    )
  );

-- Files: Users can access files for projects they have access to
CREATE POLICY "Users can view project files"
  ON files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE files.project_id = p.id AND (p.owner_id = auth.uid() OR pu.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert project files"
  ON files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      WHERE files.project_id = p.id AND (p.owner_id = auth.uid() OR (pu.user_id = auth.uid() AND pu.role IN ('editor', 'contributor')))
    )
  );

-- Create a storage demo bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('clarity_hub_files', 'clarity_hub_files', true, false, 104857600, '{"image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain", "text/csv", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"}')
ON CONFLICT (id) DO NOTHING;

-- Create a storage policy to allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'clarity_hub_files');

-- Create a storage policy to allow public downloads
CREATE POLICY "Allow public downloads"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'clarity_hub_files');

-- Create a demo user for testing
INSERT INTO auth.users (id, email, email_confirmed_at, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'demo@clarityhubtester.com', NOW(), NULL, '{"provider":"email","providers":["email"]}', '{"name":"Demo User"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create a profile for the demo user
INSERT INTO profiles (id, first_name, last_name, role)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'Demo', 'User', 'user')
ON CONFLICT (id) DO NOTHING;

-- Create a demo project
INSERT INTO projects (id, name, owner_id)
VALUES
  ('d7f90a84-7577-4efa-8df7-da6ac42d7e60', 'Demo Project', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

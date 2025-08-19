-- Fix infinite recursion in projects policies
-- This migration creates a SECURITY DEFINER function to bypass RLS checks

-- First, drop any existing policies on projects that might cause recursion
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects they collaborate on" ON projects;
DROP POLICY IF EXISTS "allow_all_projects" ON projects;
DROP POLICY IF EXISTS "auth insert" ON projects;
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- Create a helper function that bypasses RLS to check if a user belongs to a project
CREATE OR REPLACE FUNCTION is_member_of_project(user_id uuid, project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND owner_id = user_id
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM projects_users 
    WHERE project_id = project_id AND user_id = user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Create policies using the helper function
CREATE POLICY "Users can access their projects" ON projects
  FOR ALL USING (
    is_member_of_project(auth.uid(), id)
  );

-- Create a simple policy for inserting projects
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
  );

-- Add policy for files table that doesn't trigger the projects recursion
DROP POLICY IF EXISTS "allow_all_files" ON files;
DROP POLICY IF EXISTS "auth insert" ON files;

-- Create a function to check if a user can access files in a project
CREATE OR REPLACE FUNCTION can_access_project_files(user_id uuid, project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND owner_id = user_id
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM projects_users 
    WHERE project_id = project_id AND user_id = user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Create policies for files using the helper function
CREATE POLICY "Users can access files in their projects" ON files
  FOR ALL USING (
    can_access_project_files(auth.uid(), project_id)
  );

-- Document the changes
COMMENT ON FUNCTION is_member_of_project(uuid, uuid) IS 'Checks if a user is a member of a project, bypassing RLS';
COMMENT ON FUNCTION can_access_project_files(uuid, uuid) IS 'Checks if a user can access files in a project, bypassing RLS';
COMMENT ON TABLE projects IS 'Fixed recursion issues with properly designed SECURITY DEFINER functions'; 
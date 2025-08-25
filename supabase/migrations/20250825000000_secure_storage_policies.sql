-- Security Enhancement: Secure Storage Policies
-- 
-- This migration fixes critical security vulnerabilities:
-- 1. Removes anonymous public access to files
-- 2. Enforces file size limits consistently (50MB)
-- 3. Restricts file types through database constraints
-- 4. Adds proper authentication checks

-- Update bucket configuration for security
UPDATE storage.buckets
SET 
  public = false,  -- SECURITY: Remove public access, use signed URLs instead
  file_size_limit = 52428800,  -- 50MB limit (52428800 bytes)
  allowed_mime_types = ARRAY[
    -- Document formats
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'text/rtf',
    -- Spreadsheet formats
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    -- Image formats
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'image/svg+xml',
    -- Audio formats
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/mp4',
    'audio/m4a',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
    -- Video formats
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
    'video/x-ms-wmv',
    'video/x-flv',
    -- Email formats
    'message/rfc822',
    'application/vnd.ms-outlook',
    -- Presentation formats
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    -- Archive formats (limited)
    'application/zip',
    'application/vnd.rar',
    'application/x-7z-compressed',
    -- Text formats
    'text/html',
    'text/xml',
    'application/xml',
    'application/json'
  ]
WHERE id IN ('files', 'project-files', 'demo-files', 'thumbnails');

-- Drop all existing insecure policies
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public can view demo files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can view thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Demo bucket access" ON storage.objects;

-- Create secure, restrictive policies

-- FILES bucket - only authenticated users with proper authorization
CREATE POLICY "Secure file upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('files', 'project-files') AND
    -- User can only upload to their own directory structure
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Secure file read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('files', 'project-files') AND
    (
      -- User owns the file
      (storage.foldername(name))[1] = auth.uid()::text OR
      -- User has access to the project (check via files table)
      EXISTS (
        SELECT 1 FROM files f 
        INNER JOIN projects p ON f.project_id = p.id
        WHERE f.storage_path = name 
        AND (p.owner_id = auth.uid() OR 
             EXISTS (
               SELECT 1 FROM project_collaborators pc 
               WHERE pc.project_id = p.id AND pc.user_id = auth.uid()
             ))
      )
    )
  );

CREATE POLICY "Secure file update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('files', 'project-files') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Secure file delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('files', 'project-files') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- THUMBNAILS bucket - similar security model
CREATE POLICY "Secure thumbnail upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Secure thumbnail read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM files f 
        INNER JOIN projects p ON f.project_id = p.id
        WHERE f.storage_path LIKE '%' || (storage.foldername(name))[2] || '%'
        AND (p.owner_id = auth.uid() OR 
             EXISTS (
               SELECT 1 FROM project_collaborators pc 
               WHERE pc.project_id = p.id AND pc.user_id = auth.uid()
             ))
      )
    )
  );

CREATE POLICY "Secure thumbnail update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Secure thumbnail delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- DEMO bucket - restricted to demo purposes only, no persistent data
CREATE POLICY "Demo upload only for demo users"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'demo-files' AND
    -- Only allow demo uploads in demo mode (add your demo user logic here)
    (storage.foldername(name))[1] LIKE 'demo_%'
  );

CREATE POLICY "Demo read access"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'demo-files' AND
    (storage.foldername(name))[1] LIKE 'demo_%'
  );

-- Function to validate file uploads at database level
CREATE OR REPLACE FUNCTION validate_file_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate file size
  IF NEW.size > 52428800 THEN -- 50MB
    RAISE EXCEPTION 'File size exceeds 50MB limit';
  END IF;
  
  -- Validate file path doesn't contain traversal attempts
  IF NEW.storage_path ~ '\.\./|//|\\|<|>|:|"|!|\?|\*' THEN
    RAISE EXCEPTION 'Invalid characters in file path';
  END IF;
  
  -- Validate sanitized filename
  IF NEW.name ~ '[<>:"|?*\\]|\.\.|^\.+$|^$' THEN
    RAISE EXCEPTION 'Invalid filename format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation trigger to files table
DROP TRIGGER IF EXISTS validate_file_upload_trigger ON files;
CREATE TRIGGER validate_file_upload_trigger
  BEFORE INSERT OR UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION validate_file_upload();

-- Add security audit log for file operations
CREATE TABLE IF NOT EXISTS file_security_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE file_security_audit ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own audit logs
CREATE POLICY "Users can only view their own audit logs"
  ON file_security_audit FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Function to log security events
CREATE OR REPLACE FUNCTION log_file_security_event(
  p_action TEXT,
  p_file_path TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO file_security_audit (
    user_id, action, file_path, file_name, file_size,
    success, error_message
  ) VALUES (
    auth.uid(), p_action, p_file_path, p_file_name, p_file_size,
    p_success, p_error_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log file operations
CREATE OR REPLACE FUNCTION audit_file_operations()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_file_security_event(
      'FILE_UPLOAD',
      NEW.storage_path,
      NEW.name,
      NEW.size
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_file_security_event(
      'FILE_DELETE',
      OLD.storage_path,
      OLD.name,
      OLD.size
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger
DROP TRIGGER IF EXISTS audit_file_operations_trigger ON files;
CREATE TRIGGER audit_file_operations_trigger
  AFTER INSERT OR DELETE ON files
  FOR EACH ROW
  EXECUTE FUNCTION audit_file_operations();
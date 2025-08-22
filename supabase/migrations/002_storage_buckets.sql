-- Create storage buckets for file management
-- This needs to be run after the initial Supabase setup

-- Note: Storage bucket creation via SQL is limited in Supabase
-- These buckets should be created via the Supabase Dashboard or CLI
-- This file documents the required bucket configuration

/*
Required Storage Buckets:

1. 'documents' bucket
   - Public: false
   - File size limit: 50MB
   - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
   - Used for: Exported documents and reports

2. 'files' bucket
   - Public: false
   - File size limit: 100MB
   - Allowed MIME types: all (for maximum flexibility)
   - Used for: User uploaded case files, evidence, exhibits

3. 'thumbnails' bucket
   - Public: false
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp
   - Used for: Generated preview thumbnails

Storage Policies to be applied via Supabase Dashboard:
*/

-- Storage bucket RLS policies (to be applied after bucket creation)
-- These are examples - actual implementation depends on Supabase bucket creation

-- Policy for 'documents' bucket
-- Users can upload documents to their own folder
-- Path pattern: {user_id}/{project_id}/{document_id}/{filename}

-- Policy for 'files' bucket  
-- Users can upload files to their projects
-- Path pattern: {project_id}/{file_id}/{filename}

-- Policy for 'thumbnails' bucket
-- System generates thumbnails, users can view their own
-- Path pattern: {project_id}/thumbs/{file_id}.jpg

-- Helper function to generate storage paths
CREATE OR REPLACE FUNCTION generate_storage_path(
  p_bucket TEXT,
  p_project_id UUID,
  p_file_id UUID,
  p_filename TEXT
) RETURNS TEXT AS $$
BEGIN
  CASE p_bucket
    WHEN 'documents' THEN
      RETURN format('%s/%s/%s', p_project_id, p_file_id, p_filename);
    WHEN 'files' THEN
      RETURN format('%s/%s/%s', p_project_id, p_file_id, p_filename);
    WHEN 'thumbnails' THEN
      RETURN format('%s/thumbs/%s.jpg', p_project_id, p_file_id);
    ELSE
      RETURN format('%s/%s', p_file_id, p_filename);
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Helper function to validate file upload
CREATE OR REPLACE FUNCTION validate_file_upload(
  p_file_size BIGINT,
  p_mime_type TEXT,
  p_bucket TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check file size limits
  CASE p_bucket
    WHEN 'documents' THEN
      IF p_file_size > 52428800 THEN -- 50MB
        RAISE EXCEPTION 'Document file size exceeds 50MB limit';
      END IF;
    WHEN 'files' THEN
      IF p_file_size > 104857600 THEN -- 100MB
        RAISE EXCEPTION 'File size exceeds 100MB limit';
      END IF;
    WHEN 'thumbnails' THEN
      IF p_file_size > 5242880 THEN -- 5MB
        RAISE EXCEPTION 'Thumbnail size exceeds 5MB limit';
      END IF;
  END CASE;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to handle file upload metadata
CREATE OR REPLACE FUNCTION handle_file_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate file upload
  PERFORM validate_file_upload(NEW.file_size, NEW.mime_type, NEW.storage_bucket);
  
  -- Generate storage path if not provided
  IF NEW.storage_path IS NULL THEN
    NEW.storage_path := generate_storage_path(
      NEW.storage_bucket,
      NEW.project_id,
      NEW.id,
      NEW.file_name
    );
  END IF;
  
  -- Log the upload activity
  INSERT INTO activity_log (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    NEW.uploaded_by,
    'file_upload',
    'file',
    NEW.id,
    jsonb_build_object(
      'file_name', NEW.file_name,
      'file_size', NEW.file_size,
      'mime_type', NEW.mime_type
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for file uploads
CREATE TRIGGER handle_file_upload_trigger
  BEFORE INSERT ON files
  FOR EACH ROW
  EXECUTE FUNCTION handle_file_upload();

-- Function to clean up storage when file is deleted
CREATE OR REPLACE FUNCTION cleanup_file_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the deletion
  INSERT INTO activity_log (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    auth.uid(),
    'file_delete',
    'file',
    OLD.id,
    jsonb_build_object(
      'file_name', OLD.file_name,
      'storage_path', OLD.storage_path
    )
  );
  
  -- Note: Actual storage deletion should be handled by application
  -- or a background job to ensure proper cleanup
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for file deletion
CREATE TRIGGER cleanup_file_storage_trigger
  AFTER DELETE ON files
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_file_storage();
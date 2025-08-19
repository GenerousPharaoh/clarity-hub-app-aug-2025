
-- Run this in Supabase SQL Editor to create a demo project
INSERT INTO public.projects (id, name, owner_id, created_at, description)
VALUES 
  ('demo-project-123', 'Demo Legal Case', 'demo-user-123', NOW(), 'A demo project with sample files')
ON CONFLICT (id) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Add some demo files
INSERT INTO public.files (id, name, project_id, owner_id, storage_path, content_type, size, file_type, metadata, added_at)
VALUES
  ('demo-file-1', 'Sample Contract.pdf', 'demo-project-123', 'demo-user-123', 'projects/demo-project-123/demo-file-1_sample.pdf', 'application/pdf', 12345, 'pdf', '{"tags":["contract","legal"],"processingStatus":"completed"}', NOW() - INTERVAL '2 days'),
  ('demo-file-2', 'Case Evidence.jpg', 'demo-project-123', 'demo-user-123', 'projects/demo-project-123/demo-file-2_evidence.jpg', 'image/jpeg', 45678, 'image', '{"tags":["evidence","photo"],"processingStatus":"completed"}', NOW() - INTERVAL '1 day'),
  ('demo-file-3', 'Meeting Notes.txt', 'demo-project-123', 'demo-user-123', 'projects/demo-project-123/demo-file-3_notes.txt', 'text/plain', 1234, 'text', '{"tags":["notes","meeting"],"processingStatus":"completed"}', NOW())
ON CONFLICT (id) 
DO UPDATE SET
  name = EXCLUDED.name,
  metadata = EXCLUDED.metadata;
    
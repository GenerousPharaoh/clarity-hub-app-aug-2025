
-- Optimized vector search function for AI
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_project_id uuid
)
RETURNS TABLE (
  id uuid,
  file_id uuid,
  project_id uuid,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.file_id,
    dc.project_id,
    dc.chunk_text,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM
    document_chunks dc
  WHERE
    dc.project_id = p_project_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY
    dc.embedding <=> query_embedding
  LIMIT
    match_count;
END;
$$;

-- Trigger to automatically request file analysis
CREATE OR REPLACE FUNCTION request_file_analysis_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a job into a queue table for background processing
  INSERT INTO file_analysis_queue (file_id, project_id, status)
  VALUES (NEW.id, NEW.project_id, 'pending');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a file analysis queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS file_analysis_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS request_file_analysis_trigger ON public.files;

-- Create trigger on files table
CREATE TRIGGER request_file_analysis_trigger
AFTER INSERT ON public.files
FOR EACH ROW
EXECUTE FUNCTION request_file_analysis_on_insert();

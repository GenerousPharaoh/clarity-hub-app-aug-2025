-- Create links table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  source_file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies if they don't already exist
DO $$
BEGIN
  -- Add RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'links' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Add read policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'links' 
    AND policyname = 'Allow read access to project members'
  ) THEN
    CREATE POLICY "Allow read access to project members" ON public.links
    FOR SELECT USING (
      project_id IN (
        SELECT project_id FROM projects_users 
        WHERE user_id = auth.uid()
      )
    );
  END IF;
  
  -- Add insert policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'links' 
    AND policyname = 'Allow insert access to project members'
  ) THEN
    CREATE POLICY "Allow insert access to project members" ON public.links
    FOR INSERT WITH CHECK (
      project_id IN (
        SELECT project_id FROM projects_users 
        WHERE user_id = auth.uid()
      )
    );
  END IF;
  
  -- Add update policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'links' 
    AND policyname = 'Allow update access to project members'
  ) THEN
    CREATE POLICY "Allow update access to project members" ON public.links
    FOR UPDATE USING (
      project_id IN (
        SELECT project_id FROM projects_users 
        WHERE user_id = auth.uid()
      )
    );
  END IF;
  
  -- Add delete policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'links' 
    AND policyname = 'Allow delete access to project members'
  ) THEN
    CREATE POLICY "Allow delete access to project members" ON public.links
    FOR DELETE USING (
      project_id IN (
        SELECT project_id FROM projects_users 
        WHERE user_id = auth.uid()
      )
    );
  END IF;
END
$$; 
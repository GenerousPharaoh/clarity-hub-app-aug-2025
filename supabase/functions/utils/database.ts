import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Database } from '../types/supabase.ts';

// Initialize the Supabase client
export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Check if tables exist to avoid errors
export async function checkTablesExist() {
  const supabase = getSupabaseClient();
  
  try {
    // Try to query each required table
    const tables = ['profiles', 'projects', 'files', 'document_chunks', 'projects_users'];
    const results = await Promise.all(
      tables.map(async (table) => {
        const { error } = await supabase.from(table).select('*').limit(1);
        return { table, exists: !error };
      })
    );
    
    const missingTables = results.filter(r => !r.exists).map(r => r.table);
    
    if (missingTables.length > 0) {
      console.error(`Missing tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
}

/**
 * Get project details by ID
 * @param projectId The project ID to fetch
 * @returns Project details or null if not found
 */
export async function getProject(projectId: string) {
  try {
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      throw new Error('Required database tables do not exist');
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
}

/**
 * Get file details by ID
 * @param fileId The file ID to fetch
 * @returns File details or null if not found
 */
export async function getFile(fileId: string) {
  try {
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      throw new Error('Required database tables do not exist');
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
}

/**
 * Get all files for a project
 * @param projectId The project ID to fetch files for
 * @returns Array of files or empty array if none found
 */
export async function getProjectFiles(projectId: string) {
  const { data, error } = await getSupabaseClient()
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching project files:', error);
    return [];
  }

  return data || [];
}

/**
 * Get document chunks for vector similarity search
 * @param projectId The project ID to fetch chunks for
 * @param queryEmbedding The embedding vector to compare against
 * @param limit The maximum number of results to return
 * @returns Array of matching document chunks with similarity scores
 */
export async function getMatchingDocumentChunks(
  projectId: string,
  queryEmbedding: number[],
  matchThreshold = 0.7,
  matchCount = 5
) {
  try {
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      throw new Error('Required database tables do not exist');
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      p_project_id: projectId,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting matching chunks:', error);
    throw error;
  }
}

/**
 * Save document chunks with embeddings
 * @param chunks Array of document chunks to save
 * @returns Success status
 */
export async function saveDocumentChunks(chunks: Array<{
  file_id: string,
  project_id: string,
  owner_id: string,
  chunk_text: string,
  embedding: number[]
}>) {
  try {
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      throw new Error('Required database tables do not exist');
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('document_chunks')
      .insert(chunks);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving document chunks:', error);
    throw error;
  }
}

/**
 * Get the next available exhibit ID for a project
 * @param projectId The project ID to get next exhibit ID for
 * @returns Next available exhibit ID
 */
export async function getNextExhibitId(projectId: string): Promise<string> {
  try {
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      // Return a default value if tables don't exist yet
      return 'Exhibit_1';
    }
    
    const supabase = getSupabaseClient();
    
    // Get highest exhibit number in this project
    const { data, error } = await supabase
      .from('files')
      .select('exhibit_id')
      .eq('project_id', projectId)
      .not('exhibit_id', 'is', null)
      .order('exhibit_id', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    // First exhibit
    if (!data || data.length === 0 || !data[0].exhibit_id) {
      return 'Exhibit_1';
    }
    
    // Parse the last number and increment
    const lastId = data[0].exhibit_id;
    const match = lastId.match(/Exhibit_(\d+)/i);
    
    if (match && match[1]) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `Exhibit_${nextNum}`;
    }
    
    // Default fallback
    return 'Exhibit_1';
  } catch (error) {
    console.error('Error getting next exhibit ID:', error);
    // Return a default value on error
    return 'Exhibit_1';
  }
} 
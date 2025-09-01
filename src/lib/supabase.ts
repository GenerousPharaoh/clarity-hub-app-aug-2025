/**
 * Supabase Client Configuration
 * Re-export the singleton client to prevent multiple instances
 */

// Re-export everything from the main supabaseClient to maintain compatibility
export { 
  supabase,
  serviceClient,
  STORAGE_BUCKETS,
  initStorageBuckets,
  isAdminUser,
  manualRefresh,
  type Supabase,
  default 
} from '../services/supabaseClient';

// Re-export the supabase instance as both named and default export for compatibility
import supabaseClient from '../services/supabaseClient';

// Helper functions for common operations
/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string }
) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert || false,
      contentType: options?.contentType || file.type,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  return data;
}

/**
 * Get a signed URL for a file
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hour default
) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }

  return data.signedUrl;
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(bucket: string, path: string) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .download(path);

  if (error) {
    console.error('Error downloading file:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, paths: string[]) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .remove(paths);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }

  return data;
}

/**
 * List files in a storage bucket
 */
export async function listFiles(
  bucket: string,
  path?: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  }
) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .list(path, {
      limit: options?.limit || 100,
      offset: options?.offset || 0,
      sortBy: options?.sortBy,
    });

  if (error) {
    console.error('Error listing files:', error);
    throw error;
  }

  return data;
}

// Database helper functions

/**
 * Insert a document record
 */
export async function createDocument(document: {
  project_id: string;
  title: string;
  document_type?: string;
  description?: string;
}) {
  const { data, error } = await supabaseClient
    .from('documents')
    .insert(document)
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    throw error;
  }

  return data;
}

/**
 * Save document content (with versioning)
 */
export async function saveDocumentContent(
  documentId: string,
  content: any,
  plainText: string
) {
  // First, mark all existing versions as non-current
  await supabaseClient
    .from('document_content')
    .update({ is_current: false })
    .eq('document_id', documentId);

  // Get the latest version number
  const { data: latestVersion } = await supabaseClient
    .from('document_content')
    .select('version')
    .eq('document_id', documentId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const newVersion = (latestVersion?.version || 0) + 1;

  // Insert new version
  const { data, error } = await supabaseClient
    .from('document_content')
    .insert({
      document_id: documentId,
      version: newVersion,
      content: content,
      plain_text: plainText,
      word_count: plainText.split(/\s+/).filter(w => w).length,
      is_current: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving document content:', error);
    throw error;
  }

  return data;
}

/**
 * Load document content (latest version)
 */
export async function loadDocumentContent(documentId: string) {
  const { data, error } = await supabaseClient
    .from('document_content')
    .select('*')
    .eq('document_id', documentId)
    .eq('is_current', true)
    .single();

  if (error) {
    console.error('Error loading document content:', error);
    throw error;
  }

  return data;
}

/**
 * Create a file record in the database
 */
export async function createFileRecord(file: {
  project_id: string;
  document_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  mime_type: string;
  sha256_hash?: string;
  metadata?: any;
}) {
  const { data, error } = await supabaseClient
    .from('files')
    .insert(file)
    .select()
    .single();

  if (error) {
    console.error('Error creating file record:', error);
    throw error;
  }

  return data;
}

/**
 * Get files for a project
 */
export async function getProjectFiles(projectId: string) {
  const { data, error } = await supabaseClient
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching project files:', error);
    throw error;
  }

  return data;
}

/**
 * Create a citation link between document and file
 */
export async function createCitation(citation: {
  document_id: string;
  file_id: string;
  citation_key: string;
  page_number?: number;
  position_data?: any;
}) {
  const { data, error } = await supabaseClient
    .from('document_citations')
    .insert(citation)
    .select()
    .single();

  if (error) {
    console.error('Error creating citation:', error);
    throw error;
  }

  return data;
}

/**
 * Get citations for a document
 */
export async function getDocumentCitations(documentId: string) {
  const { data, error } = await supabaseClient
    .from('document_citations')
    .select(`
      *,
      files (*)
    `)
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching citations:', error);
    throw error;
  }

  return data;
}

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabaseClient.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabaseClient.auth.onAuthStateChange(callback);
  },
};
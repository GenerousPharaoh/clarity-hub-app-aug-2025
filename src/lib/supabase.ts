/**
 * Supabase Client - re-export singleton to prevent multiple instances
 */
import supabaseClient, {
  STORAGE_BUCKETS,
  manualRefresh,
  type Supabase,
} from '../services/supabaseClient';

export { STORAGE_BUCKETS, manualRefresh, type Supabase };
export { supabaseClient as supabase };
export default supabaseClient;

// Storage helpers

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
  if (error) throw error;
  return data;
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadFile(bucket: string, path: string) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .download(path);
  if (error) throw error;
  return data;
}

export async function deleteFile(bucket: string, paths: string[]) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .remove(paths);
  if (error) throw error;
  return data;
}

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
  if (error) throw error;
  return data;
}

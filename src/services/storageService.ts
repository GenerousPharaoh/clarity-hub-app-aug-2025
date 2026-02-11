/**
 * Storage Service - Supabase File Storage
 *
 * Simplified storage service for file upload, download, delete,
 * and URL generation. Uses Supabase Storage exclusively.
 *
 * Files table columns:
 *   id, project_id, file_name, file_path, file_type,
 *   added_by, created_at, updated_at, exhibit_number
 */
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

// ============================================================
// Types
// ============================================================

export interface UploadResult {
  path: string;
  publicUrl: string;
}

export interface FileRecord {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  added_by: string;
  created_at: string | null;
  updated_at: string | null;
  exhibit_number: string | null;
}

// ============================================================
// URL helpers
// ============================================================

/**
 * Build a deterministic public URL for a file in the storage bucket.
 * No network call required -- just string construction.
 */
export function getPublicUrl(path: string): string {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
}

/**
 * Get a signed URL for temporary access to a file.
 * Defaults to 1 hour expiry.
 */
export async function getSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('[storageService] Signed URL error:', error);
    // Fall back to public URL construction
    return getPublicUrl(path);
  }

  return data.signedUrl;
}

/**
 * Download a file from the private bucket and return a local blob URL.
 * Uses the Supabase client's authenticated download (avoids CORS issues).
 * Callers must revoke the blob URL with URL.revokeObjectURL() when done.
 */
export async function getFileUrl(
  filePath: string
): Promise<{ url: string; error?: string }> {
  if (!filePath) return { url: '', error: 'No file path provided' };

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(filePath);

    if (error) {
      console.error('[storageService] Download error:', error);
      return { url: '', error: error.message };
    }

    if (!data) {
      return { url: '', error: 'File download returned empty data' };
    }

    // Create a local blob URL — no CORS issues
    const blobUrl = URL.createObjectURL(data);
    return { url: blobUrl };
  } catch (err) {
    console.error('[storageService] getFileUrl error:', err);
    return {
      url: '',
      error: err instanceof Error ? err.message : 'Failed to download file',
    };
  }
}

// ============================================================
// Upload / Download / Delete
// ============================================================

/**
 * Upload a file to Supabase storage.
 */
export async function uploadFile(
  path: string,
  file: File,
  options?: {
    upsert?: boolean;
    cacheControl?: string;
  }
): Promise<UploadResult> {
  const { upsert = true, cacheControl = '3600' } = options ?? {};

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl,
      upsert,
    });

  if (error) {
    console.error('[storageService] Upload error:', error);
    throw error;
  }

  return {
    path: data.path,
    publicUrl: getPublicUrl(data.path),
  };
}

/**
 * Download a file from Supabase storage as a Blob.
 */
export async function downloadFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(path);

  if (error) {
    console.error('[storageService] Download error:', error);
    throw error;
  }

  return data;
}

/**
 * Delete one or more files from Supabase storage.
 */
export async function deleteFile(paths: string | string[]): Promise<void> {
  const pathArray = Array.isArray(paths) ? paths : [paths];

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(pathArray);

  if (error) {
    console.error('[storageService] Delete error:', error);
    throw error;
  }
}

/**
 * Get a thumbnail URL using Supabase image transforms.
 */
export async function getThumbnailUrl(
  path: string,
  options?: { width?: number; height?: number }
): Promise<string> {
  const { width = 200, height = 200 } = options ?? {};

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 60, {
      transform: {
        width,
        height,
        resize: 'cover',
      },
    });

  if (error) {
    console.error('[storageService] Thumbnail error:', error);
    return getPublicUrl(path);
  }

  return data.signedUrl;
}

// ============================================================
// Default export
// ============================================================

export default {
  getPublicUrl,
  getSignedUrl,
  getFileUrl,
  uploadFile,
  downloadFile,
  deleteFile,
  getThumbnailUrl,
};

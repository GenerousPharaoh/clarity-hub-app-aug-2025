import { supabase } from '../lib/supabase';
import { fallbackStorage } from './fallbackStorageService';

// Get Supabase URL for public URL construction
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

// Initialize fallback mode based on prior failures
let useLocalFallback = false;

/**
 * Helper functions for working with Supabase Storage
 * These utilities ensure proper CORS handling and consistent error management
 */

const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  FILES: 'files',
  THUMBNAILS: 'thumbnails',
};

// Maximum number of upload retries
const MAX_RETRIES = 3;

// Storage version tracker for conflict resolution
interface FileVersion {
  path: string;
  versionId: string;
  timestamp: number;
}

// Keep track of file versions in memory
const fileVersions: Record<string, FileVersion[]> = {};

// Test Supabase connection on startup and set fallback mode if needed
(async function testSupabaseConnection() {
  try {
    // Try to access the files bucket
    const { data, error } = await supabase.storage.from('files').list('', { limit: 1 });
    
    if (error) {
      useLocalFallback = true;
    } else {
      useLocalFallback = false;
    }
  } catch (error) {
    useLocalFallback = true;
  }
})();

/**
 * Check if we're using local fallback storage
 */
export const isUsingFallback = () => {
  return useLocalFallback;
};

/**
 * Reset fallback mode and try to use Supabase storage again
 * Returns true if connection test succeeds
 */
export const resetFallbackMode = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.from('files').list('', { limit: 1 });
    if (error) {
      return false;
    }

    useLocalFallback = false;
    return true;
  } catch (error) {
    console.error('Error resetting fallback mode:', error);
    return false;
  }
};

/**
 * Get a public URL for a file in the storage bucket without signed URLs.
 * This avoids the redirect issue that can cause iframe embedding problems.
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  if (useLocalFallback) {
    // In fallback mode, we can't return a synchronous URL for async local storage
    // Components should use getFileUrl() for async URL resolution
    return '';
  }

  if (!path || !bucket) return '';
  
  // Clean up the path by removing any leading slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Use the public URL helper from utils
  // Return deterministic public URL without signed URLs for reliability
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
};

/**
 * Get a signed URL for temporary access to a file
 */
export const getSignedUrl = async (bucket: string, path: string, expiresIn = 3600): Promise<string> => {
  if (useLocalFallback) {
    return fallbackStorage.getFileUrl(bucket, path)
      .then(url => url || '');
  }
  
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  
  if (error) {
    // Try fallback if Supabase fails
    useLocalFallback = true;
    return fallbackStorage.getFileUrl(bucket, path)
      .then(url => url || '');
  }
  
  return data.signedUrl;
};

/**
 * Add a new version to the version history
 */
const addFileVersion = (path: string, versionId: string) => {
  const version: FileVersion = {
    path,
    versionId,
    timestamp: Date.now()
  };
  
  // Initialize version array if it doesn't exist
  if (!fileVersions[path]) {
    fileVersions[path] = [];
  }
  
  // Add new version (keep last 5 versions)
  fileVersions[path].unshift(version);
  if (fileVersions[path].length > 5) {
    fileVersions[path] = fileVersions[path].slice(0, 5);
  }
  
  return version;
};

/**
 * Get version history for a file
 */
export const getFileVersions = (path: string): FileVersion[] => {
  return fileVersions[path] || [];
};

/**
 * Upload a file to storage with versioning and robust error handling
 * @param bucket The storage bucket name
 * @param path The path to the file in the bucket
 * @param file The file to upload
 * @param options Upload options including progress tracking and upsert behavior
 */
export const uploadFile = async (
  bucket: string, 
  path: string, 
  file: File,
  options?: {
    onProgress?: (progress: { loaded: number; total: number }) => void;
    upsert?: boolean;
    cacheControl?: string;
    retryCount?: number;
    createVersion?: boolean;
  }
): Promise<{ path: string; publicUrl: string; versionId?: string }> => {
  try {
    // Set default options
    const { 
      onProgress, 
      upsert = true, 
      cacheControl = '3600',
      retryCount = 0,
      createVersion = true
    } = options || {};
    
    // Check if we're in fallback mode or demo mode
    if (useLocalFallback) {
      // Using local fallback storage
      
      // Extract project ID and user ID from the path
      // Assuming path format like: projects/{projectId}/{fileId}_{filename}
      const parts = path.split('/');
      const projectId = parts.length > 1 ? parts[1] : 'unknown-project';
      
      // Get user ID from Supabase auth
      let userId = 'unknown';
      try {
        const { data } = await supabase.auth.getUser();
        userId = data?.user?.id || 'unknown';
      } catch (error) {
        // Could not get user ID
      }
      
      // Simulate upload progress for better UX
      if (onProgress) {
        // Send 10% progress immediately
        onProgress({ loaded: file.size * 0.1, total: file.size });
        
        // After a delay, send 50% progress
        setTimeout(() => {
          onProgress({ loaded: file.size * 0.5, total: file.size });
        }, 150);
        
        // After another delay, send 90% progress
        setTimeout(() => {
          onProgress({ loaded: file.size * 0.9, total: file.size });
        }, 300);
      }
      
      // Upload to local storage
      const result = await fallbackStorage.uploadFile(
        bucket, 
        path, 
        file, 
        projectId, 
        userId
      );
      
      // Send 100% progress
      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size });
      }
      
      // Create a version ID for the local file
      const versionId = crypto.randomUUID();
      if (createVersion) {
        addFileVersion(path, versionId);
      }
      
      return {
        path: result.path,
        publicUrl: result.publicUrl,
        versionId
      };
    }
    
    // Create a better upload error message
    const formatError = (error: any) => {
      let message = error?.message || 'Unknown error occurred';
      
      // Extract more detailed error message for RLS policy issues
      if (error?.message?.includes('new row violates row-level security policy')) {
        message = 'Permission denied: Your account does not have permissions to upload files';
      }
      
      // Handle storage quota issues
      if (error?.message?.includes('exceeded storage quota')) {
        message = 'Storage quota exceeded. Please free up some space before uploading.';
      }
      
      // Handle missing buckets
      if (error?.message?.includes('The bucket you\'re trying to upload to doesn\'t exist') || 
          error?.message?.includes('Bucket not found')) {
        message = `Storage bucket "${bucket}" doesn't exist. Please check your bucket configuration.`;
      }
      
      // Handle authorization issues
      if (error?.message?.includes('invalid signature') || 
          error?.message?.includes('JWT') || 
          error?.message?.includes('auth') ||
          error?.statusCode === '401' ||
          error?.status === 401 ||
          error?.status === 400) {
        message = 'Authorization failed. Please log in again or try refreshing the page.';

        // Switch to fallback mode when authentication fails
        useLocalFallback = true;
      }
      
      return { message, originalError: error };
    };
    
    
    // Use a simpler approach first - just try to upload
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl,
          upsert,
          onUploadProgress: onProgress
            ? (progress) => {
                if (progress.total) {
                  onProgress({ 
                    loaded: progress.loaded, 
                    total: progress.total 
                  });
                }
              }
            : undefined,
        });

      if (error) {
        throw error;
      }
      
      
      // Generate version ID for the file
      const versionId = crypto.randomUUID();
      
      // Add to version history if versioning is enabled
      if (createVersion) {
        addFileVersion(path, versionId);
      }
      
      return {
        ...data,
        publicUrl: getPublicUrl(bucket, data.path),
        versionId
      };
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Upload failed:', formattedError.message);
      
      // If we're under the retry limit, try again
      if (retryCount < MAX_RETRIES) {
        
        // Wait longer between each retry attempt (exponential backoff)
        const delayTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayTime));
        
        return uploadFile(bucket, path, file, {
          ...options,
          retryCount: retryCount + 1
        });
      }
      
      // Force fallback mode if we're out of retries
      useLocalFallback = true;
      
      // Try fallback approach
      return uploadFile(bucket, path, file, {
        ...options,
        retryCount: 0 // Reset retry counter for fallback
      });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // If this is our first error, try switching to fallback mode
    if (!useLocalFallback) {
      useLocalFallback = true;
      return uploadFile(bucket, path, file, {
        ...options,
        retryCount: 0 // Reset retry counter for fallback
      });
    }
    
    // If fallback is already enabled and still failing, rethrow
    throw error;
  }
};

/**
 * Download a file from storage
 */
export const downloadFile = async (bucket: string, path: string): Promise<Blob> => {
  if (useLocalFallback) {
    const file = await fallbackStorage.getFile(bucket, path);
    if (!file) {
      throw new Error('File not found in local storage');
    }
    return file;
  }
  
  // Try to download with Supabase
  const { data, error } = await supabase.storage.from(bucket).download(path);
  
  if (error) {
    // Try fallback on failure
    useLocalFallback = true;
    return downloadFile(bucket, path);
  }
  
  return data;
};

/**
 * Get a thumbnail URL for a file, generating it if needed
 */
export const getThumbnailUrl = async (
  bucket: string, 
  path: string, 
  options?: { 
    width?: number; 
    height?: number; 
    format?: 'jpg' | 'png' | 'webp';
  }
) => {
  // Default options
  const { width = 200, height = 200, format = 'jpg' } = options || {};
  
  if (useLocalFallback) {
    // For fallback mode, just return the regular file URL for images
    // In a real app, you could implement local thumbnail generation
    return fallbackStorage.getFileUrl(bucket, path)
      .then(url => url || '');
  }
  
  // Try to get/create thumbnail with Supabase
  try {
    const { data, error } = await supabase.storage.from(bucket)
      .createSignedUrl(path, 60, {
        transform: {
          width,
          height,
          format,
          quality: 80, // Good default for thumbnails
          resize: 'cover'
        }
      });
    
    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    
    // Try fallback on failure
    useLocalFallback = true;
    return fallbackStorage.getFileUrl(bucket, path)
      .then(url => url || '');
  }
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
  if (useLocalFallback) {
    return fallbackStorage.deleteFile(bucket, path);
  }
  
  // Try to delete with Supabase
  const { error } = await supabase.storage.from(bucket).remove([path]);
  
  if (error) {
    useLocalFallback = true;
    return deleteFile(bucket, path);
  }
  
  // Remove versions for this file
  delete fileVersions[path];
  
  return true;
};

/**
 * Sync local files to Supabase when connection is restored
 */
export const syncLocalFilesToCloud = async (): Promise<boolean> => {
  if (!useLocalFallback) return true; // Already using cloud storage
  
  // Check if we can connect to Supabase
  const canConnectToSupabase = await resetFallbackMode();
  if (!canConnectToSupabase) return false;
  
  // Get all files from fallback storage
  const localFiles = await fallbackStorage.getAllFiles();
  if (!localFiles.length) return true; // No files to sync
  
  
  // Upload each file to Supabase
  let successCount = 0;
  for (const file of localFiles) {
    try {
      const { bucket, path } = parsePath(file.path);
      
      // Upload file to Supabase
      const { error } = await supabase.storage.from(bucket)
        .upload(path, file.file, { upsert: true });
      
      if (error) throw error;
      
      successCount++;
      
      // Mark file as synced in fallback storage
      await fallbackStorage.markFileSynced(file.id);
    } catch (error) {
      console.error(`Failed to sync file ${file.path}:`, error);
    }
  }
  
  
  // Only switch to cloud mode if all files were synced successfully
  return successCount === localFiles.length;
};

/**
 * Parse a storage path into bucket and path components
 */
const parsePath = (fullPath: string): { bucket: string; path: string } => {
  const parts = fullPath.split('/');
  const bucket = parts[0];
  const path = parts.slice(1).join('/');
  
  return { bucket, path };
};

/**
 * Get a public URL for a file in the storage bucket.
 * Tries multiple resolution strategies in order of reliability.
 */
export async function getFileUrl(filePath: string, options?: { cacheBuster?: boolean }): Promise<{ url: string; error?: any }> {
  if (!filePath) return { url: '', error: 'No file path provided' };

  const timestamp = options?.cacheBuster !== false ? `?t=${Date.now()}` : '';

  try {
    // 1. Supabase client getPublicUrl (fastest, no network call)
    try {
      const { data } = supabase.storage.from('files').getPublicUrl(filePath);
      if (data?.publicUrl) {
        const url = data.publicUrl + (data.publicUrl.includes('?') ? '&' : '?') + `_cb=${Date.now()}`;
        // Quick HEAD check (no-cors won't throw for blocked, but catches network errors)
        await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        return { url };
      }
    } catch { /* fall through */ }

    // 2. Direct URL construction
    if (supabaseUrl) {
      const directUrl = `${supabaseUrl}/storage/v1/object/public/files/${filePath}${timestamp}`;
      try {
        await fetch(directUrl, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' });
        return { url: directUrl };
      } catch { /* fall through */ }
    }

    // 3. Signed URL (requires auth, more reliable for private buckets)
    try {
      const { data } = await supabase.storage.from('files').createSignedUrl(filePath, 3600);
      if (data?.signedUrl) return { url: data.signedUrl };
    } catch { /* fall through */ }

    // 4. Direct download → blob URL (most reliable, but uses bandwidth)
    try {
      const { data } = await supabase.storage.from('files').download(filePath);
      if (data) return { url: URL.createObjectURL(data) };
    } catch { /* fall through */ }

    // 5. Last resort: return constructed URL without testing
    const lastResortUrl = `${supabaseUrl}/storage/v1/object/public/files/${filePath}${timestamp}`;
    return { url: lastResortUrl, error: 'All URL resolution methods failed' };

  } catch (finalError) {
    console.error('[storageService] Critical error in getFileUrl:', finalError);
    return { url: '', error: finalError };
  }
}

// Export the supabase client for direct use
export { supabase };

// Export a default object with all the functions
export default {
  getFileUrl,
  supabase,
  STORAGE_BUCKETS,
  getPublicUrl,
  getSignedUrl,
  uploadFile,
  downloadFile,
  getThumbnailUrl,
  deleteFile,
  resetFallbackMode,
  isUsingFallback,
  syncLocalFilesToCloud,
  getFileVersions
}; 
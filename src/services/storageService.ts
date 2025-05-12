import { supabase } from '../lib/supabaseClient';
import { fallbackStorage } from './fallbackStorageService';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://swtkpfpyjjkkemmvkhmz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMDM5NTIsImV4cCI6MjA2MDg3OTk1Mn0.8herIfBAFOFUXro03pQxiS4Htnljavfncz-FvPj3sGw';

// Initialize the Supabase client
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

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
      console.warn('Supabase storage connection test failed, enabling fallback mode:', error);
      useLocalFallback = true;
    } else {
      console.log('Supabase storage connection test succeeded');
      useLocalFallback = false;
    }
  } catch (error) {
    console.warn('Supabase connection error, enabling fallback mode:', error);
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
      console.warn('Supabase storage still unavailable:', error);
      return false;
    }
    
    console.log('Supabase storage connection restored');
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
    // Return fallback URL if operating in offline mode
    const urlPromise = fallbackStorage.getFileUrl(bucket, path).then((url) => url || '');
    // Because this utility is expected to be synchronous in most call-sites, return empty string synchronously 
    console.warn('[storageService] Using fallback URL – some components may need to await this promise');
    return new String(urlPromise) as unknown as string;
  }

  if (!path || !bucket) return '';
  
  // Clean up the path by removing any leading slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Extract the Supabase reference from the URL
  const ref = supabase.supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
  
  if (!ref) {
    console.error('[storageService] Unable to extract Supabase ref from URL:', supabase.supabaseUrl);
    return '';
  }
  
  // Return deterministic public URL
  return `https://${ref}.supabase.co/storage/v1/object/public/${bucket}/${cleanPath}`;
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
    console.error('Error creating signed URL:', error);
    
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
) => {
  try {
    // Set default options
    const { 
      onProgress, 
      upsert = true, 
      cacheControl = '3600',
      retryCount = 0,
      createVersion = true
    } = options || {};
    
    // Check if we're in fallback mode
    if (useLocalFallback) {
      console.log('Using local fallback for uploadFile');
      
      // Extract project ID and user ID from the path
      // Assuming path format like: projects/{projectId}/{fileId}_{filename}
      const parts = path.split('/');
      const projectId = parts.length > 1 ? parts[1] : 'unknown-project';
      
      // Get user ID from Supabase auth or use a default
      const userId = supabase.auth.getUser().then(({ data }) => data?.user?.id || 'anonymous');
      
      // Simulate upload progress
      if (onProgress) {
        // Send 10% progress
        onProgress({ loaded: file.size * 0.1, total: file.size });
        
        // After a delay, send 50% progress
        setTimeout(() => {
          onProgress({ loaded: file.size * 0.5, total: file.size });
        }, 300);
        
        // After another delay, send 90% progress
        setTimeout(() => {
          onProgress({ loaded: file.size * 0.9, total: file.size });
        }, 600);
      }
      
      // Upload to local storage
      const result = await fallbackStorage.uploadFile(
        bucket, 
        path, 
        file, 
        projectId, 
        await userId
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
      
      // Log the complete error for debugging
      console.error('STORAGE ERROR DETAILS:', JSON.stringify(error, null, 2));
      
      // Extract more detailed error message for RLS policy issues
      if (error?.message?.includes('new row violates row-level security policy')) {
        message = 'Permission denied: Your account does not have permissions to upload files';
        console.error('RLS policy violation during file upload. Details:', error);
      }
      
      // Handle storage quota issues
      if (error?.message?.includes('exceeded storage quota')) {
        message = 'Storage quota exceeded. Please free up some space before uploading.';
      }
      
      // Handle missing buckets
      if (error?.message?.includes('The bucket you\'re trying to upload to doesn\'t exist') || 
          error?.message?.includes('Bucket not found')) {
        message = `Storage bucket "${bucket}" doesn't exist. Please check your bucket configuration.`;
        console.error(`Bucket "${bucket}" not found. Available buckets should be: ${Object.values(STORAGE_BUCKETS).join(', ')}`);
      }
      
      // Handle authorization issues
      if (error?.message?.includes('invalid signature') || 
          error?.message?.includes('JWT') || 
          error?.message?.includes('auth') ||
          error?.statusCode === '401' ||
          error?.status === 401 ||
          error?.status === 400) {
        message = 'Authorization failed. Please log in again or try refreshing the page.';
        console.error('JWT/Auth error during upload:', error);
        
        // Switch to fallback mode when authentication fails
        useLocalFallback = true;
      }
      
      return { message, originalError: error };
    };
    
    console.log(`Uploading file to ${bucket}/${path}`, { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type,
      upsert,
      retryCount,
    });
    
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
      
      console.log('File uploaded successfully', { path: data.path });
      
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
        console.log(`Retrying upload (${retryCount + 1}/${MAX_RETRIES})...`);
        
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
    console.error('Error downloading file:', error);
    
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
    console.error('Error deleting file:', error);
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
  
  console.log(`Syncing ${localFiles.length} files to Supabase...`);
  
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
  
  console.log(`Synced ${successCount}/${localFiles.length} files to Supabase`);
  
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
 * Get a public URL for a file in the storage bucket
 */
export function getFileUrl(filePath: string): string | null {
  if (!filePath) return null;

  return getPublicUrl('files', filePath);
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
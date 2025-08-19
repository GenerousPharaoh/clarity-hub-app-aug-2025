import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Use dummy values for demo mode - we won't actually connect to Supabase
const url = 'https://example.supabase.co'; 
const key = 'dummy-key-for-demo-mode';

console.log('Using mock Supabase client for demo mode');

// Create a stable globally-accessible singleton
// This prevents the "Multiple GoTrueClient instances detected" warning
const createSingletonClient = () => {
  // @ts-ignore - Check for existing instance
  if (globalThis.__supabaseClient) {
    // @ts-ignore - Return existing instance
    return globalThis.__supabaseClient;
  }

  // Create a new client instance
  const client = createClient<Database>(url, key, {
    auth: { 
      persistSession: true, 
      autoRefreshToken: true,
      storageKey: 'clarity-hub-auth'
    },
  });

  // Store the instance
  // @ts-ignore - Store globally
  globalThis.__supabaseClient = client;
  
  return client;
};

// Export the singleton instance
export const supabase = createSingletonClient();

// Service client with service role key for admin operations (if available)
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
export const serviceClient = serviceKey ? createClient<Database>(url, serviceKey, {
  auth: { persistSession: false }
}) : null;

// Required bucket information
export const STORAGE_BUCKETS = {
  FILES: 'files',
  AVATARS: 'avatars',
  THUMBNAILS: 'thumbnails'
};

// Auto-initialize storage buckets if service client is available
export const initStorageBuckets = async () => {
  if (!serviceClient) {
    console.warn('Service client not available. Cannot auto-create storage buckets.');
    return false;
  }
  
  try {
    // Get existing buckets
    const { data: buckets, error: listError } = await serviceClient.storage.listBuckets();
    
    if (listError) {
      console.error('Failed to list buckets:', listError);
      return false;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name).join(', '));
    
    // Check for required buckets
    for (const bucketName of Object.values(STORAGE_BUCKETS)) {
      if (!buckets.some(b => b.name === bucketName)) {
        console.log(`Creating missing bucket: ${bucketName}`);
        
        // Create the bucket
        const { error: createError } = await serviceClient.storage.createBucket(bucketName, {
          public: bucketName === STORAGE_BUCKETS.FILES || bucketName === STORAGE_BUCKETS.AVATARS
        });
        
        if (createError) {
          console.error(`Failed to create bucket ${bucketName}:`, createError);
        } else {
          console.log(`Successfully created bucket: ${bucketName}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
    return false;
  }
};

// Helper to check if user is admin
export const isAdminUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email === 'kareem.hassanein@gmail.com';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Helper function to refresh data manually
export const manualRefresh = {
  files: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('added_at', { ascending: false });
        
      if (error) throw error;
      
      // Always ensure we return an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error manually refreshing files:', error);
      return [];
    }
  }
};

export type Supabase = typeof supabase;

export default supabase;
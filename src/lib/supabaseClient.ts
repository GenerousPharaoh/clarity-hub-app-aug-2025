import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) throw new Error('Missing Supabase env vars');

// Add global type declaration to allow for singleton
declare global {
  // Prevent re-creation during Vite HMR
  // eslint-disable-next-line no-var
  var __supabase__: ReturnType<typeof createClient<Database>> | undefined;
}

// Standard client with anon key - use singleton pattern
const supabase = 
  globalThis.__supabase__ ?? 
  createClient<Database>(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
    global: {
      fetch: fetch.bind(globalThis),
    },
  });

// In development, save the client to avoid recreation during HMR
if (process.env.NODE_ENV !== 'production') {
  globalThis.__supabase__ = supabase;
}

// Export the singleton instance
export { supabase };

// For environments with service role access
export const createAdminClient = () => {
  if (!serviceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY - admin operations will fail');
    return supabase;
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

// Required bucket information
export const STORAGE_BUCKETS = {
  FILES: 'files',
  AVATARS: 'avatars',
  THUMBNAILS: 'thumbnails'
};

// Auto-initialize storage buckets if service client is available
export const initStorageBuckets = async () => {
  // Skip in browser environment
  if (typeof window !== 'undefined' && !import.meta.env.SSR) {
    console.log('Running in browser, skipping admin operations');
    return false;
  }
  
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

// Try to initialize buckets if we have a service client
if (serviceClient && (typeof window === 'undefined' || import.meta.env.SSR)) {
  console.log('Service client available, attempting to initialize storage buckets...');
  initStorageBuckets()
    .then(success => {
      if (success) {
        console.log('Storage buckets initialized successfully');
      } else {
        console.warn('Failed to initialize some storage buckets');
      }
    })
    .catch(error => {
      console.error('Error during storage bucket initialization:', error);
    });
} else {
  console.log('No service client available or running in browser, skipping storage bucket initialization');
}

export type Supabase = typeof supabase; 
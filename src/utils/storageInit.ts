import { supabase } from '../services/supabaseClient';
import { openDB } from 'idb';

// Define required buckets
const REQUIRED_BUCKETS = ['files', 'avatars', 'thumbnails'];

// Initialize global reference to the database
let dbPromise: Promise<any> | null = null;

/**
 * Initialize the IndexedDB for unsynced files
 * This creates the required database structure if it doesn't exist
 */
export const initIndexedDB = async () => {
  try {
    if (dbPromise) {
      return dbPromise;
    }
    
    const dbName = 'clarity-file-sync';
    const version = 1;
    
    // Create a persistent reference to the db promise
    dbPromise = openDB(dbName, version, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`);
        
        // Create the unsynced-files store if it doesn't exist
        if (!db.objectStoreNames.contains('unsynced-files')) {
          console.log('Creating unsynced-files store');
          const store = db.createObjectStore('unsynced-files', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          
          // Create required indexes
          console.log('Creating indexes for unsynced-files store');
          store.createIndex('by-status', 'status');
          store.createIndex('by-projectId', 'projectId');
          store.createIndex('by-timestamp', 'timestamp');
        }
        
        // Create the fallback-storage store if it doesn't exist
        if (!db.objectStoreNames.contains('fallback-storage')) {
          console.log('Creating fallback-storage store');
          const storageStore = db.createObjectStore('fallback-storage', { 
            keyPath: 'id' 
          });
          
          // Create indexes for fallback storage
          console.log('Creating indexes for fallback-storage store');
          storageStore.createIndex('by-path', 'path', { unique: true });
          storageStore.createIndex('by-projectId', 'projectId');
          storageStore.createIndex('by-type', 'fileType');
          storageStore.createIndex('by-uploadStatus', 'uploadStatus');
        }
      },
      blocked() {
        console.warn('IndexedDB upgrade blocked - another tab has the database open');
      },
      blocking() {
        console.warn('IndexedDB is blocking a newer version from being opened');
      },
      terminated() {
        console.error('IndexedDB connection was terminated abnormally');
        dbPromise = null; // Reset promise so we can try again
      }
    });
    
    // Verify the database was opened successfully
    const db = await dbPromise;
    console.log('IndexedDB initialized successfully for file sync');
    
    // Verify the indexes exist
    const storeNames = Array.from(db.objectStoreNames);
    console.log('Available stores:', storeNames.join(', '));
    
    // Test transaction to verify indexes
    if (storeNames.includes('unsynced-files')) {
      try {
        const tx = db.transaction('unsynced-files', 'readonly');
        const store = tx.objectStore('unsynced-files');
        
        // Get index list
        const indexes = Array.from(store.indexNames);
        console.log('Available indexes for unsynced-files:', indexes.join(', '));
        await tx.done;
      } catch (error) {
        console.error('Error checking indexes:', error);
      }
    }
    
    return db;
  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
    dbPromise = null;
    return null;
  }
};

/**
 * Initialize storage buckets if they don't exist
 * This runs automatically on app startup
 */
export const initStorageBuckets = async () => {
  // Skip bucket creation in browser environment - this should be done server-side
  if (typeof window !== 'undefined') {
    console.log('Running in browser environment, skipping storage bucket initialization');
    return;
  }
  
  try {
    console.log('Checking storage buckets...');
    
    // Initialize IndexedDB for fallback storage
    await initIndexedDB();
    
    // Ensure we have a valid Supabase session before proceeding
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Authentication error, skipping bucket checks:', sessionError);
      return;
    }
    
    if (!session?.session?.access_token) {
      console.log('No active session, skipping bucket checks');
      return;
    }
    
    // List existing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      // If we get permission denied, just log and continue
      if (error.message?.includes('permission denied') || error.message?.includes('violates row-level security')) {
        console.log('Limited permissions detected - skipping bucket creation. This is expected in non-admin mode.');
        return;
      }
      
      console.error('Error listing buckets:', error);
      return;
    }
    
    const existingBuckets = buckets ? buckets.map(b => b.name) : [];
    console.log('Existing buckets:', existingBuckets.length ? existingBuckets.join(', ') : '(none)');
    
    // Since bucket creation requires admin privileges, just check if they exist
    // and let the admin know if any are missing
    const missingBuckets = REQUIRED_BUCKETS.filter(bucket => !existingBuckets.includes(bucket));
    
    if (missingBuckets.length === 0) {
      console.log('All required buckets exist.');
    } else {
      console.log('Missing buckets that should be created in the Supabase dashboard:', missingBuckets.join(', '));
    }
  } catch (err) {
    console.error('Storage bucket initialization error:', err);
  }
};

// Export the getDB function to reuse the connection
export const getIndexedDB = () => {
  if (!dbPromise) {
    // Initialize on first access
    initIndexedDB();
  }
  return dbPromise;
};

// Initialize storage with delay to ensure Supabase auth is ready
console.log('Storage initialization requested...');
let initStarted = false;

const initIfNeeded = () => {
  if (initStarted) return;
  initStarted = true;
  
  console.log('Starting delayed storage initialization...');
  
  // Skip bucket initialization in browser context
  if (typeof window !== 'undefined') {
    console.log('Browser environment detected, initializing IndexedDB only');
    // Initialize IndexedDB for local fallback, but skip bucket creation
    initIndexedDB()
      .then(() => console.log('IndexedDB initialization complete'))
      .catch(err => console.error('IndexedDB initialization failed:', err));
    return;
  }
  
  // Server-side code can proceed with full initialization
  setTimeout(() => {
    initStorageBuckets()
      .then(() => console.log('Storage initialization complete'))
      .catch(err => console.error('Storage initialization failed:', err));
  }, 2000); // Increased delay to allow auth to fully initialize
};

// Always initialize IndexedDB in browser environment 
if (typeof window !== 'undefined') {
  console.log('Initializing local storage in browser environment...');
  
  // Only enable fallback storage in demo mode
  if (window.DEMO_MODE) {
    try {
      localStorage.setItem('USE_FALLBACK_STORAGE', 'true');
      console.log('Fallback storage enabled for demo mode');
      
      // Initialize immediately
      initIndexedDB()
        .then(() => console.log('IndexedDB initialized for fallback storage'))
        .catch(err => console.error('IndexedDB initialization failed:', err));
    } catch (err) {
      console.error('Failed to enable fallback storage:', err);
    }
  } else {
    // Initialize IndexedDB for file sync in production
    initIndexedDB()
      .then(() => console.log('IndexedDB initialized for file sync'))
      .catch(err => console.error('IndexedDB initialization failed:', err));
  }
}

// Only run bucket initialization on the server (SSR) to avoid client-side noise
if (import.meta.env.SSR) {
  initIfNeeded();
}

export default {
  initStorageBuckets,
  initIndexedDB,
  getIndexedDB,
  REQUIRED_BUCKETS
}; 
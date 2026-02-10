import { supabase } from '../lib/supabase';
import { openDB } from 'idb';

const REQUIRED_BUCKETS = ['files', 'avatars', 'thumbnails'];

let dbPromise: Promise<any> | null = null;

/**
 * Initialize IndexedDB for unsynced file storage
 */
export const initIndexedDB = async () => {
  try {
    if (dbPromise) return dbPromise;

    dbPromise = openDB('clarity-file-sync', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('unsynced-files')) {
          const store = db.createObjectStore('unsynced-files', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('by-status', 'status');
          store.createIndex('by-projectId', 'projectId');
          store.createIndex('by-timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('fallback-storage')) {
          const storageStore = db.createObjectStore('fallback-storage', {
            keyPath: 'id'
          });
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
        dbPromise = null;
      }
    });

    await dbPromise;
    return dbPromise;
  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
    dbPromise = null;
    return null;
  }
};

/**
 * Initialize storage buckets (server-side only)
 */
export const initStorageBuckets = async () => {
  if (typeof window !== 'undefined') return;

  try {
    await initIndexedDB();

    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.session?.access_token) return;

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      if (error.message?.includes('permission denied') || error.message?.includes('violates row-level security')) {
        return;
      }
      console.error('Error listing buckets:', error);
      return;
    }

    const existingBuckets = buckets ? buckets.map(b => b.name) : [];
    const missingBuckets = REQUIRED_BUCKETS.filter(bucket => !existingBuckets.includes(bucket));

    if (missingBuckets.length > 0) {
      console.warn('Missing storage buckets (create in Supabase dashboard):', missingBuckets.join(', '));
    }
  } catch (err) {
    console.error('Storage bucket initialization error:', err);
  }
};

export const getIndexedDB = () => {
  if (!dbPromise) {
    initIndexedDB();
  }
  return dbPromise;
};

// Initialize IndexedDB in browser environment
if (typeof window !== 'undefined') {
  initIndexedDB().catch(err => console.error('IndexedDB init failed:', err));
}

// Only run bucket initialization on SSR
if (import.meta.env.SSR) {
  setTimeout(() => {
    initStorageBuckets().catch(err => console.error('Storage init failed:', err));
  }, 2000);
}

export default {
  initStorageBuckets,
  initIndexedDB,
  getIndexedDB,
  REQUIRED_BUCKETS
};

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Singleton to prevent "Multiple GoTrueClient instances" warning
const createSingletonClient = () => {
  // @ts-ignore
  if (globalThis.__supabaseClient) {
    // @ts-ignore
    return globalThis.__supabaseClient;
  }

  const client = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'clarity-hub-auth',
      flowType: 'pkce',
    },
  });

  // @ts-ignore
  globalThis.__supabaseClient = client;
  return client;
};

export const supabase = createSingletonClient();

export const STORAGE_BUCKETS = {
  FILES: 'files',
} as const;

// Helper to refresh file list for a project
export const manualRefresh = {
  files: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error manually refreshing files:', error);
      return [];
    }
  },
};

export type Supabase = typeof supabase;

export default supabase;

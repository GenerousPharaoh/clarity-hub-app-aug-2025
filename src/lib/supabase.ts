import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Singleton to prevent "Multiple GoTrueClient instances" warning
const createSingletonClient = () => {
  const g = globalThis as unknown as { __supabaseClient?: ReturnType<typeof createClient<Database>> };
  if (g.__supabaseClient) return g.__supabaseClient;

  const client = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'clarity-hub-auth',
      flowType: 'pkce',
    },
  });

  g.__supabaseClient = client;
  return client;
};

export const supabase = createSingletonClient();

export const STORAGE_BUCKET = 'files';

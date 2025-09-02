import { supabase } from './lib/supabase';

// Wrapper to safely access storage URL is now deprecated
// The SDK methods should be used directly instead

export function getSupabaseKey(): string {
  // Safe way to access the Supabase key without direct property access
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

export default supabase; 
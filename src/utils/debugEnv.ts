/**
 * Debug utility to verify that environment variables are loading correctly
 */

export function checkEnvironmentVariables() {
  // Collect environment variables (masking sensitive values)
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'not set',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present (masked)' : 'not set',
    NODE_ENV: import.meta.env.MODE || 'not set',
    VITE_DEV_PORT: import.meta.env.VITE_DEV_PORT || 'not set',
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'not set',
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || 'not set',
    VITE_TINYMCE_API_KEY: import.meta.env.VITE_TINYMCE_API_KEY ? 'present (masked)' : 'not set',
    VITE_ALLOW_LOCAL_STORAGE_FALLBACK: import.meta.env.VITE_ALLOW_LOCAL_STORAGE_FALLBACK || 'not set',
  };

  // Log environment variables
  console.log('Environment variables check:');
  console.table(envVars);

  // Verify critical variables are present
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('⚠️ Critical environment variables missing: Supabase credentials');
    return false;
  }

  return true;
} 
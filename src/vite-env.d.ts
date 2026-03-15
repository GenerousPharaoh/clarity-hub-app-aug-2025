/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // AI API keys (GEMINI_API_KEY, OPENAI_API_KEY) are server-side only.
  // They are accessed via process.env in Vercel serverless functions (api/).
  // They do NOT have a VITE_ prefix and are NOT available in the client bundle.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

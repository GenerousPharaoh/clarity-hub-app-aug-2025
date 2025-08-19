import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  'https://clarity-hub-production.com'
];

export function corsHeaders(req: Request): Headers {
  const origin = req.headers.get('origin') || '';
  const headers = new Headers();
  
  // Set CORS headers only for allowed origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type');
    headers.set('Access-Control-Max-Age', '3600');
  }
  
  return headers;
}

// Middleware function to handle CORS
export async function handleCors(req: Request, handler: (req: Request) => Promise<Response>): Promise<Response> {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders(req) 
    });
  }
  
  // For actual requests, call the handler
  const response = await handler(req);
  
  // Add CORS headers to the response
  const corsResponseHeaders = corsHeaders(req);
  corsResponseHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Helper to wrap handlers with CORS functionality
export function withCors(handler: (req: Request) => Promise<Response>) {
  return (req: Request) => handleCors(req, handler);
} 
// Handle CORS for all responses, including preflight OPTIONS requests
export function handleCors(req: Request, res?: Response): Response | null {
  // Get the request origin
  const origin = req.headers.get('origin');
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];
  
  // If the origin is allowed, use it; otherwise default to the first allowed origin
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0];
  
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Return the updated response with CORS headers
  if (res) {
    const headers = new Headers(res.headers);
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Authorization, X-Client-Info, apikey, Content-Type');
    headers.set('Access-Control-Allow-Credentials', 'true');

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  // No preflight needed, continue with the request
  return null;
}

// Handle common errors with appropriate responses
export function handleError(error: any, context: string = '') {
  console.error(`Error in ${context}:`, error);
  
  // Database connection errors - likely due to missing tables
  if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
    return {
      status: 503,
      body: {
        error: 'Database schema not fully initialized',
        message: 'The required database tables have not been set up yet.',
        details: error.message,
        setupRequired: true
      }
    };
  }
  
  // Auth errors
  if (error.message?.includes('auth') || error.message?.includes('JWTError')) {
    return {
      status: 401,
      body: {
        error: 'Authentication error',
        message: 'Please make sure you are properly authenticated.',
        details: error.message
      }
    };
  }
  
  // Default error format
  return {
    status: 500,
    body: {
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error.message,
      context
    }
  };
} 
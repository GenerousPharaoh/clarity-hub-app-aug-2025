import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getNextExhibitId } from "../utils/database.ts";
import { handleCors, handleError } from "../_shared/cors.ts";

interface RequestParams {
  projectId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the request body
    const { projectId } = await req.json() as RequestParams;

    // Validate required parameters
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: projectId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the next exhibit ID
    const exhibitId = await getNextExhibitId(projectId);

    // Return the result
    const response = new Response(
      JSON.stringify({ 
        exhibitId,
        success: true,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    // Add CORS headers to the response
    return handleCors(req, response) || response;
  } catch (error) {
    // Handle errors using our improved error handler
    const errorResponse = handleError(error, 'get-next-exhibit-id');
    
    const response = new Response(
      JSON.stringify(errorResponse.body),
      {
        status: errorResponse.status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    return handleCors(req, response) || response;
  }
}); 
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateText } from "../utils/googleai.ts";
import { getFile, getNextExhibitId } from "../utils/database.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

interface RequestParams {
  fileId: string;
  storagePath: string;
  contentType: string;
  fileName: string;
  fileType: string;
}

// Define CORS headers for direct use
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: CORS });
  }
  
  // Ensure origin is set properly for all responses
  const headers = new Headers({
    ...CORS,
    'Content-Type': 'application/json',
  });
  
  // Check that the request is a POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  // Call main logic and then attach CORS headers
  const response = await (async () => {
    try {
      // Parse request body
      const { fileId, storagePath, contentType, fileName, fileType } = await req.json() as RequestParams;
      
      if (!fileId || !storagePath) {
        return new Response(JSON.stringify({ 
          error: 'File ID and storage path are required' 
        }), { status: 400, headers });
      }

      // Create a Supabase client with the service role key
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );

      // Download the file
      const { data: fileData, error: downloadError } = await supabaseAdmin
        .storage
        .from('files')
        .download(storagePath);

      if (downloadError) {
        throw new Error(`Error downloading file: ${downloadError.message}`);
      }

      // Extract text based on file type
      let extractedText = '';
      let fileContent = '';
      
      try {
        if (contentType.includes('pdf')) {
          // For PDFs, we'll extract text from the first few pages
          // This is simplified for demo purposes
          const textDecoder = new TextDecoder();
          const bytes = new Uint8Array(await fileData.arrayBuffer());
          extractedText = textDecoder.decode(bytes.slice(0, 30000)); // First 30KB
          fileContent = 'PDF Document';
        } else if (contentType.includes('image')) {
          // For images, we just use the file name and type
          extractedText = fileName;
          fileContent = 'Image';
        } else if (contentType.includes('audio')) {
          // For audio, we just use the file name and type
          extractedText = fileName;
          fileContent = 'Audio Recording';
        } else if (contentType.includes('video')) {
          // For video, we just use the file name and type
          extractedText = fileName;
          fileContent = 'Video Recording';
        } else if (contentType.includes('text') || 
                 contentType.includes('document') || 
                 contentType.includes('application/rtf') ||
                 contentType.includes('application/msword')) {
          // For text-based documents
          const textDecoder = new TextDecoder();
          const bytes = new Uint8Array(await fileData.arrayBuffer());
          extractedText = textDecoder.decode(bytes.slice(0, 20000)); // First 20KB
          fileContent = 'Text Document';
        } else {
          // For other types, just use the file name
          extractedText = fileName;
          fileContent = 'Unknown Document Type';
        }
      } catch (error) {
        console.error('Error extracting text:', error);
        extractedText = fileName;
      }

      // Build prompt for Gemini
      const prompt = `
      I need you to analyze the following file and suggest an appropriate title and tags for organization.
      
      File Name: ${fileName}
      File Type: ${fileType}
      Content Type: ${contentType}
      
      Content Preview:
      """
      ${extractedText.substring(0, 2000)}
      """
      
      Please suggest:
      1. A concise, descriptive title for this file (under 60 characters)
      2. 3-5 relevant tags for categorizing this file
      3. A short description of what this file contains (2-3 sentences maximum)
      
      For documents that appear to be legal in nature, include relevant legal concepts as tags.
      For emails, include sender/recipient and date in the suggested title if available.
      For images, describe what appears in the image if possible.
      
      Format your response as a JSON object with the following structure:
      {
        "suggestedTitle": "Descriptive title for the file",
        "suggestedTags": ["tag1", "tag2", "tag3"],
        "description": "Brief description of file contents"
      }
      `;

      // Generate suggestions using Gemini
      const suggestionsText = await generateText(prompt);
      
      // Parse the response
      let suggestions;
      try {
        suggestions = JSON.parse(suggestionsText);
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", e);
        // Create a basic fallback suggestion
        suggestions = {
          suggestedTitle: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
          suggestedTags: [fileType],
          description: `${fileContent} uploaded on ${new Date().toLocaleDateString()}`
        };
      }

      // Return the suggestions result
      return new Response(
        JSON.stringify({
          success: true,
          suggestions
        }),
        {
          status: 200,
          headers
        }
      );
    } catch (error) {
      console.error("Error in suggest-filename function:", error);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to analyze file and suggest filename",
          details: error.message 
        }),
        {
          status: 500,
          headers
        }
      );
    }
  })();
  
  // Add CORS headers to response
  const origin = req.headers.get('origin');
  return new Response(response.body, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin ?? "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "authorization,apikey,content-type"
    }
  });
}); 
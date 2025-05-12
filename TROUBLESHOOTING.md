# Clarity Hub Troubleshooting Guide

## Common Issues and Fixes

### Supabase Storage Permission Errors

If you encounter console errors like:
```
new row violates row-level security policy for table "storage.objects"
```

This indicates there are issues with the Row Level Security (RLS) policies in Supabase. 

**Fix:**
1. Run the storage permissions fix script:
   ```bash
   # If Supabase CLI is installed
   ./fix-supabase-with-cli.sh
   
   # Or using the Node.js script
   node apply-fix.js
   ```

### Projects Not Displayed in UI

If you're unable to see projects in the left panel, even though they exist in the database:

**Fix:**
1. Run the project display fix script:
   ```bash
   node fix-project-display.js
   ```

2. Refresh the application in your browser

### File Upload Not Working

If file uploads are failing with permission errors or not showing up in the application:

**Fix:**
1. First ensure the storage permission fix has been applied (see above)
2. Run the file upload test script:
   ```bash
   node test-uploads.js
   ```

3. Refresh the application in your browser

## Development Server Issues

### Port Already in Use

If you see this error when starting the development server:
```
error when starting dev server:
Error: Port 5173 is already in use
```

**Fix:**
1. Find and kill the process using the port:
   ```bash
   # Find the process
   lsof -i :5173
   
   # Kill the process
   kill -9 <PID>
   ```

2. Or use the port checking utility:
   ```bash
   npm run check-ports
   ```

### TinyMCE Resources Missing

If the rich text editor is not loading properly:

**Fix:**
1. Run the TinyMCE copy script:
   ```bash
   npm run copy-tinymce
   ```

## Database Schema Issues

If you encounter database schema errors:

**Fix:**
1. Apply the latest migrations:
   ```bash
   npm run apply-migration
   ```

## Authentication Issues

If you're having trouble with login or authentication:

1. Try using the "Skip Login (Demo Mode)" button
2. Check browser console for any specific errors
3. Verify your Supabase environment variables in `.env` file

## Complete Reset

If you need to completely reset the application:

1. Stop the development server
2. Apply all fixes in sequence:
   ```bash
   # Fix Supabase storage permissions
   ./fix-supabase-with-cli.sh
   
   # Fix project display
   node fix-project-display.js
   
   # Test file uploads
   node test-uploads.js
   ```

3. Restart the development server:
   ```bash
   npm run dev
   ```

4. Refresh the application in your browser

## Getting Additional Help

If you continue to experience issues after trying these solutions:

1. Check the browser console for specific error messages
2. Examine the Supabase logs in the dashboard
3. Open an issue in the project repository with detailed information about the problem

## WebSocket and CORS Issues

### WebSocket Connection Issues

If you're seeing WebSocket connection errors in the browser console like "WebSocket connection to 'ws://localhost:xxxx/' failed", try these steps:

1. Check the port configuration in your `vite.config.ts` file and make sure the server port and HMR port match:

```ts
server: {
  port: 5173,  // Set to your preferred port
  hmr: {
    protocol: "ws",
    host: "localhost",
    port: 5173,  // Must match the server port
  },
}
```

2. Verify your environment variables are consistent. In `.env.development`, check for any `VITE_DEV_PORT` settings.

3. Restart the development server:

```bash
npm run dev
```

### CORS Issues with Edge Functions

If you're seeing CORS errors when calling Supabase Edge Functions:

1. Make sure your Edge Functions include proper CORS headers for OPTIONS requests:

```ts
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      headers: corsHeaders(req.headers.get("origin")) 
    });
  }
  
  // Your function logic here
  
  // Return response with CORS headers
  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(req.headers.get("origin")),
    },
  });
});
```

2. Add your localhost URLs to the Supabase CORS allowed list:
   - Go to Supabase Dashboard → Project Settings → API → CORS
   - Add `http://localhost:5173` and `http://127.0.0.1:5173`

3. Deploy your updated Edge Functions:

```bash
supabase functions deploy suggest-filename
supabase functions deploy analyze-file
```

### Using the Edge Function Helper

For convenience, use the provided utility function for calling Edge Functions:

```ts
// src/utils/edgeFunctions.ts
import { callEdge } from '../utils/edgeFunctions';

// Example usage:
const suggestions = await callEdge("suggest-filename", { originalName });
```

This handles the authorization header and error processing automatically.

## Verification Checklist

- ✓ No WebSocket errors in browser console
- ✓ Successful preflight OPTIONS requests to Edge Functions
- ✓ Edge Functions return proper CORS headers
- ✓ File uploads and analysis work correctly 
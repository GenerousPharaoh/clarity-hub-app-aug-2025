# Supabase CORS Configuration

To ensure your local development environment can communicate properly with Supabase, you need to add your localhost URLs to the CORS (Cross-Origin Resource Sharing) allowed list.

## Steps to Configure CORS in Supabase

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `clarity-hub-app`
3. Navigate to **Project Settings** → **API** → **CORS**
4. Under **Additional allowed origins**, add:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   ```
5. Click **Save**

## Why This Is Necessary

CORS is a security mechanism that prevents web apps from making requests to domains other than the one that served the app. By adding your localhost URLs to the allowed origins, you're telling Supabase to accept requests from your local development environment.

This is particularly important for:
- Authentication flows
- Edge Function calls
- Storage operations

## Verifying CORS Settings Are Working

You can verify your CORS settings are working with the following commands:

```bash
# Test OPTIONS preflight for Edge Functions
curl -i -X OPTIONS https://swtkpfpyjjkkemmvkhmz.supabase.co/functions/v1/suggest-filename

# Expected result: Should return 200 OK with Access-Control-Allow-Origin header
```

If you make changes to your Edge Functions, remember to redeploy them:

```bash
supabase functions deploy suggest-filename
supabase functions deploy analyze-file
``` 
# File Upload Fix Instructions

This document explains how to fix file upload issues in the Legal Case Tracker application.

## Issue Description

When attempting to upload files, you receive this error:
```
Upload failed: Storage upload failed: new row violates row-level security policy
Error loading files: Unknown error
```

This happens because:
1. The Row Level Security (RLS) policies on the Supabase `files` table are too restrictive
2. The storage bucket policies don't allow proper access
3. The API keys used for authentication might be outdated or inconsistent

## Solution Steps

### 1. Fix RLS Policies via Supabase Dashboard

The fastest way to fix this is to manually apply our SQL script via the Supabase dashboard:

```bash
./apply-migration.sh fix_rls_sql.sql
```

This will open your browser to the Supabase SQL Editor with the fix already loaded. Just click "Run" to apply it.

The SQL script does the following:
- Enables Row Level Security on the `files` table
- Removes any conflicting policies
- Creates permissive policies allowing authenticated users to insert, select, update, and delete files
- Sets proper policies on the storage.objects table for the 'files' bucket

### 2. Update Environment Variables

Make sure your `.env` file has consistent API keys:

```
VITE_SUPABASE_URL=https://swtkpfpyjjkkemmvkhmz.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Make sure these match the ones above
NEXT_PUBLIC_SUPABASE_URL=https://swtkpfpyjjkkemmvkhmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same-anon-key>
```

### 3. Verify Storage Buckets

Ensure the 'files' storage bucket exists:

1. Go to Supabase dashboard: https://supabase.com/dashboard/project/swtkpfpyjjkkemmvkhmz
2. Navigate to Storage
3. Check if the 'files' bucket exists, if not, create it
4. Make sure the bucket has public access enabled

### 4. Run the Application

Start the application with:

```bash
npm run dev
```

The application will now run on any available port, and all API calls will work regardless of which port is being used. If you want to specify a particular port:

```bash
# Set environment variable for a specific port
export VITE_DEV_PORT=5174
npm run dev

# Or directly specify the port in the command
npm run dev -- --port 5174
```

### 5. Test File Upload

After applying these fixes:
1. Log in to the application
2. Navigate to a project
3. Try uploading a file
4. Verify the file appears in the file list and can be viewed

## Automated Fix Script

For a complete environment setup, including fixing file upload issues:

```bash
node setup-complete-environment.js
```

This script:
- Fixes Supabase RLS policies
- Sets up a real user account
- Verifies AI integration
- Starts the application for testing

## Troubleshooting

If uploads still fail:

1. Check browser console for specific error messages
2. Verify that your user is properly authenticated
3. Check Supabase logs in the dashboard
4. Ensure you're using the latest API keys
5. Try redeploying the Edge Functions with `npx supabase functions deploy`

For persistent issues, you can manually insert files using the Supabase dashboard to verify database connectivity. 
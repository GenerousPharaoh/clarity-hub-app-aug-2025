# OAuth Configuration Setup for Clarity Hub App

## Problem
Google OAuth is currently redirecting to the old "Clarity Suite" app instead of the new "Clarity Hub" app at https://clarity-hub-app.vercel.app

## Solution Steps

### 1. Update Supabase OAuth Settings

Go to your Supabase Dashboard:
https://supabase.com/dashboard/project/swtkpfpyjjkkemmvkhmz/auth/url-configuration

#### Update Site URL
- Set **Site URL** to: `https://clarity-hub-app.vercel.app`

#### Add Redirect URLs
Add these URLs to the **Redirect URLs** allowlist:
- `https://clarity-hub-app.vercel.app/**`
- `https://clarity-hub-*.vercel.app/**` (for preview deployments)
- `http://localhost:3000/**` (for local development)
- `http://localhost:5173/**` (for Vite dev server)

### 2. Update Google OAuth Provider Settings

Go to: https://supabase.com/dashboard/project/swtkpfpyjjkkemmvkhmz/auth/providers

Find the **Google** provider and ensure:
- **Enable Google provider** is ON
- **Client ID** and **Client Secret** are configured
- **Authorized redirect URIs** in Google Cloud Console includes:
  - `https://swtkpfpyjjkkemmvkhmz.supabase.co/auth/v1/callback`

### 3. Verify Google Cloud Console Settings

Go to your Google Cloud Console:
https://console.cloud.google.com/apis/credentials

For your OAuth 2.0 Client ID:
1. Click on your OAuth client
2. Under **Authorized redirect URIs**, ensure you have:
   - `https://swtkpfpyjjkkemmvkhmz.supabase.co/auth/v1/callback`
3. Under **Authorized JavaScript origins**, add:
   - `https://clarity-hub-app.vercel.app`
   - `http://localhost:3000`
   - `http://localhost:5173`

### 4. Test the OAuth Flow

After making these changes:
1. Go to https://clarity-hub-app.vercel.app/auth/login
2. Click "Sign in with Google"
3. You should be redirected to Google's OAuth consent screen
4. After authorizing, you should be redirected back to https://clarity-hub-app.vercel.app/

## Current Configuration

- **Supabase Project ID**: swtkpfpyjjkkemmvkhmz
- **Supabase URL**: https://swtkpfpyjjkkemmvkhmz.supabase.co
- **App URL**: https://clarity-hub-app.vercel.app
- **User Email**: kareem.hassanein@gmail.com

## Notes

The issue occurs because the Supabase project (swtkpfpyjjkkemmvkhmz) is shared between multiple applications. The OAuth redirect configuration needs to be updated to point to the correct application URL.
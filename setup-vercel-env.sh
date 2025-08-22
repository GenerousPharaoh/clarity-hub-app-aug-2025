#!/bin/bash

# Vercel environment variables setup script
echo "Setting up Vercel environment variables..."

# Supabase configuration
vercel env add VITE_SUPABASE_URL production --force <<< "https://swtkpfpyjjkkemmvkhmz.supabase.co"
vercel env add VITE_SUPABASE_ANON_KEY production --force <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMDM5NTIsImV4cCI6MjA2MDg3OTk1Mn0.8herIfBAFOFUXro03pQxiS4Htnljavfncz-FvPj3sGw"
vercel env add SUPABASE_SERVICE_ROLE_KEY production --force <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTMwMzk1MiwiZXhwIjoyMDYwODc5OTUyfQ.Jp8Vhvs-rvVvjx0L0wEtm4Cblh-DTjoXExjNWNIaV_M"

# Database URLs
vercel env add POSTGRES_URL production --force <<< "postgres://postgres.swtkpfpyjjkkemmvkhmz:2xCv756AiutwXpRM@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
vercel env add DATABASE_URL production --force <<< "postgresql://postgres.swtkpfpyjjkkemmvkhmz:2xCv756AiutwXpRM@aws-0-ca-central-1.pooler.supabase.com:6543/postgres"

echo "Environment variables set up successfully!"
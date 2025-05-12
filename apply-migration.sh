#!/bin/bash

# Simple script to apply SQL migrations to Supabase
# This script generates a link to the SQL Editor with the migration loaded

# Get SQL migration file path
if [ -z "$1" ]; then
    echo "Error: No SQL file specified."
    echo "Usage: $0 <path-to-sql-file>"
    exit 1
fi

SQL_FILE="$1"

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file not found: $SQL_FILE"
    exit 1
fi

# Get Supabase URL from .env
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ]; then
    echo "Error: Could not find VITE_SUPABASE_URL in .env file."
    exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's/https:\/\/([^.]+)\.supabase\.co/\1/')

if [ -z "$PROJECT_REF" ]; then
    echo "Error: Could not extract project reference from Supabase URL."
    exit 1
fi

# Read the SQL file
SQL_CONTENT=$(cat "$SQL_FILE")

# Encode the SQL content for URL
ENCODED_SQL=$(echo "$SQL_CONTENT" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")

# Generate SQL Editor URL
SQL_EDITOR_URL="https://supabase.com/dashboard/project/$PROJECT_REF/sql/new?content=$ENCODED_SQL"

echo "--------------------------------------------------------------------------------"
echo "📝 SQL Migration: $SQL_FILE"
echo "--------------------------------------------------------------------------------"
echo "To apply this migration, please:"
echo ""
echo "1. Open the following URL in your browser:"
echo ""
echo "$SQL_EDITOR_URL"
echo ""
echo "2. Review the SQL in the editor"
echo "3. Click 'Run' to execute the migration"
echo "--------------------------------------------------------------------------------"
echo "SQL Content:"
echo "--------------------------------------------------------------------------------"
echo "$SQL_CONTENT"
echo "--------------------------------------------------------------------------------"

# On macOS, try to open the URL automatically
if [ "$(uname)" = "Darwin" ]; then
    echo "Attempting to open URL in your browser..."
    open "$SQL_EDITOR_URL"
fi 
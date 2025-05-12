#!/bin/bash

echo "Applying file upload fix migration..."
echo "This will add the necessary RLS policies to allow file uploads"

# Check if we have Node.js and npm installed
if command -v node &> /dev/null; then
    # Check if apply-migration.js exists
    if [ -f "apply-migration.js" ]; then
        node apply-migration.js supabase/migrations/20250525000000_fix_file_upload_rls.sql
    else
        echo "apply-migration.js not found, trying apply-migration.sh..."
        ./apply-migration.sh supabase/migrations/20250525000000_fix_file_upload_rls.sql
    fi
else
    echo "Node.js not found, trying apply-migration.sh directly..."
    ./apply-migration.sh supabase/migrations/20250525000000_fix_file_upload_rls.sql
fi

echo "Migration applied. File uploads should now work correctly."
echo "Try uploading a file again to verify the fix." 
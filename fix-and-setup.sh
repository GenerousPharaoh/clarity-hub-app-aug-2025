#!/bin/bash

# Shell script to set up the application and fix permissions

echo "========================================="
echo "🔧 Setting up storage buckets..."
echo "========================================="
node setup-storage-buckets.js

echo ""
echo "========================================="
echo "🔧 Fixing file upload permissions..."
echo "========================================="
node fix_file_upload_permissions.js

echo ""
echo "========================================="
echo "🔧 Creating test project..."
echo "========================================="
node create-test-project.js

echo ""
echo "========================================="
echo "✅ Setup complete!"
echo "========================================="
echo "Restart your app (if needed) and try uploading files."
echo "Make sure to select the Test Project that was created." 
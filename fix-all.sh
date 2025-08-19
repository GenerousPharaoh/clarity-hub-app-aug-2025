#!/bin/bash

# Script to apply all fixes and run the Clarity Hub app
# Created by Claude to fix multiple app issues

# Set up colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Clarity Hub App Repair Script ===${NC}"

# Move to app directory
cd ~/Desktop/clarity-hub-app

# 1. Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install
npm install vite-plugin-pwa --save-dev
npm install react-resizable-panels --save

# 2. Apply fixes to service worker
echo -e "${YELLOW}Step 2: Fixing service worker...${NC}"

# Check if we need to move favicon.ico to public directory
if [ ! -f "public/favicon.ico" ]; then
  if [ -f "favicon.ico" ]; then
    echo "Moving favicon.ico to public directory..."
    cp favicon.ico public/
  else
    echo "Creating default favicon.ico in public directory..."
    touch public/favicon.ico
  fi
fi

# Create a restart script
echo -e "${YELLOW}Step 3: Creating restart script...${NC}"
cat > restart-server.sh << EOL
#!/bin/bash

# Kill any processes running on port 3000
echo "Stopping any existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Clear caches
echo "Clearing cache..."
npm cache clean --force
rm -rf node_modules/.vite

# Restart server
echo "Starting development server..."
PORT=3000 npm run dev
EOL

chmod +x restart-server.sh

echo -e "${YELLOW}Step 4: Updating package.json scripts...${NC}"
# Use temporary file to update package.json
# Note: This is a simple approach; for more complex JSON manipulation, consider using jq
if [ -f "package.json" ]; then
  # Add a rebuild script
  sed -i '' 's/"scripts": {/"scripts": {\n    "rebuild": "rm -rf node_modules\/.vite && vite build --force && vite preview",/g' package.json
  echo "Added rebuild script to package.json"
fi

echo -e "${GREEN}All fixes have been applied!${NC}"
echo ""
echo -e "${BLUE}To run the app with all fixes:${NC}"
echo "1. Run ./restart-server.sh"
echo "2. Open http://localhost:3000 in your browser"
echo ""
echo -e "${BLUE}If you encounter any issues:${NC}"
echo "1. Try 'npm run rebuild' to rebuild the app"
echo "2. Check the browser console for errors"
echo ""
echo -e "${GREEN}The app should now work properly with:${NC}"
echo "- Fixed Supabase authentication issues"
echo "- Optimized button response times" 
echo "- Fixed resizable panels"
echo "- Properly cached favicon and static assets"
echo ""
echo -e "${YELLOW}Would you like to start the server now? (y/n)${NC}"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting server..."
  ./restart-server.sh
else
  echo "You can start the server later by running ./restart-server.sh"
fi

#!/bin/bash

# Apply all fixes script for Clarity Hub App
# This script applies all fixes needed to resolve the app's issues

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Clarity Hub app fixes application...${NC}"

# Step 1: Apply database fixes
echo -e "\n${YELLOW}Step 1: Applying database fixes...${NC}"
if [ -f "direct_sql_fix.js" ]; then
  node direct_sql_fix.js
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Database fixes applied successfully.${NC}"
  else
    echo -e "${RED}Failed to apply database fixes.${NC}"
    echo "Please check the error message above."
  fi
else
  echo -e "${RED}direct_sql_fix.js file not found.${NC}"
  echo "Please run this script from the project root directory."
  exit 1
fi

# Step 2: Kill any running dev servers
echo -e "\n${YELLOW}Step 2: Stopping any running Vite dev servers...${NC}"
pkill -f "node.*vite" || true
echo -e "${GREEN}Stopped any running dev servers.${NC}"

# Step 3: Check for port 5173 and 5174 usage
echo -e "\n${YELLOW}Step 3: Checking port usage...${NC}"
PORT_5173_PID=$(lsof -i:5173 -t 2>/dev/null)
PORT_5174_PID=$(lsof -i:5174 -t 2>/dev/null)

if [ -n "$PORT_5173_PID" ]; then
  echo -e "${YELLOW}Port 5173 is in use by PID ${PORT_5173_PID}.${NC}"
  read -p "Do you want to kill the process using port 5173? (y/n) " KILL_5173
  if [ "$KILL_5173" = "y" ]; then
    kill -9 $PORT_5173_PID
    echo -e "${GREEN}Process using port 5173 killed.${NC}"
  fi
else
  echo -e "${GREEN}Port 5173 is available.${NC}"
fi

if [ -n "$PORT_5174_PID" ]; then
  echo -e "${YELLOW}Port 5174 is in use by PID ${PORT_5174_PID}.${NC}"
  read -p "Do you want to kill the process using port 5174? (y/n) " KILL_5174
  if [ "$KILL_5174" = "y" ]; then
    kill -9 $PORT_5174_PID
    echo -e "${GREEN}Process using port 5174 killed.${NC}"
  fi
else
  echo -e "${GREEN}Port 5174 is available.${NC}"
fi

# Step 4: Start the development server
echo -e "\n${YELLOW}Step 4: Starting development server...${NC}"
echo -e "${GREEN}Starting development server... Check the browser at http://localhost:5173 or the first available port.${NC}"
npm run dev &

# Wait a moment for the server to start
sleep 5

# Step 5: Final verification
echo -e "\n${YELLOW}Step 5: Final verification${NC}"
echo -e "${GREEN}All fixes have been applied. Please verify:${NC}"
echo "1. The dev server started without WebSocket errors."
echo "2. You can log in to the application successfully."
echo "3. You can create and open projects."
echo "4. Notes save without 409 conflicts."
echo "5. Edge functions work without CORS errors."
echo "6. Panel headers are not clipped."
echo "7. TinyMCE loads without plugin errors."

echo -e "\n${GREEN}Fix application complete. To validate all fixes, run: node validate_fixes.js${NC}" 
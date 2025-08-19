#!/bin/bash

# Quick Verification Script
# This script launches a simple static verification page

# Text formatting
BOLD='\033[1m'
NORMAL='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'

echo -e "${BOLD}${BLUE}Clarity Hub - Quick Static Verification${NORMAL}"
echo -e "${BLUE}==========================================${NORMAL}\n"

echo "This script will open a static verification page to confirm"
echo "the basic layout and functionality of the app without relying"
echo "on complex React rendering.\n"

# Step 1: Check if http-server is installed
if ! command -v npx &> /dev/null; then
  echo -e "${RED}Error: npx not found. Please install Node.js.${NORMAL}"
  exit 1
fi

# Step 2: Serve the static file
echo -e "${BOLD}Starting static server...${NORMAL}"
echo "The static verification page will open in your browser."
echo -e "${YELLOW}Press Ctrl+C when done to stop the server.${NORMAL}\n"

# Launch the browser after a short delay
(
  sleep 2
  open "http://localhost:8080/static-verify.html" 2>/dev/null || 
  xdg-open "http://localhost:8080/static-verify.html" 2>/dev/null || 
  echo -e "${YELLOW}Please open your browser and go to: http://localhost:8080/static-verify.html${NORMAL}"
) &

# Start the server
cd public && npx http-server -p 8080 --silent
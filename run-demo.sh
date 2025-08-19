#!/bin/bash

# Demo Mode Launch Script
# This script launches the app with guaranteed demo mode

# Text formatting
BOLD='\033[1m'
NORMAL='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'

echo -e "${BOLD}${BLUE}Clarity Hub - Demo Mode Launcher${NORMAL}"
echo -e "${BLUE}==========================================${NORMAL}\n"

echo "This script launches the app in demo mode with all features enabled."
echo "No backend connection is needed to run the demo.\n"

# Step 1: Create a special demo launch file
echo -e "${BOLD}Setting up demo mode...${NORMAL}"

# Create a temporary html file with forced demo mode
cat > ./public/demo-mode.html << 'EOL'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Clarity Hub - Demo Mode</title>
    <!-- TinyMCE script - load from local public folder instead of CDN -->
    <script src="/tinymce/tinymce.min.js"></script>
    <!-- Custom style fixes -->
    <link rel="stylesheet" href="/style-fixes.css">
    <script>
      // Force demo mode
      window.FORCE_DEMO_MODE = true;
      console.log('🔄 Demo mode forced by launcher script');
      
      // Clear any existing app state
      localStorage.clear();
      
      // Add debugging utilities
      window.resetApp = function() {
        console.log('Resetting app state...');
        localStorage.clear();
        window.location.reload();
      };
    </script>
  </head>
  <body>
    <div id="root">
      <!-- Loading indicator -->
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
        <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 20px; font-family: sans-serif;">Loading Clarity Hub Demo...</p>
      </div>
    </div>
    
    <!-- Static verification fallback button -->
    <div style="position: fixed; bottom: 10px; right: 10px; z-index: 9999;">
      <a href="/static-verify.html" style="background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-size: 12px;">
        Static Verification
      </a>
    </div>
    
    <!-- Reset button -->
    <div style="position: fixed; bottom: 10px; left: 10px; z-index: 9999;">
      <button onclick="resetApp()" style="background: rgba(244,67,54,0.8); color: white; padding: 5px 10px; border-radius: 4px; border: none; cursor: pointer; font-size: 12px;">
        Reset App
      </button>
    </div>
    
    <script type="module" src="/src/main.tsx"></script>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </body>
</html>
EOL

echo -e "${GREEN}✓ Demo mode setup complete${NORMAL}"

# Step 2: Start the dev server
echo -e "\n${BOLD}Starting development server...${NORMAL}"
echo "The app will open in your browser in demo mode."
echo -e "${YELLOW}Press Ctrl+C when done to stop the server.${NORMAL}\n"

# Launch the browser after a short delay
(
  sleep 3
  open "http://localhost:3000/demo-mode.html" 2>/dev/null || 
  xdg-open "http://localhost:3000/demo-mode.html" 2>/dev/null || 
  echo -e "${YELLOW}Please open your browser and go to: http://localhost:3000/demo-mode.html${NORMAL}"
) &

# Start the dev server
npm run dev
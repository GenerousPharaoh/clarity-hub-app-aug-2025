#!/bin/bash
# Simple script to start the app with a specific port and open the browser

echo "Starting Clarity Hub App..."
echo "The app will be available at: http://localhost:8080"
echo "Opening browser automatically..."
echo ""

# Kill any existing process on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Open browser after a short delay to ensure server is running
(sleep 3 && open http://localhost:8080) &

# Run vite with specific port and open flag
npx vite --port 8080 --open
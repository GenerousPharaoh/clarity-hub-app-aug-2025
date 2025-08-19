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

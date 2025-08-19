#!/bin/bash

echo "Starting simplified application with demo mode..."

# Make sure any old app is killed
killall node 2>/dev/null

# Start the dev server
npm run dev
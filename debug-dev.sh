#!/bin/bash

# Install necessary dependencies if missing
echo "Checking for required dependencies..."
cd ~/Desktop/clarity-hub-app

# Install vite explicitly if needed
npm install vite@latest --save-dev

# Check if any dependencies are missing
echo "Running npm install to ensure all dependencies are present..."
npm install

echo "Starting server with debug logging..."
DEBUG=vite:* npx vite

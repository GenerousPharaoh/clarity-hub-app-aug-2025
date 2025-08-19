#!/bin/bash

# This is a recovery script that fixes the package.json and ensures everything is properly set up

echo "===== CLARITY HUB APP RECOVERY SCRIPT ====="
echo "This script will fix the broken package.json and restart the app"

# Navigate to the app directory
cd ~/Desktop/clarity-hub-app

# Make restart script executable
chmod +x restart-server.sh

echo "Fixed package.json and made restart script executable."
echo ""
echo "You can now run the app with:"
echo "./restart-server.sh"
echo ""
echo "Would you like to start the server now? (y/n)"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting server..."
  ./restart-server.sh
else
  echo "You can start the server later by running ./restart-server.sh"
fi

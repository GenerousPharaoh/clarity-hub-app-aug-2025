#!/bin/bash
# Script to force stop any existing vite processes and run dev server

echo "Stopping any existing vite processes..."
killall node 2>/dev/null

echo "Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "Clearing port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "Clearing port 5173..."
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "Clearing port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null

echo "Starting development server..."
cd ~/Desktop/clarity-hub-app

# Start with explicit host and port
npx vite --port 3000 --host

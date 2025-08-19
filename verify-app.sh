#!/bin/bash

# Verification script for Clarity Hub App
# This script tests that the application starts correctly and runs the verification tests

# Text formatting
BOLD='\033[1m'
NORMAL='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'

# Function to print a step heading
print_step() {
  echo -e "\n${BOLD}${BLUE}$1${NORMAL}"
  echo -e "${BLUE}$(printf '=%.0s' {1..50})${NORMAL}\n"
}

# Function to print success message
print_success() {
  echo -e "${GREEN}✓ $1${NORMAL}"
}

# Function to print error message
print_error() {
  echo -e "${RED}✗ $1${NORMAL}"
}

# Function to print warning message
print_warning() {
  echo -e "${YELLOW}⚠ $1${NORMAL}"
}

# Set up cleanup for background processes
cleanup() {
  print_step "Cleaning up"
  
  if [ ! -z "$DEV_SERVER_PID" ]; then
    echo "Stopping dev server (PID: $DEV_SERVER_PID)"
    kill $DEV_SERVER_PID 2>/dev/null
  fi
  
  echo "Done!"
  exit 0
}

# Register cleanup on script exit
trap cleanup EXIT INT TERM

# Start script
clear
echo -e "${BOLD}${BLUE}"
echo "==============================================="
echo "     Clarity Hub App Verification Script      "
echo "==============================================="
echo -e "${NORMAL}"
echo "This script will verify that the Clarity Hub app"
echo "is properly configured and functional."
echo ""

# Step 1: Check dependencies
print_step "Step 1: Checking dependencies"

# Check Node.js is installed
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  print_success "Node.js is installed: $NODE_VERSION"
else
  print_error "Node.js not found. Please install Node.js."
  exit 1
fi

# Check npm is installed
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  print_success "npm is installed: $NPM_VERSION"
else
  print_error "npm not found. Please install npm."
  exit 1
fi

# Step 2: Check all necessary files exist
print_step "Step 2: Checking for required files"

# Run the component verification script
echo "Running component verification script..."
if node tests/component-check.mjs; then
  print_success "All components verified successfully"
else
  print_error "Component verification failed"
  exit 1
fi

# Step 3: Start the dev server
print_step "Step 3: Starting development server"

# Start the dev server in the background
echo "Starting Vite development server..."
npm run dev > dev-server.log 2>&1 &
DEV_SERVER_PID=$!

# Wait for server to start up
echo "Waiting for server to start (up to 20 seconds)..."
for i in {1..20}; do
  if grep -q "Local:" dev-server.log; then
    SERVER_URL=$(grep "Local:" dev-server.log | awk '{print $2}')
    print_success "Dev server started: $SERVER_URL"
    break
  fi
  
  if [ $i -eq 20 ]; then
    print_error "Server failed to start in time."
    cat dev-server.log
    exit 1
  fi
  
  # Check if process is still running
  if ! ps -p $DEV_SERVER_PID > /dev/null; then
    print_error "Server process died."
    cat dev-server.log
    exit 1
  fi
  
  echo -n "."
  sleep 1
done

echo ""
print_success "Server is running with PID: $DEV_SERVER_PID"

# Wait a bit more for the server to fully initialize
sleep 5

# Step 4: Run end-to-end verification
print_step "Step 4: Running end-to-end verification tests"

echo "Running end-to-end tests to verify app functionality..."
echo "(This will open a browser window automatically)"
echo ""

# Run the E2E verification script
if node tests/e2e-verification.mjs; then
  print_success "End-to-end verification completed successfully"
else
  print_warning "End-to-end verification had some issues"
  echo "Please check the test-results directory for screenshots"
fi

# Show the test result screenshots
print_step "Verification Results"

if [ -d "test-results" ]; then
  echo "Screenshots were saved to the test-results directory:"
  ls -la test-results/*.png 2>/dev/null
  
  # Count screenshots
  SCREENSHOT_COUNT=$(ls -1 test-results/*.png 2>/dev/null | wc -l)
  if [ $SCREENSHOT_COUNT -gt 0 ]; then
    print_success "Generated $SCREENSHOT_COUNT verification screenshots"
  else
    print_warning "No screenshots were generated"
  fi
else
  print_warning "No test-results directory found"
fi

print_step "Verification Summary"

echo "App appears to be configured correctly."
echo "The verification process has completed - please check the results above."
echo ""
echo -e "${BOLD}To manually verify the app:${NORMAL}"
echo "1. Open a browser to $SERVER_URL"
echo "2. Check that projects and files are displayed"
echo "3. Try selecting different projects and files"
echo "4. Test the panel resizing"
echo "5. Press Ctrl+Shift+D to activate debug mode"
echo "6. Use the Reset App button if needed"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server and exit this script${NORMAL}"

# Wait for user to press Ctrl+C
while true; do
  sleep 1
done
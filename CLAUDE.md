# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Commands
- `npm install` - Install dependencies (also runs copy-tinymce.js)
- `npm run dev` - Start development server (runs on port 3000 by default)
- `npm run build` - Build for production (runs typecheck first)
- `npm run lint` - Run ESLint

### Viewer Testing Commands
- `npm run dev` - Start the dev server, then:
  - Visit http://localhost:3000/test-viewers to test file viewers
  - Visit http://localhost:3000/comprehensive-file-test.html for isolated viewer tests

### Test Commands
- `npm run test` - Run Playwright tests
- `npm run test:ui` - Run Playwright tests with UI
- `npm run test:debug` - Run Playwright tests in debug mode
- `npm run test:report` - Show Playwright test reports
- `npm run test:puppeteer` - Run Puppeteer validation tests

### Supabase/Storage Commands
- `npm run fix:storage` - Fix Supabase storage permissions
- `npm run fix:projects` - Fix project display issues
- `npm run test:uploads` - Test file uploads
- `npm run fix:all` - Apply all fixes (storage, projects, uploads)
- `npm run copy-tinymce` - Copy TinyMCE resources (runs automatically before dev/build)

## Application Architecture

### Core Architecture
1. **Client Application:** React + Vite app with Material UI
2. **Backend:** Supabase for authentication, storage, and database
3. **Edge Functions:** Supabase Edge Functions for AI integration

### Key Components

#### Layout System
- **ResizablePanels:** The app uses a three-panel layout with resizable panels:
  - Left Panel: Project/file navigation
  - Center Panel: Content display and editing
  - Right Panel: File viewer and AI tools
- State management via Zustand for panel sizes and collapsed state

#### File Management
- File uploads through Supabase Storage with fallback to IndexedDB
- File viewers for various file types (PDF, images, audio, video, documents)
- Versioning support for uploaded files

#### File Viewers
- `UniversalFileViewer`: Main container that detects file type and delegates to appropriate viewer
- Specialized viewers for different file types (PDFViewer, ImageViewer, etc.)
- Enhanced viewers with additional capabilities (zoom, annotations, etc.)

#### Authentication
- Supabase Auth for user management
- Protected routes with AuthContext

### Common Issues and Fixes

1. **Storage Permission Errors:**
   - If encountering "violates row-level security policy" errors, run `npm run fix:storage`

2. **Projects Not Displaying:**
   - If projects aren't showing in the left panel, run `npm run fix:projects`

3. **WebSocket Connection Issues:**
   - Check port configuration in vite.config.ts
   - Ensure server port and HMR port match

4. **CORS Issues with Edge Functions:**
   - Edge Functions should include proper CORS headers for OPTIONS requests
   - Relevant utility: `src/utils/edgeFunctions.ts`
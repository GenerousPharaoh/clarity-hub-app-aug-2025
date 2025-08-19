# Clarity Hub App

A legal case tracking application with document management features built with React + Vite and Supabase.

## Overview

The Clarity Hub application allows legal professionals to:

- Create and manage legal cases/projects
- Upload and organize case-related documents
- Use rich text editing for notes and documentation
- View PDFs and other document types
- Search through case materials
- Use AI-powered analysis and insights

## Quick Start

### Running the App

1. Start the development server:
```bash
npm run dev
```

2. Open your browser to http://localhost:3000

3. The app will automatically load in demo mode with sample data

### Demo Mode Features

The application runs in demo mode by default, allowing you to explore the interface with sample data without requiring a Supabase backend connection.

Features available in demo mode:
- Browse sample projects and files
- View mock file previews
- Use the 3-panel resizable interface
- Test the document viewer components

### Resetting the App

If you encounter any issues with the application state:

1. Press `Ctrl+Shift+D` to reveal the debug controls
2. Click the "Reset App" button that appears in the bottom-right corner
3. The app will reload with fresh demo data

Alternatively, you can paste the following into your browser console:
```javascript
fetch('/reset-app.js')
  .then(response => response.text())
  .then(script => eval(script))
  .catch(err => console.error('Error loading reset script:', err));
```

## Features

### Three-Panel Layout
- Left Panel: Project/file navigation
- Center Panel: Document editor
- Right Panel: File viewer and AI tools

### File Management
- Upload various file types
- Organize files by project
- View files with type-specific viewers

### Document Viewers
- PDF Viewer with zoom, rotate and page navigation
- Image Viewer with pan and zoom
- Audio/Video Player
- Text/Document Viewer

### AI Features (Mock)
- Document summaries
- Entity extraction
- Question answering

## Development

### Prerequisites
- Node.js 16+
- npm

### Installation
1. Clone the repository
```bash
git clone <repository-url>
cd clarity-hub-app
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technical Details

### Core Technologies
- React 18
- TypeScript
- Vite
- Material UI (MUI) v7
- Zustand for state management
- React Router v7

### UI Components
- Material UI (MUI) for UI components
- react-resizable-panels for the 3-panel layout
- react-pdf for PDF viewing
- react-zoom-pan-pinch for image viewing

### State Management
- Zustand for global state
- React Context for auth and notifications
- Local storage persistence

## Troubleshooting

### Common Issues

**UI Layout Problems**
- Press `Ctrl+Shift+D` to reveal the reset button
- Click "Reset App" to restore the default layout

**Files Not Loading**
- The app is running in demo mode with mock file viewers
- No actual backend connections are made

**Panel Resizing Issues**
- Refresh the page to reset the panel sizes
- Check browser console for any JavaScript errors

## License

Copyright © 2025 Clarity Hub. All rights reserved.
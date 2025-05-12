# Clarity Hub App

A legal case tracking application with document management features built with React + Vite and Supabase.

## Overview

The Clarity Hub application allows legal professionals to:

- Create and manage legal cases/projects
- Upload and organize case-related documents
- Use rich text editing for notes and documentation
- View PDFs and other document types
- Search through case materials

## Quick Fix

If you're experiencing issues with file uploads, project creation, or Supabase permissions, run:

```bash
./apply-all-fixes.sh
```

This script will automatically:
1. Fix Supabase storage permissions
2. Fix project display and creation
3. Test file uploads
4. Start the development server

## Manual Setup

### Prerequisites

- Node.js 16+
- npm
- Supabase account and project

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

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` to add your Supabase credentials.

4. Start the development server
```bash
npm run dev
```

## Troubleshooting

If you're experiencing issues, check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common problems and solutions.

For specific issues:

- **Storage Permissions**: Run `./fix-supabase-with-cli.sh`
- **Project Display**: Run `node fix-project-display.js`
- **File Uploads**: Run `node test-uploads.js`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run copy-tinymce` - Copy TinyMCE resources
- `npm run fix:storage` - Fix Supabase storage permissions
- `npm run fix:projects` - Fix project display issues
- `npm run test:uploads` - Test file uploads
- `npm run fix:all` - Apply all fixes

### Feature Implementation Details

For detailed information about fixes implemented in this project, see [Fix Documentation](fix-documentation.md).

# Claude Memory - Clarity Hub App Project

## Project Overview
**Clarity Hub** is a sophisticated legal case management application built with React, TypeScript, Material UI, and Supabase. It provides document management, AI-powered analysis, and collaborative features for legal professionals.

## Recent Major Updates (August 23, 2025)

### 1. Critical Bug Fixes
- **React Child Error Fix**: Fixed "Objects are not valid as a React child" error that was breaking the entire app
  - Problem: `showNotification` was receiving objects instead of individual parameters
  - Solution: Updated 8 instances in `LeftPanel.tsx` and added defensive handling in `NotificationContext.tsx`
  - User reaction: "oh shit; suddenly it seems to be working..?"

- **DOM Nesting Warnings**: Migrated from deprecated `ListItem button` prop to `ListItemButton` component
- **API Errors**: Fixed `project_id=eq.undefined` errors by adding validation in `useProjectFiles` and `cloudFileService`
- **Session Expiration**: Prevented demo users from seeing session expiration messages

### 2. Editor Overhaul
- **User Feedback**: "the doc editor looks like shit tbh" and "it feels clunky and cheap"
- **Action Taken**: Complete migration from TinyMCE to Lexical editor
- **Result**: Created `LegalRichTextEditor` with premium UI and legal-specific features
- **Files Changed**: `CenterPanel.tsx`, removed 400+ lines of TinyMCE config

### 3. Panel System Redesign
- **Problem**: Toggle buttons were hiding panels completely instead of collapsing them
- **Solution**: 
  - Panels now collapse to 48px minimal sidebars with icon-only mode
  - Created `CollapsedPanel.tsx` component with expand buttons
  - Center panel auto-resizes using `flex: 1`
  - Smooth transitions between states

### 4. Upload System Consolidation
- **User Complaint**: "there are still multiple upload buttons... There should be ONE upload feature"
- **Solution**: 
  - Consolidated into single `CloudUploadZone` component
  - Added bulk drag-and-drop support
  - Real-time progress tracking
  - Files persist in Supabase Storage (`project-files` bucket)

### 5. Persistent Demo Mode Implementation
- **Created Services**:
  - `demoService.ts`: Manages persistent demo account
  - `demoAIService.ts`: Provides AI-like analysis without API costs
  
- **Fixed IDs for Persistence**:
  - Demo User ID: `11111111-1111-1111-1111-111111111111`
  - Demo Project ID: `22222222-2222-2222-2222-222222222222`
  
- **Features**:
  - Demo data persists in Supabase across sessions
  - Realistic AI analysis simulation
  - Automatic exhibit ID generation
  - No API keys required

## Technical Architecture

### Core Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Material UI v5 with custom theme
- **State Management**: Zustand with persist middleware
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Deployment**: Vercel

### Key Services
1. **Authentication**: `AuthContext.tsx` with Supabase Auth
2. **File Management**: `cloudFileService.ts` for cloud storage
3. **AI Integration**: 
   - Production: Gemini AI via Edge Functions
   - Demo: `demoAIService.ts` for simulation
4. **Real-time**: Supabase subscriptions for collaboration

### Database Schema
- `projects`: Legal cases/projects
- `files`: Document storage with metadata
- `exhibits`: Legal exhibit management
- `users`/`profiles`: User management
- `ai_conversations`: AI chat history

### Important Files & Locations
```
src/
├── components/
│   ├── ProfessionalPanelLayout.tsx  # Panel resize/collapse logic
│   ├── CollapsedPanel.tsx           # Collapsed panel UI
│   ├── upload/
│   │   └── CloudUploadZone.tsx      # Unified upload component
│   └── editor/
│       └── LegalRichTextEditor.tsx  # Lexical editor implementation
├── services/
│   ├── demoService.ts               # Persistent demo management
│   ├── demoAIService.ts            # AI simulation for demo
│   └── cloudFileService.ts         # File upload/storage
├── layouts/
│   ├── MainLayout.tsx              # App shell with panels
│   └── panels/
│       ├── LeftPanel.tsx           # Project/file navigation
│       ├── CenterPanel.tsx         # Document editor
│       └── RightPanel.tsx          # File viewer & AI
└── contexts/
    ├── AuthContext.tsx             # Authentication
    └── NotificationContext.tsx    # Toast notifications
```

## Environment & Configuration

### Required Environment Variables
```env
VITE_SUPABASE_URL=https://swtkpfpyjjkkemmvkhmz.supabase.co
VITE_SUPABASE_ANON_KEY=[anon_key]
```

### Demo Mode
- Activated by: `window.DEMO_MODE = true`
- Auto-initializes demo project on app load
- Uses simulated AI to avoid API costs
- Files persist in real Supabase storage

## Common Issues & Solutions

### 1. Storage Permission Errors
- Run: `npm run fix:storage`
- Check RLS policies in Supabase dashboard

### 2. Projects Not Displaying
- Run: `npm run fix:projects`
- Verify user has proper project associations

### 3. Upload Not Working
- Check if in demo mode (should use `demoService`)
- Verify `project-files` bucket exists and is public
- Check Supabase storage limits

### 4. Panel Issues
- Panels should collapse to 48px, not hide
- Use Cmd+[ and Cmd+] for keyboard shortcuts
- Check `ProfessionalPanelLayout.tsx` for resize logic

## Development Commands
```bash
npm install          # Install dependencies
npm run dev         # Start dev server (port 3000)
npm run build       # Build for production
npm run lint        # Run ESLint
npm run fix:all     # Apply all fixes
```

## Recent User Feedback & Responses

1. **"the doc editor looks like shit"** → Migrated to Lexical
2. **"multiple upload buttons... should be ONE"** → Created CloudUploadZone
3. **"panels... just remove entirely"** → Fixed to collapse to sidebars
4. **"gives a pop up as if i am going to make the file locally"** → Fixed project creation flow

## Next Potential Improvements
- Enhanced AI capabilities for document analysis
- Real-time collaboration features
- Advanced search with embeddings
- Timeline visualization for case events
- Automated document classification

## Notes for Future Development
- Always check `window.DEMO_MODE` for demo-specific behavior
- Use `demoService` and `demoAI` for demo mode operations
- Maintain fixed demo IDs for consistency
- Test with both demo and authenticated modes
- Keep upload functionality unified in CloudUploadZone

---
*Last Updated: August 23, 2025*
*This document should be referenced at the start of each new conversation about the Clarity Hub app.*
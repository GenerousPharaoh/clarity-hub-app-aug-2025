# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Commands
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production (runs typecheck first)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally
- `npm run typecheck` - Run TypeScript type checking

## Application Architecture

### Core Architecture
1. **Client Application:** React + Vite app with Material UI
2. **Backend:** Supabase for authentication, storage, and database
3. **Edge Functions:** Supabase Edge Functions for AI integration
4. **Deployment:** Vercel with automatic GitHub integration

### Supabase Integration
- Full database schema with projects, documents, files, and citations
- File upload pipeline with SHA256 hashing and storage
- Row Level Security (RLS) policies for data protection
- Real-time subscriptions for collaborative features
- Complete environment variables configured in Vercel

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

#### AI Architecture (Multi-Model Legal Reasoning)

The app uses a dual-model AI architecture optimized for Ontario employment law:

**Model Routing (`src/services/aiRouter.ts`):**
- Smart query classification: simple → moderate → deep complexity
- Routes to optimal model based on query complexity and availability
- Graceful fallback: if one model is unavailable, uses the other

**Gemini 3.0 Pro (`src/services/geminiAIService.ts`):**
- Primary model for multimodal processing (text, images, audio, video, documents)
- Handles general legal chat, document analysis, file understanding
- Used for simple and moderate complexity queries
- API Key env var: `VITE_GEMINI_API_KEY`

**GPT-5.2 Deep Reasoning (`src/services/openaiService.ts`):**
- Activated for deep legal reasoning tasks (strategy, case analysis, complex legal tests)
- Extended thinking mode with temperature 0.2 for legal accuracy
- System prompt enforces: only cite from provided context, never fabricate citations
- Also provides text-embedding-3-small for RAG embeddings (1536-dim, $0.02/1M tokens)
- API Key env var: `VITE_OPENAI_API_KEY`

**Adaptive AI Service (`src/services/adaptiveAIService.ts`):**
- Wraps Gemini for contextual chat with user preferences and case context
- Ontario employment law specialist system prompt

**RAG Pipeline:**
- Legal knowledge chunks stored with tsvector (full-text) and vector embeddings (pgvector)
- `legalKnowledgeService.buildLegalContext(query)` searches cases, principles, legislation
- Context is injected into AI prompts alongside user's case file data
- HNSW index on embeddings for fast approximate nearest neighbor search

**Query Classification Signals (triggers GPT-5.2):**
- Legal strategy: "strategy", "advise", "recommend", "pros and cons", "risks"
- Complex analysis: "analyze", "factors", "elements", "standard", "legal test"
- Case reasoning: "reasonable notice", "constructive dismissal", "just cause", "damages"
- Multi-step: "how would a court", "precedent", "argue", "counter-argument"

**UI Integration (`src/components/ai/AdaptiveLegalAIChat.tsx`):**
- Model indicator chip on each AI response (shows "GPT-5.2" or "Gemini")
- Conversation history maintained for context continuity
- Legal knowledge context fetched in parallel with user context

#### Legal Knowledge Base (Ontario Employment Law MVP)
- **Service:** `src/services/legalKnowledgeService.ts` - Full CRUD + search for legal data
- **AI Integration:** Legal context is fetched in parallel with user context in `AdaptiveLegalAIChat.tsx`
- **Database Tables:**
  - `legal_topics` (34 rows) - Hierarchical topic taxonomy with parent/child relationships
  - `legal_legislation` (11 rows) - Statutes and regulations (ESA, OHRC, OHSA, WSIA, LRA, etc.)
  - `legal_legislation_sections` (12 rows) - Key statutory provisions with keyword arrays
  - `legal_cases` (23 rows) - Landmark case law with citations, holdings, and ratios
  - `legal_principles` (12 rows) - Legal doctrines (Bardal factors, Waksdale, Honda/Keays, etc.)
  - `legal_knowledge_chunks` (81 rows) - RAG search table with full-text search (tsvector) and vector embeddings (pgvector HNSW)
- **Search:** `match_legal_knowledge()` RPC for vector similarity; `fts` tsvector column for full-text search
- **RLS:** All legal tables are read-only for authenticated users

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
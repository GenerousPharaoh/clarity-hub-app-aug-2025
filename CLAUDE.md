# CLAUDE.md

Guidance for Claude Code when working on the Clarity Hub app.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # Production build (typecheck + bundle)
npm run lint         # ESLint
npm run typecheck    # TypeScript only
```

## Architecture

**Stack:** React 19 + Vite + TypeScript + Tailwind CSS 4 + Supabase + TanStack Query + Zustand + Framer Motion

**Deployment:** Vercel auto-deploy on push to `main`. API routes in `api/` directory as Vercel serverless functions.

**Layout:** Three resizable panels — Left (files), Center (overview/documents/exhibits/timeline), Right (viewer/AI chat). Each panel has ResizeObserver-based compact/ultraCompact modes.

### Authentication
- Google OAuth only (PKCE flow via Supabase Auth)
- Demo mode with seeded data (no real auth)
- Auth context: `useAuth()` → `{ user, loading, signInWithGoogle, signOut, isDemoMode }`

### AI Architecture (Server-Side)
All AI calls go through Vercel serverless functions — API keys are NOT in the client bundle.

| Route | Purpose |
|-------|---------|
| `api/ai-chat.ts` | Main AI chat — routes to Gemini (quick/standard) or GPT (deep) based on query complexity. Rate limited (30/min). |
| `api/ai-embeddings.ts` | OpenAI text-embedding-3-small for RAG |
| `api/process-file.ts` | File processing: text extraction → classification → summary → timeline extraction → chunking → embedding |
| `api/classify-file.ts` | Standalone classification for already-processed files |
| `api/extract-timeline.ts` | Bulk timeline extraction across all project files (5-min timeout) |

**Client services** (`src/services/`):
- `aiRouter.ts` — classifies queries, calls `/api/ai-chat`, extracts citations
- `geminiAIService.ts` / `openaiService.ts` — stubs (SDKs removed from client bundle)
- `legalKnowledgeService.ts` — searches legal_cases, legal_principles, legal_legislation (typed Supabase queries, no `as any`)
- `documentSearchService.ts` — RAG vector + full-text search over project files
- `compendiumGenerator.ts` — PDF compilation using pdf-lib

**System prompt focus:** Ontario employment law specialist — ESA 2000, Human Rights Code, Waksdale, Bardal factors, costs grid.

### Environment Variables

| Variable | Scope | Used By |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | Client | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase client |
| `OPENAI_API_KEY` | Server | ai-chat, ai-embeddings, process-file, classify-file, extract-timeline |
| `GEMINI_API_KEY` | Server | ai-chat (optional, falls back to OpenAI) |
| `SUPABASE_URL` | Server | All API routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | All API routes |

### Database (Supabase)

**Project:** `wfxpkjjvjmmjvampvetb` (ca-central-1)

**Core tables:** `profiles`, `projects`, `projects_users`, `files`, `document_chunks`, `notes`, `exhibit_markers`, `chat_messages`

**Legal knowledge:** `legal_topics` (34), `legal_legislation` (11), `legal_legislation_sections` (12), `legal_cases` (23), `legal_principles` (12), `legal_knowledge_chunks` (81)

**New feature tables:**
- `timeline_events` — AI-extracted chronological events per project
- `compendiums` + `compendium_entries` — Exhibit book builder configuration
- `files` extended with: `document_type`, `classification_metadata` (JSONB), `classification_confidence`, `classification_source`, `classified_at`
- `exhibit_markers` extended with: `sort_order`

**RLS:** All tables have row-level security scoped through project ownership or `projects_users` membership.

**Storage:** Single `files` bucket (private, 100MB limit, signed URLs).

## Key Features

### Smart Document Classification
- 65 Ontario legal document types across 11 categories (`src/lib/documentTypes.ts`)
- Auto-classifies during file processing via `classifyDocument()` in `document-processor.ts`
- Standalone `/api/classify-file` endpoint for retroactive classification
- UI: color-coded badges on file cards, category filter chips in left panel

### Timeline Extraction
- AI extracts dated events during file processing via `api/lib/timeline-extractor.ts`
- Bulk extraction via `/api/extract-timeline` endpoint
- Timeline tab in center panel with chronological event list
- Manual event creation, verification toggle, source file linking

### Exhibit Book / Compendium Builder
- PDF compilation using pdf-lib (`src/services/compendiumGenerator.ts`)
- Cover page, table of contents, tab dividers, sequential page numbering
- 3-step wizard modal from ExhibitsTab: Select & Arrange → Configure → Generate
- Supports PDF merging and image embedding

### Responsive Panel Design
- All 3 panels use ResizeObserver with compact/ultraCompact breakpoints
- Text truncates, labels hide, buttons become icon-only at narrow widths
- `min-w-0` on all flex children, `items-stretch` on all multi-column grids
- Global `cursor: pointer !important` on all interactive elements

## Design System

**Fonts:** Space Grotesk (headings), Inter (body), JetBrains Mono (code)

**Colors:** Primary = ink blue (#62798f), Accent = burnished copper (#a5743f), Surfaces = zinc-based neutrals

**Design tokens** (all in `src/index.css` `@theme` block):
- Layered multi-stop shadows (not flat)
- `.surface-grain` — barely-visible noise texture
- `.border-translucent` — semi-transparent borders (Linear-style)
- `.interactive-lift` — hover lift + shadow bloom + active press
- `.focus-accent` — copper-gold focus ring on primary CTAs

**Patterns:**
- `border-translucent` instead of hard gray borders
- `font-heading` on all headings
- Equal-height cards via `items-stretch` + `flex flex-col h-full`
- Progressive disclosure: secondary actions appear on hover (visible on mobile)
- Concise text throughout — no marketing language or obvious labels

## File Structure

```
api/                          # Vercel serverless functions
  ai-chat.ts                  # Main AI endpoint
  ai-embeddings.ts            # Embedding generation
  process-file.ts             # File processing pipeline
  classify-file.ts            # Standalone classification
  extract-timeline.ts         # Bulk timeline extraction
  lib/
    document-processor.ts     # Processing pipeline logic
    timeline-extractor.ts     # Timeline extraction prompts
src/
  components/
    ai/                       # AI chat panel, messages, prompts
    auth/                     # Login, callback, protected route
    dashboard/                # Dashboard, project cards
    layout/                   # Header, AppShell
    shared/                   # ErrorBoundary, PanelErrorBoundary, EmptyState, etc.
    viewers/                  # PDF, image, audio, video, document viewers
    workspace/
      left/                   # LeftPanel, FileListItem, FileUploadZone
      center/                 # CenterPanel, ProjectOverview, ExhibitsTab, TimelineTab, CompendiumBuilderModal, editor/
      right/                  # RightPanel
  hooks/                      # TanStack Query hooks (useFiles, useNotes, useExhibits, useTimeline, useCompendiums, useAIChat)
  services/                   # AI router, legal knowledge, document search, compendium generator, storage
  store/                      # Zustand slices (auth, panel, file, ui)
  lib/                        # Utilities, document types taxonomy, processing budget
  types/                      # database.ts (Supabase types), index.ts (app types)
```

## Code Quality

- Zero `as any` casts in the codebase
- Zero `@ts-ignore` / `@ts-expect-error` directives
- All Supabase queries fully typed
- ESLint: 0 errors in `src/` (edge function lint errors are non-blocking)
- Build: `tsc -b && vite build` — must pass before committing

## Important Notes

- **No MUI** — removed. UI is pure Tailwind CSS + Lucide icons.
- **AI keys are server-side only** — never use `VITE_` prefix for API keys.
- `openaiService.ts` and `geminiAIService.ts` are stubs — all AI calls go through `api/` routes.
- The `adaptiveAIService.ts` and `AdaptiveLegalAIChat.tsx` files referenced in old docs **do not exist** — removed/replaced.
- Free-tier Supabase projects pause after inactivity. If the app won't load, restore the project in Supabase dashboard.
- Feature roadmap at `FEATURE-ROADMAP.md` — CanLII integration and brief drafting assistant are next.

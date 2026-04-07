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

**Deployment:** Vercel auto-deploy on push to `main`. Production URL: `https://clarity-hub-app.vercel.app`. API routes in `api/` directory as Vercel serverless functions.

**Layout:** Three resizable panels — Left (files), Center (overview/docs/exhibits/timeline/drafts), Right (viewer/AI chat). Width-adaptive layouts: compact (<1180px), standard, wide (>1480px). Each panel has ResizeObserver-based compact/ultraCompact modes.

### Authentication
- Google OAuth only (PKCE flow via Supabase Auth)
- Demo mode with seeded data (no real auth)
- Auth context: `useAuth()` → `{ user, loading, signInWithGoogle, signOut, isDemoMode }`

### AI Architecture (Server-Side)
All AI calls go through Vercel serverless functions — API keys are NOT in the client bundle.

| Route | Purpose |
|-------|---------|
| `api/ai-chat.ts` | Main AI chat — routes to Gemini (quick/standard) or GPT (deep) based on query complexity. Rate limited (30/min). |
| `api/ai-embeddings.ts` | Voyage AI voyage-law-2 embeddings (1024-dim, legal-optimized). Falls back to OpenAI if Voyage unavailable. |
| `api/process-file.ts` | File processing: Mistral OCR → classification → summary → timeline → chunking → Voyage embedding |
| `api/classify-file.ts` | Standalone classification for already-processed files |
| `api/extract-timeline.ts` | Bulk timeline extraction across all project files (5-min timeout) |
| `api/rerank.ts` | Cohere Rerank — re-scores search results for precision retrieval |
| `api/canlii.ts` | CanLII API proxy — Canadian case law and legislation lookup |
| `api/legal-web-search.ts` | Tavily web search — real-time legal research for recent case law/news |
| `api/reembed.ts` | Re-embed utility — regenerate embeddings after provider switch (5-min timeout) |
| `api/canlii-verify.ts` | Citation verification — batch-verifies legal citations against CanLII API |

**Client services** (`src/services/`):
- `aiRouter.ts` — classifies queries, calls `/api/ai-chat`, extracts citations
- `geminiAIService.ts` / `openaiService.ts` — stubs (SDKs removed from client bundle)
- `legalKnowledgeService.ts` — searches legal_cases, legal_principles, legal_legislation (typed Supabase queries, no `as any`)
- `documentSearchService.ts` — RAG vector + full-text search → Cohere rerank → precise AI context
- `canliiService.ts` — CanLII client for case law research (courts, cases, citations, legislation)
- `compendiumGenerator.ts` — PDF compilation using pdf-lib

**System prompt focus:** Ontario employment law specialist — ESA 2000, Human Rights Code, Waksdale, Bardal factors, costs grid.

### Environment Variables

| Variable | Scope | Used By |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | Client | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase client |
| `OPENAI_API_KEY` | Server | ai-chat, process-file (classify/summary/timeline), ai-embeddings (fallback) |
| `GEMINI_API_KEY` | Server | ai-chat (optional, falls back to OpenAI) |
| `VOYAGE_API_KEY` | Server | ai-embeddings, process-file — voyage-law-2 (1024-dim, legal-optimized) |
| `MISTRAL_API_KEY` | Server | process-file — Mistral OCR for PDF/image text extraction |
| `COHERE_API_KEY` | Server | rerank — Cohere Rerank for precision document retrieval |
| `CANLII_API_KEY` | Server | canlii — CanLII API for Canadian case law/legislation |
| `TAVILY_API_KEY` | Server | legal-web-search, ai-chat — Tavily for real-time legal web search |
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

- Minimal `as any` — only in `useTimeline.ts` where DB types are outdated
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
- Feature roadmap at `FEATURE-ROADMAP.md` — brief drafting assistant is next.

### Enhanced AI Pipeline (March 2026)

**Document Processing:** Upload → **Mistral OCR** (structured markdown) → classify → summarize → timeline → chunk → **Voyage-law-2 embed** (1024-dim) → pgvector

**AI Chat Query:** User query → **Voyage embed** → pgvector hybrid search (RRF) → **Cohere Rerank** (precision top-N) → legal knowledge context → optional **Tavily web search** → route to Gemini/GPT → response with citations

**New Capabilities:**
- **Mistral OCR** (`api/lib/mistral-ocr.ts`): Structured markdown extraction preserving tables, headers, complex layouts. Falls back to pdf-parse → GPT-4.1 vision.
- **Voyage-law-2** (`api/lib/embeddings.ts`): Legal-optimized embeddings, 6-15% better retrieval vs OpenAI. 1024-dim vectors. Falls back to OpenAI text-embedding-3-small (1536-dim) — but dimensions must match the pgvector column.
- **Cohere Rerank** (`api/rerank.ts`): Two-stage retrieval — pgvector pulls top 30, Cohere rescores to top N. Falls back to original RRF order.
- **CanLII** (`api/canlii.ts` + `src/services/canliiService.ts`): Browse Ontario courts/tribunals, fetch case metadata, build citation graphs (cited/citing cases), search legislation.
- **Tavily** (`api/legal-web-search.ts`): Real-time web search focused on Canadian legal sources. Integrated into ai-chat via `enableWebSearch` flag.

**Embeddings (current):** OpenAI text-embedding-3-small (1536-dim). Voyage AI voyage-law-2 code exists but is disabled — requires payment method for usable rate limits. Set `VOYAGE_API_KEY` env var to re-enable (requires DB migration to 1024-dim).

## Gotchas & Constraints

- **Vercel Hobby plan: max 12 serverless functions.** `api/_lib/` uses underscore prefix so Vercel ignores those files. Currently 10 of 12 used.
- **`.npmrc` has `legacy-peer-deps=true`** — required for `react-pdf-highlighter-extended-extended` (React 18 peer dep with React 19).
- **Geist font is self-hosted** in `public/fonts/` with `@font-face` in `index.css`. Do NOT use jsDelivr CDN — blocked by Chromium ORB.
- **`database.ts` types are outdated for `timeline_events`** — actual DB has `extraction_method`, `event_type`, `significance`, `source_quote`, `page_reference` etc. that aren't in the types. Use `as any` cast or raw queries for timeline inserts.
- **`search_documents` RPC** — the RRF score must be cast to `::double precision` or PostgREST returns 400.
- **`GEMINI_API_KEY` (without VITE_ prefix) must exist on Vercel** for server-side Gemini routing. `VITE_GEMINI_API_KEY` only reaches the client bundle, not serverless functions. Without it, all AI queries route to GPT-5.2.
- **Don't auto-focus editor on mobile** — triggers keyboard. Guard with `window.innerWidth > 768`.
- **Don't use `AnimatePresence mode="wait"` on tab content** — causes 3-state flash with lazy-loaded Suspense components. Use instant switching.
- **PDF annotation uses `react-pdf-highlighter-extended-extended`** (SantaFe React 19 fork) with pdfjs-dist v5. Worker served from `public/pdf.worker.min.mjs`.

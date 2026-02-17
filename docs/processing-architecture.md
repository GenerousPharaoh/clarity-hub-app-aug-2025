# Processing Architecture (Canonical vs Legacy)

Last updated: 2026-02-17

## Canonical Runtime Path (active)

This is the file processing path currently wired to the app UI:

1. `src/components/workspace/left/LeftPanel.tsx` triggers processing via `useProcessFile`.
2. `src/hooks/useProcessFile.ts` calls `POST /api/process-file`.
3. `api/process-file.ts` validates auth/project access and delegates to:
4. `api/lib/document-processor.ts` for extraction, chunking, embeddings, and persistence.
5. Search reads from `document_chunks` via `src/services/documentSearchService.ts` and RPC `search_documents`.

## Legacy Supabase Function Prototypes (inactive from app UI)

The following function entrypoints are not called from current frontend/runtime code and are retained only as historical prototypes:

- `supabase/functions/analyze-file/index.ts`
- `supabase/functions/process-analysis-queue/index.ts`
- `supabase/functions/process-document/index.ts`
- `supabase/functions/project-qa/index.ts`
- `supabase/functions/semantic-search/index.ts`
- `supabase/functions/suggest-filename/index.ts`

## Policy

- New ingestion or processing work should target the canonical `/api/process-file` flow.
- Legacy function prototypes may be kept for reference but should not be used for new runtime behavior.
- Linting excludes legacy prototype paths to keep quality signals focused on active code.

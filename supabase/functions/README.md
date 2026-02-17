# Supabase Functions Inventory

Last updated: 2026-02-17

This directory contains a mix of active utility functions and historical prototypes.

## Active Utility Functions

These are considered active or currently useful utilities:

- `analyze-writing-context`
- `fix-file-upload`
- `get-next-exhibit-id`

## Legacy Prototypes

These are retained for reference only and are not part of the canonical runtime path:

- `analyze-file`
- `process-analysis-queue`
- `process-document`
- `project-qa`
- `semantic-search`
- `suggest-filename`

See `/docs/processing-architecture.md` for canonical processing flow details.

## Maintenance Policy

- Prefer implementing new processing/search work in the canonical app/API flow.
- Do not use legacy prototypes for new runtime behavior without an explicit migration decision.
- Keep legacy prototypes only for historical context until archived or deleted.

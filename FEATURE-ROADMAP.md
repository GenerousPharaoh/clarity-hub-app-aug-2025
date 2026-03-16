# Clarity Hub — Ontario Legal Feature Roadmap

## Overview

Five differentiating features researched and planned for Ontario law firm use. Each has a detailed implementation plan produced by dedicated research agents analyzing the existing codebase + Ontario legal requirements.

---

## Feature 1: Exhibit Book / Compendium Builder

**What:** Compile exhibits into court-ready tabbed PDF books with cover page, index, tab dividers, sequential page numbering, and bookmarks.

**Why it differentiates:** No existing legal tool does this well. Lawyers spend hours manually assembling exhibit books in Word + Adobe.

**Technical approach:**
- `pdf-lib` for PDF merging/manipulation (jsPDF can't merge existing PDFs)
- `@lillallol/outline-pdf` for PDF bookmarks
- Client-side generation (files downloaded from Supabase, merged in browser)
- 3-step wizard modal launched from ExhibitsTab

**Database:** New `compendiums` and `compendium_entries` tables

**Effort:** 3-4 weeks | **Priority:** P0 (most impactful, most feasible)

---

## Feature 2: CanLII Integration

**What:** Search and save Ontario case law from CanLII directly in the app. AI uses saved cases as context for legal analysis.

**Why it differentiates:** No case management tool integrates CanLII search with AI analysis in context of the user's specific matter.

**Technical approach:**
- CanLII REST API (metadata only, no full text) via server-side proxy
- New "Research" tab in right panel for browsing/saving cases
- Citation parser utility for resolving neutral citations (2024 ONSC 1234)
- Saved cases injected into AI legal context via `legalKnowledgeService`
- Auto-resolve citations in AI chat responses

**Limitation:** CanLII API has NO search endpoint — only browse by database + date. Full text requires user upload or server-side HTML fetch.

**Database:** New `canlii_saved_cases` table

**Dependency:** Must apply for CanLII API key (free, requires application)

**Effort:** 10-15 days | **Priority:** P1

---

## Feature 3: Smart Document Classification

**What:** Auto-classify uploaded documents into 65 Ontario legal document types (Statement of Claim, Termination Letter, Affidavit, etc.) with metadata extraction.

**Why it differentiates:** Transforms a file dump into a structured case file. No competitor does Ontario-specific classification.

**Technical approach:**
- Classification prompt runs during existing `processFile()` pipeline (step 3b, after text extraction)
- Uses gpt-4.1-mini (same as summaries) with JSON mode — adds ~$0.001/file, ~2s latency
- 65 document types across 11 categories (Court Filings, Employment, Financial, etc.)
- Extracts type-specific metadata (parties, dates, amounts, court file numbers) into JSONB column
- Filename-based pre-classification hints boost accuracy

**Database:** Add `classification_metadata JSONB`, `classification_confidence`, `classification_source`, `classified_at` columns to existing `files` table. The `document_type` column already exists (unused).

**UI:** Document type badge on file cards, filter by type in left panel, manual override popover, bulk classify endpoint for existing files.

**Effort:** 4-7 days | **Priority:** P0 (low effort, high impact, fits existing pipeline)

---

## Feature 4: Timeline Extraction & Visualization

**What:** AI extracts dates/events from documents, renders them on an interactive visual timeline. Export as litigation chronology.

**Why it differentiates:** Every litigation has a chronology. Building it manually from documents is tedious. Auto-extraction + interactive viz is unique.

**Technical approach:**
- Timeline extraction prompt runs during file processing (or manual "Build Timeline" action)
- Extracts: date, precision, title, description, category, parties, source quote, page reference
- Handles approximate dates ("early 2024" → date_precision: "approximate")
- Port the InteractiveTimeline component from the abuse-of-process app (~800 lines, Framer Motion, no external deps)
- New "Timeline" tab in CenterPanel (4th tab)
- Export as formatted DOCX/PDF chronology table

**Database:** New `timeline_events` table with date, category, source linkage, verification status

**Effort:** 3-5 weeks | **Priority:** P1

---

## Feature 5: Brief/Factum Drafting Assistant

**What:** Structured legal document drafting with Ontario factum templates, AI section-by-section generation, citation management, and court-formatted DOCX export.

**Why it differentiates:** Not generic "AI writing" — structured legal document generation following Ontario Rules of Civil Procedure with McGill Guide citations and exhibit cross-references.

**Technical approach:**
- Custom TipTap extensions: `DocumentSection` (collapsible structured sections), `LegalCitation` (inline marks with verification), `RecordReference` (links to exhibits/pages)
- Section-by-section AI generation via `/api/ai-draft-section` endpoint
- Citation picker searching legal_cases + legal_legislation
- Post-generation citation verification (flag unverified citations)
- Table of Authorities auto-generation from document_citations
- DOCX export with proper court formatting (margins, fonts, spacing, schedules)
- Templates: Court of Appeal Factum, Motion Factum, Demand Letter, Statement of Claim, etc.

**Database:** New `document_templates`, `document_citations` tables. Extend `notes` with `template_id` and `document_metadata`.

**Effort:** 2-3 weeks for Phase 1-2 (foundation + citations), 4+ weeks total | **Priority:** P2 (most complex, highest long-term value)

---

## Recommended Build Order

```
Phase 1 (Weeks 1-2):  Smart Document Classification (P0)
                       └── Fits existing pipeline, low risk, immediate value

Phase 2 (Weeks 2-4):  Exhibit Book Builder (P0)
                       └── Killer feature, standalone module, no dependencies

Phase 3 (Weeks 4-6):  Timeline Extraction (P1)
                       └── Leverages classification metadata, reuses existing component

Phase 4 (Weeks 6-8):  CanLII Integration (P1)
                       └── Requires API key application (start early), enriches AI

Phase 5 (Weeks 8-12): Brief Drafting Assistant (P2)
                       └── Builds on all previous features (classification, CanLII, exhibits, timeline)
```

## Cross-Feature Dependencies

```
Classification ──→ Timeline (categories inform event types)
Classification ──→ Brief Drafting (document type determines template)
CanLII ──────────→ Brief Drafting (citations from CanLII populate Table of Authorities)
Exhibits ────────→ Exhibit Book (existing exhibit system is the foundation)
Exhibits ────────→ Brief Drafting (record references link to exhibits)
Timeline ────────→ Brief Drafting (chronology informs Facts section)
```

---

*Generated 2026-03-15 by Claude Opus 4.6 research agents*

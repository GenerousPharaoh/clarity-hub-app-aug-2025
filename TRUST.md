# Trust and Data Handling

This document describes where data in Clarity Hub lives, which third-party
services process it, and what retention and training guarantees each
provider offers. It is written for firm procurement teams, compliance
officers, and individual practitioners evaluating the product against
their professional-responsibility obligations.

Last reviewed: 2026-04-17

---

## Current state (honest disclosure)

Clarity Hub is pre-v1. It has not been SOC 2 audited, does not carry a
Data Processing Addendum, and does not claim Canadian-only data residency.
A firm considering adoption for privileged client material should treat
this document as a starting point for diligence, not a representation.

---

## Data at rest

| Data type | Location | Notes |
|---|---|---|
| Postgres rows (projects, files, chat, annotations, timeline, drafts) | Supabase `wfxpkjjvjmmjvampvetb` in `ca-central-1` (Montréal) | Canadian residency for at-rest storage. Row-level security scoped through `projects.owner_id` and `projects_users` membership. |
| File binaries (PDFs, images, audio, video) | Supabase Storage `files` bucket, `ca-central-1` | Private bucket, 100 MB per-file limit, signed URLs with short TTL. |
| Vector embeddings | Postgres `document_chunks.embedding` (pgvector, 1536-dim) | `ca-central-1`. Derived from document text. |
| User authentication | Supabase Auth, `ca-central-1` | Google OAuth (PKCE). No password storage. No MFA yet. |

---

## Data in transit (sub-processors)

The table below enumerates every service that receives some portion of a
customer's data during normal operation. Each one is a separate diligence
target for a firm.

| Service | Purpose | Data sent | Region | Retention / training |
|---|---|---|---|---|
| Vercel | Serverless API runtime + static hosting | All API request bodies (document text, chat queries) | Default `iad1` (US-East, Virginia); regional pinning requires Pro plan | Vercel does not use customer data for training. Logs retained per plan; Pro adds 7-day runtime logs. |
| OpenAI (GPT-5.2, GPT-4.1, text-embedding-3-small, Whisper) | Deep legal reasoning, document classification, summary, timeline extraction, embeddings fallback, audio transcription | Document text, filenames, chat queries, transcripts | US | **OpenAI API does not use business-tier data for training.** Default abuse-monitoring retention: 30 days. Zero-retention available via Enterprise agreement only. |
| Google (Gemini 2.5 Flash) | Standard-effort chat model | Chat queries + retrieved context | US | **Gemini API does not use paid-tier data for training.** Logging policies vary by plan. |
| Voyage AI (voyage-law-2) | Legal-optimized embeddings when enabled | Document text chunks | US | Voyage's paid tier does not train on customer data. Free tier may be used for service improvement. |
| Cohere (Rerank) | Two-stage retrieval reranking | Query string + top-30 candidate chunk text (truncated to 500 chars) | US / Canada multi-region | Cohere does not use API data for training by default. |
| Mistral (mistral-ocr-latest) | Structured OCR for PDFs and images | Uploaded file binaries (PDFs, images) | EU (France) | Mistral API does not train on customer data. Files API retains uploads for up to 30 days unless deleted. |
| Tavily | Live web search for legal research | Search queries (user-entered + query-derived) | US | Short log retention; no model training on customer queries. |
| CanLII | Case law and legislation lookup | Neutral citations, court codes, query strings | Canada | CanLII is a non-profit Canadian legal database. No training concerns. |
| Resend (not yet integrated) | Transactional email | Recipient + body | US | See Resend terms. |

### Cross-border transfers

Several sub-processors above are US-based. Data sent to them crosses
the Canadian border under PIPEDA s. 4.1.3 (accountability for third-party
transfers). A firm adopting Clarity Hub for privileged material should
satisfy itself that either (a) the material is not privileged at the
point it enters the pipeline, or (b) the firm has client consent for
cross-border processing.

For firms who cannot accept cross-border processing, Clarity Hub is not
currently suitable — see "Roadmap" below.

---

## What Clarity Hub does NOT do

- Does **not** send user data to any AI provider not listed above.
- Does **not** train any model on customer data.
- Does **not** share matter contents with other Clarity Hub users.
- Does **not** call AI providers from the browser directly — all AI keys
  are server-side, so no provider sees a customer's identity from a
  browser fingerprint.
- Does **not** have human-in-the-loop review of matter contents by the
  Clarity Hub developer. RLS prevents direct customer-data access at the
  database layer.

---

## Data portability

Every project can be exported as a single ZIP archive containing:

- The original uploaded binaries (PDFs, images, documents, media).
- All metadata as pretty-printed JSON (one file per table).
- A README describing the cross-reference schema.

The archive uses open formats only — no Clarity-Hub-specific software is
required to read or repurpose the data. Export is available from the
project-card menu on the dashboard.

This directly addresses the "vendor lock-in" concern in firm procurement:
if Clarity Hub disappears tomorrow, a customer's entire matter library
is reconstructible from the ZIP archives they have on disk.

---

## Retention

- When a user deletes a file, `files.is_deleted` is set to `true`. The
  row is retained for 30 days to support undelete, then hard-deleted
  along with its binary.
- When a user deletes a project, it is hard-deleted immediately along
  with all its children (files, annotations, chat messages, drafts,
  timeline, etc.) via cascading foreign keys.
- When a user deletes their account, all projects they own are deleted
  via the same cascade. Shared projects (`projects_users`) revert to
  the remaining owners.
- Supabase-native database backups are kept per the current Supabase
  plan (7 days on Pro, not on free tier).

---

## Hallucination controls

AI-generated case citations are automatically verified against CanLII in
every assistant message. Citations resolve to one of four states:

- **Verified** (green): the case exists in CanLII; chip links to the
  real decision.
- **Not found** (red): CanLII has no matching decision; chip is
  struck-through and links to a manual CanLII search. These are
  almost always hallucinations.
- **Unverified** (amber): legislation reference or non-neutral format
  that can't be auto-checked; chip links to a CanLII search.
- **Pending**: verification in flight; copy is disabled and a banner
  warns the user not to paste yet.

When any citation is flagged, the clipboard copy action opens a
confirmation dialog listing the flagged citations and offering to append
a warning footer to the copied text. A firm-wide setting to make the
warning footer mandatory is on the roadmap.

---

## Roadmap toward firm-grade compliance

The following are not yet shipped and are the gating items for most
firm-level adoptions:

1. **Canadian-only processing path**. Requires either Vercel Enterprise
   regional pinning or migration of AI-calling endpoints to Supabase
   Edge Functions running in `ca-central-1`. Target: Q3 2026.
2. **SOC 2 Type II**. Observation period has not begun. No current
   timeline.
3. **Formal DPA**. Currently handled ad-hoc. Target: when first paid
   firm customer signs.
4. **Audit log**. Every mutation logged to an append-only table with
   user, timestamp, IP, and old/new values. Target: Q2 2026.
5. **SSO / MFA**. Google OAuth only today. Microsoft, Okta, and MFA
   are on the roadmap.
6. **Backup / DR testing**. Supabase's native backups are not yet
   regularly restored to validate recoverability.
7. **Second engineer**. Single-maintainer risk is real; noted openly.

---

## Reporting a vulnerability

Security issues should be reported privately to the email address in
the project README. We will acknowledge within 72 hours.

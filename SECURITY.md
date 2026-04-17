# Security Policy

**Effective date: 2026-04-17**

Clarity Hub processes legal and, by extension, privileged material. We
take security seriously and publish this policy so customers,
researchers, and firm procurement teams know exactly what to expect.

Read alongside TRUST.md (technical data flow), PRIVACY.md, DPA.md, and
TERMS.md.

---

## Reporting a vulnerability

Send a private report to the email address in the project README. Do
not open a public GitHub issue for security reports.

We will acknowledge receipt within 72 hours and will keep you updated
on investigation and remediation. We request that researchers avoid
actions that would degrade service availability, exfiltrate user data,
or violate privacy while investigating. In return we commit to:

- no legal action against researchers acting in good faith and within
  this policy;
- credit (where requested) in a public disclosure once remediation is
  complete;
- reasonable coordination on disclosure timing, typically within 90
  days of initial report.

## Scope

In scope:
- the production web application at its current public URL
- the Supabase project and storage bucket referenced in the repo
- the Vercel serverless API functions under `/api/*`
- Clarity Hub's own application code in this repository

Out of scope:
- sub-processors' infrastructure (please report those to the
  sub-processor directly): Supabase, Vercel, OpenAI, Google, Voyage
  AI, Cohere, Mistral, Tavily, CanLII
- denial-of-service testing
- physical attacks or social engineering of maintainers or
  sub-processor staff
- vulnerabilities requiring physical access to a user's device
- the demo-mode data set (synthetic, public)

## What we protect

Our security priorities, in order:

1. Customer data at rest (Supabase Canada region)
2. Customer data in transit (TLS, authenticated endpoints)
3. Authentication and session integrity (Google OAuth PKCE)
4. Sub-processor credential confidentiality (server-side-only keys)
5. Audit-trail integrity (append-only log)
6. Availability of the Service

## Security controls in place

### Identity
- Google OAuth via Supabase Auth (PKCE flow).
- No password storage.
- Session tokens scoped to project membership via row-level security.
- MFA is on the roadmap; see TRUST.md.

### Transport
- TLS 1.2+ on every endpoint, including sub-processor calls.
- HSTS on hosted domains.

### Storage
- AES-256 encryption at rest for database and object storage (managed
  by Supabase).
- Signed URLs for file downloads, short TTL.
- Single private `files` bucket; no public buckets.

### Access control
- Row-level security on every Postgres table scoped through project
  ownership or `projects_users` membership.
- AI and sub-processor API keys are server-side only. They never
  appear in the browser bundle.
- Service-role key is used exclusively in serverless functions to
  perform actions the user has already been authorized for.

### Application
- Input sanitization on all user content via DOMPurify for rendered
  HTML.
- CSP-compatible rendering; no inline event handlers.
- Rate limits on all AI endpoints (30 requests per user per minute).
- Supabase queries are typed; dynamic-table access is cast and
  filtered rather than interpolated from user input.

### Logging
- Operational logs retained by Vercel per plan.
- Audit log for key user-initiated mutations (file upload, project
  creation, file deletion, export) retained in Postgres for 18
  months.

### Dependencies
- Rolling updates; known-critical CVEs patched within seven (7)
  calendar days of disclosure.
- `npm audit` reviewed at each release.

## Incident response

If we identify or are notified of a security incident affecting
customer data, we will:

1. Contain the incident and preserve forensic evidence.
2. Assess scope (which accounts, which data categories, what
   sub-processors were involved).
3. Notify affected customers without undue delay and in any event
   within 72 hours of our determination that their Personal
   Information is involved.
4. Notify the Office of the Privacy Commissioner of Canada where
   required under PIPEDA section 10.1.
5. Publish a post-incident review within 30 days describing root
   cause, remediation, and preventive measures.

## What we do not yet have

Full firm-grade compliance takes time and investment. This section is
deliberately honest so a procurement team knows what they are and
are not getting:

- **No SOC 2 Type II** audit complete. Observation period has not
  begun. Target: a named timeline published in Q3 2026.
- **No ISO 27001** certification.
- **No penetration test report** from an independent firm. One is
  planned before first paid firm contract.
- **No MFA / SSO** beyond Google OAuth. On the roadmap.
- **No Canadian-only processing path** for AI steps. The serverless
  runtime and most AI sub-processors are US-based. On the roadmap.
- **Single maintainer.** Bus-factor risk is real and disclosed.

## Changes to this policy

Material changes will be announced via the project README and, for
firm customers, via direct email to the account on file.

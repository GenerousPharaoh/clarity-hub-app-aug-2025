# Privacy Notice

**Effective date: 2026-04-17**

This Privacy Notice describes how Clarity Hub collects, uses, stores,
and discloses personal information. It is written to the standard of
the Personal Information Protection and Electronic Documents Act
(PIPEDA) and Ontario's Personal Health Information Protection Act
(PHIPA) where the latter applies.

Read alongside TRUST.md (technical data-flow disclosure), TERMS.md
(terms of service), and DPA.md (data processing addendum for firm
customers).

---

## 1. The information we collect

### 1.1 Account information

When you sign up via Google OAuth we receive your email address, your
display name, and your Google avatar URL. We do not receive your Google
password or access any Google service other than the basic profile.

### 1.2 Content you upload or generate

This includes every document you upload, every annotation and highlight
you make, every chat message you send to the AI assistant, every
timeline event, every draft you write, every exhibit marker, and every
compendium configuration.

### 1.3 Derived information

We generate and store summaries, document classifications, timeline
extractions, vector embeddings, and full-text indexes from Your Content
to power retrieval and AI features.

### 1.4 Usage and technical data

We log basic request metadata (timestamps, endpoints called, response
status, user id) for operational and security purposes. We do not
maintain a per-page behavioural tracking profile. We do not use
third-party analytics or advertising cookies.

## 2. Purposes of collection

We collect and process personal information for the following purposes:

(a) to deliver the Service to you, including file processing, OCR,
classification, embedding, retrieval, AI chat, timeline extraction,
annotation, and export;
(b) to authenticate your identity and secure your account;
(c) to comply with applicable law, lawful production orders, and
professional-regulatory inquiries;
(d) to detect abuse, investigate security incidents, and enforce our
Terms;
(e) to communicate with you about service changes, incidents, and
matters you have asked about.

We do not use personal information for advertising, profiling outside
the Service, or for training any machine-learning model.

## 3. Where your information is processed

### 3.1 At rest (Canada)

Database rows and file binaries reside in Supabase's `ca-central-1`
region, located in Montréal, Quebec. This includes Postgres tables and
the `files` storage bucket.

### 3.2 In transit (cross-border)

Several processing steps are performed by US-based and EU-based
sub-processors. The complete list, including each sub-processor's
purpose, region, and retention commitment, is published in TRUST.md
and is updated whenever it changes.

In summary: server-side API functions run on Vercel (default region
`iad1`, Virginia, United States). AI processing is performed by
OpenAI, Google (Gemini), Voyage AI, Cohere, and Mistral. Live legal
web search uses Tavily. Citation lookup uses CanLII.

### 3.3 Consent for cross-border transfer

By using the Service you consent to the transfer of Your Content to
the jurisdictions listed in TRUST.md for the purposes of delivering
the Service. If you are a regulated professional, you are responsible
for obtaining any client consent required under your professional
rules before uploading client information that will be subject to
this transfer.

If you cannot accept cross-border transfer for a particular matter,
do not upload that matter's material to the Service at this time. A
Canadian-only processing path is on our roadmap (see TRUST.md).

## 4. Sharing

We share personal information only with the sub-processors listed in
TRUST.md, and only to the extent necessary to deliver the Service. We
bind each sub-processor contractually to use the data only for that
purpose and not for model training. We do not sell, rent, or
commercialize personal information.

We may disclose personal information if we are required to do so by
law, valid court order, subpoena, or lawful production request, or
where we believe on reasonable grounds that disclosure is necessary
to protect the safety or rights of users or the public. Where
permitted, we will notify the affected account before disclosing.

## 5. Retention

- Deleted files: soft-deleted for 30 days to support recovery, then
  hard-deleted along with binaries.
- Deleted projects: hard-deleted immediately via cascading foreign
  keys; all child rows (files, annotations, chat messages, drafts,
  timeline events, exhibits) are removed at the same time.
- Deleted accounts: all owned projects are hard-deleted; shared
  projects (via `projects_users`) revert to remaining owners.
- Derived embeddings, summaries, classifications, and full-text
  indexes are removed when the underlying file or project is
  deleted.
- Audit log entries (see SECURITY.md) are retained for 18 months
  and then deleted.

Operational backups taken by Supabase follow its native retention
schedule (7 days on Pro plans). Backups are destroyed when they age
out; we do not maintain separate long-term backups.

## 6. Your rights

Under PIPEDA and similar laws you have the right to:

(a) access the personal information we hold about you;
(b) correct or update inaccurate personal information;
(c) withdraw consent for any processing not required to deliver the
Service (by closing your account);
(d) request deletion of your personal information (by closing your
account and deleting your projects);
(e) make a complaint to the Office of the Privacy Commissioner of
Canada (www.priv.gc.ca) or your provincial commissioner.

To exercise any right, contact us at the email address in the README.
We will respond within 30 days.

## 7. Security

We protect personal information using industry-standard technical and
organizational measures, including:

- encryption in transit (TLS 1.2+) for all sub-processor traffic;
- encryption at rest for database and object storage (managed by
  Supabase);
- row-level security scoped to account ownership for every row in
  every table;
- server-side-only API keys for AI sub-processors (no AI keys in
  the browser bundle);
- per-user rate limits on AI endpoints to contain abuse;
- short-lived signed URLs for file downloads;
- vulnerability disclosure process described in SECURITY.md.

No system is perfectly secure. Our incident-response commitments are
in SECURITY.md.

## 8. Children

The Service is not directed at children under the age of majority in
your jurisdiction. We do not knowingly collect personal information
from minors. If you believe a minor has provided information to the
Service, contact us and we will delete it.

## 9. Changes

We may update this Privacy Notice from time to time. Material changes
will be announced at least 30 days in advance via email to the account
address and by in-app notice. The effective date at the top of this
page reflects the most recent revision.

## 10. Contact

Questions about this Privacy Notice or requests to exercise your
rights should be directed to the email address in the project README.

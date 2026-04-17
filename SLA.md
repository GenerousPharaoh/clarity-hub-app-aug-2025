# Service Level Commitments

**Effective date: 2026-04-17**

Clarity Hub is in pre-release. We do not yet publish binding Service
Level Agreements with financial credits. We do publish the operating
targets below so customers know what to expect and can hold us to
them during evaluation.

If you are a firm customer and need a binding SLA as a condition of
adoption, contact the email in the README; we will negotiate one in
the DPA signing process.

---

## Target availability

**Operating target:** 99.5% monthly availability of the production web
application and API, measured end-to-end from a synthetic health-check
endpoint.

Scheduled maintenance is announced at least 48 hours in advance via
in-app notice and is excluded from the availability calculation, up to
four (4) hours per calendar month.

## Target response times (support)

During pre-release, support is best-effort and provided by the
single maintainer:

| Severity | Definition | Response target |
|---|---|---|
| **S1** — Outage | Production is unavailable; data at risk | Acknowledge within 4 hours, hourly updates, engineer active until resolved |
| **S2** — Major | Major feature broken for most users | Acknowledge within 1 business day |
| **S3** — Minor | Limited-impact bug or question | Acknowledge within 3 business days |
| **S4** — Enhancement | Feature request, cosmetic | Acknowledge within 5 business days |

Contact for support is the email address in the project README.

## Target processing times (background)

These are operational targets, not guarantees, for common pipelines:

- File upload to availability: under 5 seconds for typical PDFs (< 10 MB).
- File processing (OCR + classification + embed + timeline): typically
  under 2 minutes for a 20-page PDF.
- AI chat response:
  - quick / standard effort: under 15 seconds typical
  - deep effort: under 60 seconds typical
- Project export: proportional to file count and size; typically a few
  seconds per 10 MB of binaries plus metadata.

Processing time depends on sub-processor load (Mistral, OpenAI,
Gemini, Cohere, Voyage, Tavily). We do not guarantee sub-processor
latency.

## Target recovery

- **Recovery Point Objective (RPO):** 24 hours. Supabase Pro native
  backups are taken daily.
- **Recovery Time Objective (RTO):** 24 hours for a region-level
  Supabase outage; 4 hours for an application-only outage.

We do not currently maintain multi-region failover.

## Status and incident history

A status page with current availability and historical incidents is
on the roadmap. During pre-release, incident notifications are sent
to the account email on file and, for firm customers, via direct
email to the DPA contact.

## Exclusions

Operating targets do not apply to:

- issues caused by user misconfiguration
- issues caused by Controller's network, device, or browser
- sub-processor outages beyond our control (we still notify and
  mitigate where possible)
- force majeure events
- scheduled maintenance announced in accordance with this document
- beta features clearly marked as such in the UI

# Data Processing Addendum

**Template last updated: 2026-04-17**

This Data Processing Addendum ("DPA") supplements the Terms of Service
between Clarity Hub ("Processor") and the customer entity identified
below ("Controller") and governs the Processor's handling of Personal
Information submitted to the Service.

> This template is intended for firm and enterprise customers. Solo
> users and demo-mode users are covered by the general Terms of Service
> and Privacy Notice and do not require a signed DPA. If you are a firm
> considering adoption, request a countersigned copy by contacting the
> email in the project README.

---

## 1. Definitions

**"Applicable Data Protection Law"** means PIPEDA, Ontario's Personal
Health Information Protection Act (where applicable), the General Data
Protection Regulation where Controller is in the EEA, and any other
privacy legislation applicable to the processing under this DPA.

**"Personal Information"** means information about an identifiable
individual that Controller submits to the Service.

**"Processing"** means any operation performed on Personal Information,
including collection, storage, use, disclosure, transfer, and
destruction.

**"Sub-processor"** means a third party engaged by Processor to assist
in Processing, as listed in Appendix A.

## 2. Scope and roles

2.1 For Personal Information submitted by Controller's authorized
users, Controller is the controller and Processor is the processor.

2.2 Processor Processes Personal Information only on documented
instructions from Controller. The instructions are set out in (a) the
Service itself (including the features Controller elects to use),
(b) the Terms of Service, and (c) this DPA. Any further instructions
must be mutually agreed in writing.

## 3. Purposes and categories

3.1 Purposes. Processor Processes Personal Information solely to
provide the Service: OCR, classification, summarization, embedding,
retrieval, AI chat, timeline extraction, citation verification, and
export.

3.2 Categories. The Personal Information Processed may include any
information Controller uploads to the Service, which in a legal
matter typically includes names, contact details, employment records,
medical records, correspondence, financial records, and the content
of pleadings and correspondence with opposing parties or regulators.

3.3 Data subjects. Processing may concern Controller's staff,
Controller's clients, opposing parties, witnesses, experts, and any
other individuals identified in matter documents.

## 4. Processor obligations

Processor:

(a) Processes Personal Information only on Controller's documented
instructions, including as to transfers to a third country, unless
required to do otherwise by Applicable Data Protection Law (in which
case Processor will notify Controller unless prohibited);

(b) ensures that persons authorized to Process Personal Information
are bound by confidentiality obligations;

(c) implements the technical and organizational measures described in
Appendix B;

(d) takes all measures required under Applicable Data Protection Law
in engaging Sub-processors, as described in Section 5;

(e) taking into account the nature of the Processing, assists
Controller in fulfilling its obligation to respond to requests for
exercising data-subject rights;

(f) assists Controller in ensuring compliance with security,
incident-notification, and impact-assessment obligations, taking
into account the nature of Processing and the information available
to Processor;

(g) at Controller's choice, deletes or returns all Personal
Information on termination, and deletes existing copies unless
Applicable Data Protection Law requires storage; and

(h) makes available to Controller all information necessary to
demonstrate compliance with this DPA and allows for and contributes
to audits.

## 5. Sub-processors

5.1 General authorization. Controller grants Processor general
authorization to engage the Sub-processors listed in Appendix A.

5.2 Notice of changes. Processor will give Controller at least thirty
(30) days' prior notice of any intended addition or replacement of
Sub-processors. Controller may object in writing within fifteen (15)
days, in which case the parties will work in good faith to identify a
resolution; failing resolution, Controller may terminate the affected
portion of the Service.

5.3 Processor obligations for Sub-processors. Processor imposes on
each Sub-processor the same data-protection obligations as apply under
this DPA, in particular providing sufficient guarantees to implement
appropriate technical and organizational measures. Processor remains
liable to Controller for the acts and omissions of its Sub-processors.

## 6. International transfers

6.1 Canadian residency at rest. Personal Information is stored in
Supabase's ca-central-1 region in Montréal, Quebec.

6.2 Cross-border Processing. Personal Information is transferred to
Sub-processors in the United States, the European Union, and other
jurisdictions identified in Appendix A for the purposes of Processing.

6.3 Transfer mechanisms. Where required, the parties rely on the
following mechanisms: (i) Controller's informed consent obtained via
the Service's first-use consent flow; (ii) the Standard Contractual
Clauses where Controller is in the EEA; and (iii) the Sub-processor's
own cross-border compliance (including the EU-US Data Privacy Framework
where the Sub-processor is certified).

## 7. Security

Processor maintains technical and organizational measures appropriate
to the nature, scope, and purposes of the Processing, as described in
Appendix B. Measures include encryption in transit and at rest,
row-level access control, server-side key management, rate limiting,
and an incident-response process.

## 8. Breach notification

Processor will notify Controller without undue delay, and in any event
within 72 hours, after becoming aware of a Personal Information breach
affecting Controller's Personal Information. The notification will
include, to the extent known, the nature of the breach, the categories
and approximate volume of records affected, the likely consequences,
and the measures taken or proposed to address the breach.

## 9. Data-subject rights

Processor provides Controller with tooling (in-app export and deletion)
that enables Controller to satisfy most data-subject requests. For
requests requiring Processor assistance beyond that tooling, Processor
will cooperate in good faith; Processor may charge reasonable fees for
time incurred beyond sixteen (16) hours per calendar year.

## 10. Records and audit

Processor maintains records of Processing activities sufficient to
demonstrate compliance. On reasonable written request (no more than
once per calendar year unless following a security incident), Processor
will provide Controller with a written description of technical and
organizational measures and a summary of its most recent security
review. On-site audits may be performed once per calendar year, during
business hours, on reasonable notice and at Controller's cost, subject
to confidentiality obligations.

## 11. Term and termination

This DPA is effective on the first day of Processing and continues
until Processor ceases to Process Personal Information under the
Terms of Service. Sections 8, 10, 12, and the obligations surrounding
deletion and return of Personal Information survive termination.

## 12. Liability

Each party's liability under this DPA is subject to the limitations
and exclusions in the Terms of Service, except where applicable law
prohibits such limitation in respect of the specific harm.

## 13. General

This DPA prevails over any inconsistent terms in the Terms of Service
to the extent of the inconsistency and to the extent the subject matter
relates to data protection. The parties may execute this DPA
electronically.

---

## Appendix A — Sub-processors

See TRUST.md for the live list. Controller acknowledges the list as
of the effective date of this DPA includes: Supabase (database and
storage, Canada), Vercel (application hosting, United States), OpenAI
(AI models, United States), Google / Gemini (AI models, United States),
Voyage AI (embeddings, United States), Cohere (rerank, Canada and
United States), Mistral (OCR, European Union), Tavily (web search,
United States), CanLII (case-law lookup, Canada).

## Appendix B — Technical and organizational measures

**Access control.** Account authentication via Google OAuth (PKCE).
Row-level security on every Postgres table scoped through project
ownership or explicit sharing. Service-role keys never exposed in the
browser bundle. Server-side AI keys.

**Transport security.** TLS 1.2+ on all API endpoints, storage
endpoints, and Sub-processor calls. HSTS enabled on hosted domains.

**At-rest encryption.** Database and object storage encrypted at rest
by Supabase using AES-256.

**Logical segregation.** Multi-tenant by account. No cross-account
reads are possible at the database layer.

**Rate limiting.** Per-user rate limits on all AI endpoints to contain
abuse.

**Logging.** Operational logs retained by Vercel per its plan; audit
log of key mutations retained for 18 months in Supabase.

**Software security.** All production code goes through peer review
(or, during the pre-release period, solo-maintainer review with
reliance on type checks and automated test suites). Dependencies are
updated on a rolling basis; known-critical CVEs are patched within
seven (7) calendar days of disclosure.

**Physical security.** Deferred to Sub-processors' colocation and
cloud providers.

**Backup and recovery.** Supabase Pro native backups (7-day retention).
No long-term long-term backups are maintained by Processor.

**Incident response.** As described in SECURITY.md.

---

## Signature block

For Controller:

    Name:
    Title:
    Date:
    Signature:

For Processor (Clarity Hub):

    Name:
    Title:
    Date:
    Signature:

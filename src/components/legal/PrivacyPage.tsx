import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      {/* Header */}
      <header className="border-b border-surface-200 bg-white/80 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-950/80">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm font-medium text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-surface-400" />
            <span className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
              Clarity Hub
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <article className="prose-legal">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            Last updated: April 2026
          </p>

          <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-surface-700 dark:text-surface-300">
            {/* Introduction */}
            <section>
              <p>
                Clarity Hub is a legal case management application developed and operated by
                Kareem Hassanein, an individual developer based in Ontario, Canada. This Privacy
                Policy explains how personal information is collected, used, disclosed, and
                protected when you use Clarity Hub, in accordance with the Personal Information
                Protection and Electronic Documents Act (PIPEDA).
              </p>
              <p className="mt-4">
                By creating an account or using Clarity Hub, you acknowledge that you have read
                and understood this Privacy Policy. If you do not agree with these practices,
                please do not use the service.
              </p>
            </section>

            {/* 1. Accountability */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                1. Accountability
              </h2>
              <p className="mt-3">
                Kareem Hassanein is responsible for personal information under Clarity Hub's
                control. Questions, concerns, or requests regarding this policy or data
                handling practices can be directed to:
              </p>
              <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 px-5 py-4 dark:border-surface-800 dark:bg-surface-900">
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  Kareem Hassanein
                </p>
                <p className="mt-1">
                  Email:{' '}
                  <a
                    href="mailto:kareem.hassanein@gmail.com"
                    className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                  >
                    kareem.hassanein@gmail.com
                  </a>
                </p>
              </div>
            </section>

            {/* 2. Identifying Purposes */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                2. Purposes for Collecting Personal Information
              </h2>
              <p className="mt-3">
                Clarity Hub collects and processes personal information for the following
                purposes:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Account management:
                  </strong>{' '}
                  Creating and maintaining your account, authenticating your identity via Google
                  OAuth, and associating your data with your profile.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    File storage and organization:
                  </strong>{' '}
                  Storing uploaded documents in Supabase storage infrastructure so that you can
                  organize, retrieve, and manage your case files.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    AI-powered analysis:
                  </strong>{' '}
                  Processing your documents and queries through AI services to provide features
                  such as document classification, text extraction (OCR), timeline generation,
                  search, summarization, and legal research assistance.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Case management:
                  </strong>{' '}
                  Enabling features such as exhibit marking, note-taking, chronology building,
                  and exhibit book compilation.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Service improvement:
                  </strong>{' '}
                  Understanding usage patterns to maintain, debug, and improve the application.
                </li>
              </ul>
              <p className="mt-3">
                Clarity Hub does not collect personal information for marketing, advertising, or
                profiling purposes.
              </p>
            </section>

            {/* 3. Consent */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                3. Consent
              </h2>
              <p className="mt-3">
                Consent is obtained in the following ways:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Account creation:
                  </strong>{' '}
                  By signing in with Google OAuth, you consent to the collection of your name,
                  email address, and profile image as provided by Google.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    File uploads:
                  </strong>{' '}
                  By uploading documents, you consent to their storage and processing as
                  described in this policy, including AI-powered analysis.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    AI features:
                  </strong>{' '}
                  AI analysis is an integral part of the document processing pipeline. By using
                  the service, you consent to your uploaded content being processed by the
                  third-party AI providers listed in Section 5.
                </li>
              </ul>
              <p className="mt-3">
                You may withdraw consent at any time by deleting your account and data (see
                Section 11). Note that withdrawing consent may affect the functionality
                available to you.
              </p>
            </section>

            {/* 4. Limiting Collection */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                4. Limiting Collection
              </h2>
              <p className="mt-3">
                Clarity Hub collects only the information necessary to provide the service:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    From Google OAuth:
                  </strong>{' '}
                  Name, email address, and profile image.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    From your use of the app:
                  </strong>{' '}
                  Files you upload, notes you create, exhibit markers, timeline events, AI chat
                  messages, and project metadata.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Automatically collected:
                  </strong>{' '}
                  Basic access logs for security and debugging purposes.
                </li>
              </ul>
              <p className="mt-3">
                Clarity Hub does not collect financial information, government identifiers, or
                biometric data. No information is collected from third-party data brokers or
                social media profiles beyond the Google OAuth scope described above.
              </p>
            </section>

            {/* 5. Limiting Use, Disclosure, and Retention */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                5. Use, Disclosure, and Retention
              </h2>

              <h3 className="mt-6 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                Use
              </h3>
              <p className="mt-2">
                Personal information is used only for the purposes identified in Section 2.
                Your case files and documents are never used to train AI models, serve
                advertising, or build user profiles for commercial purposes.
              </p>

              <h3 className="mt-6 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                Third-Party Processors
              </h3>
              <p className="mt-2">
                To provide Clarity Hub's features, your data may be processed by the following
                third-party service providers. Each is used under API-tier (enterprise)
                agreements, not consumer accounts. All providers listed below have confirmed
                that they do not use API inputs to train their models.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="pb-3 pr-4 text-left font-semibold text-surface-900 dark:text-surface-100">
                        Provider
                      </th>
                      <th className="pb-3 pr-4 text-left font-semibold text-surface-900 dark:text-surface-100">
                        Purpose
                      </th>
                      <th className="pb-3 text-left font-semibold text-surface-900 dark:text-surface-100">
                        Data Processing Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    <tr>
                      <td className="py-3 pr-4 font-medium text-surface-900 dark:text-surface-200">Supabase</td>
                      <td className="py-3 pr-4">Database, authentication, file storage</td>
                      <td className="py-3">Canada (ca-central-1, Montreal)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-surface-900 dark:text-surface-200">Vercel</td>
                      <td className="py-3 pr-4">Application hosting, serverless functions</td>
                      <td className="py-3">United States (serverless functions may execute in US regions)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-surface-900 dark:text-surface-200">OpenAI</td>
                      <td className="py-3 pr-4">AI chat, document analysis, embeddings (fallback)</td>
                      <td className="py-3">United States</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-surface-900 dark:text-surface-200">Google (Gemini)</td>
                      <td className="py-3 pr-4">AI chat, multimodal document analysis</td>
                      <td className="py-3">United States</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-surface-900 dark:text-surface-200">Mistral AI</td>
                      <td className="py-3 pr-4">OCR and text extraction from PDFs and images</td>
                      <td className="py-3">European Union (France)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-surface-900 dark:text-surface-200">Cohere</td>
                      <td className="py-3 pr-4">Search result reranking for retrieval accuracy</td>
                      <td className="py-3">United States / Canada</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-surface-900 dark:text-surface-200">Voyage AI</td>
                      <td className="py-3 pr-4">Legal-optimized document embeddings for search</td>
                      <td className="py-3">United States</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-surface-900 dark:text-surface-200">Tavily</td>
                      <td className="py-3 pr-4">Real-time web search for legal research</td>
                      <td className="py-3">United States</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="mt-6 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                Cross-Border Transfers
              </h3>
              <p className="mt-2">
                Your primary data (database, files, authentication) is stored in Canada
                (AWS ca-central-1, Montreal) via Supabase. However, when AI features process
                your content, data is transmitted to the providers listed above, some of which
                operate in the United States and the European Union. These transfers are
                necessary to provide the AI-powered features of the service. All transfers
                occur over encrypted connections (TLS 1.2+), and all providers are accessed
                under API-tier agreements that prohibit the use of your data for model training.
              </p>

              <h3 className="mt-6 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                Retention
              </h3>
              <p className="mt-2">
                Your data is retained for as long as you maintain an active account. AI
                providers process your data in real-time and do not retain inputs beyond what is
                necessary to complete the request (typically seconds to minutes, as defined by
                each provider's data processing agreement). If you delete your account, your
                data will be removed within 30 days (see Section 11).
              </p>
            </section>

            {/* 6. Accuracy */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                6. Accuracy
              </h2>
              <p className="mt-3">
                Clarity Hub relies on you to provide accurate information. You can update your
                profile information at any time through your account settings. If you become
                aware that information associated with your account is inaccurate, you may
                correct it directly or contact us for assistance.
              </p>
            </section>

            {/* 7. Safeguards */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                7. Safeguards
              </h2>
              <p className="mt-3">
                Clarity Hub implements the following technical and organizational measures to
                protect your information:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Encryption in transit:
                  </strong>{' '}
                  All data transmitted between your browser, the application servers, and
                  third-party services is encrypted using TLS 1.2 or higher.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Encryption at rest:
                  </strong>{' '}
                  Data stored in Supabase (database and file storage) is encrypted at rest
                  using AES-256 encryption.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Row-Level Security (RLS):
                  </strong>{' '}
                  All database tables are protected by Supabase Row-Level Security policies,
                  ensuring that users can only access data belonging to their own projects.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Authentication:
                  </strong>{' '}
                  Authentication is handled by Supabase Auth using the PKCE (Proof Key for Code
                  Exchange) OAuth flow, which protects against authorization code interception.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Signed URLs:
                  </strong>{' '}
                  Stored files are accessed through time-limited signed URLs, preventing
                  unauthorized direct access.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    SOC 2 compliant infrastructure:
                  </strong>{' '}
                  Supabase and Vercel both maintain SOC 2 Type II compliance for their hosting
                  infrastructure.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Server-side API keys:
                  </strong>{' '}
                  All AI provider API keys are stored as server-side environment variables and
                  are never exposed to the client browser.
                </li>
              </ul>
            </section>

            {/* 8. Openness */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                8. Openness
              </h2>
              <p className="mt-3">
                This Privacy Policy is publicly available and describes Clarity Hub's
                information handling practices. If this policy is updated, the "Last updated"
                date at the top of this page will be revised, and material changes will be
                communicated to registered users via the email address associated with their
                account.
              </p>
            </section>

            {/* 9. Individual Access */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                9. Individual Access
              </h2>
              <p className="mt-3">
                You have the right to request access to the personal information Clarity Hub
                holds about you. To make an access request, contact{' '}
                <a
                  href="mailto:kareem.hassanein@gmail.com"
                  className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                >
                  kareem.hassanein@gmail.com
                </a>
                . Requests will be responded to within 30 days, as required by PIPEDA.
              </p>
              <p className="mt-3">
                In most cases, you can also directly access, download, or export your data
                through the application itself (files, notes, exhibits, and chat history are
                all visible within your projects).
              </p>
            </section>

            {/* 10. Challenging Compliance */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                10. Challenging Compliance
              </h2>
              <p className="mt-3">
                If you believe that Clarity Hub has not handled your personal information in
                accordance with this policy or PIPEDA, you may:
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-6">
                <li>
                  Contact Kareem Hassanein at{' '}
                  <a
                    href="mailto:kareem.hassanein@gmail.com"
                    className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                  >
                    kareem.hassanein@gmail.com
                  </a>{' '}
                  to resolve the concern directly. You will receive a response within 30 days.
                </li>
                <li>
                  If the matter is not resolved to your satisfaction, you may file a complaint
                  with the Office of the Privacy Commissioner of Canada (OPC) at{' '}
                  <a
                    href="https://www.priv.gc.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                  >
                    www.priv.gc.ca
                  </a>{' '}
                  or by calling 1-800-282-1376.
                </li>
              </ol>
            </section>

            {/* Data Breach Notification */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                11. Data Breach Notification
              </h2>
              <p className="mt-3">
                In the event of a breach of security safeguards involving personal information
                that poses a real risk of significant harm, Clarity Hub will:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  Notify affected users as soon as feasible, describing the nature of the
                  breach and the information involved.
                </li>
                <li>
                  Report the breach to the Office of the Privacy Commissioner of Canada, as
                  required under PIPEDA's breach notification provisions.
                </li>
                <li>
                  Take reasonable steps to reduce the risk of harm resulting from the breach.
                </li>
              </ul>
            </section>

            {/* Health Information */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                12. Health and Sensitive Information
              </h2>
              <p className="mt-3">
                Clarity Hub is designed for legal case management. Depending on the nature of
                your cases, uploaded documents may contain health records, financial
                information, or other sensitive personal information about third parties.
              </p>
              <p className="mt-3">
                Such information is treated as sensitive under PIPEDA and is subject to the same
                safeguards described in Section 7. Clarity Hub does not independently categorize
                or flag health information within uploaded documents. It is your responsibility
                to ensure that your collection, use, and storage of third-party personal
                information complies with applicable privacy legislation, including the Personal
                Health Information Protection Act (PHIPA) where applicable.
              </p>
            </section>

            {/* Solicitor-Client Privilege */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                13. Solicitor-Client Privilege
              </h2>
              <p className="mt-3">
                Clarity Hub's AI features use API-tier services from the providers listed in
                Section 5. These providers have confirmed that API inputs are not used to train
                their models and are not retained beyond what is necessary to fulfill the
                request.
              </p>
              <p className="mt-3">
                However, the use of any third-party service to process privileged or
                confidential communications may have implications for solicitor-client
                privilege. Users should independently assess whether submitting specific
                documents or queries to AI-powered features is appropriate given the
                privilege and confidentiality considerations of their particular matter. Clarity
                Hub does not provide legal advice on this question.
              </p>
            </section>

            {/* Cookies and Local Storage */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                14. Cookies and Local Storage
              </h2>
              <p className="mt-3">
                Clarity Hub uses the following browser-side storage mechanisms:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Supabase authentication cookies:
                  </strong>{' '}
                  Essential cookies set by Supabase to maintain your authenticated session.
                  These are strictly necessary for the application to function.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Local storage:
                  </strong>{' '}
                  Used to persist user preferences such as theme selection (light/dark/system),
                  panel layout sizes, and UI state. This data remains on your device and is not
                  transmitted to any server.
                </li>
              </ul>
              <p className="mt-3">
                Clarity Hub does not use analytics cookies, advertising trackers, or any
                third-party tracking scripts.
              </p>
            </section>

            {/* Data Deletion */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                15. Data Deletion
              </h2>
              <p className="mt-3">
                You may request deletion of your account and all associated data by contacting{' '}
                <a
                  href="mailto:kareem.hassanein@gmail.com"
                  className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                >
                  kareem.hassanein@gmail.com
                </a>
                . Upon receiving a deletion request:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Your user profile and authentication records will be deleted.</li>
                <li>All projects, uploaded files, notes, exhibits, timeline events, chat messages, and document embeddings associated with your account will be permanently deleted.</li>
                <li>Deletion will be completed within 30 days of the request.</li>
                <li>Backups containing your data may persist for up to an additional 30 days before being purged through normal backup rotation.</li>
              </ul>
              <p className="mt-3">
                You may also delete individual projects and their associated files directly
                within the application at any time.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                16. Changes to This Policy
              </h2>
              <p className="mt-3">
                This Privacy Policy may be updated from time to time. Material changes will be
                communicated to registered users via email. The "Last updated" date at the top
                of this page indicates the most recent revision. Continued use of Clarity Hub
                after a policy change constitutes acceptance of the revised policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                17. Contact
              </h2>
              <p className="mt-3">
                For any questions or concerns about this Privacy Policy or Clarity Hub's data
                handling practices, please contact:
              </p>
              <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 px-5 py-4 dark:border-surface-800 dark:bg-surface-900">
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  Kareem Hassanein
                </p>
                <p className="mt-1">
                  Email:{' '}
                  <a
                    href="mailto:kareem.hassanein@gmail.com"
                    className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                  >
                    kareem.hassanein@gmail.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </article>

        {/* Footer links */}
        <footer className="mt-16 border-t border-surface-200 pt-8 dark:border-surface-800">
          <div className="flex flex-wrap gap-6 text-sm text-surface-500 dark:text-surface-400">
            <Link
              to="/terms"
              className="underline decoration-surface-300 underline-offset-2 hover:text-surface-900 hover:decoration-surface-500 dark:decoration-surface-600 dark:hover:text-surface-100"
            >
              Terms of Service
            </Link>
            <Link
              to="/login"
              className="underline decoration-surface-300 underline-offset-2 hover:text-surface-900 hover:decoration-surface-500 dark:decoration-surface-600 dark:hover:text-surface-100"
            >
              Sign in
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

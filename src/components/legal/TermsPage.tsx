import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';

export function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            Last updated: April 2026
          </p>

          <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-surface-700 dark:text-surface-300">
            {/* 1. Agreement */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                1. Agreement to Terms
              </h2>
              <p className="mt-3">
                These Terms of Service ("Terms") govern your access to and use of Clarity Hub,
                a legal case management application developed and operated by Kareem Hassanein
                ("Developer"). By creating an account or using Clarity Hub, you agree to be
                bound by these Terms and the{' '}
                <Link
                  to="/privacy"
                  className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="mt-3">
                If you do not agree to these Terms, do not use the service.
              </p>
            </section>

            {/* 2. Service Description */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                2. Service Description
              </h2>
              <p className="mt-3">
                Clarity Hub is a web-based legal case management tool that enables users to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Upload, organize, and store legal documents and case files.</li>
                <li>Annotate PDFs with highlights, notes, and exhibit markers.</li>
                <li>Generate AI-powered document summaries, timelines, and classifications.</li>
                <li>Conduct AI-assisted legal research using natural language queries grounded in uploaded documents.</li>
                <li>Build exhibit books and compile case materials.</li>
                <li>Create and manage notes, chronologies, and draft documents.</li>
              </ul>
              <p className="mt-3">
                Clarity Hub is a tool to assist with legal case management. It is not a law
                firm, does not provide legal advice, and does not create a solicitor-client
                relationship between the Developer and any user.
              </p>
            </section>

            {/* 3. Account and Access */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                3. Account and Access
              </h2>
              <p className="mt-3">
                To use Clarity Hub, you must sign in with a Google account. You are responsible
                for:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Maintaining the security of your Google account credentials.</li>
                <li>All activity that occurs under your account.</li>
                <li>Promptly notifying the Developer if you become aware of any unauthorized use of your account.</li>
              </ul>
              <p className="mt-3">
                The Developer reserves the right to suspend or terminate accounts that violate
                these Terms or that are used for purposes that compromise the security or
                integrity of the service.
              </p>
            </section>

            {/* 4. User Responsibilities */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                4. User Responsibilities
              </h2>

              <h3 className="mt-6 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                Your Data
              </h3>
              <p className="mt-2">
                You retain full ownership of all documents, files, notes, and other content you
                upload to or create within Clarity Hub ("User Content"). You are solely
                responsible for:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>The legality, accuracy, and appropriateness of all User Content.</li>
                <li>Ensuring that your use of Clarity Hub complies with applicable laws, professional obligations, and ethical rules.</li>
                <li>Maintaining your own backups of important files and data.</li>
              </ul>

              <h3 className="mt-6 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                Privilege and Confidentiality
              </h3>
              <p className="mt-2">
                If you are a lawyer or paralegal, you are responsible for determining whether
                uploading specific documents to Clarity Hub is consistent with your professional
                obligations regarding solicitor-client privilege and confidentiality. While
                Clarity Hub implements technical safeguards (encryption, RLS, API-tier AI
                providers that do not train on inputs), the decision to use any cloud-based
                tool for privileged or confidential materials rests with you. The Developer does
                not provide legal advice on this question.
              </p>

              <h3 className="mt-6 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                Third-Party Personal Information
              </h3>
              <p className="mt-2">
                Case files often contain personal information about third parties. You are
                responsible for ensuring that your collection, storage, and processing of
                third-party personal information through Clarity Hub complies with PIPEDA, the
                Personal Health Information Protection Act (PHIPA), and any other applicable
                privacy legislation.
              </p>

              <h3 className="mt-6 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
                Prohibited Uses
              </h3>
              <p className="mt-2">
                You agree not to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Use Clarity Hub for any unlawful purpose or in violation of any applicable law.</li>
                <li>Attempt to gain unauthorized access to any part of the service, other users' accounts, or any systems connected to the service.</li>
                <li>Interfere with or disrupt the integrity or performance of the service.</li>
                <li>Upload content that contains malware, viruses, or other harmful code.</li>
                <li>Use the service to store or transmit content that infringes on the intellectual property rights of others.</li>
                <li>Reverse engineer, decompile, or disassemble any part of the service.</li>
              </ul>
            </section>

            {/* 5. AI Features */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                5. AI Features and Limitations
              </h2>
              <p className="mt-3">
                Clarity Hub incorporates AI-powered features including document classification,
                OCR text extraction, timeline generation, summarization, embedding-based
                search, and a legal research chat assistant. These features are provided subject
                to the following important limitations:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    AI outputs are not legal advice.
                  </strong>{' '}
                  AI-generated summaries, classifications, timelines, search results, and chat
                  responses are computational outputs, not professional legal opinions. They may
                  contain errors, omissions, or hallucinated content.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Independent verification required.
                  </strong>{' '}
                  All AI outputs must be independently reviewed and verified by a qualified
                  legal professional before being relied upon for any legal purpose. Do not
                  submit AI-generated content to a court or tribunal without independent
                  verification.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    No guarantee of accuracy or completeness.
                  </strong>{' '}
                  AI models may produce incorrect information, miss relevant details, or cite
                  non-existent sources. The Developer makes no representations about the
                  accuracy, reliability, or completeness of AI-generated content.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Data processing by third parties.
                  </strong>{' '}
                  AI features require your content to be processed by third-party AI providers
                  (OpenAI, Google Gemini, Mistral AI, Cohere, Voyage AI, and Tavily). All
                  providers are accessed via API-tier services and have confirmed that they do
                  not use API inputs to train their models. See the{' '}
                  <Link
                    to="/privacy"
                    className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                  >
                    Privacy Policy
                  </Link>{' '}
                  for details.
                </li>
                <li>
                  <strong className="text-surface-900 dark:text-surface-100">
                    Availability.
                  </strong>{' '}
                  AI features depend on the availability of third-party services and may be
                  temporarily unavailable due to outages, rate limits, or changes by those
                  providers. The Developer is not responsible for interruptions caused by
                  third-party service availability.
                </li>
              </ul>
            </section>

            {/* 6. Data Processing Consent */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                6. Data Processing
              </h2>
              <p className="mt-3">
                By using Clarity Hub, you consent to the processing of your User Content as
                described in the{' '}
                <Link
                  to="/privacy"
                  className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                >
                  Privacy Policy
                </Link>
                , including:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Storage of your files and data on Supabase infrastructure in Canada (ca-central-1, Montreal).</li>
                <li>Processing of your content by AI providers, some of which operate in the United States and the European Union, for the purpose of delivering AI-powered features.</li>
                <li>Generation and storage of document embeddings (vector representations) for search functionality.</li>
              </ul>
            </section>

            {/* 7. Intellectual Property */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                7. Intellectual Property
              </h2>
              <p className="mt-3">
                The Clarity Hub application, including its source code, design, interface,
                documentation, and branding, is the intellectual property of Kareem Hassanein.
                These Terms do not grant you any rights to the Developer's intellectual
                property beyond a limited, non-exclusive, non-transferable license to use the
                service for its intended purpose.
              </p>
              <p className="mt-3">
                You retain full ownership of your User Content. By uploading content to Clarity
                Hub, you grant the Developer a limited license to store, process, and display
                that content solely to provide the service to you. This license terminates when
                you delete the content or your account.
              </p>
            </section>

            {/* 8. Limitation of Liability */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                8. Limitation of Liability
              </h2>
              <p className="mt-3">
                To the maximum extent permitted by applicable law:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  The Developer shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages, including but not limited to loss of data,
                  loss of revenue, loss of business opportunities, or damages arising from
                  reliance on AI-generated outputs.
                </li>
                <li>
                  The Developer's total aggregate liability for any claims arising from or
                  related to the service shall not exceed the amount you have paid, if any,
                  for access to Clarity Hub in the twelve (12) months preceding the claim.
                </li>
                <li>
                  The Developer is not liable for any damages or losses resulting from: (a) your
                  reliance on AI-generated content without independent verification; (b) your
                  decisions regarding solicitor-client privilege or confidentiality; (c)
                  unauthorized access to your account resulting from your failure to secure your
                  credentials; (d) the unavailability of third-party services; or (e) data loss
                  resulting from circumstances beyond the Developer's reasonable control.
                </li>
              </ul>
            </section>

            {/* 9. Disclaimer of Warranties */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                9. Disclaimer of Warranties
              </h2>
              <p className="mt-3">
                Clarity Hub is provided on an "as-is" and "as-available" basis. To the maximum
                extent permitted by applicable law, the Developer disclaims all warranties,
                express or implied, including but not limited to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</li>
                <li>Any warranty that the service will be uninterrupted, error-free, or free of viruses or other harmful components.</li>
                <li>Any warranty regarding the accuracy, reliability, or completeness of AI-generated content.</li>
                <li>Any warranty that the service will meet your specific requirements.</li>
              </ul>
              <p className="mt-3">
                The Developer does not warrant that the security measures implemented are
                impenetrable. While reasonable safeguards are maintained, no system connected to
                the internet can guarantee absolute security.
              </p>
            </section>

            {/* 10. Indemnification */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                10. Indemnification
              </h2>
              <p className="mt-3">
                You agree to indemnify and hold harmless the Developer from any claims,
                damages, losses, liabilities, and expenses (including reasonable legal fees)
                arising from: (a) your use of the service; (b) your User Content; (c) your
                violation of these Terms; or (d) your violation of any applicable law or the
                rights of any third party.
              </p>
            </section>

            {/* 11. Service Availability */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                11. Service Availability and Modifications
              </h2>
              <p className="mt-3">
                The Developer reserves the right to modify, suspend, or discontinue any part of
                the service at any time, with or without notice. The Developer will make
                reasonable efforts to provide advance notice of material changes, but is not
                obligated to maintain any specific feature or functionality.
              </p>
              <p className="mt-3">
                The service depends on third-party infrastructure (Supabase, Vercel, AI
                providers). The Developer is not responsible for outages or service degradation
                caused by those third parties.
              </p>
            </section>

            {/* 12. Termination */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                12. Termination
              </h2>
              <p className="mt-3">
                You may stop using Clarity Hub at any time. You may request deletion of your
                account and data as described in the{' '}
                <Link
                  to="/privacy"
                  className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="mt-3">
                The Developer may terminate or suspend your access to the service at any time
                for violation of these Terms or for any other reason, with reasonable notice
                where circumstances permit. Upon termination, your right to use the service
                ceases immediately, but you may request an export of your data within 30 days
                of termination.
              </p>
            </section>

            {/* 13. Governing Law */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                13. Governing Law and Dispute Resolution
              </h2>
              <p className="mt-3">
                These Terms are governed by and construed in accordance with the laws of the
                Province of Ontario and the federal laws of Canada applicable therein, without
                regard to conflict of law principles.
              </p>
              <p className="mt-3">
                Any disputes arising out of or relating to these Terms or the service shall be
                subject to the exclusive jurisdiction of the courts of the Province of Ontario,
                sitting in the City of Burlington or the Regional Municipality of Halton.
              </p>
            </section>

            {/* 14. Changes to Terms */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                14. Changes to These Terms
              </h2>
              <p className="mt-3">
                The Developer reserves the right to update these Terms at any time. Material
                changes will be communicated to registered users via the email address
                associated with their account. The "Last updated" date at the top of this page
                indicates the most recent revision.
              </p>
              <p className="mt-3">
                Continued use of Clarity Hub after changes to these Terms constitutes acceptance
                of the revised Terms. If you do not agree with any changes, you must stop using
                the service and may request deletion of your account.
              </p>
            </section>

            {/* 15. Severability */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                15. Severability
              </h2>
              <p className="mt-3">
                If any provision of these Terms is found to be unenforceable or invalid by a
                court of competent jurisdiction, that provision will be limited or eliminated to
                the minimum extent necessary, and the remaining provisions will continue in
                full force and effect.
              </p>
            </section>

            {/* 16. Entire Agreement */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                16. Entire Agreement
              </h2>
              <p className="mt-3">
                These Terms, together with the{' '}
                <Link
                  to="/privacy"
                  className="text-accent-600 underline decoration-accent-600/30 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-400/30 dark:hover:decoration-accent-400"
                >
                  Privacy Policy
                </Link>
                , constitute the entire agreement between you and the Developer regarding your
                use of Clarity Hub, and supersede any prior agreements or understandings.
              </p>
            </section>

            {/* 17. Contact */}
            <section>
              <h2 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
                17. Contact
              </h2>
              <p className="mt-3">
                For questions about these Terms, please contact:
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
              to="/privacy"
              className="underline decoration-surface-300 underline-offset-2 hover:text-surface-900 hover:decoration-surface-500 dark:decoration-surface-600 dark:hover:text-surface-100"
            >
              Privacy Policy
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

/**
 * Built-in prompt templates for the AI Task Library.
 *
 * Each template targets a common Ontario employment-law workflow
 * so users can launch focused analysis with a single click.
 */

export type TemplateCategory =
  | 'evidence_analysis'
  | 'legal_research'
  | 'drafting'
  | 'timeline'
  | 'strategy';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Lucide icon name (used to look up the component in the UI) */
  icon: string;
  /** The actual prompt text sent to the AI chat */
  promptText: string;
  suggestedEffort: 'standard' | 'deep';
  requiresFileContext: boolean;
}

export const TEMPLATE_CATEGORIES: { key: TemplateCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'evidence_analysis', label: 'Evidence' },
  { key: 'legal_research', label: 'Research' },
  { key: 'drafting', label: 'Drafting' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'strategy', label: 'Strategy' },
];

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ── Evidence Analysis ──────────────────────────────────────────────
  {
    id: 'summarize-document',
    name: 'Summarize Document',
    description: 'Extract key facts, dates, parties, and significance from the selected file.',
    category: 'evidence_analysis',
    icon: 'FileText',
    promptText:
      'Summarize this document. Extract and organize: (1) key facts, (2) important dates, (3) parties involved, (4) legal significance, and (5) any action items or next steps implied by the content.',
    suggestedEffort: 'standard',
    requiresFileContext: true,
  },
  {
    id: 'find-contradictions',
    name: 'Find Contradictions',
    description: 'Compare the selected file against other project documents for inconsistencies.',
    category: 'evidence_analysis',
    icon: 'GitCompare',
    promptText:
      'Compare the selected file against the other documents in this project. Identify any contradictions, inconsistencies, or conflicting accounts regarding dates, facts, or statements. For each contradiction found, cite the specific passages from each document.',
    suggestedEffort: 'deep',
    requiresFileContext: true,
  },
  {
    id: 'extract-admissions',
    name: 'Extract Admissions',
    description: 'Find statements against interest by the opposing party.',
    category: 'evidence_analysis',
    icon: 'Quote',
    promptText:
      'Review the selected document and identify any admissions or statements against interest made by the opposing party. For each admission: (1) quote the exact language, (2) explain why it is adverse to their position, and (3) note which legal issue it is relevant to.',
    suggestedEffort: 'deep',
    requiresFileContext: true,
  },
  {
    id: 'assess-credibility',
    name: 'Assess Credibility',
    description: 'Evaluate internal consistency and reliability of a document or statement.',
    category: 'evidence_analysis',
    icon: 'ShieldCheck',
    promptText:
      'Assess the credibility and internal consistency of this document. Identify: (1) any self-contradictions, (2) vague or evasive language, (3) claims that are implausible or unverifiable, (4) areas where the account is consistent and detailed, and (5) overall reliability for evidentiary purposes.',
    suggestedEffort: 'deep',
    requiresFileContext: true,
  },

  // ── Legal Research ─────────────────────────────────────────────────
  {
    id: 'bardal-factors',
    name: 'Bardal Factors Analysis',
    description: 'Calculate reasonable notice based on age, tenure, character of employment, and availability.',
    category: 'legal_research',
    icon: 'Scale',
    promptText:
      'Perform a Bardal factors analysis to calculate reasonable notice. Consider: (1) character of employment, (2) length of service, (3) age of the employee, and (4) availability of similar employment. Cite comparable Ontario case law for the proposed range and explain how each factor weighs in this case.',
    suggestedEffort: 'deep',
    requiresFileContext: false,
  },
  {
    id: 'termination-clause-review',
    name: 'Termination Clause Review',
    description: 'Assess enforceability of a termination clause post-Waksdale.',
    category: 'legal_research',
    icon: 'FileSearch',
    promptText:
      'Review the termination and severance provisions in the employment contract. Analyze enforceability under the Waksdale v Swegon framework: (1) does the for-cause clause comply with the ESA, (2) does the without-cause clause meet ESA minimums, (3) are the clauses ambiguous, and (4) is there a severability clause and would it save the provisions? Cite relevant Ontario case law.',
    suggestedEffort: 'deep',
    requiresFileContext: true,
  },
  {
    id: 'human-rights-nexus',
    name: 'Human Rights Nexus',
    description: 'Prima facie discrimination analysis using the Moore v BC (Education) test.',
    category: 'legal_research',
    icon: 'Gavel',
    promptText:
      'Analyze whether a prima facie case of discrimination exists under the Ontario Human Rights Code using the Moore v British Columbia (Education) test: (1) identify the protected ground(s), (2) did the complainant experience adverse treatment, and (3) was the protected ground a factor in the adverse treatment? Also consider the duty to accommodate to the point of undue hardship.',
    suggestedEffort: 'deep',
    requiresFileContext: false,
  },
  {
    id: 'esa-entitlements',
    name: 'ESA Entitlements',
    description: 'Calculate statutory minimum notice and severance under the Employment Standards Act.',
    category: 'legal_research',
    icon: 'Calculator',
    promptText:
      'Calculate the minimum statutory entitlements under the Employment Standards Act, 2000 for this employee. Include: (1) notice of termination or pay in lieu (s. 57-58), (2) severance pay eligibility and amount (s. 64-65), (3) any outstanding vacation pay, and (4) benefit continuation obligations. State all assumptions clearly.',
    suggestedEffort: 'standard',
    requiresFileContext: false,
  },

  // ── Drafting ───────────────────────────────────────────────────────
  {
    id: 'improve-draft',
    name: 'Improve Draft Section',
    description: 'Strengthen legal writing for clarity, precision, and persuasiveness.',
    category: 'drafting',
    icon: 'PenTool',
    promptText:
      'Review and improve this draft section. Focus on: (1) legal precision and correct terminology, (2) persuasive structure (IRAC where appropriate), (3) removing unnecessary qualifiers or vague language, (4) ensuring all factual claims are supported, and (5) improving readability. Provide the revised version with tracked changes explained.',
    suggestedEffort: 'standard',
    requiresFileContext: true,
  },
  {
    id: 'generate-demand-letter',
    name: 'Generate Demand Letter',
    description: 'Draft a demand letter grounded in the project evidence.',
    category: 'drafting',
    icon: 'Mail',
    promptText:
      'Draft a demand letter based on the evidence in this project. Include: (1) a concise statement of facts, (2) the legal basis for the claim (breach of contract, ESA violations, Human Rights Code, as applicable), (3) a clear calculation of damages sought, (4) a reasonable deadline for response, and (5) consequences of non-compliance. Use professional but firm language appropriate for Ontario employment disputes.',
    suggestedEffort: 'deep',
    requiresFileContext: false,
  },

  // ── Timeline ───────────────────────────────────────────────────────
  {
    id: 'extract-chronology',
    name: 'Extract Chronology',
    description: 'Pull all dated events from a document into a structured timeline.',
    category: 'timeline',
    icon: 'Calendar',
    promptText:
      'Extract a chronology of all dated events from this document. For each event provide: (1) date (exact or approximate), (2) description of what occurred, (3) parties involved, and (4) significance to the case. Present in chronological order. Note any events with ambiguous or conflicting dates.',
    suggestedEffort: 'standard',
    requiresFileContext: true,
  },
  {
    id: 'identify-timeline-gaps',
    name: 'Identify Timeline Gaps',
    description: 'Find missing periods or unexplained gaps in the evidentiary record.',
    category: 'timeline',
    icon: 'AlertTriangle',
    promptText:
      'Review the timeline of events in this project and identify: (1) gaps where significant time passes without documented events, (2) periods where key actions likely occurred but are not evidenced, (3) discrepancies in the sequence of events across different documents, and (4) recommendations for what evidence might fill these gaps.',
    suggestedEffort: 'deep',
    requiresFileContext: false,
  },

  // ── Strategy ───────────────────────────────────────────────────────
  {
    id: 'strengths-weaknesses',
    name: 'Case Strengths & Weaknesses',
    description: 'Balanced assessment of the strongest and weakest aspects of the case.',
    category: 'strategy',
    icon: 'BarChart3',
    promptText:
      'Provide a balanced assessment of this case. Identify: (1) the three strongest arguments and evidence supporting the claim, (2) the three most significant weaknesses or risks, (3) any evidentiary gaps that need to be addressed, and (4) overall case viability. Be candid about weaknesses rather than optimistic.',
    suggestedEffort: 'deep',
    requiresFileContext: false,
  },
  {
    id: 'anticipate-opposing',
    name: 'Anticipate Opposing Arguments',
    description: 'Predict the other side\'s best arguments and how to counter them.',
    category: 'strategy',
    icon: 'Swords',
    promptText:
      'Anticipate the opposing party\'s strongest arguments. For each argument: (1) state the argument as the opposing counsel would frame it, (2) identify the evidence they would rely on, (3) assess its strength, and (4) propose a counter-argument with supporting evidence or case law. Focus on the arguments that pose the greatest risk.',
    suggestedEffort: 'deep',
    requiresFileContext: false,
  },
  {
    id: 'settlement-range',
    name: 'Settlement Range Analysis',
    description: 'Estimate a realistic settlement range based on the evidence and comparable cases.',
    category: 'strategy',
    icon: 'DollarSign',
    promptText:
      'Estimate a realistic settlement range for this case. Consider: (1) statutory entitlements under the ESA, (2) common law reasonable notice using Bardal factors, (3) any Human Rights Code damages (injury to dignity), (4) aggravated or punitive damages exposure, (5) costs implications, and (6) litigation risk discount. Cite comparable Ontario settlements or judgments where available.',
    suggestedEffort: 'deep',
    requiresFileContext: false,
  },
];

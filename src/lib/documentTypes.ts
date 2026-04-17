// Document type taxonomy for Ontario legal case management
// Maps document types to labels, categories, and icon names (Lucide)

export interface DocumentTypeInfo {
  label: string;
  category: string;
  icon: string;
}

export const DOCUMENT_CATEGORIES: Record<string, string> = {
  court_filings: 'Court Filings',
  court_orders: 'Court Orders',
  sworn: 'Sworn Documents',
  discovery: 'Discovery',
  settlement: 'Settlement & Negotiation',
  employment: 'Employment',
  financial: 'Financial',
  regulatory: 'Regulatory',
  correspondence: 'Correspondence',
  medical: 'Medical',
  general: 'General',
};

export const DOCUMENT_TYPES: Record<string, DocumentTypeInfo> = {
  // ── Court Filings ──────────────────────────────────────
  statement_of_claim: { label: 'Statement of Claim', category: 'court_filings', icon: 'FileText' },
  statement_of_defence: { label: 'Statement of Defence', category: 'court_filings', icon: 'Shield' },
  reply: { label: 'Reply', category: 'court_filings', icon: 'Reply' },
  counterclaim: { label: 'Counterclaim', category: 'court_filings', icon: 'FileWarning' },
  crossclaim: { label: 'Crossclaim', category: 'court_filings', icon: 'FilePlus' },
  third_party_claim: { label: 'Third Party Claim', category: 'court_filings', icon: 'Users' },
  notice_of_motion: { label: 'Notice of Motion', category: 'court_filings', icon: 'Bell' },
  notice_of_application: { label: 'Notice of Application', category: 'court_filings', icon: 'FileInput' },
  factum: { label: 'Factum', category: 'court_filings', icon: 'BookOpen' },
  book_of_authorities: { label: 'Book of Authorities', category: 'court_filings', icon: 'Library' },
  notice_of_appeal: { label: 'Notice of Appeal', category: 'court_filings', icon: 'ArrowUpCircle' },
  notice_of_discontinuance: { label: 'Notice of Discontinuance', category: 'court_filings', icon: 'XCircle' },
  notice_of_intent_to_defend: { label: 'Notice of Intent to Defend', category: 'court_filings', icon: 'ShieldCheck' },
  affidavit_of_documents: { label: 'Affidavit of Documents', category: 'court_filings', icon: 'FolderOpen' },
  trial_record: { label: 'Trial Record', category: 'court_filings', icon: 'Clipboard' },
  jury_notice: { label: 'Jury Notice', category: 'court_filings', icon: 'Users' },
  requisition: { label: 'Requisition', category: 'court_filings', icon: 'FileInput' },
  bill_of_costs: { label: 'Bill of Costs', category: 'court_filings', icon: 'Receipt' },
  certificate_of_assessment: { label: 'Certificate of Assessment', category: 'court_filings', icon: 'Award' },
  consent: { label: 'Consent', category: 'court_filings', icon: 'CheckSquare' },

  // ── Court Orders ───────────────────────────────────────
  court_order: { label: 'Court Order', category: 'court_orders', icon: 'Gavel' },
  endorsement: { label: 'Endorsement', category: 'court_orders', icon: 'Stamp' },
  reasons_for_decision: { label: 'Reasons for Decision', category: 'court_orders', icon: 'Scale' },
  judgment: { label: 'Judgment', category: 'court_orders', icon: 'FileCheck' },

  // ── Sworn Documents ────────────────────────────────────
  affidavit: { label: 'Affidavit', category: 'sworn', icon: 'PenTool' },
  statutory_declaration: { label: 'Statutory Declaration', category: 'sworn', icon: 'Stamp' },
  sworn_statement: { label: 'Sworn Statement', category: 'sworn', icon: 'PenLine' },

  // ── Discovery ──────────────────────────────────────────
  examination_transcript: { label: 'Examination Transcript', category: 'discovery', icon: 'FileAudio' },
  expert_report: { label: 'Expert Report', category: 'discovery', icon: 'Microscope' },
  witness_statement: { label: 'Witness Statement', category: 'discovery', icon: 'UserCheck' },
  undertaking_response: { label: 'Undertaking Response', category: 'discovery', icon: 'ClipboardCheck' },
  request_to_admit: { label: 'Request to Admit', category: 'discovery', icon: 'HelpCircle' },
  interrogatories: { label: 'Interrogatories', category: 'discovery', icon: 'MessageSquare' },

  // ── Settlement & Negotiation ───────────────────────────
  offer_to_settle: { label: 'Offer to Settle', category: 'settlement', icon: 'Handshake' },
  demand_letter: { label: 'Demand Letter', category: 'settlement', icon: 'AlertTriangle' },
  settlement_agreement: { label: 'Settlement Agreement', category: 'settlement', icon: 'FileSignature' },
  mediation_brief: { label: 'Mediation Brief', category: 'settlement', icon: 'Scale' },
  minutes_of_settlement: { label: 'Minutes of Settlement', category: 'settlement', icon: 'FileText' },
  release: { label: 'Release', category: 'settlement', icon: 'Unlock' },

  // ── Employment ─────────────────────────────────────────
  employment_contract: { label: 'Employment Contract', category: 'employment', icon: 'FileSignature' },
  termination_letter: { label: 'Termination Letter', category: 'employment', icon: 'XCircle' },
  resignation_letter: { label: 'Resignation Letter', category: 'employment', icon: 'LogOut' },
  performance_review: { label: 'Performance Review', category: 'employment', icon: 'BarChart' },
  offer_letter: { label: 'Offer Letter', category: 'employment', icon: 'Mail' },
  severance_package: { label: 'Severance Package', category: 'employment', icon: 'Package' },
  employment_policy: { label: 'Employment Policy', category: 'employment', icon: 'BookOpen' },
  disciplinary_notice: { label: 'Disciplinary Notice', category: 'employment', icon: 'AlertOctagon' },
  job_description: { label: 'Job Description', category: 'employment', icon: 'ClipboardList' },

  // ── Financial ──────────────────────────────────────────
  financial_statement: { label: 'Financial Statement', category: 'financial', icon: 'DollarSign' },
  tax_return: { label: 'Tax Return', category: 'financial', icon: 'FileSpreadsheet' },
  pay_stub: { label: 'Pay Stub', category: 'financial', icon: 'Receipt' },
  t4_slip: { label: 'T4 Slip', category: 'financial', icon: 'FileSpreadsheet' },
  roe: { label: 'Record of Employment', category: 'financial', icon: 'FileText' },
  bank_statement: { label: 'Bank Statement', category: 'financial', icon: 'Landmark' },
  invoice: { label: 'Invoice', category: 'financial', icon: 'Receipt' },
  expense_report: { label: 'Expense Report', category: 'financial', icon: 'CreditCard' },

  // ── Regulatory ─────────────────────────────────────────
  hrto_application: { label: 'HRTO Application', category: 'regulatory', icon: 'Scale' },
  hrto_response: { label: 'HRTO Response', category: 'regulatory', icon: 'FileText' },
  professional_complaint: { label: 'Professional Complaint', category: 'regulatory', icon: 'Flag' },
  investigation_report: { label: 'Investigation Report', category: 'regulatory', icon: 'Search' },
  regulatory_decision: { label: 'Regulatory Decision', category: 'regulatory', icon: 'Gavel' },
  compliance_report: { label: 'Compliance Report', category: 'regulatory', icon: 'ClipboardCheck' },

  // ── Correspondence ─────────────────────────────────────
  legal_correspondence: { label: 'Legal Correspondence', category: 'correspondence', icon: 'Mail' },
  email: { label: 'Email', category: 'correspondence', icon: 'AtSign' },
  text_message: { label: 'Text Message', category: 'correspondence', icon: 'MessageCircle' },
  internal_memo: { label: 'Internal Memo', category: 'correspondence', icon: 'StickyNote' },
  letter: { label: 'Letter', category: 'correspondence', icon: 'Mail' },

  // ── Medical ────────────────────────────────────────────
  medical_record: { label: 'Medical Record', category: 'medical', icon: 'Heart' },
  medical_report: { label: 'Medical Report', category: 'medical', icon: 'Stethoscope' },
  disability_claim: { label: 'Disability Claim', category: 'medical', icon: 'FileHeart' },
  ime_report: { label: 'Independent Medical Examination', category: 'medical', icon: 'ClipboardList' },
  treatment_record: { label: 'Treatment Record', category: 'medical', icon: 'Activity' },

  // ── General ────────────────────────────────────────────
  legislation: { label: 'Legislation', category: 'general', icon: 'BookOpen' },
  case_law: { label: 'Case Law', category: 'general', icon: 'Scale' },
  photograph: { label: 'Photograph', category: 'general', icon: 'Camera' },
  contract: { label: 'Contract', category: 'general', icon: 'FileSignature' },
  corporate_record: { label: 'Corporate Record', category: 'general', icon: 'Building' },
  other: { label: 'Other', category: 'general', icon: 'File' },
};

/**
 * Get the human-readable label for a document type key.
 * Returns the key itself (title-cased) if not found in the taxonomy.
 */
export function getDocumentTypeLabel(type: string): string {
  const entry = DOCUMENT_TYPES[type];
  if (entry) return entry.label;
  // Fallback: convert snake_case to Title Case
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Get the category key for a document type.
 * Returns 'general' if the type is not found.
 */
export function getDocumentTypeCategory(type: string): string {
  return DOCUMENT_TYPES[type]?.category ?? 'general';
}

/**
 * Get the category label for a document type.
 */
export function getDocumentTypeCategoryLabel(type: string): string {
  const categoryKey = getDocumentTypeCategory(type);
  return DOCUMENT_CATEGORIES[categoryKey] ?? 'General';
}

/**
 * Get all document types within a given category.
 */
export function getDocumentTypesByCategory(category: string): Array<{ key: string } & DocumentTypeInfo> {
  return Object.entries(DOCUMENT_TYPES)
    .filter(([, info]) => info.category === category)
    .map(([key, info]) => ({ key, ...info }));
}

/**
 * Get all categories with their document types, useful for building grouped selects.
 */
export function getGroupedDocumentTypes(): Array<{
  category: string;
  categoryLabel: string;
  types: Array<{ key: string } & DocumentTypeInfo>;
}> {
  return Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, categoryLabel]) => ({
    category: categoryKey,
    categoryLabel,
    types: getDocumentTypesByCategory(categoryKey),
  }));
}

/**
 * Legal-significance score for a document type. Higher = more important to
 * lead with when building AI context for case analysis, brief drafting, etc.
 *
 * The ordering reflects what a litigator would reach for first: operative
 * orders and filings > sworn statements and pleadings > key contracts and
 * termination docs > discovery > correspondence and background.
 *
 * Unknown/other types fall to the bottom but still rank above unclassified.
 */
const LEGAL_SIGNIFICANCE: Record<string, number> = {
  // Operative / dispositive
  judgment: 100,
  reasons_for_decision: 98,
  court_order: 96,
  endorsement: 92,
  regulatory_decision: 90,

  // Foundational filings
  statement_of_claim: 88,
  statement_of_defence: 86,
  counterclaim: 84,
  reply: 80,
  notice_of_motion: 78,
  notice_of_application: 78,
  factum: 76,
  hrto_application: 88,
  hrto_response: 84,

  // Key employment documents (Ontario focus)
  termination_letter: 92,
  employment_contract: 90,
  settlement_agreement: 88,
  release: 84,
  offer_to_settle: 80,
  demand_letter: 78,
  severance_package: 78,
  offer_letter: 70,
  resignation_letter: 68,
  disciplinary_notice: 66,
  performance_review: 60,
  employment_policy: 58,
  job_description: 50,

  // Sworn / discovery
  affidavit: 82,
  sworn_statement: 78,
  statutory_declaration: 74,
  examination_transcript: 76,
  expert_report: 74,
  witness_statement: 72,
  investigation_report: 70,
  professional_complaint: 68,

  // Medical (often tied to damages / disability claims)
  ime_report: 72,
  medical_report: 66,
  disability_claim: 64,
  medical_record: 60,
  treatment_record: 56,

  // Financial (damages)
  financial_statement: 60,
  roe: 58,
  t4_slip: 50,
  pay_stub: 48,
  tax_return: 48,
  bank_statement: 40,
  invoice: 36,
  expense_report: 34,

  // Correspondence / background
  legal_correspondence: 44,
  internal_memo: 36,
  email: 32,
  text_message: 28,
  letter: 34,

  // Reference material
  legislation: 40,
  case_law: 40,

  // Generic
  contract: 50,
  corporate_record: 36,
  photograph: 30,
  other: 10,
};

/**
 * Get the legal-significance score for a document type. Used to sort
 * documents when building AI context so the model sees the most
 * load-bearing evidence first.
 */
export function getLegalSignificance(documentType: string | null | undefined): number {
  if (!documentType) return 0;
  return LEGAL_SIGNIFICANCE[documentType] ?? 10;
}

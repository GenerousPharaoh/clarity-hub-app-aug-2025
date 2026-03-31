/** Types for brief drafting, citations, chronology, and templates. */

export interface BriefSection {
  id: string;
  key: string;
  heading: string;
  content_html: string;
  sort_order: number;
  is_generated: boolean;
  generation_prompt?: string;
  model_used?: string;
  generated_at?: string;
}

export interface BriefDraft {
  id: string;
  project_id: string;
  created_by: string;
  title: string;
  template_type: string;
  court_name: string | null;
  file_number: string | null;
  case_name: string | null;
  party_name: string | null;
  sections: BriefSection[];
  rendered_content: string | null;
  status: 'draft' | 'review' | 'final';
  created_at: string;
  updated_at: string;
}

export interface BriefCitation {
  id: string;
  brief_id: string;
  citation_type: 'case' | 'legislation' | 'exhibit' | 'external';
  legal_case_id: string | null;
  legal_legislation_id: string | null;
  exhibit_marker_id: string | null;
  citation_text: string;
  short_form: string | null;
  pinpoint: string | null;
  toa_order: number | null;
  is_verified: boolean;
  section_key: string | null;
  created_at: string;
}

export interface ChronologyEntry {
  id: string;
  project_id: string;
  timeline_event_id: string | null;
  annotation_id: string | null;
  date_display: string;
  date_sort: string | null;
  description: string;
  source_description: string | null;
  exhibit_ref: string | null;
  category: string | null;
  sort_order: number;
  is_included: boolean;
  created_at: string;
  updated_at: string;
}

export interface BriefTemplate {
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  sections: Array<{
    key: string;
    heading: string;
    description: string;
    required: boolean;
  }>;
}

export const BRIEF_TEMPLATES: BriefTemplate[] = [
  {
    slug: 'demand_letter',
    name: 'Demand Letter',
    category: 'Settlement',
    description: 'Without-prejudice demand for compensation',
    icon: 'Mail',
    sections: [
      { key: 'header', heading: 'WITHOUT PREJUDICE', description: 'Header and recipient info', required: true },
      { key: 'background', heading: 'BACKGROUND', description: 'Employment history and facts', required: true },
      { key: 'entitlements', heading: 'ENTITLEMENTS', description: 'Legal basis and amounts claimed', required: true },
      { key: 'demand', heading: 'DEMAND', description: 'Specific demand and deadline', required: true },
    ],
  },
  {
    slug: 'statement_of_claim',
    name: 'Statement of Claim',
    category: 'Court Filing',
    description: 'Ontario Superior Court Form 14A',
    icon: 'Scale',
    sections: [
      { key: 'parties', heading: 'THE PARTIES', description: 'Plaintiff and defendant identification', required: true },
      { key: 'claim', heading: 'THE CLAIM', description: 'Summary of claim and relief sought', required: true },
      { key: 'facts', heading: 'FACTS', description: 'Material facts in numbered paragraphs', required: true },
      { key: 'damages', heading: 'DAMAGES', description: 'Particulars of damages claimed', required: true },
      { key: 'relief', heading: 'RELIEF SOUGHT', description: 'Specific orders requested', required: true },
    ],
  },
  {
    slug: 'motion_factum',
    name: 'Motion Factum',
    category: 'Court Filing',
    description: 'Factum for an Ontario motion',
    icon: 'BookOpen',
    sections: [
      { key: 'overview', heading: 'PART I - OVERVIEW', description: 'Brief summary of the motion', required: true },
      { key: 'facts', heading: 'PART II - THE FACTS', description: 'Chronological facts with exhibit references', required: true },
      { key: 'issues', heading: 'PART III - ISSUES', description: 'Legal issues to be decided', required: true },
      { key: 'law_argument', heading: 'PART IV - LAW AND ARGUMENT', description: 'Legal analysis with case law', required: true },
      { key: 'order_sought', heading: 'PART V - ORDER SOUGHT', description: 'Specific relief requested', required: true },
      { key: 'authorities', heading: 'SCHEDULE A - TABLE OF AUTHORITIES', description: 'Auto-generated from citations', required: false },
    ],
  },
  {
    slug: 'hrto_application',
    name: 'HRTO Application',
    category: 'Tribunal',
    description: 'Human Rights Tribunal of Ontario Form 1',
    icon: 'Shield',
    sections: [
      { key: 'applicant', heading: 'APPLICANT INFORMATION', description: 'Applicant details', required: true },
      { key: 'respondent', heading: 'RESPONDENT INFORMATION', description: 'Respondent details', required: true },
      { key: 'grounds', heading: 'GROUNDS', description: 'Protected grounds under the Code', required: true },
      { key: 'facts', heading: 'FACTS', description: 'What happened, chronological order', required: true },
      { key: 'remedy', heading: 'REMEDY SOUGHT', description: 'What you want the Tribunal to order', required: true },
    ],
  },
];

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

/**
 * Template-specific AI drafting instructions.
 * Each template+section gets specialized guidance based on Ontario
 * Rules of Civil Procedure, HRTO Rules, and legal drafting conventions.
 */
export const TEMPLATE_PROMPTS: Record<string, Record<string, string>> = {
  demand_letter: {
    _system: `You are drafting a WITHOUT PREJUDICE demand letter for an Ontario employment law matter.
This letter is settlement correspondence protected by settlement privilege.
Tone: firm but professional, not adversarial. Use plain language, not legalese.
Do NOT use numbered paragraphs — use flowing prose with clear paragraph breaks.
Do NOT cite case law extensively — a demand letter is practical, not academic.
Address the letter to the respondent's counsel (or the respondent directly if unrepresented).`,
    header: `Draft the header of a without-prejudice demand letter. Include:
- "WITHOUT PREJUDICE" prominently at the top
- Date line
- Addressee (use the case name to infer parties, or use [Respondent Name] placeholder)
- "Re:" line with the matter description
- Opening salutation ("Dear [Name]" or "Dear Counsel")
- Opening paragraph stating the purpose: "We are counsel for [Client]. This letter is written on a without-prejudice basis to explore resolution of [Client]'s claims arising from the termination of their employment."`,
    background: `Draft the BACKGROUND section. Include:
- Date employment commenced and position held
- Key terms of employment (salary, bonus, benefits if known from the evidence)
- Circumstances of termination (date, manner, any stated reasons)
- Whether the employer provided working notice, pay in lieu, or nothing
- Any relevant post-termination conduct (e.g., failure to provide ROE, benefits cutoff)
Structure chronologically. Keep factual, not argumentative. Reference evidence from project files where supported.`,
    entitlements: `Draft the ENTITLEMENTS section. Address:
1. Reasonable notice period under common law — apply Bardal factors:
   - Age of the employee at termination
   - Length of service
   - Character of employment (seniority, specialization)
   - Availability of similar employment
   - Reference comparable case law if available in the legal context
2. ESA minimum entitlements (s. 54-66 of the Employment Standards Act, 2000)
3. Any applicable benefits continuation during the notice period
4. Severance pay under ESA s. 64 if applicable (5+ years service, $2.5M+ payroll)
5. Damages for manner of dismissal if applicable (Honda Canada v. Keays, 2008 SCC 39)
6. Human rights damages if applicable (injury to dignity under the OHRC)
7. Any contractual entitlements or special damages
Present the calculation clearly. State the total quantum demanded.`,
    demand: `Draft the DEMAND section. Include:
- The total amount demanded with a brief itemization
- A reasonable deadline for response (typically 14-21 days)
- What the demand includes (e.g., "inclusive of all ESA entitlements, common law reasonable notice, and damages")
- Consequences of non-response ("failing which our client will pursue all available legal remedies including commencing an action in the Ontario Superior Court of Justice")
- An invitation to discuss resolution
- Closing with "Yours truly" or "Yours very truly"
Do NOT threaten — state consequences matter-of-factly.`,
  },
  statement_of_claim: {
    _system: `You are drafting a Statement of Claim (Form 14A) for the Ontario Superior Court of Justice.
Follow the Rules of Civil Procedure, R.R.O. 1990, Reg. 194, especially:
- Rule 25.06: every pleading shall contain a concise statement of material facts
- Rule 25.06(1): material facts, not evidence or law
- Rule 25.06(8): where fraud, misrepresentation, breach of trust, or willful default is alleged, full particulars must be pleaded
Use consecutively numbered paragraphs throughout.
Each paragraph should contain one material fact or closely related facts.
Do NOT include evidence — plead facts, not how you will prove them.
Do NOT include legal argument — state the cause of action and its elements factually.
Cite the statutory basis for any statutory claim (e.g., "contrary to section 5(1) of the Human Rights Code, R.S.O. 1990, c. H.19").`,
    parties: `Draft THE PARTIES section with numbered paragraphs. For each party state:
- Full legal name
- Whether plaintiff or defendant
- Municipality of residence (individual) or place of incorporation/business (corporation)
- Capacity in which they are sued (personal capacity, as employer, etc.)
- For corporate defendants: nature of business relevant to the claim
Example format:
"1. The Plaintiff, [Name], resides in the City of [City], in the Province of Ontario.
2. The Defendant, [Name], is a corporation incorporated under the laws of Ontario, carrying on business in [City], Ontario."`,
    claim: `Draft THE CLAIM section with numbered paragraphs. State:
- The nature of the claim in summary (e.g., "The Plaintiff claims damages for wrongful dismissal, breach of contract, and violation of the Human Rights Code")
- The general basis for the court's jurisdiction
- A concise overview of the causes of action
This section is a roadmap — keep it brief (3-5 paragraphs).`,
    facts: `Draft the FACTS section with consecutively numbered paragraphs. Plead:
- Employment relationship (commencement, position, duties, reporting structure)
- Terms of employment (compensation, benefits, any written contract)
- Chronological events leading to the claim
- The termination (date, manner, reasons given or not given)
- Post-termination events relevant to the claim
- For each cause of action, plead the material facts constituting it:
  * Wrongful dismissal: termination without adequate notice or pay in lieu
  * Breach of contract: specific contractual terms and how they were breached
  * Bad faith: specific conduct constituting bad faith in the manner of dismissal (Wallace/Honda factors)
  * Human rights: protected ground, adverse treatment, nexus between the two
  * ESA violations: specific sections violated
Reference exhibits where supported: "(Exhibit [X])". Use the timeline events to maintain chronological order.`,
    damages: `Draft the DAMAGES section with numbered paragraphs. Plead particulars of:
1. Common law reasonable notice damages — state the Bardal factors and the claimed notice period
2. ESA minimum entitlements — termination pay (s. 54-60), severance pay (s. 64-66) if applicable
3. Benefit continuation losses during the reasonable notice period
4. Bonus/incentive compensation lost during the notice period
5. Moral/aggravated damages for manner of dismissal (Honda Canada v. Keays, 2008 SCC 39)
6. Human rights damages (injury to dignity, mental anguish) if applicable
7. Punitive damages if exceptional circumstances warrant (Whiten v. Pilot Insurance, 2002 SCC 18)
8. Pre-judgment and post-judgment interest pursuant to the Courts of Justice Act, R.S.O. 1990, c. C.43
9. Costs on a substantial indemnity basis (or as the court deems appropriate)
State specific dollar amounts where calculable.`,
    relief: `Draft the RELIEF SOUGHT section. List the specific orders requested, each as a lettered sub-paragraph:
(a) Damages for wrongful dismissal in the amount of $[X] or such other amount as this Court deems just;
(b) Damages for [specific cause of action];
(c) General damages for [specific head of damage];
(d) Pre-judgment interest in accordance with the Courts of Justice Act;
(e) Post-judgment interest in accordance with the Courts of Justice Act;
(f) Costs of this action on a substantial indemnity basis, or alternatively on a partial indemnity basis;
(g) Such further and other relief as this Honourable Court deems just.
Always end with the catch-all "such further and other relief" clause.`,
  },
  motion_factum: {
    _system: `You are drafting a factum for a motion in the Ontario Superior Court of Justice.
Follow the Ontario Practice Direction concerning Civil Motions and the Rules of Civil Procedure.
A factum is a concise argument document — not a brief or memorandum of law.
Use FIVE numbered parts as required: Overview, Facts, Issues, Law and Argument, Order Sought.
Facts must be stated concisely with specific references to the motion record (Tab and page numbers where available).
The Law and Argument section must state the legal test, cite binding authority, and apply it to the facts.
Cite cases with neutral citations (e.g., 2024 ONSC 1234). Provide paragraph pinpoints where possible.
Keep the factum concise — courts prefer brevity and clarity.`,
    overview: `Draft PART I - OVERVIEW (1-2 paragraphs maximum). State:
- What the motion is for (e.g., "This is a motion for summary judgment pursuant to Rule 20 of the Rules of Civil Procedure")
- Who is bringing it
- The essential outcome sought
- Why the motion should be granted (one sentence thesis)
This is the court's first impression — make it clear and compelling.`,
    facts: `Draft PART II - THE FACTS. State the material facts in numbered paragraphs.
- Focus ONLY on facts relevant to the motion (not the entire case history)
- Reference the motion record: "The Plaintiff was employed from [date] to [date] (Affidavit of [Name], para. X, Motion Record Tab Y)"
- Use exhibit references where available
- Maintain strict chronological order
- Do not argue or characterize — state facts neutrally
- Include only facts supported by evidence in the record`,
    issues: `Draft PART III - ISSUES. State the legal issues to be decided as numbered questions:
"1. Is [party] entitled to summary judgment dismissing the [claim/defence]?"
"2. If so, what is the appropriate quantum of damages?"
Keep to 2-4 crisp issue statements. Frame as questions the court must answer.`,
    law_argument: `Draft PART IV - LAW AND ARGUMENT. For each issue:
1. State the governing legal test with its authoritative source
   - For summary judgment: Hryniak v. Mauldin, 2014 SCC 7 (genuine issue requiring trial)
   - For default judgment: Rules 19.01-19.09
   - For injunctions: RJR-MacDonald Inc. v. Canada, [1994] 1 SCR 311 (serious issue, irreparable harm, balance of convenience)
2. Cite binding authority (SCC > ONCA > ONSC)
3. Apply the test to the specific facts of this case
4. Address any anticipated counter-arguments
5. Conclude on each issue
Use headings for each issue. Cite with pinpoint paragraph references.`,
    order_sought: `Draft PART V - ORDER SOUGHT. List the specific orders requested:
1. An Order granting [type of relief];
2. [Specific monetary amount if applicable];
3. Costs of this motion on a [partial/substantial] indemnity basis, fixed in the amount of $[X] inclusive of disbursements and applicable taxes;
4. Such further and other relief as this Honourable Court deems just.`,
    authorities: `Generate SCHEDULE A - TABLE OF AUTHORITIES.
List all cases and legislation cited in the factum in two sections:
JURISPRUDENCE:
1. [Case name], [neutral citation], at paras [X]-[Y]
2. [Next case]...

LEGISLATION:
1. [Act name], [statutory citation], s. [section]
2. [Next statute]...

Order cases alphabetically by first-named party. Order legislation alphabetically by Act name.
Only include authorities actually cited in the preceding sections.`,
  },
  hrto_application: {
    _system: `You are drafting an Application to the Human Rights Tribunal of Ontario (HRTO) under Form 1.
Follow the HRTO Rules of Procedure and the Human Rights Code, R.S.O. 1990, c. H.19.
The HRTO is an administrative tribunal — the tone should be clear and accessible, not overly legalistic.
Use numbered paragraphs for the facts section.
The application must be filed within ONE YEAR of the last act of discrimination (s. 34(1) of the Code).
Focus on establishing: (1) a protected ground, (2) adverse treatment in a social area, (3) a nexus between the two.
The test for discrimination: Moore v. British Columbia (Education), 2012 SCC 61.`,
    applicant: `Draft the APPLICANT INFORMATION section. Include:
- Full name of the applicant
- Contact information (address, phone, email) — use placeholders if not known
- Whether represented by counsel or self-represented
- If represented: counsel name, firm, address, phone, email, LSUC number`,
    respondent: `Draft the RESPONDENT INFORMATION section. Include:
- Full legal name of the respondent (individual or corporate)
- Respondent's address
- Nature of the respondent's relationship to the applicant (employer, service provider, landlord, etc.)
- If multiple respondents, list each separately with their role`,
    grounds: `Draft the GROUNDS section. Identify:
- The social area: employment (s. 5), services (s. 1), housing (s. 2), contracts (s. 3), or membership in a vocational association (s. 6)
- The specific protected ground(s) under s. 5(1) of the Human Rights Code:
  race, ancestry, place of origin, colour, ethnic origin, citizenship, creed, sex, sexual orientation, gender identity/expression, age, record of offences, marital status, family status, disability
- Whether the allegation is direct discrimination, adverse effect discrimination, or harassment (s. 5(2))
- Whether there is an allegation of reprisal (s. 8)
State each ground clearly and concisely.`,
    facts: `Draft the FACTS section with consecutively numbered paragraphs. The HRTO requires:
- The relationship between the applicant and respondent
- The protected characteristic of the applicant
- The specific acts or omissions that constitute discrimination
- The dates of each incident (the Tribunal needs dates to assess the 1-year limitation)
- How the protected ground is connected to the adverse treatment (the nexus)
- Any complaint made to the respondent and the response
- The impact on the applicant (emotional, financial, professional)
Use plain language — HRTO adjudicators are not judges and appreciate clarity.
Reference evidence from project files where supported.`,
    remedy: `Draft the REMEDY SOUGHT section. The HRTO can order (s. 45.2 of the Code):
1. Monetary compensation for loss arising out of the infringement (lost wages, benefits, etc.)
2. Monetary compensation for injury to dignity, feelings, and self-respect (typically $10,000-$35,000 for employment cases)
3. An order to do anything to remedy the infringement or to prevent future infringements
4. Reinstatement (rarely ordered but available)
List specific remedies sought with estimated amounts where possible.
For injury to dignity, reference comparable HRTO awards in similar cases if available.`,
  },
};

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

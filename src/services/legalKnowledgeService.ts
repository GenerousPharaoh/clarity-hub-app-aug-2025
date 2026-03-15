/**
 * Legal Knowledge Service - Ontario Employment Law Knowledge Base
 *
 * Provides access to legislation, case law, legal principles, and
 * RAG-powered semantic search for the AI legal assistant.
 */
import { supabase } from '@/lib/supabase';

// The legal knowledge tables exist in the database but aren't in the
// auto-generated types (they were created outside the type generation).
// We use an untyped helper to query them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Sanitize a value before interpolating it into a PostgREST `.or()` filter
 * string. Strips characters that could alter the filter semantics.
 */
function sanitizeFilterValue(value: string): string {
  return value.replace(/[%_,.*()\\]/g, '');
}

// ============================================================
// Types
// ============================================================

export interface LegalTopic {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  display_order: number;
  children?: LegalTopic[];
}

export interface LegalLegislation {
  id: string;
  title: string;
  short_title: string | null;
  jurisdiction: string;
  legislation_type: 'statute' | 'regulation' | 'code' | 'policy';
  citation: string;
  url: string | null;
  in_force: boolean;
  summary: string | null;
}

export interface LegalLegislationSection {
  id: string;
  legislation_id: string;
  section_number: string;
  title: string | null;
  content: string;
  summary: string | null;
  keywords: string[];
  legislation?: LegalLegislation;
}

export interface LegalCase {
  id: string;
  case_name: string;
  citation: string;
  neutral_citation: string | null;
  court: string;
  court_level: 'trial' | 'divisional' | 'appellate' | 'scc';
  decision_date: string;
  jurisdiction: string;
  judges: string[];
  summary: string | null;
  ratio: string | null;
  key_holdings: string[];
  facts_summary: string | null;
  canli_url: string | null;
  is_landmark: boolean;
}

export interface LegalPrinciple {
  id: string;
  name: string;
  category: string;
  description: string;
  elements: string[];
  source_case_id: string | null;
  source_legislation_id: string | null;
  current_status: 'active' | 'modified' | 'overruled' | 'codified';
  notes: string | null;
  source_case?: LegalCase;
  source_legislation?: LegalLegislation;
}

export interface LegalSearchResult {
  id: string;
  source_type: 'legislation' | 'case' | 'principle' | 'commentary';
  source_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

// ============================================================
// Service
// ============================================================

class LegalKnowledgeService {
  // ─── Legislation ───────────────────────────────────────────

  async searchLegislationSections(
    keyword: string
  ): Promise<LegalLegislationSection[]> {
    const { data, error } = await db
      .from('legal_legislation_sections')
      .select('*, legislation:legal_legislation(*)')
      .contains('keywords', [keyword]);

    if (error) throw error;
    return data ?? [];
  }

  // ─── Case Law ──────────────────────────────────────────────

  async searchCases(searchTerm: string): Promise<LegalCase[]> {
    const safe = sanitizeFilterValue(searchTerm);
    const { data, error } = await db
      .from('legal_cases')
      .select('*')
      .or(
        `case_name.ilike.%${safe}%,summary.ilike.%${safe}%,ratio.ilike.%${safe}%`
      )
      .order('is_landmark', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data ?? [];
  }

  // ─── Legal Principles ─────────────────────────────────────

  async searchPrinciples(searchTerm: string): Promise<LegalPrinciple[]> {
    const safe = sanitizeFilterValue(searchTerm);
    const { data, error } = await db
      .from('legal_principles')
      .select('*')
      .or(
        `name.ilike.%${safe}%,description.ilike.%${safe}%,category.ilike.%${safe}%`
      )
      .limit(10);

    if (error) throw error;
    return data ?? [];
  }

  // ─── Context Building for AI ──────────────────────────────

  /**
   * Build comprehensive legal context for an AI query.
   * Combines keyword search across cases, principles, and legislation
   * to provide relevant context for the AI assistant.
   */
  async buildLegalContext(query: string): Promise<string> {
    const keywords = this.extractKeywords(query);
    const sections: string[] = [];

    // Search cases
    const cases = await this.searchCases(query);
    if (cases.length > 0) {
      sections.push('## Relevant Case Law\n');
      for (const c of cases.slice(0, 5)) {
        sections.push(`### ${c.case_name} (${c.citation})`);
        sections.push(
          `**Court:** ${c.court} | **Level:** ${c.court_level} | **Date:** ${c.decision_date}`
        );
        if (c.ratio) sections.push(`**Ratio:** ${c.ratio}`);
        if (c.key_holdings?.length) {
          sections.push('**Key Holdings:**');
          c.key_holdings.forEach((h) => sections.push(`- ${h}`));
        }
        sections.push('');
      }
    }

    // Search principles
    const principles = await this.searchPrinciples(query);
    if (principles.length > 0) {
      sections.push('## Relevant Legal Principles\n');
      for (const p of principles.slice(0, 5)) {
        sections.push(`### ${p.name} (${p.category})`);
        sections.push(p.description);
        if (p.elements?.length) {
          sections.push('**Elements:**');
          p.elements.forEach((e) => sections.push(`- ${e}`));
        }
        sections.push(`**Status:** ${p.current_status}`);
        sections.push('');
      }
    }

    // Search legislation sections by keyword
    for (const kw of keywords.slice(0, 3)) {
      const legSections = await this.searchLegislationSections(kw);
      if (legSections.length > 0) {
        sections.push('## Relevant Legislation\n');
        for (const s of legSections.slice(0, 3)) {
          const leg = s.legislation;
          const legTitle = leg?.short_title ?? leg?.title ?? 'Unknown';
          sections.push(`### ${legTitle} s.${s.section_number}`);
          if (s.title) sections.push(`**${s.title}**`);
          sections.push(s.content);
          sections.push('');
        }
        break; // Only include legislation from first matching keyword
      }
    }

    return sections.join('\n');
  }

  // ─── Helpers ──────────────────────────────────────────────

  private extractKeywords(query: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
      'not', 'no', 'nor', 'so', 'yet', 'both', 'each', 'every', 'all',
      'any', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too',
      'very', 'just', 'because', 'about', 'what', 'which', 'who', 'whom',
      'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its',
      'our', 'their', 'i', 'me', 'you', 'he', 'she', 'it', 'we', 'they',
    ]);

    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  }
}

// Singleton export
export const legalKnowledge = new LegalKnowledgeService();
export default legalKnowledge;

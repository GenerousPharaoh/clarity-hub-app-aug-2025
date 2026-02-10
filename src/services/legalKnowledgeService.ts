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
  // ─── Topics ────────────────────────────────────────────────

  async getTopics(): Promise<LegalTopic[]> {
    const { data, error } = await db
      .from('legal_topics')
      .select('*')
      .order('display_order');

    if (error) throw error;
    return this.buildTopicTree(data ?? []);
  }

  async getTopicBySlug(slug: string): Promise<LegalTopic | null> {
    const { data, error } = await db
      .from('legal_topics')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  private buildTopicTree(topics: LegalTopic[]): LegalTopic[] {
    const topLevel = topics.filter((t) => !t.parent_id);
    const children = topics.filter((t) => t.parent_id);

    return topLevel.map((parent) => ({
      ...parent,
      children: children
        .filter((c) => c.parent_id === parent.id)
        .sort((a, b) => a.display_order - b.display_order),
    }));
  }

  // ─── Legislation ───────────────────────────────────────────

  async getLegislation(filters?: {
    jurisdiction?: string;
    type?: string;
    inForce?: boolean;
  }): Promise<LegalLegislation[]> {
    let query = db
      .from('legal_legislation')
      .select('*')
      .order('title');

    if (filters?.jurisdiction) {
      query = query.eq('jurisdiction', filters.jurisdiction);
    }
    if (filters?.type) {
      query = query.eq('legislation_type', filters.type);
    }
    if (filters?.inForce !== undefined) {
      query = query.eq('in_force', filters.inForce);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getLegislationById(id: string): Promise<LegalLegislation | null> {
    const { data, error } = await db
      .from('legal_legislation')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getLegislationSections(
    legislationId: string,
    keyword?: string
  ): Promise<LegalLegislationSection[]> {
    let query = db
      .from('legal_legislation_sections')
      .select('*')
      .eq('legislation_id', legislationId)
      .order('section_number');

    if (keyword) {
      query = query.contains('keywords', [keyword]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

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

  async getCases(filters?: {
    courtLevel?: string;
    isLandmark?: boolean;
    jurisdiction?: string;
    limit?: number;
  }): Promise<LegalCase[]> {
    let query = db
      .from('legal_cases')
      .select('*')
      .order('decision_date', { ascending: false });

    if (filters?.courtLevel) {
      query = query.eq('court_level', filters.courtLevel);
    }
    if (filters?.isLandmark !== undefined) {
      query = query.eq('is_landmark', filters.isLandmark);
    }
    if (filters?.jurisdiction) {
      query = query.eq('jurisdiction', filters.jurisdiction);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getCaseById(id: string): Promise<LegalCase | null> {
    const { data, error } = await db
      .from('legal_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getCaseByCitation(citation: string): Promise<LegalCase | null> {
    const { data, error } = await db
      .from('legal_cases')
      .select('*')
      .eq('citation', citation)
      .single();

    if (error) return null;
    return data;
  }

  async searchCases(searchTerm: string): Promise<LegalCase[]> {
    const { data, error } = await db
      .from('legal_cases')
      .select('*')
      .or(
        `case_name.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,ratio.ilike.%${searchTerm}%`
      )
      .order('is_landmark', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data ?? [];
  }

  // ─── Legal Principles ─────────────────────────────────────

  async getPrinciples(filters?: {
    category?: string;
    status?: string;
  }): Promise<LegalPrinciple[]> {
    let query = db
      .from('legal_principles')
      .select('*')
      .order('name');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('current_status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getPrincipleByName(name: string): Promise<LegalPrinciple | null> {
    const { data, error } = await db
      .from('legal_principles')
      .select('*')
      .eq('name', name)
      .single();

    if (error) return null;
    return data;
  }

  async searchPrinciples(searchTerm: string): Promise<LegalPrinciple[]> {
    const { data, error } = await db
      .from('legal_principles')
      .select('*')
      .or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`
      )
      .limit(10);

    if (error) throw error;
    return data ?? [];
  }

  // ─── RAG Search (Vector Similarity) ───────────────────────

  async semanticSearch(
    queryEmbedding: number[],
    options?: {
      threshold?: number;
      limit?: number;
      sourceType?: string;
      topicIds?: string[];
    }
  ): Promise<LegalSearchResult[]> {
    const { data, error } = await db.rpc('match_legal_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: options?.threshold ?? 0.7,
      match_count: options?.limit ?? 10,
      filter_source_type: options?.sourceType ?? null,
      filter_topics: options?.topicIds ?? null,
    });

    if (error) throw error;
    return data ?? [];
  }

  // ─── Full-Text Search ─────────────────────────────────────

  async fullTextSearch(
    query: string,
    limit: number = 10
  ): Promise<LegalSearchResult[]> {
    const tsQuery = query
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .join(' & ');

    const { data, error } = await db
      .from('legal_knowledge_chunks')
      .select('id, source_type, source_id, content, metadata, topics')
      .textSearch('fts', tsQuery)
      .limit(limit);

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((d: any) => ({ ...d, similarity: 1 }));
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

  /**
   * Get a concise summary of available knowledge for a topic.
   */
  async getTopicSummary(topicSlug: string): Promise<{
    topic: LegalTopic | null;
    caseCount: number;
    principleCount: number;
    legislationCount: number;
  }> {
    const topic = await this.getTopicBySlug(topicSlug);
    if (!topic)
      return { topic: null, caseCount: 0, principleCount: 0, legislationCount: 0 };

    const [cases, principles, legislation] = await Promise.all([
      db
        .from('legal_cases')
        .select('id', { count: 'exact', head: true })
        .contains('topics', [topic.id]),
      db
        .from('legal_principles')
        .select('id', { count: 'exact', head: true })
        .contains('related_topics', [topic.id]),
      db
        .from('legal_legislation')
        .select('id', { count: 'exact', head: true }),
    ]);

    return {
      topic,
      caseCount: cases.count ?? 0,
      principleCount: principles.count ?? 0,
      legislationCount: legislation.count ?? 0,
    };
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

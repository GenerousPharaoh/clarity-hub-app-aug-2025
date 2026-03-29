/**
 * Client-side CanLII service.
 * Calls the /api/canlii proxy endpoint for Canadian legal research.
 */
import { supabase } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────

export interface CanliiDatabase {
  databaseId: string;
  jurisdiction: string;
  name: string;
}

export interface CanliiCase {
  databaseId: string;
  caseId: string;
  title: string;
  citation: string;
}

export interface CanliiCaseMetadata {
  url: string;
  title: string;
  citation: string;
  docketNumber: string;
  decisionDate: string;
  keywords: string[];
  language: string;
}

export interface CanliiCitation {
  databaseId: string;
  caseId: string;
  title: string;
  citation: string;
}

export interface CanliiLegislationDatabase {
  databaseId: string;
  type: string;
  jurisdiction: string;
  name: string;
}

export interface CanliiLegislation {
  legislationId: string;
  title: string;
  citation: string;
  type: string;
}

// ─── Helper ─────────────────────────────────────────────────

async function callCanlii<T>(
  action: string,
  params: Record<string, string> = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/canlii', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, params }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorBody.error || `CanLII request failed: ${response.status}`);
  }

  return response.json();
}

// ─── Ontario-specific database IDs ──────────────────────────

export const ONTARIO_COURTS = {
  onca: 'Court of Appeal for Ontario',
  onsc: 'Superior Court of Justice',
  oncj: 'Ontario Court of Justice',
  onscdc: 'Divisional Court',
} as const;

export const ONTARIO_TRIBUNALS = {
  onhrt: 'Human Rights Tribunal of Ontario',
  onlat: 'Ontario Labour Arbitration',
  onwsiat: 'Workplace Safety and Insurance Appeals Tribunal',
  onlrb: 'Ontario Labour Relations Board',
} as const;

// ─── Service ────────────────────────────────────────────────

class CanliiService {
  /** List all available court/tribunal databases. */
  async listCourts(language = 'en'): Promise<CanliiDatabase[]> {
    const result = await callCanlii<{ caseDatabases: CanliiDatabase[] }>(
      'listDatabases',
      { language }
    );
    return result.caseDatabases || [];
  }

  /** List cases from a specific court/tribunal. */
  async listCases(params: {
    databaseId: string;
    offset?: number;
    resultCount?: number;
    decisionDateAfter?: string;
    decisionDateBefore?: string;
    language?: string;
  }): Promise<CanliiCase[]> {
    const result = await callCanlii<{ cases: CanliiCase[] }>('listCases', {
      databaseId: params.databaseId,
      offset: String(params.offset ?? 0),
      resultCount: String(params.resultCount ?? 25),
      ...(params.decisionDateAfter
        ? { decisionDateAfter: params.decisionDateAfter }
        : {}),
      ...(params.decisionDateBefore
        ? { decisionDateBefore: params.decisionDateBefore }
        : {}),
      language: params.language || 'en',
    });
    return result.cases || [];
  }

  /** Get full metadata for a specific case. */
  async getCaseMetadata(
    databaseId: string,
    caseId: string,
    language = 'en'
  ): Promise<CanliiCaseMetadata> {
    return callCanlii<CanliiCaseMetadata>('getCaseMetadata', {
      databaseId,
      caseId,
      language,
    });
  }

  /** Get cases cited by a specific decision. */
  async getCitedCases(
    databaseId: string,
    caseId: string
  ): Promise<CanliiCitation[]> {
    const result = await callCanlii<{ citedCases: CanliiCitation[] }>(
      'getCitedCases',
      { databaseId, caseId }
    );
    return result.citedCases || [];
  }

  /** Get cases that cite a specific decision. */
  async getCitingCases(
    databaseId: string,
    caseId: string
  ): Promise<CanliiCitation[]> {
    const result = await callCanlii<{ citingCases: CanliiCitation[] }>(
      'getCitingCases',
      { databaseId, caseId }
    );
    return result.citingCases || [];
  }

  /** Get legislation cited by a specific decision. */
  async getCitedLegislation(
    databaseId: string,
    caseId: string
  ): Promise<CanliiCitation[]> {
    const result = await callCanlii<{ citedLegislations: CanliiCitation[] }>(
      'getCitedLegislations',
      { databaseId, caseId }
    );
    return result.citedLegislations || [];
  }

  /** List all legislation databases. */
  async listLegislationDatabases(
    language = 'en'
  ): Promise<CanliiLegislationDatabase[]> {
    const result = await callCanlii<{
      legislationDatabases: CanliiLegislationDatabase[];
    }>('listLegislationDatabases', { language });
    return result.legislationDatabases || [];
  }

  /** List legislation items from a database. */
  async listLegislation(
    databaseId: string,
    language = 'en'
  ): Promise<CanliiLegislation[]> {
    const result = await callCanlii<{ legislations: CanliiLegislation[] }>(
      'listLegislation',
      { databaseId, language }
    );
    return result.legislations || [];
  }
}

export const canliiService = new CanliiService();
export default canliiService;

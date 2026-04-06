/**
 * useCitationVerification
 *
 * TanStack Query hook that asynchronously verifies legal citations found in
 * AI responses against the CanLII API. Results are cached permanently per
 * message (staleTime: Infinity) so a citation is only verified once.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CitationVerification {
  citation: string;
  status: 'verified' | 'unverified' | 'not_found' | 'error';
  canliiUrl?: string;
  canliiTitle?: string;
  message?: string;
}

async function verifyCitations(citations: string[]): Promise<CitationVerification[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/canlii-verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ citations }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error || `Verification failed: ${response.status}`);
  }

  const data = await response.json();
  return data.results as CitationVerification[];
}

export function useCitationVerification(messageId: string, citations: string[]) {
  return useQuery<CitationVerification[]>({
    queryKey: ['citation-verification', messageId],
    queryFn: () => verifyCitations(citations),
    enabled: citations.length > 0,
    staleTime: Infinity, // Once verified, never re-verify
    retry: 1,
  });
}

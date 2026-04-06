/**
 * Parses AI responses that use structured markers:
 *   [ANSWER], [REASONING], [SOURCES], [CONFIDENCE: high|medium|low]
 *
 * Falls back gracefully — if markers are absent, the entire content
 * is returned as `answer` with `isStructured: false`.
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface StructuredResponse {
  answer: string;
  reasoning: string | null;
  sources: string | null;
  confidence: ConfidenceLevel | null;
  raw: string;
  isStructured: boolean;
}

const CONFIDENCE_RE = /\[CONFIDENCE:\s*(high|medium|low)\s*\]/i;

/**
 * Extract the text between `startMarker` and the next known marker (or end of string).
 * Returns null if the marker is not found.
 */
function extractSection(
  text: string,
  startMarker: string,
  allMarkers: string[],
): string | null {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return null;

  const contentStart = startIdx + startMarker.length;

  // Find the earliest next marker after this section's content starts
  let endIdx = text.length;
  for (const marker of allMarkers) {
    if (marker === startMarker) continue;
    const idx = text.indexOf(marker, contentStart);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }

  // Also check for the [CONFIDENCE: ...] marker which is dynamic
  const confMatch = CONFIDENCE_RE.exec(text.slice(contentStart));
  if (confMatch && contentStart + confMatch.index < endIdx) {
    endIdx = contentStart + confMatch.index;
  }

  return text.slice(contentStart, endIdx).trim();
}

export function parseStructuredResponse(content: string): StructuredResponse {
  const raw = content;

  // Check if the response contains the [ANSWER] marker — that's the
  // minimum requirement to treat it as structured.
  const hasAnswerMarker = content.includes('[ANSWER]');

  if (!hasAnswerMarker) {
    return {
      answer: content,
      reasoning: null,
      sources: null,
      confidence: null,
      raw,
      isStructured: false,
    };
  }

  const staticMarkers = ['[ANSWER]', '[REASONING]', '[SOURCES]'];

  const answer = extractSection(content, '[ANSWER]', staticMarkers) ?? '';
  const reasoning = extractSection(content, '[REASONING]', staticMarkers);
  const sources = extractSection(content, '[SOURCES]', staticMarkers);

  // Extract confidence level
  let confidence: ConfidenceLevel | null = null;
  const confMatch = CONFIDENCE_RE.exec(content);
  if (confMatch) {
    confidence = confMatch[1].toLowerCase() as ConfidenceLevel;
  }

  return {
    answer,
    reasoning,
    sources,
    confidence,
    raw,
    isStructured: true,
  };
}

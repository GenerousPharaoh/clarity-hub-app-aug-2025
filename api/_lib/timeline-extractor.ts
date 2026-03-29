/**
 * Timeline event extraction from legal documents.
 * Uses GPT-4.1-mini to identify dates, events, and temporal references
 * from extracted document text.
 */

import type OpenAI from 'openai';

export interface TimelineEvent {
  date: string;
  date_end?: string;
  date_precision: 'day' | 'month' | 'year' | 'approximate';
  date_text?: string;
  title: string;
  description?: string;
  category: string;
  event_type: string;
  significance: 'high' | 'medium' | 'low';
  parties?: string[];
  source_quote?: string;
  page_reference?: number;
}

/**
 * Extract timeline events from document text using GPT-4.1-mini.
 *
 * @param extractedText - Full extracted text of the document.
 * @param fileName - Original file name (provides context hints).
 * @param fileId - UUID of the file record in the database.
 * @param openai - Initialized OpenAI client.
 * @returns Array of extracted timeline events.
 */
export async function extractTimelineEvents(
  extractedText: string,
  fileName: string,
  fileId: string,
  openai: OpenAI
): Promise<TimelineEvent[]> {
  if (!extractedText || extractedText.trim().length === 0) {
    return [];
  }

  // Use up to 10000 chars for timeline extraction (covers most legal docs)
  const truncated = extractedText.slice(0, 10000);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: `You are a legal document analyst specializing in timeline reconstruction for Ontario litigation. Extract all date-referenced events from this document.

FILENAME: "${fileName}"
FILE ID: "${fileId}"

TEXT:
${truncated}

Return a JSON object with a single key "events" containing an array of event objects. Each event must have:
- "date": ISO date string (YYYY-MM-DD). If only month/year known, use first of month (e.g., "2024-03-01"). If only year, use "2024-01-01".
- "date_end": ISO date string if the event spans a range, otherwise omit.
- "date_precision": one of "day", "month", "year", "approximate"
- "date_text": the original date text as it appears in the document (e.g., "on or about March 2024")
- "title": concise event title (under 100 chars)
- "description": 1-2 sentence description of what happened
- "category": one of "employment", "litigation", "medical", "financial", "correspondence", "regulatory", "other"
- "event_type": one of "filing", "hearing", "decision", "communication", "employment_action", "medical_event", "payment", "deadline", "meeting", "other"
- "significance": "high" for pivotal events (termination, filing, key decisions), "medium" for supporting events, "low" for minor references
- "parties": array of party names involved (if identifiable)
- "source_quote": brief verbatim quote from the document that references this event (under 200 chars)
- "page_reference": page number if determinable, otherwise omit

Rules:
- Only extract events with identifiable dates or time references.
- Do NOT infer or fabricate dates. If unsure, use "approximate" precision.
- Combine duplicate references to the same event.
- Order events chronologically.
- Return {"events": []} if no date-referenced events are found.`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const events: unknown[] = Array.isArray(parsed.events) ? parsed.events : [];

    // Validate and normalize each event
    return events
      .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
      .map((e) => normalizeEvent(e))
      .filter((e): e is TimelineEvent => e !== null);
  } catch (error) {
    console.error(`Timeline extraction failed for file ${fileId}:`, error);
    return [];
  }
}

/**
 * Validate and normalize a raw event object from the AI response.
 */
function normalizeEvent(raw: Record<string, unknown>): TimelineEvent | null {
  const date = typeof raw.date === 'string' ? raw.date.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';

  // date and title are required
  if (!date || !title) return null;

  // Validate date format (loose ISO check)
  if (!/^\d{4}-\d{2}-\d{2}/.test(date)) return null;

  const validCategories = [
    'employment', 'litigation', 'medical', 'financial',
    'correspondence', 'regulatory', 'other',
  ];
  const validEventTypes = [
    'filing', 'hearing', 'decision', 'communication',
    'employment_action', 'medical_event', 'payment',
    'deadline', 'meeting', 'other',
  ];
  const validSignificance = ['high', 'medium', 'low'];
  const validPrecision = ['day', 'month', 'year', 'approximate'];

  const category = validCategories.includes(raw.category as string)
    ? (raw.category as string)
    : 'other';
  const eventType = validEventTypes.includes(raw.event_type as string)
    ? (raw.event_type as string)
    : 'other';
  const significance = validSignificance.includes(raw.significance as string)
    ? (raw.significance as string)
    : 'medium';
  const datePrecision = validPrecision.includes(raw.date_precision as string)
    ? (raw.date_precision as string)
    : 'approximate';

  const event: TimelineEvent = {
    date: date.slice(0, 10), // Ensure YYYY-MM-DD only
    date_precision: datePrecision as TimelineEvent['date_precision'],
    title: title.slice(0, 200),
    category,
    event_type: eventType,
    significance: significance as TimelineEvent['significance'],
  };

  if (typeof raw.date_end === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw.date_end)) {
    event.date_end = raw.date_end.slice(0, 10);
  }
  if (typeof raw.date_text === 'string' && raw.date_text.trim()) {
    event.date_text = raw.date_text.trim().slice(0, 300);
  }
  if (typeof raw.description === 'string' && raw.description.trim()) {
    event.description = raw.description.trim().slice(0, 500);
  }
  if (Array.isArray(raw.parties)) {
    event.parties = raw.parties
      .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
      .map((p) => p.trim());
  }
  if (typeof raw.source_quote === 'string' && raw.source_quote.trim()) {
    event.source_quote = raw.source_quote.trim().slice(0, 300);
  }
  if (typeof raw.page_reference === 'number' && raw.page_reference > 0) {
    event.page_reference = Math.floor(raw.page_reference);
  }

  return event;
}

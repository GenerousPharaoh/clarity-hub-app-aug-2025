/**
 * Hierarchical text chunking for document processing.
 * Produces parent chunks (~1200 tokens) and child chunks (~400 tokens)
 * for multi-resolution retrieval.
 */

export interface Chunk {
  content: string;
  chunkType: 'parent' | 'child';
  chunkIndex: number;
  parentIndex?: number;
  pageNumber?: number;
  sectionHeading?: string;
  charStart: number;
  charEnd: number;
  timestampStart?: number;
  timestampEnd?: number;
}

const PARENT_CHUNK_SIZE = 1200; // ~1200 tokens (approx 4 chars/token)
const CHILD_CHUNK_SIZE = 400;
const OVERLAP = 100;

/**
 * Split text into sentences using common sentence boundaries.
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter((s) => s.trim().length > 0);
}

/**
 * Chunk text into hierarchical parent/child chunks.
 */
export function chunkText(
  text: string,
  options?: {
    pageBreaks?: number[]; // character offsets of page breaks
    sectionHeadings?: Array<{ heading: string; offset: number }>;
  }
): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  const sentences = splitSentences(text);
  const chunks: Chunk[] = [];
  let parentIndex = 0;

  // Build parent chunks from sentences
  let currentParent = '';
  let parentStart = 0;
  let currentOffset = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    if (currentParent.length + sentence.length > PARENT_CHUNK_SIZE * 4 && currentParent.length > 0) {
      // Emit parent chunk
      const parentChunk: Chunk = {
        content: currentParent.trim(),
        chunkType: 'parent',
        chunkIndex: parentIndex,
        charStart: parentStart,
        charEnd: parentStart + currentParent.length,
        pageNumber: findPageNumber(parentStart, options?.pageBreaks),
        sectionHeading: findSectionHeading(parentStart, options?.sectionHeadings),
      };
      chunks.push(parentChunk);

      // Generate child chunks from parent
      const children = splitIntoChildren(currentParent.trim(), parentIndex, parentStart);
      chunks.push(...children);

      parentIndex++;
      // Overlap: start the next parent with the last bit
      const overlapText = currentParent.slice(-OVERLAP * 4);
      parentStart = currentOffset - overlapText.length;
      currentParent = overlapText;
    }

    currentParent += (currentParent ? ' ' : '') + sentence;
    currentOffset += sentence.length + 1; // +1 for space
  }

  // Emit final parent chunk
  if (currentParent.trim().length > 0) {
    const parentChunk: Chunk = {
      content: currentParent.trim(),
      chunkType: 'parent',
      chunkIndex: parentIndex,
      charStart: parentStart,
      charEnd: parentStart + currentParent.length,
      pageNumber: findPageNumber(parentStart, options?.pageBreaks),
      sectionHeading: findSectionHeading(parentStart, options?.sectionHeadings),
    };
    chunks.push(parentChunk);

    const children = splitIntoChildren(currentParent.trim(), parentIndex, parentStart);
    chunks.push(...children);
  }

  return chunks;
}

/**
 * Split a parent chunk into child chunks.
 */
function splitIntoChildren(
  parentContent: string,
  parentIndex: number,
  parentCharStart: number
): Chunk[] {
  const children: Chunk[] = [];
  const targetSize = CHILD_CHUNK_SIZE * 4;

  if (parentContent.length <= targetSize) {
    // Parent is small enough to be its own child
    return [];
  }

  const sentences = splitSentences(parentContent);
  let current = '';
  let childIndex = 0;
  let localOffset = 0;

  for (const sentence of sentences) {
    if (current.length + sentence.length > targetSize && current.length > 0) {
      children.push({
        content: current.trim(),
        chunkType: 'child',
        chunkIndex: childIndex,
        parentIndex,
        charStart: parentCharStart + localOffset - current.length,
        charEnd: parentCharStart + localOffset,
      });
      childIndex++;
      current = '';
    }
    current += (current ? ' ' : '') + sentence;
    localOffset += sentence.length + 1;
  }

  if (current.trim().length > 0) {
    children.push({
      content: current.trim(),
      chunkType: 'child',
      chunkIndex: childIndex,
      parentIndex,
      charStart: parentCharStart + localOffset - current.length,
      charEnd: parentCharStart + localOffset,
    });
  }

  return children;
}

/**
 * Chunk a transcript with timestamps.
 */
export function chunkTranscript(
  segments: Array<{ text: string; start: number; end: number }>
): Chunk[] {
  const chunks: Chunk[] = [];
  let parentIndex = 0;
  let current = '';
  let currentStart = 0;
  let currentEnd = 0;
  let charOffset = 0;

  for (const segment of segments) {
    if (current.length + segment.text.length > PARENT_CHUNK_SIZE * 4 && current.length > 0) {
      chunks.push({
        content: current.trim(),
        chunkType: 'parent',
        chunkIndex: parentIndex,
        charStart: charOffset - current.length,
        charEnd: charOffset,
        timestampStart: currentStart,
        timestampEnd: currentEnd,
      });
      parentIndex++;
      current = '';
      currentStart = segment.start;
    }

    if (!current) currentStart = segment.start;
    current += (current ? ' ' : '') + segment.text;
    currentEnd = segment.end;
    charOffset += segment.text.length + 1;
  }

  if (current.trim().length > 0) {
    chunks.push({
      content: current.trim(),
      chunkType: 'parent',
      chunkIndex: parentIndex,
      charStart: charOffset - current.length,
      charEnd: charOffset,
      timestampStart: currentStart,
      timestampEnd: currentEnd,
    });
  }

  return chunks;
}

function findPageNumber(offset: number, pageBreaks?: number[]): number | undefined {
  if (!pageBreaks || pageBreaks.length === 0) return undefined;
  let page = 1;
  for (const breakOffset of pageBreaks) {
    if (offset >= breakOffset) page++;
    else break;
  }
  return page;
}

function findSectionHeading(
  offset: number,
  sections?: Array<{ heading: string; offset: number }>
): string | undefined {
  if (!sections || sections.length === 0) return undefined;
  let heading: string | undefined;
  for (const section of sections) {
    if (offset >= section.offset) heading = section.heading;
    else break;
  }
  return heading;
}

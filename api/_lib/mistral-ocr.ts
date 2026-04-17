/**
 * Mistral OCR integration for document text extraction.
 * Uses mistral-ocr-latest to extract structured markdown from PDFs and images.
 *
 * API format:
 * - PDFs: upload via Files API → OCR with file_id reference
 * - Images: OCR with image_url (data URI base64)
 */

const MISTRAL_FILES_URL = 'https://api.mistral.ai/v1/files';
const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr';

interface MistralOCRPage {
  index: number;
  markdown: string;
  images?: Array<{ id: string; image_base64?: string }>;
}

interface MistralOCRResponse {
  pages: MistralOCRPage[];
  model: string;
  usage?: { pages_processed: number };
}

/**
 * Upload a file to Mistral's Files API for OCR processing.
 * Returns the file_id to reference in the OCR call.
 */
async function uploadToMistral(
  blob: Blob,
  fileName: string,
  apiKey: string
): Promise<string> {
  const formData = new FormData();
  // Use Blob with filename (3rd arg) — File constructor may not exist in Node 18
  formData.append('file', new Blob([await blob.arrayBuffer()], { type: blob.type || 'application/pdf' }), fileName);
  formData.append('purpose', 'ocr');

  const response = await fetch(MISTRAL_FILES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mistral file upload failed (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Run OCR on a file that was uploaded to Mistral.
 */
async function ocrWithFileId(
  fileId: string,
  apiKey: string
): Promise<MistralOCRResponse> {
  const response = await fetch(MISTRAL_OCR_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'file',
        file_id: fileId,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mistral OCR failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Run OCR on an image using base64 data URI.
 */
async function ocrWithImageUrl(
  base64DataUri: string,
  apiKey: string
): Promise<MistralOCRResponse> {
  const response = await fetch(MISTRAL_OCR_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        image_url: base64DataUri,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mistral OCR failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export interface OCRResult {
  text: string;
  pageBreaks: number[]; // character offsets where each page starts
  sectionHeadings: Array<{ heading: string; offset: number }>; // markdown headings with offsets
}

/**
 * Extract headings (e.g. `# Foo`, `## Bar`) from a markdown string.
 * Returns each heading's text and character offset within the string.
 */
function extractMarkdownHeadings(
  markdown: string,
  baseOffset: number
): Array<{ heading: string; offset: number }> {
  const headings: Array<{ heading: string; offset: number }> = [];
  const lines = markdown.split('\n');
  let offset = 0;

  for (const line of lines) {
    // Match ATX-style headings: `#`, `##`, `###`, up to `######`
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (match) {
      const text = match[2].trim();
      if (text.length > 0 && text.length < 200) {
        headings.push({
          heading: text,
          offset: baseOffset + offset,
        });
      }
    }
    // +1 accounts for the newline removed by split
    offset += line.length + 1;
  }

  return headings;
}

/**
 * Extract text from a PDF or image using Mistral OCR.
 * Returns structured markdown with page boundaries preserved, plus
 * page-break offsets and section-heading offsets to feed the chunker.
 *
 * - PDFs: uploaded via Files API, then processed with file reference
 * - Images: sent directly as base64 data URI
 */
export async function extractWithMistralOCR(
  blob: Blob,
  fileName: string
): Promise<OCRResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not configured');
  }

  const isPdf =
    blob.type === 'application/pdf' ||
    fileName.toLowerCase().endsWith('.pdf');

  let result: MistralOCRResponse;

  if (isPdf) {
    const fileId = await uploadToMistral(blob, fileName, apiKey);
    result = await ocrWithFileId(fileId, apiKey);
  } else {
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = blob.type || guessMimeType(fileName);
    const dataUri = `data:${mimeType};base64,${base64}`;
    result = await ocrWithImageUrl(dataUri, apiKey);
  }

  if (!result.pages || result.pages.length === 0) {
    return { text: '', pageBreaks: [], sectionHeadings: [] };
  }

  let combined = '';
  const pageBreaks: number[] = [];
  const sectionHeadings: Array<{ heading: string; offset: number }> = [];

  for (const page of result.pages) {
    const pageMarker = `\n\n--- Page ${page.index + 1} ---\n\n`;
    // The page content starts after the marker
    const markerStart = combined.length;
    combined += pageMarker;
    const contentStart = combined.length;

    const pageMarkdown = (page.markdown || '').trim();
    combined += pageMarkdown;

    // Page break offset is where the page's actual content begins
    // (after the marker). For the first page, ignore the leading empty prefix.
    pageBreaks.push(markerStart === 0 ? 0 : contentStart);

    // Extract headings from this page with the correct global offset
    const pageHeadings = extractMarkdownHeadings(pageMarkdown, contentStart);
    sectionHeadings.push(...pageHeadings);
  }

  return {
    text: combined.trim(),
    pageBreaks,
    sectionHeadings,
  };
}

function guessMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    tiff: 'image/tiff',
    bmp: 'image/bmp',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

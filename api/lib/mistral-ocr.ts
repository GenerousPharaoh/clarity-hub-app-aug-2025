/**
 * Mistral OCR integration for document text extraction.
 * Uses mistral-ocr-latest to extract structured markdown from PDFs and images.
 * Returns concatenated markdown from all pages with page markers.
 */

const MISTRAL_OCR_ENDPOINT = 'https://api.mistral.ai/v1/ocr';

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
 * Extract text from a PDF or image using Mistral OCR.
 * Returns structured markdown with page boundaries preserved.
 */
export async function extractWithMistralOCR(
  blob: Blob,
  fileName: string
): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not configured');
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = blob.type || guessMimeType(fileName);

  const response = await fetch(MISTRAL_OCR_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'base64',
        document_data: `data:${mimeType};base64,${base64}`,
        document_name: fileName,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mistral OCR failed (${response.status}): ${errorBody}`);
  }

  const result: MistralOCRResponse = await response.json();

  if (!result.pages || result.pages.length === 0) {
    return '';
  }

  // Concatenate all pages with page markers for the chunker
  return result.pages
    .map((page) => {
      const pageMarker = `\n\n--- Page ${page.index + 1} ---\n\n`;
      return pageMarker + (page.markdown || '').trim();
    })
    .join('')
    .trim();
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

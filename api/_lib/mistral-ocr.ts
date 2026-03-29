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
  formData.append('file', new File([blob], fileName, { type: blob.type }));
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

/**
 * Extract text from a PDF or image using Mistral OCR.
 * Returns structured markdown with page boundaries preserved.
 *
 * - PDFs: uploaded via Files API, then processed with file reference
 * - Images: sent directly as base64 data URI
 */
export async function extractWithMistralOCR(
  blob: Blob,
  fileName: string
): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not configured');
  }

  const isPdf =
    blob.type === 'application/pdf' ||
    fileName.toLowerCase().endsWith('.pdf');

  let result: MistralOCRResponse;

  if (isPdf) {
    // PDFs must be uploaded first, then referenced by file_id
    const fileId = await uploadToMistral(blob, fileName, apiKey);
    result = await ocrWithFileId(fileId, apiKey);
  } else {
    // Images can use inline base64 data URI
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = blob.type || guessMimeType(fileName);
    const dataUri = `data:${mimeType};base64,${base64}`;
    result = await ocrWithImageUrl(dataUri, apiKey);
  }

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

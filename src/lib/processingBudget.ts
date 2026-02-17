import { formatFileSize } from './utils';

const PROCESSING_USAGE_KEY = 'clarity-hub-processing-usage';

export const PROCESSING_DAILY_FILE_LIMIT = 10;
export const PROCESSING_DAILY_MB_LIMIT_BYTES = 250 * 1024 * 1024; // 250MB/day
export const DEFAULT_ESTIMATED_FILE_BYTES = 5 * 1024 * 1024; // 5MB when size is unknown

interface ProcessingUsage {
  day: string;
  files: number;
  bytes: number;
}

export interface ProcessingBudgetCheck {
  allowed: boolean;
  reason?: string;
  remainingFiles: number;
  remainingBytes: number;
  usage: ProcessingUsage;
}

export interface ProcessingEstimate {
  extractedChars: number;
  embeddingChunks: number;
  totalTokens: number;
}

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readUsage(): ProcessingUsage {
  if (typeof window === 'undefined') {
    return { day: getTodayKey(), files: 0, bytes: 0 };
  }

  try {
    const raw = localStorage.getItem(PROCESSING_USAGE_KEY);
    if (!raw) return { day: getTodayKey(), files: 0, bytes: 0 };

    const parsed = JSON.parse(raw) as Partial<ProcessingUsage>;
    const today = getTodayKey();

    if (parsed.day !== today) {
      return { day: today, files: 0, bytes: 0 };
    }

    return {
      day: today,
      files: typeof parsed.files === 'number' ? parsed.files : 0,
      bytes: typeof parsed.bytes === 'number' ? parsed.bytes : 0,
    };
  } catch {
    return { day: getTodayKey(), files: 0, bytes: 0 };
  }
}

function writeUsage(usage: ProcessingUsage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROCESSING_USAGE_KEY, JSON.stringify(usage));
  } catch {
    // ignore localStorage failures
  }
}

function normalizeBytes(fileSizeBytes?: number): number {
  if (typeof fileSizeBytes === 'number' && Number.isFinite(fileSizeBytes) && fileSizeBytes > 0) {
    return fileSizeBytes;
  }
  return DEFAULT_ESTIMATED_FILE_BYTES;
}

function checkBudgetForWorkload(fileCount: number, totalBytes: number): ProcessingBudgetCheck {
  const usage = readUsage();
  const safeFileCount = Number.isFinite(fileCount) ? Math.max(0, Math.floor(fileCount)) : 0;
  const safeBytes = Number.isFinite(totalBytes) ? Math.max(0, totalBytes) : 0;

  const nextFiles = usage.files + safeFileCount;
  const nextBytes = usage.bytes + safeBytes;

  const remainingFiles = Math.max(0, PROCESSING_DAILY_FILE_LIMIT - usage.files);
  const remainingBytes = Math.max(0, PROCESSING_DAILY_MB_LIMIT_BYTES - usage.bytes);

  if (nextFiles > PROCESSING_DAILY_FILE_LIMIT) {
    return {
      allowed: false,
      reason: `Daily file limit reached (${PROCESSING_DAILY_FILE_LIMIT}/day).`,
      remainingFiles,
      remainingBytes,
      usage,
    };
  }

  if (nextBytes > PROCESSING_DAILY_MB_LIMIT_BYTES) {
    return {
      allowed: false,
      reason: `Daily data limit reached (${formatFileSize(PROCESSING_DAILY_MB_LIMIT_BYTES)}/day).`,
      remainingFiles,
      remainingBytes,
      usage,
    };
  }

  return {
    allowed: true,
    remainingFiles,
    remainingBytes,
    usage,
  };
}

export function getProcessingUsage(): ProcessingUsage {
  return readUsage();
}

export function checkProcessingBudget(fileSizeBytes?: number): ProcessingBudgetCheck {
  const bytes = normalizeBytes(fileSizeBytes);
  return checkBudgetForWorkload(1, bytes);
}

export function checkProcessingBudgetBatch(
  fileCount: number,
  totalBytes: number
): ProcessingBudgetCheck {
  return checkBudgetForWorkload(fileCount, totalBytes);
}

export function reserveProcessingBudget(fileSizeBytes?: number): void {
  const usage = readUsage();
  const bytes = normalizeBytes(fileSizeBytes);

  writeUsage({
    day: usage.day,
    files: usage.files + 1,
    bytes: usage.bytes + bytes,
  });
}

/**
 * Heuristic size estimate by file type for pre-processing cost previews.
 * These values are conservative defaults; actual usage depends on extracted text.
 */
export function estimateFileBytesByType(fileType?: string | null): number {
  switch (fileType) {
    case 'text':
      return 512 * 1024; // 0.5MB
    case 'document':
    case 'spreadsheet':
      return 3 * 1024 * 1024; // 3MB
    case 'image':
      return 4 * 1024 * 1024; // 4MB
    case 'pdf':
      return 6 * 1024 * 1024; // 6MB
    case 'audio':
      return 12 * 1024 * 1024; // 12MB
    case 'video':
      return 25 * 1024 * 1024; // 25MB
    default:
      return DEFAULT_ESTIMATED_FILE_BYTES;
  }
}

/**
 * Rough token estimate to help users decide before triggering processing.
 * This is intentionally conservative and not billing-accurate.
 */
export function estimateProcessingCost(fileSizeBytes?: number): ProcessingEstimate {
  const bytes = normalizeBytes(fileSizeBytes);

  // Assume extracted text is between 2k chars and 50k chars, roughly scaling with file size.
  const extractedChars = Math.min(50_000, Math.max(2_000, Math.round(bytes * 2.5)));

  // Parent chunk target is ~1200 tokens (~4800 chars) in the current chunker.
  const embeddingChunks = Math.max(1, Math.ceil(extractedChars / 4800));

  const extractionTokens = Math.ceil(extractedChars / 4);
  const summaryTokens = 300;
  const embeddingTokens = Math.ceil(extractedChars / 4);
  const totalTokens = extractionTokens + summaryTokens + embeddingTokens;

  return {
    extractedChars,
    embeddingChunks,
    totalTokens,
  };
}

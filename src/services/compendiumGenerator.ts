/**
 * Compendium / Exhibit Book PDF Generator
 *
 * Uses pdf-lib to merge exhibit PDFs and images into a single
 * court-ready compendium with cover page, table of contents,
 * tab dividers, and sequential page numbering.
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';

// ── Types ──────────────────────────────────────────────────

export interface CompendiumConfig {
  title: string;
  courtName?: string;
  fileNumber?: string;
  caseName?: string;
  partyName?: string;
  counselName?: string;
  tabStyle: 'letter' | 'number';
  includeCoverPage: boolean;
  includeIndex: boolean;
  includeTabDividers: boolean;
  includePageNumbers: boolean;
}

export interface CompendiumEntry {
  tabLabel: string;
  displayTitle: string;
  fileBlob: Blob;
  fileType: string; // 'pdf' | 'image'
}

export interface CompendiumResult {
  blob: Blob;
  pageCount: number;
  fileSize: number;
}

// ── Constants ──────────────────────────────────────────────

const PAGE_WIDTH = 612; // US Letter 8.5" in points
const PAGE_HEIGHT = 792; // US Letter 11" in points
const MARGIN = 72; // 1 inch margin
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ── Helpers ────────────────────────────────────────────────

/** Draw centered text at a given y position. */
function drawCenteredText(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0.1, 0.1, 0.1)
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (PAGE_WIDTH - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
}

/** Word-wrap text to fit within maxWidth, returning an array of lines. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      currentLine = test;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Generate tab labels: A, B, C... or 1, 2, 3... */
export function generateTabLabels(count: number, style: 'letter' | 'number'): string[] {
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    if (style === 'number') {
      labels.push(String(i + 1));
    } else {
      // A-Z, then AA, AB, etc.
      let label = '';
      let n = i;
      do {
        label = String.fromCharCode(65 + (n % 26)) + label;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);
      labels.push(label);
    }
  }
  return labels;
}

// ── Main Generator ─────────────────────────────────────────

export async function generateCompendium(
  config: CompendiumConfig,
  entries: CompendiumEntry[],
  onProgress?: (stage: string, current: number, total: number) => void
): Promise<CompendiumResult> {
  const mergedPdf = await PDFDocument.create();

  // Embed standard fonts
  const helvetica = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await mergedPdf.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await mergedPdf.embedFont(StandardFonts.TimesRomanBold);

  // Track page ranges for each entry (for index)
  const pageRanges: Array<{
    tabLabel: string;
    title: string;
    startPage: number;
    endPage: number;
  }> = [];

  onProgress?.('Preparing', 0, entries.length);

  // ─── 1. Cover Page ───────────────────────────────────────

  if (config.includeCoverPage) {
    const cover = mergedPdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Top decorative line
    cover.drawRectangle({
      x: MARGIN,
      y: PAGE_HEIGHT - 100,
      width: CONTENT_WIDTH,
      height: 2,
      color: rgb(0.15, 0.15, 0.15),
    });

    let y = PAGE_HEIGHT - 140;

    // Court name
    if (config.courtName) {
      const courtLines = wrapText(config.courtName, timesRomanBold, 14, CONTENT_WIDTH);
      for (const line of courtLines) {
        drawCenteredText(cover, line, y, timesRomanBold, 14);
        y -= 20;
      }
      y -= 10;
    }

    // File number
    if (config.fileNumber) {
      drawCenteredText(cover, config.fileNumber, y, timesRoman, 12, rgb(0.3, 0.3, 0.3));
      y -= 30;
    }

    // Separator line
    cover.drawRectangle({
      x: PAGE_WIDTH / 2 - 80,
      y,
      width: 160,
      height: 1,
      color: rgb(0.6, 0.6, 0.6),
    });
    y -= 30;

    // Case name
    if (config.caseName) {
      drawCenteredText(cover, 'BETWEEN:', y, timesRoman, 10, rgb(0.4, 0.4, 0.4));
      y -= 25;
      const caseLines = wrapText(config.caseName, timesRomanBold, 13, CONTENT_WIDTH);
      for (const line of caseLines) {
        drawCenteredText(cover, line, y, timesRomanBold, 13);
        y -= 20;
      }
      y -= 20;
    }

    // Title of the compendium
    y = Math.min(y, PAGE_HEIGHT / 2 + 20);
    const titleLines = wrapText(config.title.toUpperCase(), timesRomanBold, 18, CONTENT_WIDTH);
    for (const line of titleLines) {
      drawCenteredText(cover, line, y, timesRomanBold, 18);
      y -= 26;
    }

    // Party name
    if (config.partyName) {
      y -= 20;
      const partyLines = wrapText(config.partyName, timesRoman, 11, CONTENT_WIDTH);
      for (const line of partyLines) {
        drawCenteredText(cover, line, y, timesRoman, 11, rgb(0.3, 0.3, 0.3));
        y -= 16;
      }
    }

    // Counsel name at bottom
    if (config.counselName) {
      const counselY = MARGIN + 60;
      cover.drawRectangle({
        x: MARGIN,
        y: counselY + 20,
        width: CONTENT_WIDTH,
        height: 1,
        color: rgb(0.6, 0.6, 0.6),
      });
      const counselLines = wrapText(config.counselName, timesRoman, 10, CONTENT_WIDTH);
      let cy = counselY;
      for (const line of counselLines) {
        drawCenteredText(cover, line, cy, timesRoman, 10, rgb(0.3, 0.3, 0.3));
        cy -= 14;
      }
    }

    // Bottom decorative line
    cover.drawRectangle({
      x: MARGIN,
      y: MARGIN,
      width: CONTENT_WIDTH,
      height: 2,
      color: rgb(0.15, 0.15, 0.15),
    });
  }

  // ─── 2. Reserve placeholder pages for the index ──────────
  // We will replace these after knowing page ranges.

  const indexPageStart = mergedPdf.getPageCount();
  const indexPlaceholderPages: number[] = [];
  if (config.includeIndex) {
    // Reserve 1 page initially; we may need more
    const placeholder = mergedPdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    indexPlaceholderPages.push(indexPageStart);
    // Mark it so we know to replace
    placeholder.drawText('', { x: 0, y: 0, size: 1, font: helvetica });
  }

  // ─── 3. Merge each entry ────────────────────────────────

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    onProgress?.('Merging documents', i + 1, entries.length);

    // Tab divider page
    if (config.includeTabDividers) {
      const divider = mergedPdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      // Background tint
      divider.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        color: rgb(0.97, 0.97, 0.97),
      });

      // Tab label, large and centered
      const prefix = config.tabStyle === 'letter' ? 'TAB' : 'TAB';
      const tabText = `${prefix} ${entry.tabLabel}`;
      drawCenteredText(divider, tabText, PAGE_HEIGHT / 2 + 40, helveticaBold, 36);

      // Decorative line under tab label
      const tabTextWidth = helveticaBold.widthOfTextAtSize(tabText, 36);
      divider.drawRectangle({
        x: (PAGE_WIDTH - tabTextWidth) / 2,
        y: PAGE_HEIGHT / 2 + 30,
        width: tabTextWidth,
        height: 2,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Document title below
      const titleLines = wrapText(entry.displayTitle, helvetica, 14, CONTENT_WIDTH);
      let ty = PAGE_HEIGHT / 2;
      for (const line of titleLines) {
        drawCenteredText(divider, line, ty, helvetica, 14, rgb(0.35, 0.35, 0.35));
        ty -= 20;
      }
    }

    const startPage = mergedPdf.getPageCount();

    // Merge content
    if (entry.fileType === 'pdf') {
      try {
        const arrayBuf = await entry.fileBlob.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        for (const page of copiedPages) {
          mergedPdf.addPage(page);
        }
      } catch (err) {
        // If PDF fails to load (encrypted, corrupted), add an error page
        const errorPage = mergedPdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        drawCenteredText(
          errorPage,
          'This document could not be included.',
          PAGE_HEIGHT / 2 + 20,
          helveticaBold,
          14,
          rgb(0.6, 0.1, 0.1)
        );
        drawCenteredText(
          errorPage,
          entry.displayTitle,
          PAGE_HEIGHT / 2 - 10,
          helvetica,
          11,
          rgb(0.4, 0.4, 0.4)
        );
        const reason = err instanceof Error ? err.message : 'Unknown error';
        drawCenteredText(
          errorPage,
          `Reason: ${reason}`,
          PAGE_HEIGHT / 2 - 30,
          helvetica,
          9,
          rgb(0.5, 0.5, 0.5)
        );
      }
    } else if (entry.fileType === 'image') {
      try {
        const imageBytes = await entry.fileBlob.arrayBuffer();
        let image;
        const mimeType = entry.fileBlob.type.toLowerCase();

        if (mimeType.includes('png')) {
          image = await mergedPdf.embedPng(imageBytes);
        } else {
          // Default to JPEG for jpg, jpeg, and other image types
          image = await mergedPdf.embedJpg(imageBytes);
        }

        const imagePage = mergedPdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

        // Scale image to fit within page margins
        const maxW = PAGE_WIDTH - MARGIN * 2;
        const maxH = PAGE_HEIGHT - MARGIN * 2;
        const scale = Math.min(maxW / image.width, maxH / image.height, 1);
        const scaledW = image.width * scale;
        const scaledH = image.height * scale;

        imagePage.drawImage(image, {
          x: (PAGE_WIDTH - scaledW) / 2,
          y: (PAGE_HEIGHT - scaledH) / 2,
          width: scaledW,
          height: scaledH,
        });
      } catch (err) {
        const errorPage = mergedPdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        drawCenteredText(
          errorPage,
          'Image could not be embedded.',
          PAGE_HEIGHT / 2 + 20,
          helveticaBold,
          14,
          rgb(0.6, 0.1, 0.1)
        );
        drawCenteredText(
          errorPage,
          entry.displayTitle,
          PAGE_HEIGHT / 2 - 10,
          helvetica,
          11,
          rgb(0.4, 0.4, 0.4)
        );
      }
    }

    const endPage = mergedPdf.getPageCount() - 1;
    pageRanges.push({
      tabLabel: entry.tabLabel,
      title: entry.displayTitle,
      startPage,
      endPage,
    });
  }

  // ─── 4. Fill in the index / table of contents ────────────

  if (config.includeIndex && indexPlaceholderPages.length > 0) {
    // Calculate the page number offset:
    // Cover page = page 0 (if present), index starts after that
    const numberingOffset = config.includeCoverPage ? 1 : 0;

    // Build index content on the reserved page(s)
    const indexPage = mergedPdf.getPage(indexPageStart);

    // Clear the placeholder page by drawing a white rectangle
    indexPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: rgb(1, 1, 1),
    });

    // Title
    drawCenteredText(indexPage, 'TABLE OF CONTENTS', PAGE_HEIGHT - MARGIN - 10, timesRomanBold, 16);

    // Separator line
    indexPage.drawRectangle({
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - 20,
      width: CONTENT_WIDTH,
      height: 1,
      color: rgb(0.3, 0.3, 0.3),
    });

    let y = PAGE_HEIGHT - MARGIN - 50;
    const lineHeight = 22;

    for (const range of pageRanges) {
      if (y < MARGIN + 40) {
        // We would need another page for the index. For now, note overflow.
        // In practice, most compendiums fit in one index page.
        drawCenteredText(
          indexPage,
          '(continued...)',
          MARGIN + 20,
          helvetica,
          9,
          rgb(0.5, 0.5, 0.5)
        );
        break;
      }

      // Tab label column
      const tabPrefix = config.tabStyle === 'letter' ? 'Tab' : 'Tab';
      const labelText = `${tabPrefix} ${range.tabLabel}`;
      indexPage.drawText(labelText, {
        x: MARGIN,
        y,
        size: 11,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Title (truncated if needed)
      const titleX = MARGIN + 70;
      const maxTitleWidth = CONTENT_WIDTH - 70 - 50; // leave room for page number
      let displayTitle = range.title;
      while (
        helvetica.widthOfTextAtSize(displayTitle, 11) > maxTitleWidth &&
        displayTitle.length > 3
      ) {
        displayTitle = displayTitle.slice(0, -4) + '...';
      }
      indexPage.drawText(displayTitle, {
        x: titleX,
        y,
        size: 11,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Dot leader
      const titleEnd = titleX + helvetica.widthOfTextAtSize(displayTitle, 11) + 5;
      const pageNumText = String(range.startPage - numberingOffset + 1);
      const pageNumWidth = helvetica.widthOfTextAtSize(pageNumText, 11);
      const pageNumX = MARGIN + CONTENT_WIDTH - pageNumWidth;

      let dotX = titleEnd;
      while (dotX < pageNumX - 10) {
        indexPage.drawText('.', {
          x: dotX,
          y,
          size: 9,
          font: helvetica,
          color: rgb(0.6, 0.6, 0.6),
        });
        dotX += 5;
      }

      // Page number
      indexPage.drawText(pageNumText, {
        x: pageNumX,
        y,
        size: 11,
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1),
      });

      y -= lineHeight;
    }
  }

  // ─── 5. Add page numbers ────────────────────────────────

  if (config.includePageNumbers) {
    const pages = mergedPdf.getPages();
    // Skip the cover page
    const startIdx = config.includeCoverPage ? 1 : 0;

    for (let i = startIdx; i < pages.length; i++) {
      const page = pages[i];
      const { width } = page.getSize();
      const pageNum = String(i - startIdx + 1);
      const numWidth = helvetica.widthOfTextAtSize(pageNum, 10);

      page.drawText(pageNum, {
        x: (width - numWidth) / 2,
        y: 30,
        size: 10,
        font: helvetica,
        color: rgb(0.45, 0.45, 0.45),
      });
    }
  }

  // ─── 6. Serialize and return ─────────────────────────────

  onProgress?.('Finalizing', entries.length, entries.length);

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: mergedPdf.getPageCount(),
    fileSize: pdfBytes.length,
  };
}

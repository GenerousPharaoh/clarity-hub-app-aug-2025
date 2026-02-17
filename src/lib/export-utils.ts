/**
 * Export conversion utilities for notes and chat conversations.
 * Supports: Markdown, PDF, DOCX, and Plain Text.
 */

// ── Markdown Export ────────────────────────────────────────

/**
 * Clean HTML content to markdown-ish plain text.
 * Strips HTML tags while preserving basic structure.
 */
function htmlToText(html: string): string {
  // Replace block elements with newlines
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<\/ol>/gi, '\n');

  // Bold and italic
  text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i>(.*?)<\/i>/gi, '*$1*');

  // Links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Headers
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1');

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Clean up excessive newlines
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

export function exportToMarkdown(content: string, title: string): string {
  const cleanContent = content.startsWith('<') ? htmlToText(content) : content;
  return `# ${title}\n\n${cleanContent}\n`;
}

export function exportToPlainText(content: string, title: string): string {
  const cleanContent = content.startsWith('<') ? htmlToText(content) : content;
  // Strip markdown formatting too
  const plain = cleanContent
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return `${title}\n${'='.repeat(title.length)}\n\n${plain}\n`;
}

// ── Chat Export ────────────────────────────────────────────

interface ChatExportMessage {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp?: Date;
}

export function exportChatToMarkdown(
  messages: ChatExportMessage[],
  title: string
): string {
  const lines = [`# ${title}`, '', `*Exported ${new Date().toLocaleDateString()}*`, ''];

  for (const msg of messages) {
    const role = msg.role === 'user' ? 'You' : 'AI Assistant';
    const model = msg.model ? ` (${msg.model === 'gpt' ? 'GPT-5.2' : 'Gemini'})` : '';
    const time = msg.timestamp
      ? ` — ${msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : '';

    lines.push(`### ${role}${model}${time}`, '');
    lines.push(msg.content, '');
    lines.push('---', '');
  }

  return lines.join('\n');
}

// ── PDF Export ─────────────────────────────────────────────

export async function exportToPdf(content: string, title: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const cleanContent = content.startsWith('<') ? htmlToText(content) : content;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = doc.internal.pageSize.getHeight() - margin * 2;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, margin + 10);

  // Body
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const lines = doc.splitTextToSize(cleanContent, pageWidth);
  let y = margin + 20;

  for (const line of lines) {
    if (y > pageHeight + margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5;
  }

  return doc.output('blob');
}

// ── DOCX Export ────────────────────────────────────────────

export async function exportToDocx(content: string, title: string): Promise<Blob> {
  const docx = await import('docx');

  const cleanContent = content.startsWith('<') ? htmlToText(content) : content;

  const paragraphs = cleanContent.split('\n\n').filter(Boolean).map((para) => {
    // Check if it's a heading
    const h1Match = para.match(/^#\s+(.+)/);
    const h2Match = para.match(/^##\s+(.+)/);
    const h3Match = para.match(/^###\s+(.+)/);

    if (h1Match) {
      return new docx.Paragraph({
        text: h1Match[1],
        heading: docx.HeadingLevel.HEADING_1,
      });
    }
    if (h2Match) {
      return new docx.Paragraph({
        text: h2Match[1],
        heading: docx.HeadingLevel.HEADING_2,
      });
    }
    if (h3Match) {
      return new docx.Paragraph({
        text: h3Match[1],
        heading: docx.HeadingLevel.HEADING_3,
      });
    }

    // Regular paragraph
    return new docx.Paragraph({
      children: [new docx.TextRun(para)],
      spacing: { after: 200 },
    });
  });

  const doc = new docx.Document({
    sections: [
      {
        properties: {},
        children: [
          new docx.Paragraph({
            text: title,
            heading: docx.HeadingLevel.TITLE,
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  return docx.Packer.toBlob(doc);
}

// ── Download Utility ───────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

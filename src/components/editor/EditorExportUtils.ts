/**
 * Professional document export utilities for the Clarity Hub editor
 * Provides high-quality export functionality for PDF, DOCX, and HTML formats
 */

import { jsPDF } from 'jspdf';

export interface ExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize?: number;
  fontFamily?: string;
  includeMetadata?: boolean;
}

export class DocumentExporter {
  private static defaultOptions: ExportOptions = {
    title: 'Document',
    author: 'Clarity Hub',
    subject: 'Professional Document',
    margins: {
      top: 72, // 1 inch
      right: 72,
      bottom: 72,
      left: 72,
    },
    fontSize: 12,
    fontFamily: 'Inter, Arial, sans-serif',
    includeMetadata: true,
  };

  /**
   * Export document content as PDF
   */
  static async exportAsPDF(
    content: string,
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Create a temporary div to render the content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      tempDiv.style.fontFamily = opts.fontFamily!;
      tempDiv.style.fontSize = `${opts.fontSize}px`;
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#000';
      tempDiv.style.padding = '40px';
      tempDiv.style.maxWidth = '800px';
      tempDiv.style.margin = '0 auto';
      
      // Apply professional styling
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      tempDiv.style.backgroundColor = '#fff';
      
      document.body.appendChild(tempDiv);
      
      // Use modern browser print functionality for better PDF generation
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${opts.title}</title>
              <meta charset="utf-8">
              <style>
                @page {
                  margin: 1in;
                  size: letter;
                }
                body {
                  font-family: ${opts.fontFamily};
                  font-size: ${opts.fontSize}px;
                  line-height: 1.6;
                  color: #000;
                  max-width: none;
                  margin: 0;
                  padding: 0;
                }
                h1, h2, h3, h4, h5, h6 {
                  color: #000;
                  margin-top: 1.5em;
                  margin-bottom: 0.75em;
                  font-weight: 600;
                }
                h1 { font-size: 2em; border-bottom: 2px solid #333; padding-bottom: 0.3em; }
                h2 { font-size: 1.5em; }
                h3 { font-size: 1.25em; }
                p { margin-bottom: 1em; }
                blockquote {
                  border-left: 4px solid #ccc;
                  margin: 1em 0;
                  padding-left: 1em;
                  color: #666;
                  font-style: italic;
                }
                table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 1em 0;
                }
                table th, table td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                table th {
                  background-color: #f2f2f2;
                  font-weight: 600;
                }
                code {
                  background-color: #f4f4f4;
                  padding: 2px 4px;
                  border-radius: 3px;
                  font-family: 'Courier New', monospace;
                }
                pre {
                  background-color: #f4f4f4;
                  padding: 1em;
                  border-radius: 4px;
                  overflow-x: auto;
                }
                ul, ol {
                  margin-bottom: 1em;
                }
                li {
                  margin-bottom: 0.5em;
                }
                .exhibit-citation {
                  background-color: #e3f2fd;
                  color: #1976d2;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-weight: bold;
                  font-size: 0.9em;
                }
              </style>
            </head>
            <body>${content}</body>
          </html>
        `);
        printWindow.document.close();
        
        // Trigger print dialog for PDF export
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      
      // Clean up
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to export PDF. Please try again.');
    }
  }

  /**
   * Export document content as HTML
   */
  static exportAsHTML(
    content: string,
    options: Partial<ExportOptions> = {}
  ): void {
    const opts = { ...this.defaultOptions, ...options };
    
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <style>
    body {
      font-family: ${opts.fontFamily};
      font-size: ${opts.fontSize}px;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: #fff;
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: #2c3e50;
      margin-top: 2em;
      margin-bottom: 1em;
      font-weight: 600;
      line-height: 1.3;
    }
    
    h1 {
      font-size: 2.5em;
      border-bottom: 3px solid #3498db;
      padding-bottom: 0.5em;
    }
    
    h2 { font-size: 2em; color: #2980b9; }
    h3 { font-size: 1.5em; color: #3498db; }
    h4 { font-size: 1.25em; }
    h5 { font-size: 1.1em; }
    h6 { font-size: 1em; text-transform: uppercase; letter-spacing: 0.05em; }
    
    p {
      margin-bottom: 1.2em;
      text-align: justify;
    }
    
    blockquote {
      border-left: 4px solid #3498db;
      margin: 1.5em 0;
      padding-left: 1.5em;
      color: #7f8c8d;
      font-style: italic;
      background-color: #f8f9fa;
      padding: 1em 1em 1em 1.5em;
      border-radius: 0 4px 4px 0;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5em 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    table th, table td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    
    table th {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      font-weight: 600;
      color: #495057;
    }
    
    table tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    
    code {
      background-color: #f1f3f4;
      color: #d73a49;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      font-size: 0.9em;
    }
    
    pre {
      background-color: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      margin: 1.5em 0;
    }
    
    pre code {
      background: none;
      color: inherit;
      padding: 0;
      border-radius: 0;
    }
    
    ul, ol {
      margin-bottom: 1.2em;
      padding-left: 2em;
    }
    
    li {
      margin-bottom: 0.6em;
    }
    
    .exhibit-citation {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      color: #1565c0;
      padding: 4px 10px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9em;
      display: inline-block;
      margin: 0 2px;
      border: 1px solid rgba(21, 101, 192, 0.2);
    }
    
    .exhibit-citation:hover {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      color: white;
    }
    
    hr {
      border: none;
      height: 2px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      margin: 2em 0;
      border-radius: 2px;
    }
    
    @media print {
      body {
        padding: 0;
        font-size: 11px;
      }
      
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }
      
      blockquote, table, pre {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${content}
  
  <footer style="margin-top: 3em; padding-top: 2em; border-top: 1px solid #e1e4e8; color: #6c757d; font-size: 0.9em; text-align: center;">
    <p>Generated by Clarity Hub Professional Document Editor</p>
    <p>Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  </footer>
</body>
</html>`;

    // Create and download the file
    const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${opts.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'document'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export document content as DOCX (simplified version)
   */
  static exportAsDOCX(
    content: string,
    options: Partial<ExportOptions> = {}
  ): void {
    const opts = { ...this.defaultOptions, ...options };
    
    // Create RTF content (which can be opened by Word)
    const rtfHeader = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}`;
    const rtfBody = content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '{\\f0\\fs28\\b $1\\par}')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '{\\f0\\fs24\\b $1\\par}')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '{\\f0\\fs20\\b $1\\par}')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '{\\f0\\fs20 $1\\par}')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '{\\b $1}')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '{\\i $1}')
      .replace(/<br\s*\/?>/gi, '\\par')
      .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    
    const rtfFooter = '}';
    const rtfContent = rtfHeader + rtfBody + rtfFooter;
    
    // Create and download the file
    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${opts.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'document'}.rtf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get document statistics
   */
  static getDocumentStats(content: string): {
    wordCount: number;
    characterCount: number;
    paragraphCount: number;
    headingCount: number;
  } {
    // Strip HTML tags for accurate counting
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    const paragraphs = content.split(/<\/p>/i).length - 1;
    const headings = (content.match(/<h[1-6][^>]*>/gi) || []).length;
    
    return {
      wordCount: words.length,
      characterCount: textContent.length,
      paragraphCount: Math.max(paragraphs, 1),
      headingCount: headings,
    };
  }
}

export default DocumentExporter;
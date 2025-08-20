import * as pdfjsLib from 'pdfjs-dist';
import { advancedSearchService } from './advancedSearchService';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.js';

export interface ExtractedContent {
  text: string;
  pageNumber?: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
}

export interface TextExtractionResult {
  content: ExtractedContent[];
  totalPages?: number;
  fileType: string;
  extractedAt: string;
  error?: string;
}

class TextExtractionService {
  private supportedTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'text/html',
    'application/xml',
    'text/xml'
  ];

  /**
   * Check if file type is supported for text extraction
   */
  isSupported(contentType: string): boolean {
    return this.supportedTypes.includes(contentType);
  }

  /**
   * Extract text content from a file
   */
  async extractText(file: File | Blob, contentType: string): Promise<TextExtractionResult> {
    try {
      let content: ExtractedContent[] = [];

      switch (contentType) {
        case 'application/pdf':
          content = await this.extractFromPDF(file);
          break;
        case 'text/plain':
        case 'text/csv':
        case 'application/json':
        case 'text/html':
        case 'application/xml':
        case 'text/xml':
          content = await this.extractFromText(file);
          break;
        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }

      return {
        content,
        totalPages: content.length,
        fileType: contentType,
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error extracting text:', error);
      return {
        content: [],
        fileType: contentType,
        extractedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractFromPDF(file: File | Blob): Promise<ExtractedContent[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const content: ExtractedContent[] = [];
      
      // Extract metadata
      const metadata = await pdf.getMetadata();
      const pdfMetadata = {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        subject: metadata.info?.Subject,
        keywords: metadata.info?.Keywords,
        creator: metadata.info?.Creator,
        producer: metadata.info?.Producer,
        creationDate: metadata.info?.CreationDate,
        modificationDate: metadata.info?.ModDate
      };

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items into a single string
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (pageText) {
            content.push({
              text: pageText,
              pageNumber: pageNum,
              metadata: pageNum === 1 ? pdfMetadata : undefined
            });
          }
        } catch (pageError) {
          console.error(`Error extracting text from page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }

      return content;

    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw error;
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractFromText(file: File | Blob): Promise<ExtractedContent[]> {
    try {
      const text = await file.text();
      
      return [{
        text: text.trim(),
        pageNumber: 1
      }];

    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw error;
    }
  }

  /**
   * Index file content for search
   */
  async indexFileForSearch(
    fileId: string,
    file: File | Blob,
    contentType: string
  ): Promise<void> {
    try {
      if (!this.isSupported(contentType)) {
        console.log(`Skipping indexing for unsupported type: ${contentType}`);
        return;
      }

      const extractionResult = await this.extractText(file, contentType);
      
      if (extractionResult.error) {
        console.error(`Failed to extract text for file ${fileId}:`, extractionResult.error);
        return;
      }

      // Index each page/section separately
      for (const content of extractionResult.content) {
        if (content.text.length > 10) { // Only index meaningful content
          await advancedSearchService.indexFileContent(
            fileId,
            content.text,
            content.pageNumber
          );
        }
      }

      console.log(`Successfully indexed ${extractionResult.content.length} pages for file ${fileId}`);

    } catch (error) {
      console.error(`Error indexing file ${fileId}:`, error);
      // Don't throw error as indexing is not critical for file upload
    }
  }

  /**
   * Extract and index text from uploaded file URL
   */
  async indexFromFileUrl(fileId: string, fileUrl: string, contentType: string): Promise<void> {
    try {
      if (!this.isSupported(contentType)) {
        return;
      }

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();
      await this.indexFileForSearch(fileId, blob, contentType);

    } catch (error) {
      console.error(`Error indexing file from URL ${fileUrl}:`, error);
    }
  }

  /**
   * Extract metadata from document
   */
  async extractMetadata(file: File | Blob, contentType: string): Promise<any> {
    try {
      if (contentType === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const metadata = await pdf.getMetadata();
        
        return {
          title: metadata.info?.Title,
          author: metadata.info?.Author,
          subject: metadata.info?.Subject,
          keywords: metadata.info?.Keywords,
          creator: metadata.info?.Creator,
          producer: metadata.info?.Producer,
          creationDate: metadata.info?.CreationDate,
          modificationDate: metadata.info?.ModDate,
          pageCount: pdf.numPages
        };
      }

      // For other file types, extract basic metadata
      return {
        size: file.size,
        type: contentType,
        lastModified: (file as File).lastModified 
          ? new Date((file as File).lastModified).toISOString()
          : undefined
      };

    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {};
    }
  }

  /**
   * Search within extracted text content
   */
  async searchInContent(
    content: ExtractedContent[],
    searchTerm: string,
    caseSensitive: boolean = false
  ): Promise<{
    matches: Array<{
      pageNumber?: number;
      text: string;
      context: string;
      position: number;
    }>;
    totalMatches: number;
  }> {
    const matches: Array<{
      pageNumber?: number;
      text: string;
      context: string;
      position: number;
    }> = [];

    const searchRegex = new RegExp(
      searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      caseSensitive ? 'g' : 'gi'
    );

    for (const item of content) {
      const text = item.text;
      let match;

      while ((match = searchRegex.exec(text)) !== null) {
        const position = match.index;
        const contextStart = Math.max(0, position - 50);
        const contextEnd = Math.min(text.length, position + searchTerm.length + 50);
        const context = text.substring(contextStart, contextEnd);

        matches.push({
          pageNumber: item.pageNumber,
          text: match[0],
          context,
          position
        });

        // Prevent infinite loop for global regex
        if (!searchRegex.global) break;
      }
    }

    return {
      matches,
      totalMatches: matches.length
    };
  }

  /**
   * Get text preview from content
   */
  getTextPreview(content: ExtractedContent[], maxLength: number = 300): string {
    if (!content.length) return '';

    const fullText = content
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (fullText.length <= maxLength) {
      return fullText;
    }

    return fullText.substring(0, maxLength) + '...';
  }

  /**
   * Extract key entities from text (simple implementation)
   */
  extractEntities(text: string): Array<{ entity: string; type: string; confidence: number }> {
    const entities: Array<{ entity: string; type: string; confidence: number }> = [];

    // Simple regex patterns for common entity types
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      date: /\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(?:[0-2]?[0-9]|3[01])(?:st|nd|rd|th)?,?\s+(?:19|20)[0-9]{2}\b/gi,
      currency: /\$[\d,]+(?:\.\d{2})?/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g
    };

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            entity: match.trim(),
            type,
            confidence: 0.8
          });
        });
      }
    });

    return entities;
  }

  /**
   * Clean and normalize text
   */
  normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n+/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const textExtractionService = new TextExtractionService();
export default textExtractionService;
import { supabase } from '../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractedContent {
  fileId: string;
  fileName: string;
  pageNumber: number;
  text: string;
  metadata?: any;
}

class PDFExtractionService {
  private extractionQueue: string[] = [];
  private isProcessing = false;

  /**
   * Extract text from a PDF file
   */
  async extractPDFText(url: string): Promise<string[]> {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const pageTexts: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        pageTexts.push(pageText);
      }

      return pageTexts;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw error;
    }
  }

  /**
   * Extract and store PDF content in Supabase
   */
  async extractAndStore(fileId: string, fileUrl: string, fileName: string): Promise<void> {
    try {
      const pageTexts = await this.extractPDFText(fileUrl);
      
      // Store each page's content
      const contentRecords = pageTexts.map((text, index) => ({
        file_id: fileId,
        file_name: fileName,
        page_number: index + 1,
        content: text,
        extracted_at: new Date().toISOString(),
      }));

      // First, delete any existing content for this file
      await supabase
        .from('document_content')
        .delete()
        .eq('file_id', fileId);

      // Insert new content
      const { error } = await supabase
        .from('document_content')
        .insert(contentRecords);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`Failed to extract PDF ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Extract all PDFs from files in Supabase
   */
  async extractAllPDFs(): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    try {
      // Get all PDF files
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .or('mime_type.eq.application/pdf,name.ilike.%.pdf');

      if (error) {
        throw error;
      }

      if (!files || files.length === 0) {
        return { success: 0, failed: 0, total: 0 };
      }

      let success = 0;
      let failed = 0;

      // Process PDFs in batches
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (file) => {
            try {
              if (file.url) {
                await this.extractAndStore(file.id, file.url, file.name);
                success++;
              }
            } catch (error) {
              console.error(`Failed to process ${file.name}:`, error);
              failed++;
            }
          })
        );
      }

      return {
        success,
        failed,
        total: files.length,
      };
    } catch (error) {
      console.error('Error in extractAllPDFs:', error);
      throw error;
    }
  }

  /**
   * Search extracted content
   */
  async searchContent(query: string, limit: number = 10): Promise<ExtractedContent[]> {
    try {
      const { data, error } = await supabase
        .from('document_content')
        .select('*')
        .textSearch('content', query)
        .limit(limit);

      if (error) {
        return [];
      }

      return data?.map(item => ({
        fileId: item.file_id,
        fileName: item.file_name,
        pageNumber: item.page_number,
        text: item.content,
        metadata: item.metadata,
      })) || [];
    } catch (error) {
      console.error('Error in searchContent:', error);
      return [];
    }
  }

  /**
   * Get content for a specific file
   */
  async getFileContent(fileId: string): Promise<ExtractedContent[]> {
    try {
      const { data, error } = await supabase
        .from('document_content')
        .select('*')
        .eq('file_id', fileId)
        .order('page_number', { ascending: true });

      if (error) {
        return [];
      }

      return data?.map(item => ({
        fileId: item.file_id,
        fileName: item.file_name,
        pageNumber: item.page_number,
        text: item.content,
        metadata: item.metadata,
      })) || [];
    } catch (error) {
      console.error('Error in getFileContent:', error);
      return [];
    }
  }

  /**
   * Extract text from exhibits for AI training
   */
  async extractExhibitsForTraining(): Promise<{
    exhibits: Array<{
      exhibitId: string;
      name: string;
      content: string;
    }>;
    totalPages: number;
  }> {
    try {
      // Get all files marked as exhibits
      const { data: exhibits, error } = await supabase
        .from('files')
        .select('*')
        .not('exhibit_id', 'is', null);

      if (error) {
        throw error;
      }

      if (!exhibits || exhibits.length === 0) {
        return { exhibits: [], totalPages: 0 };
      }

      const extractedExhibits: Array<{
        exhibitId: string;
        name: string;
        content: string;
      }> = [];
      
      let totalPages = 0;

      for (const exhibit of exhibits) {
        // Get extracted content for this exhibit
        const content = await this.getFileContent(exhibit.id);
        
        if (content.length > 0) {
          const fullText = content.map(c => c.text).join('\n\n');
          extractedExhibits.push({
            exhibitId: exhibit.exhibit_id,
            name: exhibit.name,
            content: fullText,
          });
          totalPages += content.length;
        }
      }

      return {
        exhibits: extractedExhibits,
        totalPages,
      };
    } catch (error) {
      console.error('Error extracting exhibits for training:', error);
      throw error;
    }
  }

  /**
   * Create a summary of extracted content
   */
  async createContentSummary(): Promise<{
    totalFiles: number;
    totalPages: number;
    totalCharacters: number;
    fileTypes: { [key: string]: number };
  }> {
    try {
      const { data, error } = await supabase
        .from('document_content')
        .select('file_id, file_name, content');

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          totalFiles: 0,
          totalPages: 0,
          totalCharacters: 0,
          fileTypes: {},
        };
      }

      const uniqueFiles = new Set(data.map(d => d.file_id));
      const fileTypes: { [key: string]: number } = {};
      let totalCharacters = 0;

      data.forEach(item => {
        totalCharacters += item.content?.length || 0;
        
        const ext = item.file_name?.split('.').pop()?.toLowerCase() || 'unknown';
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      });

      return {
        totalFiles: uniqueFiles.size,
        totalPages: data.length,
        totalCharacters,
        fileTypes,
      };
    } catch (error) {
      console.error('Error creating content summary:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const pdfExtractionService = new PDFExtractionService();
export default pdfExtractionService;
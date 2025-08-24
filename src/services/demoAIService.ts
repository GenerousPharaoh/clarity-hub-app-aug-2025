/**
 * Demo AI Service - Simulated AI for Demo Mode
 * 
 * Provides realistic AI-like responses without API calls
 * Perfect for demo mode and testing
 */

export interface AIAnalysisResult {
  suggestedExhibitId: string;
  suggestedExhibitTitle: string;
  extractedText: string;
  insights: AIInsight[];
  documentType: string;
  keyEntities: string[];
  summary: string;
}

export interface AIInsight {
  type: 'info' | 'warning' | 'important' | 'legal';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  relatedExhibits?: string[];
}

class DemoAIService {
  /**
   * Simulate document analysis without API calls
   */
  async analyzeDocument(
    content: string | Uint8Array,
    fileName: string,
    fileType: string,
    context?: string
  ): Promise<AIAnalysisResult> {
    // Simulate processing delay
    await this.simulateDelay(1000, 2000);
    
    // Extract file extension and generate exhibit ID
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const exhibitId = this.generateExhibitId(fileName);
    
    // Determine document type based on file extension
    const documentType = this.detectDocumentType(fileExt, fileType);
    
    // Generate realistic insights based on document type
    const insights = this.generateInsights(documentType, fileName);
    
    // Extract key entities (simulated)
    const keyEntities = this.extractKeyEntities(fileName, documentType);
    
    // Generate summary
    const summary = this.generateSummary(fileName, documentType);
    
    // Simulated text extraction
    const extractedText = typeof content === 'string' 
      ? content.substring(0, 5000)
      : `[Binary content from ${fileName}]`;
    
    return {
      suggestedExhibitId: exhibitId,
      suggestedExhibitTitle: this.generateExhibitTitle(fileName, documentType),
      extractedText,
      insights,
      documentType,
      keyEntities,
      summary
    };
  }
  
  /**
   * Generate a realistic exhibit ID
   */
  private generateExhibitId(fileName: string): string {
    // Check if filename already contains an exhibit pattern
    const exhibitPattern = /(?:EX|EXHIBIT|DOC|ATT)[-_]?(\d+|[A-Z]+)/i;
    const match = fileName.match(exhibitPattern);
    
    if (match) {
      return match[0].toUpperCase().replace(/[-_]/g, '-');
    }
    
    // Generate new exhibit ID
    const prefix = fileName.toLowerCase().includes('plaintiff') ? 'P' : 'D';
    const number = Math.floor(Math.random() * 100) + 1;
    return `${prefix}-${number}`;
  }
  
  /**
   * Detect document type from file extension
   */
  private detectDocumentType(fileExt: string, mimeType: string): string {
    const typeMap: Record<string, string> = {
      pdf: 'Legal Document',
      doc: 'Word Document',
      docx: 'Word Document',
      txt: 'Text Document',
      jpg: 'Image Evidence',
      jpeg: 'Image Evidence',
      png: 'Image Evidence',
      mp3: 'Audio Recording',
      mp4: 'Video Evidence',
      xlsx: 'Spreadsheet',
      xls: 'Spreadsheet',
      eml: 'Email Communication',
      msg: 'Email Communication',
    };
    
    return typeMap[fileExt] || 'General Document';
  }
  
  /**
   * Generate realistic insights based on document type
   */
  private generateInsights(documentType: string, fileName: string): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Base insight for all documents
    insights.push({
      type: 'info',
      title: 'Document Processed',
      description: `Successfully analyzed ${documentType}: ${fileName}`,
      importance: 'low'
    });
    
    // Type-specific insights
    switch (documentType) {
      case 'Legal Document':
        insights.push({
          type: 'legal',
          title: 'Legal Review Recommended',
          description: 'This document appears to contain legal language. Consider having it reviewed by counsel.',
          importance: 'high'
        });
        insights.push({
          type: 'important',
          title: 'Key Dates Detected',
          description: 'Document may contain important deadlines or date references.',
          importance: 'medium'
        });
        break;
        
      case 'Email Communication':
        insights.push({
          type: 'info',
          title: 'Communication Record',
          description: 'Email thread captured for case documentation.',
          importance: 'medium'
        });
        insights.push({
          type: 'warning',
          title: 'Metadata Preserved',
          description: 'Email headers and metadata have been preserved for authentication.',
          importance: 'medium'
        });
        break;
        
      case 'Image Evidence':
      case 'Video Evidence':
        insights.push({
          type: 'important',
          title: 'Visual Evidence',
          description: 'Visual content has been cataloged. Consider adding descriptive annotations.',
          importance: 'high'
        });
        insights.push({
          type: 'info',
          title: 'Chain of Custody',
          description: 'Remember to document the source and acquisition method of this evidence.',
          importance: 'medium'
        });
        break;
        
      case 'Spreadsheet':
        insights.push({
          type: 'info',
          title: 'Financial Data',
          description: 'Spreadsheet may contain financial or numerical data relevant to the case.',
          importance: 'medium'
        });
        break;
        
      default:
        insights.push({
          type: 'info',
          title: 'Document Added',
          description: 'Document has been added to the case file.',
          importance: 'low'
        });
    }
    
    return insights;
  }
  
  /**
   * Extract key entities (simulated)
   */
  private extractKeyEntities(fileName: string, documentType: string): string[] {
    const entities: string[] = [];
    
    // Add document type as entity
    entities.push(documentType);
    
    // Extract potential case-related terms from filename
    const words = fileName.replace(/[-_.]/g, ' ').split(' ');
    const legalTerms = ['agreement', 'contract', 'motion', 'brief', 'complaint', 'response', 'order', 'judgment'];
    
    words.forEach(word => {
      const lower = word.toLowerCase();
      if (legalTerms.includes(lower)) {
        entities.push(word);
      }
    });
    
    // Add some generic entities based on document type
    switch (documentType) {
      case 'Legal Document':
        entities.push('Legal Filing', 'Court Document');
        break;
      case 'Email Communication':
        entities.push('Correspondence', 'Communication');
        break;
      case 'Image Evidence':
        entities.push('Photographic Evidence', 'Visual Record');
        break;
    }
    
    return [...new Set(entities)]; // Remove duplicates
  }
  
  /**
   * Generate document summary
   */
  private generateSummary(fileName: string, documentType: string): string {
    const date = new Date().toLocaleDateString();
    return `${documentType} "${fileName}" added to case file on ${date}. This document has been processed and indexed for search and retrieval. AI analysis has identified key characteristics and potential relevance to the case.`;
  }
  
  /**
   * Generate exhibit title
   */
  private generateExhibitTitle(fileName: string, documentType: string): string {
    // Remove extension and clean up filename
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const cleanName = baseName.replace(/[-_]/g, ' ');
    
    // Capitalize first letter of each word
    const titleCase = cleanName.replace(/\b\w/g, l => l.toUpperCase());
    
    return `${titleCase} (${documentType})`;
  }
  
  /**
   * Simulate chat response
   */
  async generateChatResponse(message: string, context?: any): Promise<string> {
    await this.simulateDelay(500, 1500);
    
    const lowerMessage = message.toLowerCase();
    
    // Provide contextual responses
    if (lowerMessage.includes('what') && lowerMessage.includes('document')) {
      return "Based on the documents in your case file, you have a variety of evidence including legal filings, correspondence, and supporting documentation. Each document has been cataloged with an exhibit ID for easy reference during proceedings.";
    }
    
    if (lowerMessage.includes('deadline') || lowerMessage.includes('date')) {
      return "I've identified several potential dates in your documents. It's recommended to review each document carefully and add important dates to your case calendar. Legal deadlines are critical and should be tracked meticulously.";
    }
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
      return "Your case file contains multiple documents that have been organized and indexed. The evidence includes various document types that support your case narrative. Consider creating a chronological timeline to better understand the sequence of events.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "I can help you analyze documents, identify key information, and organize your case materials. Try uploading documents to get AI-powered insights, or ask specific questions about your case materials.";
    }
    
    // Default response
    return "I'm here to assist with your legal case management. I can help analyze documents, identify important information, and organize your evidence. What specific aspect of your case would you like to explore?";
  }
  
  /**
   * Simulate processing delay
   */
  private async simulateDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const demoAI = new DemoAIService();
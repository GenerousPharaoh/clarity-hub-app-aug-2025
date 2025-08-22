/**
 * Gemini AI Service - Document Processing with Gemini 2.5 Pro
 * 
 * Uses Google's latest Gemini 2.5 Pro thinking model for legal document analysis
 * Features enhanced reasoning capabilities and adaptive thinking for complex legal problems
 * #1 on LMArena, state-of-the-art performance on benchmarks
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface DocumentAnalysis {
  extractedText: string;
  documentType: 'contract' | 'email' | 'brief' | 'motion' | 'evidence' | 'correspondence' | 'other';
  keyEntities: string[];
  legalIssues: string[];
  suggestedExhibitId: string;
  suggestedExhibitTitle: string;
  insights: LegalInsight[];
  confidenceScore: number;
  summary: string;
}

export interface LegalInsight {
  type: 'risk' | 'opportunity' | 'deadline' | 'citation' | 'key_term';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  pageReferences?: number[];
}

class GeminiAIService {
  private model;

  constructor() {
    // Use Gemini 2.5 Pro - Google's latest thinking model with enhanced reasoning
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro", // Latest 2.5 Pro with adaptive thinking
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  /**
   * Analyze a legal document with Gemini 2.5 Pro
   */
  async analyzeDocument(
    fileContent: string | Uint8Array,
    fileName: string,
    fileType: string,
    caseContext?: string
  ): Promise<DocumentAnalysis> {
    try {
      const prompt = this.buildLegalAnalysisPrompt(fileName, fileType, caseContext);
      
      // Gemini 2.0 Flash can handle multiple input types
      const parts = [
        { text: prompt }
      ];

      // Add file content based on type
      if (typeof fileContent === 'string') {
        parts.push({ text: `\n\nDocument Content:\n${fileContent}` });
      } else {
        // For binary content (PDFs, images), Gemini can process directly
        parts.push({ 
          inlineData: {
            mimeType: fileType,
            data: Buffer.from(fileContent).toString('base64')
          }
        });
      }

      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      // Parse the structured response
      return this.parseAnalysisResponse(text, fileName);
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for semantic search
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      // Use Google's latest embedding model for vector generation
      const embeddingModel = genAI.getGenerativeModel({ 
        model: "text-embedding-004" // Google's latest embedding model (768 dimensions)
      });

      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Chat with context about legal documents
   */
  async chatWithContext(
    message: string,
    documentContext: string[],
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      const chat = this.model.startChat({
        history: conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.8,
        },
      });

      // Build context-aware prompt
      const contextPrompt = `
You are a legal AI assistant analyzing case documents. Here's the relevant context:

${documentContext.join('\n\n')}

User Question: ${message}

Provide a detailed, legally-informed response focusing on:
1. Direct answer to the question
2. Relevant legal considerations
3. Citations to the provided documents
4. Practical next steps if applicable
`;

      const result = await chat.sendMessage(contextPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Chat generation failed:', error);
      throw error;
    }
  }

  /**
   * Build a comprehensive legal analysis prompt
   */
  private buildLegalAnalysisPrompt(fileName: string, fileType: string, caseContext?: string): string {
    return `You are an expert legal analyst. Analyze this document and provide structured insights.

File Name: ${fileName}
File Type: ${fileType}
${caseContext ? `Case Context: ${caseContext}` : ''}

Analyze this document and provide:

1. DOCUMENT TYPE: Classify as one of: contract, email, brief, motion, evidence, correspondence, other

2. KEY ENTITIES: List all important parties, people, organizations mentioned

3. LEGAL ISSUES: Identify all legal issues, claims, or causes of action

4. EXHIBIT SUGGESTION:
   - Suggested Exhibit ID (format: D1 for documents, P1 for photos, E1 for emails, etc.)
   - Suggested Exhibit Title (concise, descriptive)

5. INSIGHTS: Provide 3-5 key insights categorized as:
   - risk: Potential legal risks or liabilities
   - opportunity: Strategic advantages or opportunities
   - deadline: Time-sensitive dates or deadlines
   - citation: Important legal citations or references
   - key_term: Critical contractual terms or provisions

6. SUMMARY: Provide a 2-3 sentence executive summary

Format your response as structured JSON for easy parsing.`;
  }

  /**
   * Parse Gemini's response into structured data
   */
  private parseAnalysisResponse(responseText: string, fileName: string): DocumentAnalysis {
    try {
      // Try to parse as JSON first (if Gemini returns structured format)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          extractedText: parsed.extractedText || responseText,
          documentType: parsed.documentType || 'other',
          keyEntities: parsed.keyEntities || [],
          legalIssues: parsed.legalIssues || [],
          suggestedExhibitId: parsed.suggestedExhibitId || 'D1',
          suggestedExhibitTitle: parsed.suggestedExhibitTitle || fileName,
          insights: parsed.insights || [],
          confidenceScore: parsed.confidenceScore || 0.85,
          summary: parsed.summary || ''
        };
      }
    } catch (e) {
      // Fall back to text parsing if JSON fails
    }

    // Fallback: Extract information from text response
    return {
      extractedText: responseText,
      documentType: this.extractDocumentType(responseText),
      keyEntities: this.extractEntities(responseText),
      legalIssues: this.extractLegalIssues(responseText),
      suggestedExhibitId: this.extractExhibitId(responseText, fileName),
      suggestedExhibitTitle: this.extractExhibitTitle(responseText, fileName),
      insights: this.extractInsights(responseText),
      confidenceScore: 0.75,
      summary: this.extractSummary(responseText)
    };
  }

  private extractDocumentType(text: string): DocumentAnalysis['documentType'] {
    const lower = text.toLowerCase();
    if (lower.includes('contract')) return 'contract';
    if (lower.includes('email') || lower.includes('e-mail')) return 'email';
    if (lower.includes('brief')) return 'brief';
    if (lower.includes('motion')) return 'motion';
    if (lower.includes('evidence')) return 'evidence';
    if (lower.includes('correspondence')) return 'correspondence';
    return 'other';
  }

  private extractEntities(text: string): string[] {
    // Simple entity extraction - can be enhanced
    const entityPattern = /(?:Mr\.|Ms\.|Mrs\.|Dr\.|Judge|Attorney)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g;
    const matches = text.match(entityPattern) || [];
    return [...new Set(matches)];
  }

  private extractLegalIssues(text: string): string[] {
    const issues: string[] = [];
    const keywords = [
      'breach', 'violation', 'damages', 'liability', 'negligence',
      'fraud', 'misrepresentation', 'dispute', 'claim', 'cause of action'
    ];
    
    keywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        issues.push(keyword);
      }
    });
    
    return issues;
  }

  private extractExhibitId(text: string, fileName: string): string {
    // Look for exhibit ID in response
    const exhibitMatch = text.match(/[DPVACE]\d+/);
    if (exhibitMatch) return exhibitMatch[0];
    
    // Generate based on file type
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'png', 'jpeg'].includes(ext || '')) return 'P1';
    if (['pdf', 'doc', 'docx'].includes(ext || '')) return 'D1';
    if (['eml', 'msg'].includes(ext || '')) return 'E1';
    return 'D1';
  }

  private extractExhibitTitle(text: string, fileName: string): string {
    // Look for title suggestion in response
    const titleMatch = text.match(/title[:\s]+["']([^"']+)["']/i);
    if (titleMatch) return titleMatch[1];
    
    // Generate from filename
    return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  }

  private extractInsights(text: string): LegalInsight[] {
    const insights: LegalInsight[] = [];
    
    // Look for risk indicators
    if (text.toLowerCase().includes('risk') || text.toLowerCase().includes('liability')) {
      insights.push({
        type: 'risk',
        title: 'Potential Legal Risk',
        description: 'This document contains potential legal risks that require attention.',
        importance: 'high'
      });
    }
    
    // Look for deadlines
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    if (datePattern.test(text)) {
      insights.push({
        type: 'deadline',
        title: 'Important Date Found',
        description: 'This document contains date references that may be deadlines.',
        importance: 'medium'
      });
    }
    
    return insights;
  }

  private extractSummary(text: string): string {
    // Take first 200 characters as summary
    const sentences = text.split(/[.!?]+/);
    return sentences.slice(0, 2).join('. ').substring(0, 200);
  }

  /**
   * Process a file for exhibit generation
   */
  async generateExhibitData(
    file: File,
    projectContext?: string
  ): Promise<{ exhibitId: string; exhibitTitle: string; insights: LegalInsight[] }> {
    const content = await file.text();
    const analysis = await this.analyzeDocument(
      content,
      file.name,
      file.type,
      projectContext
    );

    return {
      exhibitId: analysis.suggestedExhibitId,
      exhibitTitle: analysis.suggestedExhibitTitle,
      insights: analysis.insights
    };
  }
}

export const geminiAI = new GeminiAIService();
export default geminiAI;
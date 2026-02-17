/**
 * Gemini AI Service - Document Processing with Gemini 2.5 Pro
 *
 * Uses Google's Gemini 2.5 Pro for legal document analysis.
 * Native multimodal (text, images, audio, video in same context).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini only if API key is available
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ============================================================
// Types
// ============================================================

export interface DocumentAnalysis {
  extractedText: string;
  documentType:
    | 'contract'
    | 'email'
    | 'brief'
    | 'motion'
    | 'evidence'
    | 'correspondence'
    | 'other';
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

// ============================================================
// Service
// ============================================================

class GeminiAIService {
  private model;
  private available: boolean;

  constructor() {
    this.available = !!genAI;
    if (!genAI) {
      this.model = null;
      return;
    }
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Analyze a legal document with Gemini 3.0 Pro
   */
  async analyzeDocument(
    fileContent: string | Uint8Array,
    fileName: string,
    fileType: string,
    caseContext?: string
  ): Promise<DocumentAnalysis> {
    if (!this.model)
      throw new Error(
        'Gemini AI is not configured. Set VITE_GEMINI_API_KEY to enable AI features.'
      );

    try {
      const prompt = this.buildLegalAnalysisPrompt(fileName, fileType, caseContext);

      // Gemini 3.0 Pro can handle multiple input types natively
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
        [{ text: prompt }];

      // Add file content based on type
      if (typeof fileContent === 'string') {
        parts.push({ text: `\n\nDocument Content:\n${fileContent}` });
      } else {
        // For binary content (PDFs, images), Gemini can process directly
        // Convert Uint8Array to base64 using browser-compatible method
        let binary = '';
        for (let i = 0; i < fileContent.length; i++) {
          binary += String.fromCharCode(fileContent[i]);
        }
        const base64 = btoa(binary);
        parts.push({
          inlineData: {
            mimeType: fileType,
            data: base64,
          },
        });
      }

      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      return this.parseAnalysisResponse(text, fileName);
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for semantic search (768-dim, text-embedding-004)
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    if (!genAI) return [];
    try {
      const embeddingModel = genAI.getGenerativeModel({
        model: 'text-embedding-004',
      });

      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Embedding generation failed:', error);
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
    if (!this.model)
      throw new Error(
        'Gemini AI is not configured. Set VITE_GEMINI_API_KEY to enable AI features.'
      );

    try {
      const chat = this.model.startChat({
        history: conversationHistory.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.8,
        },
      });

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
   * Process a file for exhibit generation
   */
  async generateExhibitData(
    file: File,
    projectContext?: string
  ): Promise<{
    exhibitId: string;
    exhibitTitle: string;
    insights: LegalInsight[];
  }> {
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
      insights: analysis.insights,
    };
  }

  // ─── Private helpers ────────────────────────────────────────

  private buildLegalAnalysisPrompt(
    fileName: string,
    fileType: string,
    caseContext?: string
  ): string {
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

  private parseAnalysisResponse(
    responseText: string,
    fileName: string
  ): DocumentAnalysis {
    try {
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
          summary: parsed.summary || '',
        };
      }
    } catch {
      // Fall back to text parsing if JSON fails
    }

    // Fallback: extract information from text response
    return {
      extractedText: responseText,
      documentType: this.extractDocumentType(responseText),
      keyEntities: this.extractEntities(responseText),
      legalIssues: this.extractLegalIssues(responseText),
      suggestedExhibitId: this.extractExhibitId(responseText, fileName),
      suggestedExhibitTitle: this.extractExhibitTitle(responseText, fileName),
      insights: this.extractInsights(responseText),
      confidenceScore: 0.75,
      summary: this.extractSummary(responseText),
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
    const entityPattern =
      /(?:Mr\.|Ms\.|Mrs\.|Dr\.|Judge|Attorney)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g;
    const matches = text.match(entityPattern) || [];
    return [...new Set(matches)];
  }

  private extractLegalIssues(text: string): string[] {
    const issues: string[] = [];
    const keywords = [
      'breach',
      'violation',
      'damages',
      'liability',
      'negligence',
      'fraud',
      'misrepresentation',
      'dispute',
      'claim',
      'cause of action',
    ];

    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword)) {
        issues.push(keyword);
      }
    }

    return issues;
  }

  private extractExhibitId(text: string, fileName: string): string {
    const exhibitMatch = text.match(/[DPVACE]\d+/);
    if (exhibitMatch) return exhibitMatch[0];

    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'png', 'jpeg'].includes(ext || '')) return 'P1';
    if (['pdf', 'doc', 'docx'].includes(ext || '')) return 'D1';
    if (['eml', 'msg'].includes(ext || '')) return 'E1';
    return 'D1';
  }

  private extractExhibitTitle(text: string, fileName: string): string {
    const titleMatch = text.match(/title[:\s]+["']([^"']+)["']/i);
    if (titleMatch) return titleMatch[1];
    return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  }

  private extractInsights(text: string): LegalInsight[] {
    const insights: LegalInsight[] = [];

    if (text.toLowerCase().includes('risk') || text.toLowerCase().includes('liability')) {
      insights.push({
        type: 'risk',
        title: 'Potential Legal Risk',
        description: 'This document contains potential legal risks that require attention.',
        importance: 'high',
      });
    }

    const datePattern = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g;
    if (datePattern.test(text)) {
      insights.push({
        type: 'deadline',
        title: 'Important Date Found',
        description: 'This document contains date references that may be deadlines.',
        importance: 'medium',
      });
    }

    return insights;
  }

  private extractSummary(text: string): string {
    const sentences = text.split(/[.!?]+/);
    return sentences.slice(0, 2).join('. ').substring(0, 200);
  }
}

// Singleton export
export const geminiAI = new GeminiAIService();
export default geminiAI;

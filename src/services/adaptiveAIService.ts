/**
 * Adaptive AI Service - Personalized Legal AI Assistant
 * 
 * This service provides user-adaptive AI capabilities that learn from each user's
 * specific case data, writing style, and legal focus areas.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

export interface UserAIProfile {
  id: string;
  user_id: string;
  legal_specialties: string[];
  writing_style_analysis: any;
  case_patterns: any;
  interaction_preferences: {
    response_length: 'short' | 'medium' | 'long';
    detail_level: 'basic' | 'standard' | 'expert';
    citation_style: 'bluebook' | 'apa' | 'chicago';
  };
  knowledge_domains: any;
  ai_learning_metadata: any;
}

export interface ContentAnalysis {
  extractedText: string;
  insights: any[];
  keyEntities: string[];
  legalConcepts: string[];
  suggestedActions: string[];
  confidenceScore: number;
}

export interface PersonalizedResponse {
  content: string;
  personalizedInsights: any[];
  citations: any[];
  learningSignals: any;
  profileUpdates: any;
}

export class AdaptiveAIService {
  private gemini: GoogleGenerativeAI;
  private userProfiles = new Map<string, UserAIProfile>();

  constructor() {
    this.gemini = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY!);
  }

  /**
   * Get or create user AI profile
   */
  async getUserAIProfile(userId: string): Promise<UserAIProfile> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    const { data: profile, error } = await supabase
      .from('user_ai_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      // Create initial profile
      const { data: newProfile } = await supabase
        .from('user_ai_profiles')
        .insert({
          user_id: userId,
          legal_specialties: [],
          writing_style_analysis: {},
          case_patterns: {},
          interaction_preferences: {
            response_length: 'medium',
            detail_level: 'standard',
            citation_style: 'bluebook'
          },
          knowledge_domains: {},
          ai_learning_metadata: {}
        })
        .select()
        .single();

      this.userProfiles.set(userId, newProfile);
      return newProfile;
    }

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Process uploaded file with user-specific analysis and exhibit generation
   */
  async processFileForUser(fileId: string, userId: string): Promise<void> {
    try {
      // Get user profile and file data
      const userProfile = await this.getUserAIProfile(userId);
      const { data: file } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (!file) {
        throw new Error('File not found');
      }

      // Update processing status
      await this.updateProcessingStage(fileId, 'extract', 25);

      // Download and analyze file content
      const fileContent = await this.downloadAndExtractContent(file);
      
      await this.updateProcessingStage(fileId, 'analyze', 50);

      // Analyze with user's historical context
      const analysis = await this.analyzeWithUserContext(fileContent, userProfile);

      // Generate exhibit ID and title
      const exhibitData = await this.generateExhibitData(file, analysis);
      
      // Update file with exhibit information
      await supabase
        .from('files')
        .update({
          exhibit_id: exhibitData.exhibitId,
          exhibit_title: exhibitData.exhibitTitle,
          exhibit_auto_generated: true,
          description: analysis.extractedText?.substring(0, 500) || null
        })
        .eq('id', fileId);

      await this.updateProcessingStage(fileId, 'embed', 75);

      // Generate and store user-specific embeddings
      await this.generateUserSpecificEmbeddings(file, fileContent, analysis, userId);

      await this.updateProcessingStage(fileId, 'personalize', 90);

      // Generate personalized insights
      const personalizedInsights = await this.generatePersonalizedInsights(analysis, userProfile, file);

      // Complete processing
      await this.updateProcessingStage(fileId, 'completed', 100, {
        analysis,
        insights: personalizedInsights,
        exhibit: exhibitData
      });

      // Update user's AI learning
      await this.updateUserAILearning(userId, file, analysis, personalizedInsights);

    } catch (error) {
      console.error(`AI processing failed for file ${fileId}:`, error);
      await this.updateProcessingStage(fileId, 'error', 0, null, error.message);
    }
  }

  /**
   * Generate exhibit ID and title for uploaded file
   */
  private async generateExhibitData(file: any, analysis: ContentAnalysis): Promise<{exhibitId: string; exhibitTitle: string}> {
    try {
      // Generate exhibit ID using database function
      const { data: exhibitIdResult } = await supabase.rpc('generate_exhibit_id', {
        project_id_param: file.project_id,
        file_name: file.name,
        file_type: file.content_type || file.file_type
      });

      // Generate exhibit title using AI analysis
      const exhibitTitle = await this.generateSmartExhibitTitle(file.name, analysis);

      return {
        exhibitId: exhibitIdResult || 'X1', // Fallback if function fails
        exhibitTitle
      };
    } catch (error) {
      console.error('Error generating exhibit data:', error);
      // Fallback to simple naming
      return {
        exhibitId: 'X1',
        exhibitTitle: file.name.replace(/\.[^/.]+$/, '') // Remove extension
      };
    }
  }

  /**
   * Generate smart exhibit title using AI analysis
   */
  private async generateSmartExhibitTitle(fileName: string, analysis: ContentAnalysis): Promise<string> {
    const model = this.gemini.getGenerativeModel({ model: "gemini-3.0-pro" });

    const prompt = `
    Based on this file analysis, generate a clear, professional exhibit title for a legal case.
    
    Original filename: ${fileName}
    Content analysis: ${JSON.stringify(analysis)}
    
    Generate a title that:
    1. Is clear and descriptive for legal professionals
    2. Indicates the document type or content
    3. Is 2-8 words long
    4. Uses professional legal terminology
    5. Avoids technical jargon
    
    Examples:
    - "Employment Contract - John Smith"
    - "Medical Records Summary"
    - "Email Correspondence Chain"
    - "Witness Statement Video"
    
    Return only the title, nothing else.
    `;

    try {
      const result = await model.generateContent(prompt);
      let title = result.response.text().trim();
      
      // Clean up the title
      title = title.replace(/['"]/g, ''); // Remove quotes
      title = title.substring(0, 100); // Limit length
      
      // Fallback if AI doesn't return reasonable title
      if (title.length < 3 || title.length > 100) {
        title = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }
      
      return title;
    } catch (error) {
      console.error('Error generating smart title:', error);
      // Fallback to cleaned filename
      let title = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      return title.charAt(0).toUpperCase() + title.slice(1);
    }
  }

  /**
   * Download file content and extract text/data
   */
  private async downloadAndExtractContent(file: any): Promise<any> {
    // Get signed URL for file
    const { data: signedUrlData } = await supabase.storage
      .from('project-files')
      .createSignedUrl(file.storage_path, 3600);

    if (!signedUrlData?.signedUrl) {
      throw new Error('Could not generate signed URL for file');
    }

    // Download file content
    const response = await fetch(signedUrlData.signedUrl);
    const blob = await response.blob();

    // Convert to File object for Gemini processing
    const fileObject = new File([blob], file.name, { type: file.content_type });

    // Use Gemini to extract content based on file type
    return await this.extractContentWithGemini(fileObject, file.content_type);
  }

  /**
   * Extract content using Gemini multimodal capabilities
   */
  private async extractContentWithGemini(file: File, mimeType: string): Promise<any> {
    const model = this.gemini.getGenerativeModel({ model: "gemini-3.0-pro" });

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const prompt = `
    Analyze this legal document and extract:
    1. All text content (OCR if needed)
    2. Key legal entities (parties, dates, amounts, etc.)
    3. Important legal concepts and clauses
    4. Document structure and sections
    5. Any tables, charts, or structured data
    
    Return structured JSON with extracted content.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    try {
      return JSON.parse(responseText);
    } catch {
      // If not valid JSON, return as plain text analysis
      return {
        extractedText: responseText,
        keyEntities: [],
        legalConcepts: [],
        structure: {}
      };
    }
  }

  /**
   * Analyze content with user's historical context
   */
  private async analyzeWithUserContext(content: any, userProfile: UserAIProfile): Promise<ContentAnalysis> {
    // Get user's relevant historical context
    const userContext = await this.getUserRelevantContext(userProfile.user_id, content.extractedText);

    const model = this.gemini.getGenerativeModel({ 
      model: "gemini-3.0-pro",
      generationConfig: {
        temperature: 0.1, // Low temperature for legal accuracy
        topP: 0.8,
        maxOutputTokens: 4096
      }
    });

    const prompt = `
    You are analyzing a legal document for a ${userProfile.legal_specialties.join(', ')} attorney.
    
    User's Legal Specialties: ${userProfile.legal_specialties.join(', ')}
    User's Case History Context:
    ${userContext.map(c => `- ${c.content.substring(0, 200)}...`).join('\n')}
    
    User's Known Patterns:
    ${JSON.stringify(userProfile.case_patterns)}
    
    Current Document Analysis:
    ${JSON.stringify(content)}
    
    Provide analysis that:
    1. Connects to their existing cases and patterns
    2. Matches their expertise level
    3. Identifies opportunities based on their successful strategies
    4. Flags potential issues they've encountered before
    5. Suggests specific actions in their workflow
    
    Return structured JSON with:
    - extractedText: string
    - insights: array of personalized insights
    - keyEntities: array of important entities
    - legalConcepts: array of relevant legal concepts
    - suggestedActions: array of recommended next steps
    - confidenceScore: number (0-1)
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      return JSON.parse(responseText);
    } catch {
      return {
        extractedText: content.extractedText || responseText,
        insights: [],
        keyEntities: [],
        legalConcepts: [],
        suggestedActions: [],
        confidenceScore: 0.5
      };
    }
  }

  /**
   * Generate user-specific embeddings
   */
  private async generateUserSpecificEmbeddings(
    file: any,
    content: any,
    analysis: ContentAnalysis,
    userId: string
  ): Promise<void> {
    // Chunk content intelligently based on analysis
    const chunks = this.chunkContentIntelligently(analysis.extractedText, analysis.legalConcepts);

    for (const chunk of chunks) {
      // Generate embedding using text-embedding model
      const embedding = await this.generateEmbedding(chunk.text);

      // Store in user-specific namespace
      await supabase
        .from('user_embeddings')
        .insert({
          user_id: userId,
          project_id: file.project_id,
          source_type: 'file',
          source_id: file.id,
          content_chunk: chunk.text,
          embedding,
          user_context: {
            legal_concepts: chunk.concepts,
            relevance_score: chunk.relevance,
            chunk_index: chunk.index,
            file_section: chunk.section
          },
          relevance_score: chunk.relevance
        });
    }
  }

  /**
   * Generate text embeddings
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const model = this.gemini.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Chunk content intelligently based on legal concepts
   */
  private chunkContentIntelligently(text: string, concepts: string[]): any[] {
    const chunks = [];
    const maxChunkSize = 1000;
    const overlap = 100;

    // Simple chunking for now - can be enhanced with legal-aware splitting
    for (let i = 0; i < text.length; i += maxChunkSize - overlap) {
      const chunk = text.substring(i, i + maxChunkSize);
      const conceptRelevance = concepts.filter(concept => 
        chunk.toLowerCase().includes(concept.toLowerCase())
      ).length / concepts.length;

      chunks.push({
        text: chunk,
        concepts: concepts.filter(concept => 
          chunk.toLowerCase().includes(concept.toLowerCase())
        ),
        relevance: Math.max(0.3, conceptRelevance), // Minimum relevance of 0.3
        index: chunks.length,
        section: this.detectSection(chunk)
      });
    }

    return chunks;
  }

  /**
   * Detect document section from chunk
   */
  private detectSection(chunk: string): string {
    const lowerChunk = chunk.toLowerCase();
    if (lowerChunk.includes('whereas') || lowerChunk.includes('preamble')) return 'preamble';
    if (lowerChunk.includes('section') || lowerChunk.includes('article')) return 'body';
    if (lowerChunk.includes('signature') || lowerChunk.includes('executed')) return 'signature';
    return 'body';
  }

  /**
   * Generate personalized insights
   */
  private async generatePersonalizedInsights(
    analysis: ContentAnalysis,
    userProfile: UserAIProfile,
    file: any
  ): Promise<any[]> {
    const model = this.gemini.getGenerativeModel({ model: "gemini-3.0-pro" });

    const prompt = `
    Based on this analysis and user profile, generate personalized insights:
    
    User Specialties: ${userProfile.legal_specialties.join(', ')}
    Document Analysis: ${JSON.stringify(analysis)}
    
    Generate 3-5 specific, actionable insights that would be valuable for this user's practice.
    Focus on their specialties and provide concrete next steps.
    
    Return JSON array of insights with: title, description, priority, suggested_action.
    `;

    const result = await model.generateContent(prompt);
    try {
      const insights = JSON.parse(result.response.text());
      
      // Store insights in database
      for (const insight of insights) {
        await supabase
          .from('ai_insights')
          .insert({
            project_id: file.project_id,
            user_id: userProfile.user_id,
            insight_type: 'pattern',
            title: insight.title,
            description: insight.description,
            confidence_score: insight.confidence || 0.8,
            source_files: [file.id],
            evidence: { analysis_data: analysis }
          });
      }

      return insights;
    } catch {
      return [];
    }
  }

  /**
   * Get user's relevant context for queries
   */
  private async getUserRelevantContext(userId: string, queryText: string): Promise<any[]> {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(queryText);

    // Search user's embeddings
    const { data: context } = await supabase.rpc('match_user_content', {
      user_id_param: userId,
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5
    });

    return context || [];
  }

  /**
   * Update processing stage
   */
  private async updateProcessingStage(
    fileId: string,
    stage: string,
    progress: number,
    result?: any,
    errorMessage?: string
  ): Promise<void> {
    await supabase
      .from('file_processing_queue')
      .update({
        current_stage: stage,
        progress_percentage: progress,
        ai_analysis_result: result || null,
        error_message: errorMessage || null,
        completed_at: stage === 'completed' || stage === 'error' ? new Date().toISOString() : null
      })
      .eq('file_id', fileId);
  }

  /**
   * Update user AI learning from new data
   */
  private async updateUserAILearning(
    userId: string,
    file: any,
    analysis: ContentAnalysis,
    insights: any[]
  ): Promise<void> {
    const currentProfile = await this.getUserAIProfile(userId);

    // Update knowledge domains
    const updatedDomains = { ...currentProfile.knowledge_domains };
    for (const concept of analysis.legalConcepts) {
      updatedDomains[concept] = (updatedDomains[concept] || 0) + 1;
    }

    // Update case patterns
    const updatedPatterns = { ...currentProfile.case_patterns };
    const fileType = this.detectCaseType(analysis.extractedText);
    updatedPatterns[fileType] = (updatedPatterns[fileType] || 0) + 1;

    await supabase
      .from('user_ai_profiles')
      .update({
        knowledge_domains: updatedDomains,
        case_patterns: updatedPatterns,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Clear cache
    this.userProfiles.delete(userId);
  }

  /**
   * Detect case type from content
   */
  private detectCaseType(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('contract') || lowerText.includes('agreement')) return 'contract';
    if (lowerText.includes('litigation') || lowerText.includes('complaint')) return 'litigation';
    if (lowerText.includes('employment') || lowerText.includes('employee')) return 'employment';
    if (lowerText.includes('intellectual property') || lowerText.includes('patent')) return 'ip';
    return 'general';
  }

  /**
   * Generate personalized AI response
   */
  async generatePersonalizedResponse(params: {
    userMessage: string;
    userProfile: UserAIProfile;
    userContext: any[];
    legalContext?: string;
    conversationHistory: any[];
    attachments?: File[];
  }): Promise<PersonalizedResponse> {
    const model = this.gemini.getGenerativeModel({ model: "gemini-3.0-pro" });

    const contextSummary = params.userContext
      .map(c => c.content.substring(0, 300))
      .join('\n');

    const legalKnowledgeSection = params.legalContext
      ? `\n    Ontario Employment Law Knowledge Base:\n    ${params.legalContext}\n`
      : '';

    const prompt = `
    You are a specialized Ontario employment law AI assistant. You have deep knowledge of Canadian employment law, with particular expertise in Ontario legislation, case law, and legal principles.

    User Profile:
    - Specialties: ${params.userProfile.legal_specialties.join(', ')}
    - Preferred Response Length: ${params.userProfile.interaction_preferences.response_length}
    - Detail Level: ${params.userProfile.interaction_preferences.detail_level}

    Relevant Context from User's Files:
    ${contextSummary}
    ${legalKnowledgeSection}
    Recent Conversation:
    ${params.conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

    User Question: ${params.userMessage}

    Provide a helpful, authoritative response that:
    1. References specific case law citations and legislation where applicable
    2. Cites the relevant statutory provisions (e.g., ESA s.57, OHRC s.5(1))
    3. Identifies applicable legal principles and their elements
    4. References their specific case context when relevant
    5. Matches their expertise level and communication style
    6. Suggests specific next steps or actions
    7. Notes any recent developments that may affect the analysis

    IMPORTANT: Always cite your sources. When referencing a case, include the full citation. When referencing legislation, include the section number. Do not fabricate citations.

    Return JSON with: content, personalizedInsights, citations, learningSignals, profileUpdates
    `;

    const result = await model.generateContent(prompt);
    
    try {
      return JSON.parse(result.response.text());
    } catch {
      return {
        content: result.response.text(),
        personalizedInsights: [],
        citations: [],
        learningSignals: {},
        profileUpdates: {}
      };
    }
  }
}

export default AdaptiveAIService;
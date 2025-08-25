import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabaseClient';

// Initialize Gemini AI - requires VITE_GEMINI_API_KEY environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('VITE_GEMINI_API_KEY environment variable is required');
  throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Chat modes configuration
export const CHAT_MODES = {
  fast: {
    name: 'Fast Mode',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    maxTokens: 2048,
    description: 'Quick responses using Gemini Flash for rapid analysis',
    icon: '⚡',
  },
  deep: {
    name: 'Deep Analysis',
    model: 'gemini-1.5-pro',
    temperature: 0.5,
    maxTokens: 4096,
    description: 'Thorough analysis using Gemini Pro for complex legal matters',
    icon: '🧠',
  },
};

interface KnowledgeBase {
  documents: any[];
  exhibits: any[];
  entities: any[];
  relationships: any[];
  metadata: any;
}

class ChatbotService {
  private knowledgeCache: KnowledgeBase | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private conversationHistory: Array<{ role: string; content: string }> = [];

  /**
   * Initialize or refresh the knowledge base from Supabase
   */
  async initializeKnowledge(): Promise<KnowledgeBase> {
    try {
      // Check cache validity
      if (
        this.knowledgeCache &&
        this.cacheTimestamp &&
        Date.now() - this.cacheTimestamp < this.CACHE_DURATION
      ) {
        return this.knowledgeCache;
      }

      console.log('🔄 Loading knowledge base from Supabase...');

      // Load all relevant data in parallel
      const [documents, projects, files] = await Promise.all([
        this.loadDocuments(),
        this.loadProjects(),
        this.loadFiles(),
      ]);

      // Build knowledge structure
      this.knowledgeCache = {
        documents,
        exhibits: files.filter(f => f.exhibit_id),
        entities: this.extractEntities(documents, files),
        relationships: this.buildRelationships(documents, files, projects),
        metadata: {
          documentCount: documents.length,
          exhibitCount: files.filter(f => f.exhibit_id).length,
          projectCount: projects.length,
          lastUpdated: new Date().toISOString(),
        },
      };

      this.cacheTimestamp = Date.now();
      console.log('✅ Knowledge base loaded successfully', this.knowledgeCache.metadata);

      return this.knowledgeCache;
    } catch (error) {
      console.error('❌ Error initializing knowledge base:', error);
      throw error;
    }
  }

  /**
   * Load documents from Supabase
   */
  private async loadDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Load projects from Supabase
   */
  private async loadProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Load files/exhibits from Supabase
   */
  private async loadFiles() {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading files:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Extract entities from documents and files
   */
  private extractEntities(documents: any[], files: any[]): any[] {
    const entities: any[] = [];
    
    // Extract from document titles and content
    documents.forEach(doc => {
      if (doc.title) {
        entities.push({
          type: 'document',
          name: doc.title,
          id: doc.id,
          metadata: doc,
        });
      }
    });

    // Extract from file names
    files.forEach(file => {
      if (file.name) {
        entities.push({
          type: file.exhibit_id ? 'exhibit' : 'file',
          name: file.name,
          id: file.id,
          exhibitId: file.exhibit_id,
          metadata: file,
        });
      }
    });

    return entities;
  }

  /**
   * Build relationships between entities
   */
  private buildRelationships(documents: any[], files: any[], projects: any[]): any[] {
    const relationships: any[] = [];

    // Link files to projects
    files.forEach(file => {
      if (file.project_id) {
        relationships.push({
          from: file.id,
          to: file.project_id,
          type: 'belongs_to_project',
        });
      }
    });

    // Link documents to projects
    documents.forEach(doc => {
      if (doc.project_id) {
        relationships.push({
          from: doc.id,
          to: doc.project_id,
          type: 'belongs_to_project',
        });
      }
    });

    return relationships;
  }

  /**
   * Process a chat query using Gemini AI
   */
  async processQuery(
    query: string,
    mode: 'fast' | 'deep' = 'fast',
    includeContext: boolean = true
  ): Promise<{
    response: string;
    sources: any[];
    mode: string;
    processingTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Ensure knowledge base is loaded
      const knowledge = await this.initializeKnowledge();

      // Build context from knowledge base
      const context = includeContext ? this.buildContext(query, knowledge) : '';

      // Select model based on mode
      const modelConfig = CHAT_MODES[mode];
      const model = genAI.getGenerativeModel({
        model: modelConfig.model,
        generationConfig: {
          temperature: modelConfig.temperature,
          maxOutputTokens: modelConfig.maxTokens,
        },
      });

      // Build the prompt
      const prompt = this.buildPrompt(query, context, mode);

      // Generate response
      console.log(`🤖 Processing with ${modelConfig.name}...`);
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Extract sources from the response
      const sources = this.extractSources(response, knowledge);

      // Add to conversation history
      this.conversationHistory.push(
        { role: 'user', content: query },
        { role: 'assistant', content: response }
      );

      // Keep conversation history limited
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      const processingTime = Date.now() - startTime;

      return {
        response,
        sources,
        mode: modelConfig.name,
        processingTime,
      };
    } catch (error) {
      console.error('❌ Error processing query:', error);
      throw error;
    }
  }

  /**
   * Build context from knowledge base relevant to the query
   */
  private buildContext(query: string, knowledge: KnowledgeBase): string {
    const queryLower = query.toLowerCase();
    const relevantItems: string[] = [];

    // Find relevant documents
    const relevantDocs = knowledge.documents.filter(doc =>
      doc.title?.toLowerCase().includes(queryLower) ||
      doc.content?.toLowerCase().includes(queryLower)
    );

    relevantDocs.slice(0, 3).forEach(doc => {
      relevantItems.push(`Document: ${doc.title}\nContent: ${doc.content?.substring(0, 500)}...`);
    });

    // Find relevant exhibits
    const relevantExhibits = knowledge.exhibits.filter(exhibit =>
      exhibit.name?.toLowerCase().includes(queryLower) ||
      exhibit.exhibit_id?.toLowerCase().includes(queryLower)
    );

    relevantExhibits.slice(0, 3).forEach(exhibit => {
      relevantItems.push(`Exhibit ${exhibit.exhibit_id}: ${exhibit.name}`);
    });

    return relevantItems.length > 0
      ? `\n\nRelevant Context:\n${relevantItems.join('\n\n')}`
      : '';
  }

  /**
   * Build the prompt for Gemini
   */
  private buildPrompt(query: string, context: string, mode: 'fast' | 'deep'): string {
    const systemPrompt = mode === 'deep'
      ? `You are an expert legal analyst with deep knowledge of case law, regulations, and legal procedures. 
         Provide thorough, well-reasoned analysis with citations and supporting evidence.
         Consider multiple perspectives and potential counterarguments.`
      : `You are a helpful legal assistant providing quick, accurate responses. 
         Be concise but comprehensive. Focus on the most relevant information.`;

    const conversationContext = this.conversationHistory.length > 0
      ? `\n\nPrevious conversation:\n${this.conversationHistory
          .slice(-4)
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n')}`
      : '';

    return `${systemPrompt}

${context}

${conversationContext}

User Query: ${query}

Please provide a ${mode === 'deep' ? 'detailed analysis' : 'clear and concise response'} to the query above.`;
  }

  /**
   * Extract source references from the response
   */
  private extractSources(response: string, knowledge: KnowledgeBase): any[] {
    const sources: any[] = [];
    
    // Look for exhibit references like [1-A] or [Exhibit 1-A]
    const exhibitPattern = /\[(?:Exhibit\s+)?([A-Z0-9-]+)\]/gi;
    const matches = response.matchAll(exhibitPattern);
    
    for (const match of matches) {
      const exhibitId = match[1];
      const exhibit = knowledge.exhibits.find(e => 
        e.exhibit_id === exhibitId || 
        e.exhibit_id?.includes(exhibitId)
      );
      
      if (exhibit && !sources.some(s => s.id === exhibit.id)) {
        sources.push({
          type: 'exhibit',
          id: exhibit.id,
          name: exhibit.name,
          exhibitId: exhibit.exhibit_id,
        });
      }
    }

    return sources;
  }

  /**
   * Search within the knowledge base
   */
  async search(query: string, limit: number = 10): Promise<any[]> {
    const knowledge = await this.initializeKnowledge();
    const queryLower = query.toLowerCase();
    const results: any[] = [];

    // Search documents
    knowledge.documents.forEach(doc => {
      const relevance = this.calculateRelevance(queryLower, [
        doc.title,
        doc.content,
      ]);
      
      if (relevance > 0) {
        results.push({
          ...doc,
          type: 'document',
          relevance,
        });
      }
    });

    // Search exhibits
    knowledge.exhibits.forEach(exhibit => {
      const relevance = this.calculateRelevance(queryLower, [
        exhibit.name,
        exhibit.exhibit_id,
      ]);
      
      if (relevance > 0) {
        results.push({
          ...exhibit,
          type: 'exhibit',
          relevance,
        });
      }
    });

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Calculate relevance score for search
   */
  private calculateRelevance(query: string, fields: (string | undefined)[]): number {
    let score = 0;
    const queryWords = query.split(/\s+/);

    fields.forEach(field => {
      if (!field) return;
      
      const fieldLower = field.toLowerCase();
      
      // Exact match
      if (fieldLower.includes(query)) {
        score += 10;
      }
      
      // Word matches
      queryWords.forEach(word => {
        if (fieldLower.includes(word)) {
          score += 2;
        }
      });
    });

    return score;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ role: string; content: string }> {
    return this.conversationHistory;
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();
export default chatbotService;
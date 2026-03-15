/**
 * Gemini AI Service - DEPRECATED CLIENT-SIDE STUB
 *
 * All AI calls now go through the server-side API route /api/ai-chat.
 * This file is kept as a minimal stub to avoid breaking any imports.
 * No API keys are used.
 */

// ============================================================
// Stub Service
// ============================================================

class GeminiAIService {
  /**
   * Always returns false since AI calls now go through the server.
   * The server-side route checks availability internally.
   */
  isAvailable(): boolean {
    // API keys are server-side only now.
    return false;
  }

  async chatWithContext(
    _message: string,
    _documentContext: string[],
    _conversationHistory: Array<{ role: string; content: string }>,
    _options?: { maxOutputTokens?: number }
  ): Promise<string> {
    throw new Error(
      'Direct Gemini calls are disabled. Use aiRouter.routeQuery() which calls /api/ai-chat server-side.'
    );
  }
}

// Singleton export
export const geminiAI = new GeminiAIService();
export default geminiAI;

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '@/types';
import { aiRouter } from '@/services/aiRouter';

interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string, fileContext?: string) => Promise<void>;
  clearChat: () => void;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(false);

  const sendMessage = useCallback(
    async (content: string, fileContext?: string) => {
      if (!content.trim() || isLoading) return;

      abortRef.current = false;

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Build conversation history for context continuity
        const conversationHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = await aiRouter.routeQuery({
          query: content.trim(),
          conversationHistory,
          caseContext: fileContext,
        });

        if (abortRef.current) return;

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: result.response,
          model: result.model,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        if (abortRef.current) return;

        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content:
            error instanceof Error
              ? `I encountered an error: ${error.message}. Please check that your AI API keys are configured and try again.`
              : 'An unexpected error occurred. Please try again.',
          model: 'gemini',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        if (!abortRef.current) {
          setIsLoading(false);
        }
      }
    },
    [messages, isLoading]
  );

  const clearChat = useCallback(() => {
    abortRef.current = true;
    setMessages([]);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}

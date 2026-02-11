import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  onNewNote?: () => void;
  onToggleAIChat?: () => void;
  onShowHelp?: () => void;
}

/**
 * Global keyboard shortcuts for workspace navigation.
 * Only active when no input/textarea/contenteditable is focused.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd+\ — Toggle left panel (file browser)
      if (isMod && e.key === '\\') {
        e.preventDefault();
        handlers.onToggleLeftPanel?.();
        return;
      }

      // Cmd+Shift+\ — Toggle right panel (viewer/AI)
      if (isMod && e.shiftKey && e.key === '|') {
        e.preventDefault();
        handlers.onToggleRightPanel?.();
        return;
      }

      // Cmd+J — Toggle AI chat panel
      if (isMod && e.key === 'j') {
        e.preventDefault();
        handlers.onToggleAIChat?.();
        return;
      }

      // Cmd+/ — Show keyboard shortcuts help
      if (isMod && e.key === '/') {
        e.preventDefault();
        handlers.onShowHelp?.();
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/** All registered shortcuts for display in help UI. */
export const SHORTCUTS = [
  { keys: ['Cmd', '\\'], description: 'Toggle file browser' },
  { keys: ['Cmd', 'Shift', '\\'], description: 'Toggle viewer panel' },
  { keys: ['Cmd', 'J'], description: 'Toggle AI chat' },
  { keys: ['Cmd', 'K'], description: 'Command palette' },
  { keys: ['Cmd', '/'], description: 'Show keyboard shortcuts' },
] as const;

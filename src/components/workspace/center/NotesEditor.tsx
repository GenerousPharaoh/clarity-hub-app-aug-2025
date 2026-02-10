import { useRef, useCallback, useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';
import { useUpdateNote } from '@/hooks/useNotes';

interface NotesEditorProps {
  noteId: string;
  projectId: string;
  initialContent: string;
}

/**
 * TinyMCE editor wrapper with debounced auto-save.
 * Aims for a Notion-like, minimal-chrome writing experience.
 */
export function NotesEditor({ noteId, projectId, initialContent }: NotesEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const updateNote = useUpdateNote();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Track noteId changes to reset editor content
  const currentNoteId = useRef(noteId);

  useEffect(() => {
    if (noteId !== currentNoteId.current) {
      currentNoteId.current = noteId;
      const editor = editorRef.current;
      if (editor) {
        editor.setContent(initialContent || '');
        // Reset undo history when switching notes
        editor.undoManager.clear();
        editor.undoManager.add();
      }
    }
  }, [noteId, initialContent]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleEditorChange = useCallback(
    (content: string) => {
      setSaveStatus('saving');

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        updateNote.mutate(
          { id: noteId, projectId, content },
          {
            onSuccess: () => setSaveStatus('saved'),
            onError: () => setSaveStatus('idle'),
          }
        );
      }, 1000);
    },
    [noteId, projectId, updateNote]
  );

  // Detect dark mode from document class
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  return (
    <div className="notes-editor-wrapper flex flex-1 flex-col overflow-hidden">
      {/* Save status indicator */}
      <div className="flex h-6 shrink-0 items-center justify-end px-4">
        <span className="text-[10px] font-medium text-surface-400 dark:text-surface-500">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          onInit={(_evt, editor) => {
            editorRef.current = editor;
          }}
          initialValue={initialContent}
          init={{
            // Use self-hosted TinyMCE from /public/tinymce
            base_url: '/tinymce',
            suffix: '.min',

            // Appearance
            skin: isDark ? 'oxide-dark' : 'oxide',
            content_css: isDark ? 'dark' : 'default',
            height: '100%',
            resize: false,

            // Minimal toolbar - Notion-like
            menubar: false,
            statusbar: false,
            toolbar:
              'bold italic underline | bullist numlist | link blockquote | h2 h3 | removeformat',
            toolbar_mode: 'scrolling',

            // Plugins
            plugins: 'lists link autolink',

            // Content styling injected into the iframe
            content_style: `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 15px;
                line-height: 1.7;
                color: ${isDark ? '#e2e8f0' : '#1e293b'};
                padding: 0 24px 24px;
                margin: 0;
                max-width: 100%;
                background: ${isDark ? '#1e293b' : '#ffffff'};
              }

              p { margin: 0 0 0.75em; }

              h2 {
                font-family: 'Space Grotesk', system-ui, sans-serif;
                font-size: 1.375em;
                font-weight: 600;
                color: ${isDark ? '#f1f5f9' : '#0f172a'};
                margin: 1.5em 0 0.5em;
                line-height: 1.3;
              }

              h3 {
                font-family: 'Space Grotesk', system-ui, sans-serif;
                font-size: 1.125em;
                font-weight: 600;
                color: ${isDark ? '#e2e8f0' : '#1e293b'};
                margin: 1.25em 0 0.5em;
                line-height: 1.4;
              }

              blockquote {
                margin: 1em 0;
                padding: 8px 16px;
                border-left: 3px solid ${isDark ? '#3b82f6' : '#2563eb'};
                background: ${isDark ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.04)'};
                color: ${isDark ? '#cbd5e1' : '#475569'};
                font-style: italic;
              }

              ul, ol {
                padding-left: 1.5em;
                margin: 0 0 0.75em;
              }

              li { margin-bottom: 0.25em; }

              a {
                color: ${isDark ? '#60a5fa' : '#2563eb'};
                text-decoration: underline;
                text-decoration-color: ${isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.3)'};
                text-underline-offset: 2px;
              }

              a:hover {
                text-decoration-color: currentColor;
              }

              ::selection {
                background: ${isDark ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.15)'};
              }

              /* Placeholder */
              .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
                color: ${isDark ? '#475569' : '#94a3b8'};
                font-style: normal;
              }
            `,

            // Placeholder text
            placeholder: 'Start writing...',

            // Behavior
            browser_spellcheck: true,
            contextmenu: false,
            branding: false,
            promotion: false,

            // Auto-link URLs
            link_default_target: '_blank',
            link_assume_external_targets: true,

            // Setup callback
            setup: (editor) => {
              // Focus the editor after initialization
              editor.on('init', () => {
                // Small delay to avoid racing with React render
                setTimeout(() => {
                  editor.focus();
                }, 100);
              });
            },
          }}
          onEditorChange={handleEditorChange}
        />
      </div>
    </div>
  );
}

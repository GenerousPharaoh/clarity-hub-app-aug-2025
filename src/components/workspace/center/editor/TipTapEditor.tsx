import { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from './extensions';
import { useAutoSave } from './hooks/useAutoSave';
import { EditorToolbar } from './EditorToolbar';
import { BubbleToolbar } from './BubbleToolbar';
import { SlashCommandMenu } from './SlashCommandMenu';
import { EditorStatusBar } from './EditorStatusBar';
import '@/styles/tiptap-editor.css';

interface TipTapEditorProps {
  noteId: string;
  projectId: string;
  initialContent: string;
}

export function TipTapEditor({ noteId, projectId, initialContent }: TipTapEditorProps) {
  const { saveStatus, triggerSave, cleanup } = useAutoSave(noteId, projectId);

  const editor = useEditor({
    extensions: getExtensions(),
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'tiptap',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      triggerSave(editor.getHTML());
    },
  });

  // Reset content when noteId changes (if editor isn't remounted via key)
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      // Only reset if content actually differs (avoid cursor reset on save)
      const currentHTML = editor.getHTML();
      if (currentHTML !== initialContent) {
        editor.commands.setContent(initialContent || '');
      }
    }
  }, [noteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus editor after mount
  useEffect(() => {
    if (editor) {
      const timer = setTimeout(() => {
        editor.commands.focus('end');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editor]);

  // Cleanup debounce timer on unmount
  useEffect(() => cleanup, [cleanup]);

  // Link insertion handler (shared between toolbars)
  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return; // cancelled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-surface-900">
      <EditorToolbar editor={editor} onInsertLink={handleInsertLink} />
      <div className="relative flex-1 overflow-y-auto bg-white dark:bg-surface-900">
        <BubbleToolbar editor={editor} onInsertLink={handleInsertLink} />
        <SlashCommandMenu editor={editor} />
        <EditorContent editor={editor} className="h-full" />
      </div>
      <EditorStatusBar editor={editor} saveStatus={saveStatus} />
    </div>
  );
}

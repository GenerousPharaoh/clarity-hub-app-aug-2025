import { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from './extensions';
import { useAutoSave } from './hooks/useAutoSave';
import { EditorToolbar } from './EditorToolbar';
import { BubbleToolbar } from './BubbleToolbar';
import { SlashCommandMenu } from './SlashCommandMenu';
import { EditorStatusBar } from './EditorStatusBar';
import { PromptDialog } from './PromptDialog';
import '@/styles/tiptap-editor.css';

interface TipTapEditorProps {
  noteId: string;
  projectId: string;
  initialContent: string;
}

type DialogType = 'link' | 'image' | null;

export function TipTapEditor({ noteId, projectId, initialContent }: TipTapEditorProps) {
  const { saveStatus, triggerSave, cleanup } = useAutoSave(noteId, projectId);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogInitialValue, setDialogInitialValue] = useState('');

  // Ref to store handleInsertLink so editor keymap can call it
  const insertLinkRef = useRef<() => void>(() => {});

  const editor = useEditor({
    extensions: getExtensions(),
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'tiptap',
        spellcheck: 'true',
      },
      handleKeyDown: (_view, event) => {
        // Cmd+K / Ctrl+K → insert link
        if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          insertLinkRef.current();
          return true;
        }
        return false;
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

  // Link insertion handler — opens dialog instead of window.prompt
  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setDialogInitialValue(previousUrl);
    setDialogType('link');
  }, [editor]);

  // Keep ref in sync for keyboard shortcut handler
  insertLinkRef.current = handleInsertLink;

  // Image insertion handler — opens dialog instead of window.prompt
  const handleInsertImage = useCallback(() => {
    setDialogInitialValue('');
    setDialogType('image');
  }, []);

  const handleDialogSubmit = useCallback(
    (value: string) => {
      if (!editor) return;

      if (dialogType === 'link') {
        if (value === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
          editor.chain().focus().extendMarkRange('link').setLink({ href: value }).run();
        }
      } else if (dialogType === 'image') {
        if (value) {
          editor.chain().focus().setImage({ src: value }).run();
        }
      }

      setDialogType(null);
    },
    [editor, dialogType]
  );

  const handleDialogCancel = useCallback(() => {
    setDialogType(null);
    editor?.commands.focus();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-surface-900">
      <EditorToolbar
        editor={editor}
        onInsertLink={handleInsertLink}
        onInsertImage={handleInsertImage}
      />
      <div className="relative flex-1 overflow-y-auto bg-white dark:bg-surface-900">
        <BubbleToolbar editor={editor} onInsertLink={handleInsertLink} />
        <SlashCommandMenu editor={editor} />
        <EditorContent editor={editor} className="h-full" />
      </div>
      <EditorStatusBar editor={editor} saveStatus={saveStatus} />

      {/* Link / Image URL dialog */}
      <PromptDialog
        open={dialogType === 'link'}
        title="Insert Link"
        placeholder="https://example.com"
        initialValue={dialogInitialValue}
        onSubmit={handleDialogSubmit}
        onCancel={handleDialogCancel}
        allowEmpty
      />
      <PromptDialog
        open={dialogType === 'image'}
        title="Insert Image"
        placeholder="https://example.com/image.png"
        initialValue=""
        onSubmit={handleDialogSubmit}
        onCancel={handleDialogCancel}
      />
    </div>
  );
}

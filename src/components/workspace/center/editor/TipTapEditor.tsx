import { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from './extensions';
import { useAutoSave } from './hooks/useAutoSave';
import { BubbleToolbar } from './BubbleToolbar';
import { SlashCommandMenu } from './SlashCommandMenu';
import { PromptDialog } from './PromptDialog';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import '@/styles/tiptap-editor.css';

interface TipTapEditorProps {
  noteId: string;
  projectId: string;
  initialContent: string;
  title?: string;
  onTitleChange?: (value: string) => void;
  titleInputRef?: React.RefObject<HTMLInputElement | null>;
}

type DialogType = 'link' | 'image' | null;

export function TipTapEditor({
  noteId,
  projectId,
  initialContent,
  title,
  onTitleChange,
  titleInputRef,
}: TipTapEditorProps) {
  const { saveStatus, triggerSave, cleanup } = useAutoSave(noteId, projectId);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogInitialValue, setDialogInitialValue] = useState('');
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

  // Link insertion handler
  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setDialogInitialValue(previousUrl);
    setDialogType('link');
  }, [editor]);

  insertLinkRef.current = handleInsertLink;

  // Image insertion handler
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

  const wordCount = editor.storage.characterCount?.words() ?? 0;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white dark:bg-surface-900">
      {/* Single scrollable document canvas */}
      <div className="flex-1 overflow-y-auto">
        <BubbleToolbar editor={editor} onInsertLink={handleInsertLink} />
        <SlashCommandMenu editor={editor} onInsertImage={handleInsertImage} />

        {/* Notion-style inline title — aligned with editor content */}
        {onTitleChange && (
          <div className="mx-auto max-w-[720px] px-4 pt-8 pb-0 md:px-10 md:pt-14">
            <input
              ref={titleInputRef}
              type="text"
              defaultValue={title || ''}
              key={noteId}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={(e) => {
                // Enter in title → focus editor
                if (e.key === 'Enter') {
                  e.preventDefault();
                  editor.commands.focus('start');
                }
              }}
              placeholder="Untitled"
              className={cn(
                'w-full bg-transparent font-heading text-2xl font-bold leading-tight tracking-tight md:text-[2rem]',
                'text-surface-900 dark:text-surface-50',
                'placeholder:text-surface-300 dark:placeholder:text-surface-600',
                'border-none outline-none focus:outline-none focus:ring-0'
              )}
            />
          </div>
        )}

        {/* Editor content — .tiptap CSS handles centering & typography */}
        <EditorContent editor={editor} className="min-h-[60vh]" />
      </div>

      {/* Floating save status — bottom-right corner */}
      <div
        className={cn(
          'pointer-events-none absolute bottom-3 right-3 z-10',
          'flex items-center gap-1.5 rounded-full px-2.5 py-1',
          'text-[10px] font-medium tabular-nums',
          'bg-white/80 backdrop-blur-sm dark:bg-surface-800/80',
          'border border-surface-100 dark:border-surface-700/50',
          'shadow-sm transition-opacity duration-500',
          saveStatus === 'idle' && 'opacity-0',
          saveStatus === 'saving' && 'opacity-100 text-surface-400 dark:text-surface-500',
          saveStatus === 'saved' && 'opacity-100 text-green-500 dark:text-green-400',
          saveStatus === 'error' && 'opacity-100 text-red-500 dark:text-red-400'
        )}
      >
        {saveStatus === 'saving' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
        {saveStatus === 'saved' && <Check className="h-2.5 w-2.5" />}
        {saveStatus === 'error' && <AlertCircle className="h-2.5 w-2.5" />}
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && 'Saved'}
        {saveStatus === 'error' && 'Failed'}
        {saveStatus !== 'idle' && (
          <span className="text-surface-400 dark:text-surface-500">
            · {wordCount}w
          </span>
        )}
      </div>

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

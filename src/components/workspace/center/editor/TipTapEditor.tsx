import { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from './extensions';
import { useAutoSave } from './hooks/useAutoSave';
import { EditorToolbar } from './EditorToolbar';
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
  const readingTime = Math.max(1, Math.round(wordCount / 230));

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white dark:bg-surface-900">
      {/* Fixed toolbar at top */}
      <EditorToolbar editor={editor} onInsertLink={handleInsertLink} onInsertImage={handleInsertImage} />

      {/* Scrollable document canvas with subtle background */}
      <div className="flex-1 overflow-y-auto bg-surface-100/40 dark:bg-surface-950/30">
        <BubbleToolbar editor={editor} onInsertLink={handleInsertLink} />
        <SlashCommandMenu editor={editor} onInsertImage={handleInsertImage} />

        {/* Paper-like container */}
        <div className="mx-auto my-6 max-w-[860px] rounded-lg bg-white shadow-sm ring-1 ring-surface-200/50 dark:bg-surface-900 dark:ring-surface-800/50 md:my-10">
          {/* Notion-style inline title */}
          {onTitleChange && (
            <div className="mx-auto max-w-[800px] px-6 pt-8 pb-0 md:px-12 md:pt-14">
              <input
                ref={titleInputRef}
                type="text"
                defaultValue={title || ''}
                key={noteId}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    editor.commands.focus('start');
                  }
                }}
                placeholder="Untitled Document"
                className={cn(
                  'w-full bg-transparent font-heading text-3xl font-bold leading-tight tracking-tight md:text-[2.25rem]',
                  'text-surface-900 dark:text-surface-50',
                  'placeholder:text-surface-300 dark:placeholder:text-surface-600',
                  'border-none outline-none focus:outline-none focus:ring-0'
                )}
              />
            </div>
          )}

          {/* Editor content */}
          <EditorContent editor={editor} className="min-h-[60vh]" />
        </div>
      </div>

      {/* Persistent status bar */}
      <div className="flex h-7 shrink-0 items-center justify-between border-t border-surface-200 bg-surface-50 px-3 dark:border-surface-800 dark:bg-surface-850">
        <div className="flex items-center gap-3 text-[11px] tabular-nums text-surface-400 dark:text-surface-500">
          <span>{wordCount.toLocaleString()} words</span>
          <span>{readingTime} min read</span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 text-[11px] font-medium tabular-nums transition-opacity duration-300',
            saveStatus === 'idle' && 'opacity-0',
            saveStatus === 'saving' && 'text-surface-400 dark:text-surface-500',
            saveStatus === 'saved' && 'text-green-500 dark:text-green-400',
            saveStatus === 'error' && 'text-red-500 dark:text-red-400'
          )}
        >
          {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
          {saveStatus === 'saved' && <Check className="h-3 w-3" />}
          {saveStatus === 'error' && <AlertCircle className="h-3 w-3" />}
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Failed'}
        </div>
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

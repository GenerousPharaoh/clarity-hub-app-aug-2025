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
}

type DialogType = 'link' | 'image' | null;

export function TipTapEditor({
  noteId,
  projectId,
  initialContent,
}: TipTapEditorProps) {
  const { saveStatus, triggerSave, cleanup } = useAutoSave(noteId, projectId);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogInitialValue, setDialogInitialValue] = useState('');
  const insertLinkRef = useRef<() => void>(() => {});
  const saveNowRef = useRef<() => void>(() => {});

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
        // Cmd+S / Ctrl+S → save immediately
        if (event.key === 's' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          saveNowRef.current();
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

  // Focus editor after mount — only on desktop (mobile keyboard is disruptive)
  useEffect(() => {
    if (editor && window.innerWidth > 768) {
      const timer = setTimeout(() => {
        editor.commands.focus('end');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [editor]);

  // Cleanup debounce timer on unmount
  useEffect(() => cleanup, [cleanup]);

  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const exhibitLink = target.closest('[data-file-id]') as HTMLElement | null;
    if (!exhibitLink) return;

    e.preventDefault();
    const fileId = exhibitLink.getAttribute('data-file-id');
    if (!fileId) return;

    import('@/store').then(({ default: store }) => {
      store.getState().setSelectedFile(fileId);
      store.getState().setRightPanel(true);
      store.getState().setRightTab('viewer');
    });
  }, []);

  // Link insertion handler
  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setDialogInitialValue(previousUrl);
    setDialogType('link');
  }, [editor]);

  insertLinkRef.current = handleInsertLink;
  saveNowRef.current = () => {
    if (editor) triggerSave(editor.getHTML());
  };

  // Image insertion handler
  const handleInsertImage = useCallback(() => {
    setDialogInitialValue('');
    setDialogType('image');
  }, []);

  // Exhibit insertion handler
  const [showExhibitPicker, setShowExhibitPicker] = useState(false);
  const handleInsertExhibit = useCallback(() => {
    setShowExhibitPicker(true);
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
  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const readingTime = Math.max(1, Math.round(wordCount / 230));

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden bg-white dark:bg-surface-900">
      {/* Fixed toolbar at top */}
      <EditorToolbar editor={editor} onInsertLink={handleInsertLink} onInsertImage={handleInsertImage} />

      {/* Scrollable document canvas */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-surface-100/90 via-surface-50 to-surface-100/70 dark:from-surface-950/70 dark:via-surface-900 dark:to-surface-950/70">
        <BubbleToolbar editor={editor} onInsertLink={handleInsertLink} />
        <SlashCommandMenu editor={editor} onInsertImage={handleInsertImage} onInsertLink={handleInsertLink} onInsertExhibit={handleInsertExhibit} />

        {/* Paper canvas */}
        <div className="mx-auto w-full max-w-[1080px] px-3 py-4 md:px-6 md:py-8">
          <div className="relative overflow-hidden rounded-2xl border border-surface-200/90 bg-white shadow-[0_24px_56px_-36px_rgba(15,23,42,0.5)] ring-1 ring-white/80 dark:border-surface-700/80 dark:bg-surface-900 dark:ring-surface-800/45">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-primary-50/60 to-transparent dark:from-primary-900/20" />
            <div className="mx-auto flex max-w-[800px] items-center justify-between px-6 pt-4 text-sm font-medium uppercase tracking-[0.08em] text-surface-400 dark:text-surface-500 md:px-12 md:pt-5">
              <span>Document body</span>
              <span className="hidden md:inline">Tip: Type "/" for commands</span>
            </div>

            {/* Editor content */}
            <div onClick={handleEditorClick}>
              <EditorContent editor={editor} className="min-h-[62vh]" />
            </div>
          </div>
        </div>
      </div>

      {/* Persistent status bar */}
      <div className="flex h-9 shrink-0 items-center justify-between overflow-hidden border-t border-surface-200/80 bg-white/90 px-3.5 backdrop-blur dark:border-surface-800 dark:bg-surface-900/90">
        <div className="flex min-w-0 items-center gap-3 text-xs tabular-nums text-surface-400 dark:text-surface-500">
          <span className="whitespace-nowrap">{wordCount.toLocaleString()} words</span>
          <span className="hidden whitespace-nowrap sm:inline">{charCount.toLocaleString()} chars</span>
          <span className="whitespace-nowrap">{readingTime} min read</span>
          <span className="hidden whitespace-nowrap md:inline">Type "/" for commands</span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium tabular-nums transition-all duration-300',
            saveStatus === 'idle' && 'text-surface-300 dark:text-surface-600',
            saveStatus === 'saving' && 'text-surface-400 dark:text-surface-500',
            saveStatus === 'saved' && 'text-green-500 dark:text-green-400',
            saveStatus === 'error' && 'text-red-500 dark:text-red-400'
          )}
        >
          {saveStatus === 'idle' && <span className="h-1.5 w-1.5 rounded-full bg-surface-300 dark:bg-surface-600" />}
          {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
          {saveStatus === 'saved' && <Check className="h-3 w-3" />}
          {saveStatus === 'error' && <AlertCircle className="h-3 w-3" />}
          {saveStatus === 'idle' && 'Saved'}
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed'}
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

      {/* Exhibit picker */}
      {showExhibitPicker && (
        <ExhibitPickerDialog
          projectId={projectId}
          onSelect={(exhibitId, fileId) => {
            if (editor) {
              // Insert as a styled inline reference that opens the file on click
              const exhibitRef = `[Exhibit ${exhibitId}]`;
              editor.chain().focus().insertContent(
                `<a href="#exhibit-${fileId}" data-exhibit-id="${exhibitId}" data-file-id="${fileId}" class="exhibit-ref">${exhibitRef}</a>`
              ).run();
            }
            setShowExhibitPicker(false);
          }}
          onCancel={() => {
            setShowExhibitPicker(false);
            editor?.commands.focus();
          }}
        />
      )}
    </div>
  );
}

/** Inline exhibit picker dialog */
function ExhibitPickerDialog({
  projectId,
  onSelect,
  onCancel,
}: {
  projectId: string;
  onSelect: (exhibitId: string, fileId: string) => void;
  onCancel: () => void;
}) {
  const [exhibits, setExhibits] = useState<Array<{ exhibit_id: string; file_id: string | null; description: string | null }>>([]);
  const [exhibitSearch, setExhibitSearch] = useState('');

  useEffect(() => {
    import('@/lib/supabase').then(({ supabase }) => {
      supabase
        .from('exhibit_markers')
        .select('exhibit_id, file_id, description')
        .eq('project_id', projectId)
        .order('exhibit_id')
        .then(({ data }) => setExhibits(data ?? []));
    });
  }, [projectId]);

  const filteredExhibits = exhibitSearch.trim()
    ? exhibits.filter(
        (ex) =>
          ex.exhibit_id.toLowerCase().includes(exhibitSearch.toLowerCase()) ||
          ex.description?.toLowerCase().includes(exhibitSearch.toLowerCase())
      )
    : exhibits;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-surface-200 bg-white p-4 shadow-xl dark:border-surface-700 dark:bg-surface-800">
        <h3 className="font-heading text-sm font-bold text-surface-800 dark:text-surface-100">
          Insert Exhibit Reference
        </h3>
        <p className="mt-1 text-xs text-surface-400">
          Select an exhibit to insert a clickable reference.
        </p>
        {exhibits.length === 0 ? (
          <p className="mt-4 text-center text-sm text-surface-400">
            No exhibits yet. Create exhibits in the Exhibits tab first.
          </p>
        ) : (
          <>
          {exhibits.length > 5 && (
            <input
              type="text"
              value={exhibitSearch}
              onChange={(e) => setExhibitSearch(e.target.value)}
              placeholder="Search exhibits..."
              className="mt-3 w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-surface-700 placeholder:text-surface-400 focus:border-primary-400 focus:outline-none dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
              autoFocus
            />
          )}
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
            {filteredExhibits.map((ex) => (
              <button
                key={ex.exhibit_id}
                onClick={() => ex.file_id && onSelect(ex.exhibit_id, ex.file_id)}
                disabled={!ex.file_id}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                  ex.file_id
                    ? 'hover:bg-accent-50 dark:hover:bg-accent-900/20'
                    : 'opacity-40 cursor-not-allowed'
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100 font-heading text-sm font-bold text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
                  {ex.exhibit_id}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-surface-600 dark:text-surface-300" title={ex.description || (ex.file_id ? 'Linked file' : 'No file linked')}>
                  {ex.description || (ex.file_id ? 'Linked file' : 'No file linked')}
                </span>
              </button>
            ))}
          </div>
          </>
        )}
        <div className="mt-3 flex justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

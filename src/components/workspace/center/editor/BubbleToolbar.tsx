import type { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { AIWritingMenu } from './AIWritingMenu';

interface BubbleToolbarProps {
  editor: Editor;
  onInsertLink: () => void;
}

export function BubbleToolbar({ editor, onInsertLink }: BubbleToolbarProps) {
  const [showAI, setShowAI] = useState(false);

  return (
    <>
      <BubbleMenu
        editor={editor}
        updateDelay={150}
        className="flex items-center gap-0.5 rounded-lg border border-surface-200 bg-white p-1 shadow-lg dark:border-surface-700 dark:bg-surface-800"
      >
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Code"
        >
          <Code className="h-3.5 w-3.5" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded text-[10px] font-bold" style={{ background: 'rgba(250, 204, 21, 0.4)' }}>H</span>
        </BubbleButton>
        <BubbleButton
          onClick={onInsertLink}
          active={editor.isActive('link')}
          title="Link"
        >
          <Link className="h-3.5 w-3.5" />
        </BubbleButton>

        <div className="mx-0.5 h-5 w-px bg-surface-200 dark:bg-surface-700" />

        <BubbleButton
          onClick={() => setShowAI(!showAI)}
          active={showAI}
          title="AI Writing"
          className="text-accent-500 dark:text-accent-400"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </BubbleButton>
      </BubbleMenu>

      {showAI && (
        <AIWritingMenu editor={editor} onClose={() => setShowAI(false)} />
      )}
    </>
  );
}

function BubbleButton({
  onClick,
  active,
  title,
  children,
  className,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
          : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-200',
        className
      )}
    >
      {children}
    </button>
  );
}

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
        className="flex items-center gap-0.5 rounded-xl border border-surface-200/80 bg-white/90 p-1 shadow-xl backdrop-blur-md dark:border-surface-700/80 dark:bg-surface-800/90"
      >
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded bg-yellow-300/40 text-[10px] font-bold dark:bg-yellow-400/30">H</span>
        </BubbleButton>
        <BubbleButton
          onClick={onInsertLink}
          active={editor.isActive('link')}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </BubbleButton>

        <div className="mx-0.5 h-5 w-px bg-surface-200 dark:bg-surface-700" />

        <BubbleButton
          onClick={() => setShowAI(!showAI)}
          active={showAI}
          title="AI Writing"
          variant="ai"
        >
          <Sparkles className="h-4 w-4" />
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
  variant,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'ai';
}) {
  const isAI = variant === 'ai';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        isAI
          ? active
            ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
            : 'text-accent-500 hover:bg-accent-50 hover:text-accent-600 dark:text-accent-400 dark:hover:bg-accent-900/20 dark:hover:text-accent-300'
          : active
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
            : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-200',
        className
      )}
    >
      {children}
    </button>
  );
}

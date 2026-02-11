import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { slashCommandPluginKey, type SlashCommandState } from './extensions/slash-commands';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  CodeSquare,
  Table,
  Minus,
  ImageIcon,
} from 'lucide-react';

interface SlashCommandMenuProps {
  editor: Editor;
  onInsertImage?: () => void;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

export function SlashCommandMenu({ editor, onInsertImage }: SlashCommandMenuProps) {
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState('');
  const [slashRange, setSlashRange] = useState<{ from: number; to: number }>({ from: 0, to: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: <Heading1 className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: <Heading3 className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: 'Bullet List',
      description: 'Unordered list of items',
      icon: <List className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: 'Numbered List',
      description: 'Ordered list of items',
      icon: <ListOrdered className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: 'Task List',
      description: 'Checklist with checkboxes',
      icon: <ListChecks className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: 'Quote',
      description: 'Blockquote for citations',
      icon: <Quote className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: 'Code Block',
      description: 'Code snippet with formatting',
      icon: <CodeSquare className="h-4 w-4" />,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: 'Table',
      description: 'Insert a 3x3 table',
      icon: <Table className="h-4 w-4" />,
      action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: 'Divider',
      description: 'Horizontal rule separator',
      icon: <Minus className="h-4 w-4" />,
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      title: 'Image',
      description: 'Insert image from URL',
      icon: <ImageIcon className="h-4 w-4" />,
      action: () => {
        if (onInsertImage) {
          onInsertImage();
        }
      },
    },
  ];

  // Filter commands by query
  const filtered = query
    ? commands.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Execute selected command
  const executeCommand = useCallback(
    (index: number) => {
      const cmd = filtered[index];
      if (!cmd) return;

      // Delete the slash + query text
      editor
        .chain()
        .focus()
        .deleteRange({ from: slashRange.from, to: slashRange.to })
        .run();

      // Execute the command
      cmd.action();
      setActive(false);
    },
    [editor, filtered, slashRange]
  );

  // Listen for plugin state updates
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent<SlashCommandState>).detail;
      setActive(detail.active);
      setQuery(detail.query);
      setSlashRange({ from: detail.from, to: detail.to });
      if (detail.active) setSelectedIndex(0);
    };

    window.addEventListener('slash-command-update', handleUpdate);
    return () => window.removeEventListener('slash-command-update', handleUpdate);
  }, []);

  // Listen for keyboard events from the plugin
  useEffect(() => {
    const handleKey = (e: Event) => {
      const key = (e as CustomEvent<{ key: string }>).detail.key;

      if (key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (key === 'Enter') {
        executeCommand(selectedIndex);
      }
    };

    window.addEventListener('slash-command-key', handleKey);
    return () => window.removeEventListener('slash-command-key', handleKey);
  }, [filtered.length, selectedIndex, executeCommand]);

  // Scroll selected item into view
  useEffect(() => {
    if (menuRef.current) {
      const selectedEl = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!active || filtered.length === 0) return null;

  // Position the menu near the cursor
  const coords = editor.view.coordsAtPos(slashRange.from);
  const editorRect = editor.view.dom.closest('.overflow-y-auto')?.getBoundingClientRect();
  const top = editorRect ? coords.bottom - editorRect.top + 4 : coords.bottom + 4;
  const left = editorRect ? coords.left - editorRect.left : coords.left;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 max-h-64 w-64 overflow-y-auto rounded-lg border border-surface-200 bg-white py-1 shadow-xl dark:border-surface-700 dark:bg-surface-800"
      style={{ top, left }}
    >
      {filtered.map((cmd, index) => (
        <button
          key={cmd.title}
          data-index={index}
          onClick={() => executeCommand(index)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
            index === selectedIndex
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
              index === selectedIndex
                ? 'border-primary-200 bg-primary-100 text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                : 'border-surface-200 bg-surface-50 text-surface-500 dark:border-surface-700 dark:bg-surface-700 dark:text-surface-400'
            )}
          >
            {cmd.icon}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-surface-700 dark:text-surface-200">
              {cmd.title}
            </div>
            <div className="truncate text-[10px] text-surface-400 dark:text-surface-500">
              {cmd.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

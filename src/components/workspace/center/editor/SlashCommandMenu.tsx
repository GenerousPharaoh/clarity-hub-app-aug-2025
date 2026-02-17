import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { type SlashCommandState } from './extensions/slash-commands';
import useAppStore from '@/store';
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
  Link,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface SlashCommandMenuProps {
  editor: Editor;
  onInsertImage?: () => void;
  onInsertLink?: () => void;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  group: string;
  action: () => void;
}

export function SlashCommandMenu({ editor, onInsertImage, onInsertLink }: SlashCommandMenuProps) {
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState('');
  const [slashRange, setSlashRange] = useState<{ from: number; to: number }>({ from: 0, to: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const setRightPanel = useAppStore((s) => s.setRightPanel);
  const setRightTab = useAppStore((s) => s.setRightTab);

  const commands: CommandItem[] = useMemo(
    () => [
      // ── Headings ──
      {
        title: 'Heading 1',
        description: 'Large section heading',
        icon: <Heading1 className="h-4 w-4" />,
        group: 'Headings',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: <Heading2 className="h-4 w-4" />,
        group: 'Headings',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        title: 'Heading 3',
        description: 'Small section heading',
        icon: <Heading3 className="h-4 w-4" />,
        group: 'Headings',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      // ── Lists ──
      {
        title: 'Bullet List',
        description: 'Unordered list of items',
        icon: <List className="h-4 w-4" />,
        group: 'Lists',
        action: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        title: 'Numbered List',
        description: 'Ordered list of items',
        icon: <ListOrdered className="h-4 w-4" />,
        group: 'Lists',
        action: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        title: 'Task List',
        description: 'Checklist with checkboxes',
        icon: <ListChecks className="h-4 w-4" />,
        group: 'Lists',
        action: () => editor.chain().focus().toggleTaskList().run(),
      },
      // ── Blocks ──
      {
        title: 'Quote',
        description: 'Blockquote for citations',
        icon: <Quote className="h-4 w-4" />,
        group: 'Blocks',
        action: () => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        title: 'Code Block',
        description: 'Code snippet with formatting',
        icon: <CodeSquare className="h-4 w-4" />,
        group: 'Blocks',
        action: () => editor.chain().focus().toggleCodeBlock().run(),
      },
      {
        title: 'Divider',
        description: 'Horizontal rule separator',
        icon: <Minus className="h-4 w-4" />,
        group: 'Blocks',
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
      // ── Insert ──
      {
        title: 'Table',
        description: 'Insert a 3×3 table',
        icon: <Table className="h-4 w-4" />,
        group: 'Insert',
        action: () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
      },
      {
        title: 'Image',
        description: 'Insert image from URL',
        icon: <ImageIcon className="h-4 w-4" />,
        group: 'Insert',
        action: () => onInsertImage?.(),
      },
      {
        title: 'Link',
        description: 'Insert or edit a hyperlink',
        icon: <Link className="h-4 w-4" />,
        group: 'Insert',
        action: () => onInsertLink?.(),
      },
      // ── AI ──
      {
        title: 'AI Chat',
        description: 'Open AI assistant panel',
        icon: <MessageSquare className="h-4 w-4" />,
        group: 'AI',
        action: () => {
          setRightPanel(true);
          setRightTab('ai');
        },
      },
      {
        title: 'AI Write',
        description: 'Generate text with AI at cursor',
        icon: <Sparkles className="h-4 w-4" />,
        group: 'AI',
        action: () => {
          // Insert a placeholder that signals to the user they should select text and use AI
          editor
            .chain()
            .focus()
            .insertContent(
              '<p><em>Select text above and press the ✦ AI button in the toolbar, or open AI Chat from the right panel.</em></p>'
            )
            .run();
        },
      },
    ],
    [editor, onInsertImage, onInsertLink, setRightPanel, setRightTab]
  );

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Group filtered commands by group
  const grouped = useMemo(() => {
    const groups: { label: string; items: (CommandItem & { flatIndex: number })[] }[] = [];
    const groupOrder = ['Headings', 'Lists', 'Blocks', 'Insert', 'AI'];
    let flatIndex = 0;

    for (const groupName of groupOrder) {
      const items = filtered
        .filter((c) => c.group === groupName)
        .map((c) => ({ ...c, flatIndex: flatIndex++ }));
      if (items.length > 0) {
        groups.push({ label: groupName, items });
      }
    }
    return groups;
  }, [filtered]);

  // Execute selected command
  const executeCommand = useCallback(
    (index: number) => {
      const cmd = filtered[index];
      if (!cmd) return;

      // Validate and delete the slash + query text
      try {
        const { from, to } = slashRange;
        if (from >= 0 && to > from && to <= editor.state.doc.content.size) {
          editor.chain().focus().deleteRange({ from, to }).run();
        }
      } catch {
        // If deleteRange fails, just focus and continue
        editor.commands.focus();
      }

      // Execute the command
      cmd.action();
      setActive(false);
    },
    [editor, filtered, slashRange]
  );

  // Calculate menu position using fixed viewport coordinates
  const updateMenuPosition = useCallback(() => {
    if (!active || slashRange.from === 0) return;
    try {
      const coords = editor.view.coordsAtPos(slashRange.from);
      const menuWidth = 288;
      const menuHeight = 400;
      const padding = 8;

      let top = coords.bottom + 4;
      let left = coords.left;

      // Keep within viewport
      if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - menuWidth - padding;
      }
      if (left < padding) left = padding;
      if (top + menuHeight > window.innerHeight - padding) {
        top = coords.top - menuHeight - 4; // flip above
      }

      setMenuPos({ top, left });
    } catch {
      // coords calculation can fail if position is invalid
    }
  }, [active, slashRange.from, editor]);

  // Update position when menu activates or query changes
  useEffect(() => {
    updateMenuPosition();
  }, [updateMenuPosition]);

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
      // Escape is handled by the plugin (just deactivates menu)
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

  // Close on outside click
  useEffect(() => {
    if (!active) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActive(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [active]);

  if (!active || filtered.length === 0) {
    // Show "no results" hint if menu is active but nothing matches
    if (active && query && filtered.length === 0) {
      return (
        <div
          className="fixed z-[60] w-72 rounded-xl border border-surface-200 bg-white py-3 shadow-xl dark:border-surface-700 dark:bg-surface-800"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <p className="px-3 text-center text-xs text-surface-400 dark:text-surface-500">
            No matching commands
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] max-h-[400px] w-72 overflow-y-auto rounded-xl border border-surface-200 bg-white py-1 shadow-xl dark:border-surface-700 dark:bg-surface-800"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      {grouped.map((group) => (
        <div key={group.label}>
          {/* Group header */}
          <div className="px-3 pb-1 pt-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              {group.label}
            </span>
          </div>

          {group.items.map((cmd) => (
            <button
              key={cmd.title}
              data-index={cmd.flatIndex}
              onClick={() => executeCommand(cmd.flatIndex)}
              onMouseEnter={() => setSelectedIndex(cmd.flatIndex)}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                cmd.flatIndex === selectedIndex
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  cmd.group === 'AI'
                    ? cmd.flatIndex === selectedIndex
                      ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                      : 'bg-accent-50 text-accent-500 dark:bg-accent-900/20 dark:text-accent-400'
                    : cmd.flatIndex === selectedIndex
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                )}
              >
                {cmd.icon}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-surface-700 dark:text-surface-200">
                  {cmd.title}
                </div>
                <div className="truncate text-[11px] text-surface-400 dark:text-surface-500">
                  {cmd.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

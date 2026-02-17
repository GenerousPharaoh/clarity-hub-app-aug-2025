import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Link,
  MoreHorizontal,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
  onInsertLink: () => void;
  onInsertImage: () => void;
}

/* ── Toolbar group definitions ─────────────────────────── */

interface ToolbarItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  getActive?: (editor: Editor) => boolean;
  getDisabled?: (editor: Editor) => boolean;
  action: (editor: Editor) => void;
}

interface ToolbarGroup {
  id: string;
  label: string;
  /** Priority: lower = shown first, hidden last. Groups are hidden highest priority first. */
  priority: number;
  items: ToolbarItem[];
}

function buildGroups(onInsertLink: () => void, onInsertImage: () => void): ToolbarGroup[] {
  return [
    {
      id: 'history',
      label: 'History',
      priority: 1,
      items: [
        {
          key: 'undo',
          icon: <Undo2 className="h-4 w-4" />,
          label: 'Undo',
          shortcut: '\u2318Z',
          getDisabled: (e) => !e.can().undo(),
          action: (e) => e.chain().focus().undo().run(),
        },
        {
          key: 'redo',
          icon: <Redo2 className="h-4 w-4" />,
          label: 'Redo',
          shortcut: '\u2318\u21e7Z',
          getDisabled: (e) => !e.can().redo(),
          action: (e) => e.chain().focus().redo().run(),
        },
      ],
    },
    {
      id: 'format',
      label: 'Formatting',
      priority: 2,
      items: [
        {
          key: 'bold',
          icon: <Bold className="h-4 w-4" />,
          label: 'Bold',
          shortcut: '\u2318B',
          getActive: (e) => e.isActive('bold'),
          action: (e) => e.chain().focus().toggleBold().run(),
        },
        {
          key: 'italic',
          icon: <Italic className="h-4 w-4" />,
          label: 'Italic',
          shortcut: '\u2318I',
          getActive: (e) => e.isActive('italic'),
          action: (e) => e.chain().focus().toggleItalic().run(),
        },
        {
          key: 'underline',
          icon: <Underline className="h-4 w-4" />,
          label: 'Underline',
          shortcut: '\u2318U',
          getActive: (e) => e.isActive('underline'),
          action: (e) => e.chain().focus().toggleUnderline().run(),
        },
        {
          key: 'strike',
          icon: <Strikethrough className="h-4 w-4" />,
          label: 'Strikethrough',
          getActive: (e) => e.isActive('strike'),
          action: (e) => e.chain().focus().toggleStrike().run(),
        },
        {
          key: 'code',
          icon: <Code className="h-4 w-4" />,
          label: 'Inline Code',
          getActive: (e) => e.isActive('code'),
          action: (e) => e.chain().focus().toggleCode().run(),
        },
        {
          key: 'highlight',
          icon: (
            <span className="flex h-4 w-4 items-center justify-center rounded bg-yellow-300/40 text-[11px] font-bold dark:bg-yellow-400/30">
              H
            </span>
          ),
          label: 'Highlight',
          shortcut: '\u2318\u21e7H',
          getActive: (e) => e.isActive('highlight'),
          action: (e) => e.chain().focus().toggleHighlight().run(),
        },
      ],
    },
    {
      id: 'headings',
      label: 'Headings',
      priority: 3,
      items: [
        {
          key: 'h1',
          icon: <Heading1 className="h-4 w-4" />,
          label: 'Heading 1',
          getActive: (e) => e.isActive('heading', { level: 1 }),
          action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
        },
        {
          key: 'h2',
          icon: <Heading2 className="h-4 w-4" />,
          label: 'Heading 2',
          getActive: (e) => e.isActive('heading', { level: 2 }),
          action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          key: 'h3',
          icon: <Heading3 className="h-4 w-4" />,
          label: 'Heading 3',
          getActive: (e) => e.isActive('heading', { level: 3 }),
          action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
        },
      ],
    },
    {
      id: 'lists',
      label: 'Lists',
      priority: 4,
      items: [
        {
          key: 'bullet',
          icon: <List className="h-4 w-4" />,
          label: 'Bullet List',
          getActive: (e) => e.isActive('bulletList'),
          action: (e) => e.chain().focus().toggleBulletList().run(),
        },
        {
          key: 'ordered',
          icon: <ListOrdered className="h-4 w-4" />,
          label: 'Ordered List',
          getActive: (e) => e.isActive('orderedList'),
          action: (e) => e.chain().focus().toggleOrderedList().run(),
        },
        {
          key: 'task',
          icon: <ListChecks className="h-4 w-4" />,
          label: 'Task List',
          getActive: (e) => e.isActive('taskList'),
          action: (e) => e.chain().focus().toggleTaskList().run(),
        },
      ],
    },
    {
      id: 'blocks',
      label: 'Blocks',
      priority: 5,
      items: [
        {
          key: 'quote',
          icon: <Quote className="h-4 w-4" />,
          label: 'Blockquote',
          getActive: (e) => e.isActive('blockquote'),
          action: (e) => e.chain().focus().toggleBlockquote().run(),
        },
        {
          key: 'codeblock',
          icon: <CodeSquare className="h-4 w-4" />,
          label: 'Code Block',
          getActive: (e) => e.isActive('codeBlock'),
          action: (e) => e.chain().focus().toggleCodeBlock().run(),
        },
        {
          key: 'link',
          icon: <Link className="h-4 w-4" />,
          label: 'Insert Link',
          shortcut: '\u2318K',
          getActive: (e) => e.isActive('link'),
          action: () => onInsertLink(),
        },
      ],
    },
    {
      id: 'insert',
      label: 'Insert',
      priority: 6,
      items: [
        {
          key: 'table',
          icon: <Table className="h-4 w-4" />,
          label: 'Insert Table',
          action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        },
        {
          key: 'hr',
          icon: <Minus className="h-4 w-4" />,
          label: 'Horizontal Rule',
          action: (e) => e.chain().focus().setHorizontalRule().run(),
        },
        {
          key: 'image',
          icon: <ImageIcon className="h-4 w-4" />,
          label: 'Insert Image',
          action: () => onInsertImage(),
        },
      ],
    },
    {
      id: 'align',
      label: 'Alignment',
      priority: 7,
      items: [
        {
          key: 'align-left',
          icon: <AlignLeft className="h-4 w-4" />,
          label: 'Align Left',
          getActive: (e) => e.isActive({ textAlign: 'left' }),
          action: (e) => e.chain().focus().setTextAlign('left').run(),
        },
        {
          key: 'align-center',
          icon: <AlignCenter className="h-4 w-4" />,
          label: 'Align Center',
          getActive: (e) => e.isActive({ textAlign: 'center' }),
          action: (e) => e.chain().focus().setTextAlign('center').run(),
        },
        {
          key: 'align-right',
          icon: <AlignRight className="h-4 w-4" />,
          label: 'Align Right',
          getActive: (e) => e.isActive({ textAlign: 'right' }),
          action: (e) => e.chain().focus().setTextAlign('right').run(),
        },
      ],
    },
  ];
}

/* ── Layout constants ──────────────────────────────────── */

const BTN = 32;          // w-8 button
const GAP = 2;           // gap-0.5 (0.125rem)
const DIV_W = 9;         // Divider: mx-1 (4+4) + w-px (1)
// More section: [Divider + Button] inside a flex wrapper
const MORE_W = DIV_W + BTN; // 41px

/* ── Main component ────────────────────────────────────── */

export function EditorToolbar({ editor, onInsertLink, onInsertImage }: EditorToolbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const groups = buildGroups(onInsertLink, onInsertImage);

  // Observe container width — observe both the toolbar and its parent for robustness
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const pl = parseFloat(style.paddingLeft) || 0;
      const pr = parseFloat(style.paddingRight) || 0;
      setContainerWidth(Math.max(0, rect.width - pl - pr));
    };

    // Initial measurement
    measure();

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    ro.observe(el);
    // Also observe parent — catches panel resizes that don't propagate immediately
    if (el.parentElement) ro.observe(el.parentElement);

    return () => ro.disconnect();
  }, []);

  // Decide which groups fit inline vs overflow
  const { inlineGroups, overflowGroups } = splitGroups(groups, containerWidth);

  // Close overflow on outside click
  useEffect(() => {
    if (!overflowOpen) return;
    const handle = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [overflowOpen]);

  const handleAction = useCallback(
    (item: ToolbarItem) => {
      item.action(editor);
      setOverflowOpen(false);
    },
    [editor]
  );

  return (
    <div
      ref={containerRef}
      className="flex shrink-0 items-center gap-0.5 border-b border-surface-200 bg-surface-50/50 px-2 py-1.5 dark:border-surface-800 dark:bg-surface-850/50"
    >
      {/* Inline groups */}
      {inlineGroups.map((group, gi) => (
        <div key={group.id} className="flex items-center gap-0.5">
          {group.items.map((item) => (
            <ToolbarButton
              key={item.key}
              onClick={() => handleAction(item)}
              active={item.getActive?.(editor)}
              disabled={item.getDisabled?.(editor)}
              label={item.label}
              shortcut={item.shortcut}
            >
              {item.icon}
            </ToolbarButton>
          ))}
          {gi < inlineGroups.length - 1 && <Divider />}
        </div>
      ))}

      {/* Overflow "More" dropdown */}
      {overflowGroups.length > 0 && (
        <div ref={overflowRef} className="flex items-center">
          {inlineGroups.length > 0 && <Divider />}
          <ToolbarButton
            ref={moreButtonRef}
            onClick={() => {
              if (!overflowOpen && moreButtonRef.current) {
                const rect = moreButtonRef.current.getBoundingClientRect();
                setDropdownPos({
                  top: rect.bottom + 4,
                  right: window.innerWidth - rect.right,
                });
              }
              setOverflowOpen((prev) => !prev);
            }}
            active={overflowOpen}
            label="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </ToolbarButton>

          {overflowOpen && (
            <div
              className="fixed z-[60] max-h-[70vh] w-56 overflow-y-auto rounded-xl border border-surface-200 bg-white py-1 shadow-xl dark:border-surface-700 dark:bg-surface-800"
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
            >
              {overflowGroups.map((group, gi) => (
                <div key={group.id}>
                  <div className="px-3 pb-1 pt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                      {group.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-0.5 px-2 pb-1.5">
                    {group.items.map((item) => (
                      <ToolbarButton
                        key={item.key}
                        onClick={() => handleAction(item)}
                        active={item.getActive?.(editor)}
                        disabled={item.getDisabled?.(editor)}
                        label={item.label}
                        shortcut={item.shortcut}
                      >
                        {item.icon}
                      </ToolbarButton>
                    ))}
                  </div>
                  {gi < overflowGroups.length - 1 && (
                    <div className="mx-2 my-0.5 h-px bg-surface-100 dark:bg-surface-700" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Split logic ───────────────────────────────────────── */

/** Pixel width of a group's flex container (buttons + internal gaps + optional trailing divider) */
function groupPx(itemCount: number, hasTrailingDivider: boolean): number {
  if (hasTrailingDivider) {
    // N buttons + 1 divider → N+1 items, N internal gaps
    return itemCount * BTN + DIV_W + itemCount * GAP;
  }
  // N buttons → N-1 internal gaps
  return itemCount * BTN + Math.max(0, itemCount - 1) * GAP;
}

/** Total pixel width for a set of inline groups (including parent flex gaps) */
function calcInlineWidth(groups: ToolbarGroup[]): number {
  if (groups.length === 0) return 0;
  let w = 0;
  for (let i = 0; i < groups.length; i++) {
    w += groupPx(groups[i].items.length, i < groups.length - 1);
  }
  // Parent flex gaps between group containers
  w += (groups.length - 1) * GAP;
  return w;
}

function splitGroups(groups: ToolbarGroup[], availableWidth: number) {
  const sorted = [...groups].sort((a, b) => a.priority - b.priority);
  const inlineGroups: ToolbarGroup[] = [];
  const overflowGroups: ToolbarGroup[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const candidate = [...inlineGroups, sorted[i]];
    const remainingCount = sorted.length - candidate.length;
    const inlineW = calcInlineWidth(candidate);
    // If remaining groups exist, reserve space for [gap + More section]
    const moreW = remainingCount > 0 ? GAP + MORE_W : 0;

    if (inlineW + moreW <= availableWidth) {
      inlineGroups.push(sorted[i]);
    } else {
      overflowGroups.push(sorted[i]);
    }
  }

  inlineGroups.sort((a, b) => a.priority - b.priority);
  overflowGroups.sort((a, b) => a.priority - b.priority);
  return { inlineGroups, overflowGroups };
}

/* ── Shared sub-components ─────────────────────────────── */

const ToolbarButton = forwardRef<
  HTMLButtonElement,
  {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    label?: string;
    shortcut?: string;
    children: React.ReactNode;
  }
>(function ToolbarButton({ onClick, active, disabled, label, shortcut, children }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-primary-100 text-primary-700 shadow-sm dark:bg-primary-900/40 dark:text-primary-300'
          : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
      {label && (
        <span className="pointer-events-none absolute -bottom-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-surface-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-surface-200 dark:text-surface-900">
          {label}
          {shortcut && (
            <span className="ml-1 text-surface-400 dark:text-surface-500">{shortcut}</span>
          )}
        </span>
      )}
    </button>
  );
});

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-surface-200 dark:bg-surface-700" />;
}

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { SlashCommands } from './slash-commands';

export function getExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: {
        HTMLAttributes: { class: 'tiptap-code-block' },
      },
      blockquote: {
        HTMLAttributes: { class: 'tiptap-blockquote' },
      },
      horizontalRule: {
        HTMLAttributes: { class: 'tiptap-hr' },
      },
    }),
    Placeholder.configure({
      placeholder: 'Start writing...',
      emptyEditorClass: 'is-editor-empty',
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        class: 'tiptap-link',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: { class: 'tiptap-image' },
    }),
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: { class: 'tiptap-highlight' },
    }),
    TaskList.configure({
      HTMLAttributes: { class: 'tiptap-task-list' },
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: { class: 'tiptap-task-item' },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Typography,
    CharacterCount,
    Table.configure({
      resizable: true,
      HTMLAttributes: { class: 'tiptap-table' },
    }),
    TableRow,
    TableCell,
    TableHeader,
    SlashCommands,
  ];
}

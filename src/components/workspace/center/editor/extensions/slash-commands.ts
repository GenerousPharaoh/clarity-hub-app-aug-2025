import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (view: EditorView) => void;
}

export const slashCommandPluginKey = new PluginKey('slashCommand');

export interface SlashCommandState {
  active: boolean;
  query: string;
  from: number;
  to: number;
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: slashCommandPluginKey,
        state: {
          init(): SlashCommandState {
            return { active: false, query: '', from: 0, to: 0 };
          },
          apply(tr, prev): SlashCommandState {
            const meta = tr.getMeta(slashCommandPluginKey);
            if (meta) return meta;

            // If the document or selection changed, re-check for slash
            if (tr.docChanged || tr.selectionSet) {
              const { $from } = tr.selection;
              const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
              const slashMatch = textBefore.match(/\/([\w]*)$/);

              if (slashMatch) {
                const from = $from.pos - slashMatch[0].length;
                const to = $from.pos;
                return {
                  active: true,
                  query: slashMatch[1] || '',
                  from,
                  to,
                };
              }
            }

            // Deactivate if no slash detected
            if (prev.active) {
              const { $from } = tr.selection;
              const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
              const slashMatch = textBefore.match(/\/([\w]*)$/);
              if (!slashMatch) {
                return { active: false, query: '', from: 0, to: 0 };
              }
            }

            return prev;
          },
        },
        props: {
          handleKeyDown(view, event) {
            const state = slashCommandPluginKey.getState(view.state) as SlashCommandState | undefined;
            if (!state?.active) return false;

            // Let the React component handle these keys
            if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) {
              const slashEvent = new CustomEvent('slash-command-key', {
                detail: { key: event.key },
              });
              window.dispatchEvent(slashEvent);

              if (event.key === 'Escape') {
                // Close menu and remove the slash
                view.dispatch(
                  view.state.tr.setMeta(slashCommandPluginKey, {
                    active: false,
                    query: '',
                    from: 0,
                    to: 0,
                  })
                );
              }

              if (event.key !== 'Escape') {
                event.preventDefault();
                return true;
              }
            }

            return false;
          },
        },
        view() {
          return {
            update(view) {
              const state = slashCommandPluginKey.getState(view.state) as SlashCommandState | undefined;
              const event = new CustomEvent('slash-command-update', {
                detail: state || { active: false, query: '', from: 0, to: 0 },
              });
              window.dispatchEvent(event);
            },
          };
        },
      }),
    ];
  },
});

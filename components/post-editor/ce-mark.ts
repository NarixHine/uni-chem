'use client'

import { Mark, mergeAttributes } from '@tiptap/core'
import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Mark as PMMark } from 'prosemirror-model'

// Colored-emphasis mark. In the flavored source it appears as raw HTML:
//   <ce style="color:var(--chem-green)">$\text{CO}_2$</ce>
// The editor parses it (html: true is required on the Markdown extension so
// markdown-it doesn't escape it) and renders a <ce> element carrying the
// inline style. Serialization emits the original <ce style="…">…</ce> wrapper
// so the copy output is byte-identical to the flavored source.

export const CeMark = Mark.create({
    name: 'ce',
    inclusive: true,
    excludes: '',

    addAttributes() {
        return {
            style: {
                default: null,
                parseHTML: el => el.getAttribute('style'),
                renderHTML: attrs => (attrs.style ? { style: attrs.style } : {}),
            },
        }
    },

    parseHTML() {
        return [{ tag: 'ce' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['ce', mergeAttributes(HTMLAttributes)]
    },

    addStorage() {
        return {
            markdown: {
                serialize: {
                    open(_state: MarkdownSerializerState, mark: PMMark) {
                        const style = (mark.attrs as { style?: string }).style
                        return '<ce' + (style ? ` style="${style}">` : '>')
                    },
                    close() {
                        return '</ce>'
                    },
                },
                parse: {
                    // Handled by markdown-it's native HTML inline parsing (html: true).
                },
            },
        }
    },
})

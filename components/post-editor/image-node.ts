'use client'

import { Image } from '@tiptap/extension-image'
import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Node as PMNode } from 'prosemirror-model'

// Extends `@tiptap/extension-image` with the `tiptap-markdown` storage spec so
// images round-trip as `![alt](src)` instead of raw `<img>` HTML. `tiptap-markdown`
// ships an identical spec (extensions/nodes/image.js) but does not register it by
// default, so we re-declare it here and register the node ourselves.

export const ImageNode = Image.extend({
    addStorage() {
        return {
            ...this.parent?.(),
            markdown: {
                serialize(state: MarkdownSerializerState, node: PMNode) {
                    const alt = state.esc((node.attrs.alt as string) || '')
                    const src = String(node.attrs.src ?? '').replace(/[()]/g, '\\$&')
                    const title = node.attrs.title
                        ? ' "' + String(node.attrs.title).replace(/"/g, '\\"') + '"'
                        : ''
                    state.write('![' + alt + '](' + src + title + ')')
                },
                parse: {
                    // markdown-it renders `![alt](url)` to `<img>` natively; the
                    // node's `parseDOM` rule (from `@tiptap/extension-image`) maps
                    // the `<img>` element back to this node.
                },
            },
        }
    },
})

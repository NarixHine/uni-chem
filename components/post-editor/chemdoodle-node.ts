'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type MarkdownIt from 'markdown-it'
import type StateBlock from 'markdown-it/lib/rules_block/state_block'
import type Token from 'markdown-it/lib/token'
import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Node as PMNode } from 'prosemirror-model'
import { ChemdoodleView } from './chemdoodle-view'

// A read-only block node that carries a ChemDoodle molecule as a JSON string.
// In the flavored source it is fenced as `:::\n{json}\n:::`; we parse those
// fences via a markdown-it block rule (registered through the `Markdown`
// extension's `setup` hook) and serialize back to the same fence on output.
// The React NodeView (see `chemdoodle-view.tsx`) renders the actual molecule
// inline, so the editor is a true WYSIWYG surface — no separate preview pane.

export interface ChemdoodleOptions {
    HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        chemdoodle: {
            insertChemdoodle: (json: string) => ReturnType
        }
    }
}

export const Chemdoodle = Node.create<ChemdoodleOptions>({
    name: 'chemdoodle',
    group: 'block',
    atom: true,
    isolating: true,
    defining: true,

    addOptions() {
        return { HTMLAttributes: {} }
    },

    addAttributes() {
        return {
            json: {
                default: '',
                parseHTML: el => el.textContent ?? '',
                renderHTML: () => ({ 'data-chemdoodle': '' }),
            },
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-chemdoodle]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(ChemdoodleView)
    },

    addCommands() {
        return {
            insertChemdoodle:
                (json: string) =>
                ({ commands }) =>
                    commands.insertContent({ type: this.name, attrs: { json } }),
        }
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: MarkdownSerializerState, node: PMNode) {
                    state.write(':::\n' + ((node.attrs as { json?: string }).json ?? '') + '\n:::')
                    state.closeBlock(node)
                },
                parse: {
                    setup(md: MarkdownIt) {
                        // Block rule: a line starting with `:::` opens, the next
                        // line starting with `:::` (at column 0) closes. Body is
                        // the raw JSON, preserved verbatim.
                        const rule = (
                            state: StateBlock,
                            startLine: number,
                            endLine: number,
                            silent: boolean,
                        ): boolean => {
                            const openPos = state.bMarks[startLine] + state.tShift[startLine]
                            if (state.src.charCodeAt(openPos) !== 0x3a /* : */) return false
                            if (!/^:::\s*$/.test(state.src.slice(openPos, state.eMarks[startLine]))) return false

                            let nextLine = startLine + 1
                            while (nextLine < endLine) {
                                const pos = state.bMarks[nextLine] + state.tShift[nextLine]
                                const slice = state.src.slice(pos, state.eMarks[nextLine])
                                if (/^:::\s*$/.test(slice)) break
                                nextLine++
                            }
                            if (nextLine >= endLine) return false

                            if (silent) return true

                            const bodyStart = state.bMarks[startLine + 1]
                            const bodyEnd = state.eMarks[nextLine - 1]
                            const body = state.src.slice(bodyStart, bodyEnd).replace(/\s+$/, '')

                            const token = state.push('chemdoodle', 'div', 0)
                            token.content = body
                            token.map = [startLine, nextLine + 1]
                            token.markup = ':::'
                            token.block = true
                            state.line = nextLine + 1
                            return true
                        }

                        md.block.ruler.before('fence', 'chemdoodle', rule)

                        md.renderer.rules.chemdoodle = (tokens: Token[], idx: number) => {
                            const content = tokens[idx].content ?? ''
                            return (
                                '<div data-chemdoodle>' +
                                md.utils.escapeHtml(content) +
                                '</div>'
                            )
                        }
                    },
                },
            },
        }
    },
})

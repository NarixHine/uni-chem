'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline'
import type Token from 'markdown-it/lib/token'
import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Node as PMNode } from 'prosemirror-model'

// -- KaTeX NodeView (shared by inline + block) --------------------------------

function MathView({ node, extension }: ReactNodeViewProps) {
    const expr = (node.attrs.expr as string) ?? ''
    const block = extension.name === 'blockmath'
    const html = katex.renderToString(expr.replaceAll('\\\\', '\\'), {
        displayMode: block,
        throwOnError: false,
    })
    return (
        <NodeViewWrapper as={block ? 'div' : 'span'} className={block ? 'my-4' : ''}>
            <span dangerouslySetInnerHTML={{ __html: html }} />
        </NodeViewWrapper>
    )
}

// -- Block math ($$…$$) --------------------------------------------------------

const BlockMath = Node.create({
    name: 'blockmath',
    group: 'block',
    atom: true,
    isolating: true,
    defining: true,

    addAttributes() {
        return {
            expr: { default: '', parseHTML: el => el.textContent ?? '' },
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-blockmath]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-blockmath': '' }, HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathView)
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: MarkdownSerializerState, node: PMNode) {
                    const expr = (node.attrs as { expr?: string }).expr ?? ''
                    state.write('$$' + expr + '$$')
                    state.closeBlock(node)
                },
                parse: {
                    setup(md: MarkdownIt) {
                        md.block.ruler.before('fence', 'blockmath', (state, startLine, endLine, silent) => {
                            const openPos = state.bMarks[startLine] + state.tShift[startLine]
                            if (state.src.charCodeAt(openPos) !== 0x24 /* $ */) return false
                            if (state.src.charCodeAt(openPos + 1) !== 0x24) return false

                            const afterOpen = state.eMarks[startLine]
                            const sameLineClose = state.src.indexOf('$$', openPos + 2)

                            let content: string
                            let nextLine: number

                            if (sameLineClose !== -1 && sameLineClose < afterOpen) {
                                if (silent) return true
                                content = state.src.slice(openPos + 2, sameLineClose)
                                nextLine = startLine
                            } else {
                                nextLine = startLine + 1
                                while (nextLine < endLine) {
                                    const pos = state.bMarks[nextLine] + state.tShift[nextLine]
                                    const slice = state.src.slice(pos, state.eMarks[nextLine])
                                    if (slice.trim() === '$$') break
                                    nextLine++
                                }
                                if (nextLine >= endLine) return false
                                if (silent) return true
                                content = state.src
                                    .slice(openPos + 2, state.eMarks[nextLine - 1])
                                    .trim()
                            }

                            const token = state.push('blockmath', 'div', 0)
                            token.content = content
                            token.map = [startLine, nextLine + 1]
                            token.markup = '$$'
                            token.block = true
                            state.line = nextLine + 1
                            return true
                        })

                        md.renderer.rules.blockmath = (tokens: Token[], idx: number) => {
                            return (
                                '<div data-blockmath>' +
                                md.utils.escapeHtml(tokens[idx].content ?? '') +
                                '</div>'
                            )
                        }
                    },
                },
            },
        }
    },
})

// -- Inline math ($…$) ---------------------------------------------------------

const InlineMath = Node.create({
    name: 'inlinemath',
    group: 'inline',
    inline: true,
    atom: true,
    isolating: true,
    defining: true,

    addAttributes() {
        return {
            expr: { default: '', parseHTML: el => el.textContent ?? '' },
        }
    },

    parseHTML() {
        return [{ tag: 'span[data-inlinemath]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes({ 'data-inlinemath': '' }, HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathView)
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: MarkdownSerializerState, node: PMNode) {
                    const expr = (node.attrs as { expr?: string }).expr ?? ''
                    state.write('$' + expr + '$')
                },
                parse: {
                    setup(md: MarkdownIt) {
                        md.inline.ruler.before('emphasis', 'inlinemath', (state: StateInline, silent: boolean) => {
                            if (state.src.charCodeAt(state.pos) !== 0x24 /* $ */) return false
                            if (state.src.charCodeAt(state.pos + 1) === 0x24) return false // $$ → block

                            const start = state.pos + 1
                            let end = start
                            while (end < state.posMax) {
                                if (state.src.charCodeAt(end) === 0x5c /* \ */) {
                                    end += 2
                                    continue
                                }
                                if (state.src.charCodeAt(end) === 0x24 /* $ */) break
                                end++
                            }
                            if (end >= state.posMax) return false

                            if (!silent) {
                                const expr = state.src.slice(start, end)
                                const token = state.push('inlinemath', 'span', 0)
                                token.content = expr
                                token.markup = '$'
                            }
                            state.pos = end + 1
                            return true
                        })

                        md.renderer.rules.inlinemath = (tokens: Token[], idx: number) => {
                            return (
                                '<span data-inlinemath>' +
                                md.utils.escapeHtml(tokens[idx].content ?? '') +
                                '</span>'
                            )
                        }
                    },
                },
            },
        }
    },
})

export const MathExtensions = [BlockMath, InlineMath]

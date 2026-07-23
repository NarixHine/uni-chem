'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useRef, useState } from 'react'
import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline'
import type Token from 'markdown-it/lib/token'
import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Node as PMNode } from 'prosemirror-model'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        math: {
            /** Insert an inline math node (`$…$`) with an optional seed expr. */
            insertInlineMath: (expr?: string) => ReturnType
            /** Insert a block math node (`$$…$$`) with an optional seed expr. */
            insertBlockMath: (expr?: string) => ReturnType
        }
    }
}

// -- KaTeX NodeView (shared by inline + block) --------------------------------

function MathView({ node, extension, updateAttributes, selected }: ReactNodeViewProps) {
    const expr = (node.attrs.expr as string) ?? ''
    const block = extension.name === 'blockmath'
    const [editing, setEditing] = useState(false)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const html = katex.renderToString(expr.replaceAll('\\\\', '\\'), {
        displayMode: block,
        throwOnError: false,
    })

    const commit = () => {
        const next = inputRef.current?.value ?? ''
        updateAttributes({ expr: next })
        setEditing(false)
    }

    return (
        <NodeViewWrapper as={block ? 'div' : 'span'} className={block ? 'my-4' : ''}>
            {editing ? (
                <textarea
                    ref={inputRef}
                    defaultValue={expr}
                    onBlur={commit}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            commit()
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditing(false)
                        }
                    }}
                    autoFocus
                    rows={block ? 2 : 1}
                    className={
                        'w-full resize-none rounded-[4px] border border-border bg-background px-2 py-1 font-mono text-sm focus:outline-none ' +
                        (block ? '' : 'inline-block w-auto min-w-32')
                    }
                />
            ) : (
                <span
                    onClick={() => {
                        setEditing(true)
                    }}
                    className={
                        'inline-block cursor-text rounded-[2px] ' +
                        (selected ? 'ring-1 ring-foreground/30' : '')
                    }
                    title='Click to edit math'
                >
                    {expr ? (
                        <span dangerouslySetInnerHTML={{ __html: html }} />
                    ) : (
                        <span className='font-mono text-sm text-default-400'>
                            {block ? 'block math' : 'math'}
                        </span>
                    )}
                </span>
            )}
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
            expr: {
                default: '',
                parseHTML: el => el.getAttribute('data-expr') ?? el.textContent ?? '',
                renderHTML: attrs => ({
                    'data-expr': (attrs as { expr?: string }).expr ?? '',
                }),
            },
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

    addCommands() {
        return {
            insertBlockMath:
                (expr = '') =>
                ({ commands }) =>
                    commands.insertContent({ type: this.name, attrs: { expr } }),
        }
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
            expr: {
                default: '',
                parseHTML: el => el.getAttribute('data-expr') ?? el.textContent ?? '',
                renderHTML: attrs => ({
                    'data-expr': (attrs as { expr?: string }).expr ?? '',
                }),
            },
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

    addCommands() {
        return {
            insertInlineMath:
                (expr = '') =>
                ({ commands }) =>
                    commands.insertContent({ type: this.name, attrs: { expr } }),
        }
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

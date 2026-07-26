'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react'
import { useId } from 'react'
import {
    Button,
    Card,
    Chip,
    Label,
    TextArea,
    ToggleButton,
    ToggleButtonGroup,
    type Key,
} from '@heroui/react'
import { PlusIcon, TrashIcon, MinusIcon } from '@phosphor-icons/react'
import type MarkdownIt from 'markdown-it'
import type StateBlock from 'markdown-it/lib/rules_block/state_block'
import type Token from 'markdown-it/lib/token'
import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Node as PMNode } from 'prosemirror-model'
import type { QuizData } from '@/components/quiz'
import {
    QUIZ_OPTION_MARKERS,
    defaultQuiz,
    encodeQuizData,
    parseQuizBody,
    serializeQuizFence,
} from '@/lib/quiz'

// An editable block node carrying a quiz. In the flavored source it is fenced
// as `||| <mode> <answer>\n<body>\n|||`; a markdown-it block rule (registered
// through the `Markdown` extension's `setup` hook) parses that fence into a
// single `payload` attribute holding the URL-encoded JSON the `<Quiz>`
// component also consumes. The React NodeView (`QuizView`) renders a form for
// editing the structured fields and writes back through `updateAttributes`,
// so the editor is a true WYSIWYG surface for quizzes — no separate preview.

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        quiz: {
            /** Insert a quiz block, seeded with `data` (defaults to a 2-option scaffold). */
            insertQuiz: (data?: QuizData) => ReturnType
        }
    }
}

export interface QuizOptions {
    HTMLAttributes: Record<string, unknown>
}

export const QuizNode = Node.create<QuizOptions>({
    name: 'quiz',
    group: 'block',
    atom: true,
    isolating: true,
    defining: true,

    addOptions() {
        return { HTMLAttributes: {} }
    },

    addAttributes() {
        return {
            payload: {
                default: '',
                parseHTML: el => el.getAttribute('data-payload') ?? '',
                renderHTML: attrs => {
                    const p = (attrs as { payload?: string }).payload ?? ''
                    return p ? { 'data-payload': p } : {}
                },
            },
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-quiz]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(QuizView)
    },

    addCommands() {
        return {
            insertQuiz:
                (data) =>
                ({ commands }) =>
                    commands.insertContent({
                        type: this.name,
                        attrs: { payload: encodeQuizData(data ?? defaultQuiz()) },
                    }),
        }
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: MarkdownSerializerState, node: PMNode) {
                    const payload = (node.attrs as { payload?: string }).payload ?? ''
                    let data: QuizData
                    try {
                        data = JSON.parse(decodeURIComponent(payload)) as QuizData
                    } catch {
                        data = defaultQuiz()
                    }
                    state.write(serializeQuizFence(data))
                    state.closeBlock(node)
                },
                parse: {
                    setup(md: MarkdownIt) {
                        // Block rule: an opening line `||| <mode> <answer>` (mode is
                        // `one` or `some`, answer is 1+ letters A–E), a body, and a
                        // closing `|||` line. Body is preserved verbatim and parsed
                        // into structured fields by `parseQuizBody`.
                        const rule = (
                            state: StateBlock,
                            startLine: number,
                            endLine: number,
                            silent: boolean,
                        ): boolean => {
                            const openPos = state.bMarks[startLine] + state.tShift[startLine]
                            if (state.src.charCodeAt(openPos) !== 0x7c /* | */) return false
                            const openLine = state.src.slice(openPos, state.eMarks[startLine])
                            const header = /^\|\|\|\s*(one|some)\s+([A-Ea-e]+)\s*$/.exec(openLine)
                            if (!header) return false

                            let nextLine = startLine + 1
                            while (nextLine < endLine) {
                                const pos = state.bMarks[nextLine] + state.tShift[nextLine]
                                if (/^\|\|\|\s*$/.test(state.src.slice(pos, state.eMarks[nextLine]))) {
                                    break
                                }
                                nextLine++
                            }
                            if (nextLine >= endLine) return false

                            if (silent) return true

                            const mode = header[1] as QuizData['mode']
                            const answer = header[2].toUpperCase()
                            const bodyStart = state.bMarks[startLine + 1]
                            const bodyEnd = state.eMarks[nextLine - 1]
                            const body = state.src.slice(bodyStart, bodyEnd).replace(/\s+$/, '')

                            const token = state.push('quiz', 'div', 0)
                            token.content = body
                            token.info = mode
                            token.meta = { answer }
                            token.map = [startLine, nextLine + 1]
                            token.markup = '|||'
                            token.block = true
                            state.line = nextLine + 1
                            return true
                        }

                        md.block.ruler.before('fence', 'quiz', rule)

                        md.renderer.rules.quiz = (tokens: Token[], idx: number) => {
                            const t = tokens[idx]
                            const mode = (t.info || 'one') as QuizData['mode']
                            const answer = ((t.meta as { answer?: string } | undefined)?.answer ?? '').toUpperCase()
                            const parsed = parseQuizBody(t.content ?? '')
                            const data: QuizData = {
                                mode,
                                answer,
                                question: parsed.question,
                                explanation: parsed.explanation,
                                options: parsed.options,
                            }
                            return `<div data-quiz data-payload="${encodeQuizData(data)}"></div>`
                        }
                    },
                },
            },
        }
    },
})

// -- React NodeView ----------------------------------------------------------

function decodePayload(payload: string): QuizData {
    try {
        return JSON.parse(decodeURIComponent(payload)) as QuizData
    } catch {
        return defaultQuiz()
    }
}

function QuizView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
    const uid = useId()
    const payload = (node.attrs.payload as string | undefined) ?? ''
    const data = decodePayload(payload)

    const commit = (next: QuizData) => {
        updateAttributes({ payload: encodeQuizData(next) })
    }

    const setMode = (mode: QuizData['mode']) => {
        // In `one` mode keep only the first selected letter (if any).
        let answer = data.answer.toUpperCase()
        if (mode === 'one' && answer.length > 1) answer = answer.slice(0, 1)
        commit({ ...data, mode, answer })
    }

    const setQuestion = (question: string) => commit({ ...data, question })
    const setExplanation = (explanation: string) => commit({ ...data, explanation })

    const setOption = (i: number, content: string) => {
        const options = data.options.map((o, idx) => (idx === i ? { ...o, content } : o))
        commit({ ...data, options })
    }

    const addOption = () => {
        if (data.options.length >= QUIZ_OPTION_MARKERS.length) return
        const letter = QUIZ_OPTION_MARKERS[data.options.length]
        commit({ ...data, options: [...data.options, { letter, content: '' }] })
    }

    const removeOption = (i: number) => {
        if (data.options.length <= 1) return
        const options = data.options
            .filter((_, idx) => idx !== i)
            .map((o, idx) => ({ ...o, letter: QUIZ_OPTION_MARKERS[idx] }))
        // Drop any answer letters that no longer have an option.
        const answer = data.answer
            .toUpperCase()
            .split('')
            .filter(c => options.some(o => o.letter === c))
            .join('')
        commit({ ...data, options, answer })
    }

    const answerLetters = data.answer
        .toUpperCase()
        .split('')
        .filter(c => c >= 'A' && c <= 'E')
    const answerKeys = new Set<Key>(answerLetters)

    const onAnswerChange = (keys: Set<Key>) => {
        const answer = [...keys]
            .map(k => String(k))
            .filter(c => c >= 'A' && c <= 'E')
            .sort()
            .join('')
        commit({ ...data, answer })
    }

    return (
        <NodeViewWrapper as='div' className='my-6 not-prose'>
            <Card variant='transparent'>
                <Card.Header className='flex-row items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <Chip variant='secondary'>
                            {data.mode === 'one' ? '单选题' : '不定项'}
                        </Chip>
                        <ToggleButtonGroup
                            selectionMode='single'
                            disallowEmptySelection
                            selectedKeys={new Set<Key>([data.mode])}
                            onSelectionChange={keys => {
                                const m = [...keys][0]
                                if (m === 'one' || m === 'some') setMode(m)
                            }}
                            size='sm'
                        >
                            <ToggleButton id='one'>单选</ToggleButton>
                            <ToggleButton id='some'>
                                <ToggleButtonGroup.Separator />
                                不定项
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    <Button size='sm' variant='ghost' isIconOnly aria-label='移除题目' onPress={deleteNode}>
                        <TrashIcon className='size-4' weight='bold' />
                    </Button>
                </Card.Header>

                <Card.Content className='flex flex-col gap-4'>
                    <div className='flex flex-col gap-1.5'>
                        <Label htmlFor={`${uid}-q`} isRequired>
                            题干 / Question
                        </Label>
                        <TextArea
                            id={`${uid}-q`}
                            value={data.question}
                            onChange={e => setQuestion(e.target.value)}
                            placeholder='题干，支持 Markdown 与公式…'
                            rows={3}
                            fullWidth
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <Label>选项 / Options</Label>
                        <div className='flex flex-col gap-2'>
                            {data.options.map((opt, i) => (
                                <div key={opt.letter} className='flex items-center gap-2'>
                                    <span
                                        aria-hidden
                                        className='flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-xs font-bold text-muted'
                                    >
                                        {opt.letter}
                                    </span>
                                    <TextArea
                                        id={`${uid}-opt-${i}`}
                                        aria-label={`选项 ${opt.letter}`}
                                        value={opt.content}
                                        onChange={e => setOption(i, e.target.value)}
                                        placeholder={`选项 ${opt.letter}，支持 Markdown…`}
                                        rows={2}
                                        fullWidth
                                    />
                                    <Button
                                        size='sm'
                                        variant='ghost'
                                        isIconOnly
                                        aria-label={`移除选项 ${opt.letter}`}
                                        isDisabled={data.options.length <= 1}
                                        onPress={() => removeOption(i)}
                                    >
                                        <MinusIcon className='size-4' weight='bold' />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                size='sm'
                                variant='ghost'
                                onPress={addOption}
                                isDisabled={data.options.length >= QUIZ_OPTION_MARKERS.length}
                                className='self-start'
                            >
                                <PlusIcon className='size-4' weight='bold' />
                                添加选项
                            </Button>
                        </div>
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <Label>正确答案 / Answer</Label>
                        <ToggleButtonGroup
                            selectionMode={data.mode === 'one' ? 'single' : 'multiple'}
                            disallowEmptySelection={data.mode === 'one'}
                            selectedKeys={answerKeys}
                            onSelectionChange={onAnswerChange}
                            size='sm'
                        >
                            {data.options.map((opt, i) => (
                                <ToggleButton key={opt.letter} id={opt.letter} aria-label={`标记 ${opt.letter} 为正确`}>
                                    {i > 0 ? <ToggleButtonGroup.Separator /> : null}
                                    {opt.letter}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <Label htmlFor={`${uid}-sol`}>解析 / Explanation</Label>
                        <TextArea
                            id={`${uid}-sol`}
                            value={data.explanation ?? ''}
                            onChange={e => setExplanation(e.target.value)}
                            placeholder='解析，可选…'
                            rows={2}
                            fullWidth
                        />
                    </div>
                </Card.Content>
            </Card>
        </NodeViewWrapper>
    )
}

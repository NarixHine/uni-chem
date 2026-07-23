'use client'

import { Button, Card, Chip } from '@heroui/react'
import { Markdown as MarkdownToJSX } from 'markdown-to-jsx/react'
import cn from 'cnfast'
import { useMemo, useState } from 'react'
import { Math } from '../markdown/math'
import Visualizer from '../visualizer'
import { PaperPlaneRightIcon } from '@phosphor-icons/react'

export interface QuizData {
    mode: 'one' | 'some'
    answer: string
    question: string
    explanation?: string
    options: { letter: string; content: string }[]
}

export interface QuizProps {
    data: string
    className?: string
}

const overrides = {
    Visualizer: { component: Visualizer },
    inlinemath: { component: Math },
    blockmath: { component: Math, props: { block: true } },
}

const optionOverrides = {
    Visualizer: {
        component: Visualizer,
        props: { canvasStyle: { backgroundColor: 'transparent' } },
    },
    inlinemath: { component: Math },
    blockmath: { component: Math, props: { block: true } },
}

function MiniMarkdown({ children }: { children: string }) {
    return <MarkdownToJSX options={{ overrides }}>{children}</MarkdownToJSX>
}

function OptionMarkdown({ children }: { children: string }) {
    return <MarkdownToJSX options={{ overrides: optionOverrides }}>{children}</MarkdownToJSX>
}

export function Quiz({ data, className }: QuizProps) {
    const quiz: QuizData = useMemo(() => {
        try {
            return JSON.parse(decodeURIComponent(data))
        } catch {
            return { mode: 'one' as const, answer: '', question: '', options: [] }
        }
    }, [data])

    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [submitted, setSubmitted] = useState(false)

    const answerSet = useMemo(
        () =>
            new Set(
                quiz.answer
                    .toUpperCase()
                    .split('')
                    .filter((c: string) => c >= 'A' && c <= 'E'),
            ),
        [quiz.answer],
    )

    const toggle = (letter: string) => {
        if (submitted) return
        setSelected(prev => {
            const next = new Set(prev)
            if (quiz.mode === 'one') {
                if (next.has(letter)) next.delete(letter)
                else {
                    next.clear()
                    next.add(letter)
                }
            } else {
                if (next.has(letter)) next.delete(letter)
                else next.add(letter)
            }
            return next
        })
    }

    return (
        <Card variant='transparent' className={cn('my-8 rounded-lg p-0 shadow-none', className)}>
            <Card.Header className='flex-row items-center gap-2'>
                <Chip variant='secondary' className='rounded-lg'>
                    {quiz.mode === 'one' ? '单选题' : `不定项（1~${quiz.options.length} 个正确）`}
                </Chip>
            </Card.Header>

            <Card.Content>
                <div className='dark:prose-invert prose prose-p:not-last:mb-2 prose-p:mt-0 prose-ol:my-0 prose-li:my-0 max-w-none'>
                    <MiniMarkdown>{quiz.question}</MiniMarkdown>
                </div>
            </Card.Content>

            <Card.Content className='gap-0 mb-1'>
                {quiz.options.map(opt => {
                    const isSelected = selected.has(opt.letter)
                    const isCorrect = answerSet.has(opt.letter)
                    // 单选: always reveal the correct answer green after submit
                    // 不定项: green only if the user selected it; missed ones show "漏"
                    const showCorrect =
                        submitted && isCorrect && (quiz.mode === 'one' || isSelected)
                    const showMissed = submitted && quiz.mode === 'some' && isCorrect && !isSelected
                    const showWrong = submitted && isSelected && !isCorrect

                    return (
                        <Button
                            key={opt.letter}
                            variant='ghost'
                            fullWidth
                            isDisabled={submitted}
                            onPress={() => toggle(opt.letter)}
                            className={
                                '-mx-4 w-[calc(100%+2rem)] min-h-10 h-auto md:h-auto items-center rounded-lg opacity-100 [&_canvas]:h-32 [&_canvas]:max-h-32'
                            }
                        >
                            <span
                                className={cn(
                                    'flex size-6 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-colors',
                                    showCorrect &&
                                        'border-success bg-success text-success-foreground',
                                    showMissed &&
                                        'border-warning bg-warning text-warning-foreground',
                                    showWrong && 'border-danger bg-danger text-danger-foreground',
                                    !showCorrect &&
                                        !showMissed &&
                                        !showWrong &&
                                        isSelected &&
                                        'border-accent bg-accent text-accent-foreground',
                                    !showCorrect &&
                                        !showMissed &&
                                        !showWrong &&
                                        !isSelected &&
                                        'border-border text-muted',
                                )}
                            >
                                {showMissed ? '漏' : opt.letter}
                            </span>
                            <div className='text-wrap not-prose max-w-none flex-1 text-left'>
                                <OptionMarkdown>{opt.content}</OptionMarkdown>
                            </div>
                        </Button>
                    )
                })}
            </Card.Content>

            <Card.Footer className='flex-col items-stretch gap-4'>
                {!submitted ? (
                    <Button
                        variant='primary'
                        size='sm'
                        className={'rounded-lg'}
                        isDisabled={selected.size === 0}
                        onPress={() => setSubmitted(true)}
                    >
                        <PaperPlaneRightIcon /> 提交
                    </Button>
                ) : (
                    <div className='flex flex-col gap-4'>
                        {quiz.explanation && (
                            <div className='flex flex-col gap-2'>
                                <span className='text-sm font-bold tracking-wider text-muted'>
                                    解析
                                </span>
                                <div className='prose dark:prose-invert prose-p:not-last:mb-2 prose-p:mt-0 prose-ol:my-0 prose-li:my-0 max-w-none'>
                                    <MiniMarkdown>{quiz.explanation}</MiniMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card.Footer>
        </Card>
    )
}

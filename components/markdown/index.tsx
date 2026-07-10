import { Markdown as MarkdownToJSX } from 'markdown-to-jsx/react'
import type { HTMLAttributes } from 'react'
import cn from 'cnfast'
import Visualizer from '../visualizer'
import { Quiz } from '../quiz'
import { InlineMath } from './inline-math'

export type MarkdownProps = {
    children: string
} & HTMLAttributes<HTMLDivElement>

const ESCAPED_DOLLAR = '\0$'

function preprocessMath(source: string): string {
    return source
        .replace(/\\\$/g, ESCAPED_DOLLAR)
        .replace(/(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)/gs, (_, expr) => {
            const safe = JSON.stringify(expr)
            return `<InlineMath expr=${safe} />`
        })
        .replace(new RegExp(ESCAPED_DOLLAR.replace(/\$/g, '\\$'), 'g'), '$')
}

const OPTION_MARKERS = ['A', 'B', 'C', 'D', 'E'] as const
const MARKER_SEQUENCE = ['Q', 'Sol', ...OPTION_MARKERS]

function parseQuizBody(body: string) {
    const lines = body.split('\n')
    const sections = new Map<string, string[]>()
    let currentMarker: string | null = null
    let seqIdx = 0

    for (const line of lines) {
        const trimmed = line.trim()
        let matched = false

        for (let i = seqIdx; i < MARKER_SEQUENCE.length; i++) {
            if (trimmed === MARKER_SEQUENCE[i]) {
                currentMarker = trimmed
                sections.set(currentMarker, [])
                seqIdx = i + 1
                matched = true
                break
            }
            if (MARKER_SEQUENCE[i] === 'Sol') continue
            break
        }

        if (!matched && currentMarker) {
            sections.get(currentMarker)!.push(line)
        }
    }

    const question = (sections.get('Q') ?? []).join('\n').trim()
    const explanation =
        (sections.get('Sol') ?? []).join('\n').trim() || undefined
    const options = OPTION_MARKERS.filter(l => sections.has(l)).map(l => ({
        letter: l,
        content: (sections.get(l) ?? []).join('\n').trim(),
    }))

    return { question, explanation, options }
}

function preprocessQuiz(source: string): string {
    return source.replace(
        /\|\|\|\s*(one|some)\s+([A-Ea-e]+)\s*\n([\s\S]*?)\|\|\|/g,
        (_, mode, answer, body) => {
            const parsed = parseQuizBody(body)
            const data = encodeURIComponent(
                JSON.stringify({
                    mode,
                    answer: answer.toUpperCase(),
                    question: parsed.question,
                    explanation: parsed.explanation,
                    options: parsed.options,
                }),
            )
            return `<Quiz data="${data}"></Quiz>`
        },
    )
}

export function Markdown({ children: content, className, ...props }: MarkdownProps) {
    let result = preprocessMath(content)

    result = result.replace(/:::.*?\n(.*?):::/gs, (_, p1) => {
        const molecule = JSON.stringify(JSON.parse(p1))
        return `<Visualizer mol={${molecule}}></Visualizer>`
    })

    result = preprocessQuiz(result)

    return (
        <div className={cn('prose dark:prose-invert prose-lg', className)} {...props}>
            <MarkdownToJSX
                options={{
                    overrides: {
                        Visualizer: {
                            component: Visualizer,
                        },
                        InlineMath: {
                            component: InlineMath,
                        },
                        Quiz: {
                            component: Quiz,
                        },
                    },
                }}
            >
                {result}
            </MarkdownToJSX>
        </div>
    )
}

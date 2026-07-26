import Link from 'next/link'
import { Markdown as MarkdownToJSX } from 'markdown-to-jsx/react'
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import cn from 'cnfast'
import Visualizer from '../visualizer'
import { Quiz } from '../quiz'
import { Math } from './math'
import { encodeQuizData, parseQuizBody } from '@/lib/quiz'

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: ReactNode
}

const EXTERNAL_HREF = /^(https?:|mailto:|tel:|#)/i

function MarkdownLink({ children, href, className, ...rest }: AnchorProps) {
    if (!href || EXTERNAL_HREF.test(href)) {
        return (
            <a
                href={href}
                {...rest}
                className={cn(className, 'underline-offset-5 decoration-[0.5px]')}
                target='_blank'
                rel='noreferrer'
            >
                {children}
            </a>
        )
    }
    return (
        <Link
            href={href}
            {...rest}
            className={cn(className, 'underline-offset-5 decoration-[0.5px]')}
        >
            {children}
        </Link>
    )
}

/** Overrides shared wherever flavored Markdown is rendered (no Glance). */
export const FLAVOR_OVERRIDES = {
    a: { component: MarkdownLink },
    Visualizer: {
        component: Visualizer,
        props: { canvasStyle: { backgroundColor: 'transparent' } },
    },
    inlinemath: { component: Math },
    blockmath: { component: Math, props: { block: true } },
    Quiz: { component: Quiz },
} as const

const ESCAPED_DOLLAR = '\0$'

/** Emits a self-closing lowercase `<${tag} expr="…" />` custom element. */
function toMathTag(tag: 'inlinemath' | 'blockmath', expr: string): string {
    // Lowercase tag: a PascalCase `<InlineMath />` at the start of a block
    // line is parsed by markdown-to-jsx as an HTML block opening tag,
    // swallowing the rest of the paragraph as (dropped) children. Lowercase
    // custom tags are never treated as HTML blocks, so they stay inline and
    // self-close. The override is registered lowercase in FLAVOR_OVERRIDES.
    return `<${tag} expr=${JSON.stringify(expr)} />`
}

function preprocessMath(source: string): string {
    return (
        source
            .replace(/\\\$/g, ESCAPED_DOLLAR)
            // Block math ($$…$$) first so it isn't shadowed by the inline rule.
            .replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, (_, expr) => toMathTag('blockmath', expr))
            .replace(/(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)/gs, (_, expr) =>
                toMathTag('inlinemath', expr),
            )
            .replace(new RegExp(ESCAPED_DOLLAR.replace(/\$/g, '\\$'), 'g'), '$')
    )
}

function preprocessQuiz(source: string): string {
    return source.replace(
        /\|\|\|\s*(one|some)\s+([A-Ea-e]+)\s*\n([\s\S]*?)\|\|\|/g,
        (_, mode, answer, body) => {
            const parsed = parseQuizBody(body)
            const data = encodeQuizData({
                mode,
                answer: answer.toUpperCase(),
                question: parsed.question,
                explanation: parsed.explanation,
                options: parsed.options,
            })
            return `<Quiz data="${data}"></Quiz>`
        },
    )
}

function preprocessVisualizer(source: string): string {
    return source.replace(/:::.*?\n(.*?):::/gs, (_, p1) => {
        const molecule = JSON.stringify(JSON.parse(p1))
        return `<Visualizer mol={${molecule}}></Visualizer>`
    })
}

/**
 * Applies the flavored-Markdown preprocessing pipeline (math → visualizer →
 * quiz), WITHOUT glossary matching. Reused by the article renderer and by Glance
 * (whose definitions must not recurse into further Glance tags).
 */
export function preprocessFlavor(source: string): string {
    return preprocessQuiz(preprocessVisualizer(preprocessMath(source)))
}

export type FlavoredMarkdownProps = {
    children: string
} & HTMLAttributes<HTMLDivElement>

/**
 * Compact flavored-Markdown renderer (prose-sm, no prose-lg, no glossary).
 * Used for Glance overlay bodies.
 */
export function FlavoredMarkdown({
    children: content,
    className,
    ...props
}: FlavoredMarkdownProps) {
    return (
        <div className={cn('prose dark:prose-invert prose-sm', className)} {...props}>
            <MarkdownToJSX options={{ overrides: FLAVOR_OVERRIDES }}>
                {preprocessFlavor(content)}
            </MarkdownToJSX>
        </div>
    )
}

import { Markdown as MarkdownToJSX } from 'markdown-to-jsx/react'
import type { HTMLAttributes } from 'react'
import cn from 'cnfast'
import Visualizer from '../visualizer'
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

export function Markdown({ children: content, className, ...props }: MarkdownProps) {
    let result = preprocessMath(content)

    result = result.replace(/:::.*?\n(.*?):::/gs, (_, p1) => {
        const molecule = JSON.stringify(JSON.parse(p1))
        return `<Visualizer mol={${molecule}}></Visualizer>`
    })

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
                    },
                }}
            >
                {result}
            </MarkdownToJSX>
        </div>
    )
}

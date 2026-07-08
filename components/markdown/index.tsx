'use client'

import { Markdown as MarkdownToJSX } from 'markdown-to-jsx/react'
import type { HTMLAttributes } from 'react'
import cn from 'cnfast'
import Visualizer from '../visualizer'

export type MarkdownProps = {
    children: string
} & HTMLAttributes<HTMLDivElement>

export function Markdown({ children: content, className, ...props }: MarkdownProps) {
    const result = content.replace(/:::.*?\n(.*?):::/gs, (_, p1) => {
        const molecule = JSON.stringify(JSON.parse(p1))
        return `<Visualizer mol={${molecule}}></Visualizer>`
    })

    return (
        <div className={cn('dark:prose-invert prose-lg', className)} {...props}>
            <MarkdownToJSX
                options={{
                    overrides: {
                        Visualizer: {
                            component: Visualizer,
                        },
                    },
                    
                }}
            >
                {result}
            </MarkdownToJSX>
        </div>
    )
}

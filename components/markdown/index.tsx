import { Markdown as MarkdownToJSX } from 'markdown-to-jsx/react'
import type { HTMLAttributes } from 'react'
import cn from 'cnfast'
import { preprocessGlossary } from '@/lib/glossary'
import { Glance } from '../glance/glance'
import { FLAVOR_OVERRIDES, preprocessFlavor } from './flavor'

export type MarkdownProps = {
    children: string
    /**
     * When `true` (default), glossary terms in the raw source are wrapped with
     * `<glance>` components. Disable for contexts that should not produce
     * glossary overlays (e.g. already-extracted definitions).
     */
    glossary?: boolean
} & HTMLAttributes<HTMLDivElement>

export function Markdown({
    children: content,
    className,
    glossary = true,
    ...props
}: MarkdownProps) {
    let result = glossary ? preprocessGlossary(content) : content
    result = preprocessFlavor(result)

    return (
        <div className={cn('prose dark:prose-invert prose-lg', className)} {...props}>
            <MarkdownToJSX
                options={{
                    overrides: {
                        ...FLAVOR_OVERRIDES,
                        glance: { component: Glance },
                    },
                }}
            >
                {result}
            </MarkdownToJSX>
        </div>
    )
}

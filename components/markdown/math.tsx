'use client'

import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useMemo } from 'react'
import cn from 'cnfast'

export type MathProps = {
    expr: string
    /** Render in display (block) mode via KaTeX `\displaystyle`. */
    block?: boolean
    className?: string
}

/**
 * Core KaTeX renderer. The same component powers both inline (`$…$`) and
 * block (`$$…$$`) math; the `block` prop selects KaTeX display mode and a
 * block-level `<div>` wrapper (vs. an inline `<span>`).
 *
 * KaTeX is invoked synchronously during render (via `useMemo`) rather than
 * in a `useEffect`, so the server-rendered HTML already contains the typeset
 * math — eliminating the hydration gap that would otherwise shift layout.
 */
export function Math({ expr, block, className }: MathProps) {
    const html = useMemo(
        () => katex.renderToString(expr.replaceAll('\\\\', '\\'), {
            displayMode: !!block,
            throwOnError: false,
        }),
        [expr, block],
    )

    const Tag = block ? 'div' : 'span'
    return (
        <Tag
            className={cn('[text-decoration:inherit]', className)}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}

export type InlineMathProps = Omit<MathProps, 'block'>

/** Inline math (`$…$`); renders as a `<span>`. */
export function InlineMath(props: InlineMathProps) {
    return <Math {...props} />
}

export type BlockMathProps = Omit<MathProps, 'block'>

/** Block math (`$$…$$`); renders centered in display mode as a `<div>`. */
export function BlockMath(props: BlockMathProps) {
    return <Math {...props} block />
}

'use client'

import 'katex/dist/katex.min.css'
import TeX from '@matejmazur/react-katex'
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
 */
export function Math({ expr, block, className }: MathProps) {
    return (
        <TeX
            math={expr.replaceAll('\\\\', '\\')}
            block={block}
            className={cn('[text-decoration:inherit]', className)}
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

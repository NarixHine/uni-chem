'use client'

import 'katex/dist/katex.min.css'
import TeX from '@matejmazur/react-katex'
import cn from 'cnfast'

export type InlineMathProps = {
    expr: string
    className?: string
}

export function InlineMath({ expr, className }: InlineMathProps) {
    return (
        <TeX
            math={expr.replaceAll('\\\\', '\\')}
            className={cn('[text-decoration:inherit]', className)}
        />
    )
}

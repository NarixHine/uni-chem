'use client'

import 'katex/dist/katex.min.css'
import TeX from '@matejmazur/react-katex'

export type InlineMathProps = {
    expr: string
    className?: string
}

export function InlineMath({ expr, className }: InlineMathProps) {
    return <TeX math={expr} className={className} />
}

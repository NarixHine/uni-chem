'use client'

import 'katex/dist/katex.min.css'

import { useEffect, useRef } from 'react'
import cn from 'cnfast'

export type InlineMathProps = {
    expr: string
    className?: string
}

export function InlineMath({ expr, className }: InlineMathProps) {
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (!ref.current) return

        let cancelled = false
        import('katex').then(({ default: katex }) => {
            if (cancelled) return
            katex.render(expr, ref.current!, {
                throwOnError: false,
                displayMode: false,
                strict: false,
            })
        })

        return () => { cancelled = true }
    }, [expr])

    return <span ref={ref} className={cn('katex-inline', className)} />
}

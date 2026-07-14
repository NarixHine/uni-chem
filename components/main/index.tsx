import { cn } from 'cnfast'
import type { HTMLAttributes } from 'react'

export interface MainProps extends HTMLAttributes<HTMLDivElement> {
    /** Include the default top/bottom page padding. Defaults to true. */
    padded?: boolean
}

export default function Main({ children, className, padded = true, ...props }: MainProps) {
    return (
        <main
            {...props}
            className={cn('mx-auto min-h-dvh max-w-xl px-5', padded && 'pt-16 pb-20', className)}
        >
            {children}
        </main>
    )
}

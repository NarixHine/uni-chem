import { cn } from 'cnfast'
import type { HTMLAttributes } from 'react'

export default function Main({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <main {...props} className={cn('max-w-xl px-5 pt-16 pb-20 mx-auto min-h-dvh', className)}>
            {children}
        </main>
    )
}

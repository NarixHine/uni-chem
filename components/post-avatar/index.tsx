'use client'

import { cn } from 'cnfast'
import { useMemo, type HTMLAttributes } from 'react'

const PALETTE = [
    '#eae4e9',
    '#fff1e6',
    '#fde2e4',
    '#fad2e1',
    '#e2ece9',
    '#bee1e6',
    '#f0efeb',
    '#dfe7fd',
    '#cddafd',
]

/* FNV-1a 32-bit hash → deterministic per-post color */
function hashString(s: string): number {
    let h = 0x811c9dc5
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 0x01000193)
    }
    return h >>> 0
}

export interface PostAvatarProps extends HTMLAttributes<HTMLSpanElement> {
    seed: string
    neutral?: boolean
}

export function PostAvatar({ seed, neutral, className, style, ...props }: PostAvatarProps) {
    const color = useMemo(
        () =>
            neutral ? 'var(--background-secondary)' : PALETTE[hashString(seed) % PALETTE.length],
        [seed, neutral],
    )

    return (
        <span
            aria-hidden
            className={cn('relative block shrink-0 overflow-hidden rounded-lg', className)}
            style={{
                ...style,
                backgroundColor: color,
                boxShadow:
                    'inset 0 0.5px 0.5px rgba(255,255,255,0.5), inset 0 -0.5px 0.5px rgba(0,0,0,0.1)',
            }}
            {...props}
        >
            <span
                className='block h-full w-full rounded-md md:rounded-lg'
                style={{
                    background:
                        'linear-gradient(150deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.06) 100%)',
                }}
            />
        </span>
    )
}

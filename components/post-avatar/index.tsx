'use client'

import { cn } from 'cnfast'
import { useMemo, type HTMLAttributes } from 'react'

/* FNV-1a 32-bit hash → deterministic per-post color */
function hashString(s: string): number {
    let h = 0x811c9dc5
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 0x01000193)
    }
    return h >>> 0
}

function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/* Ethereal pastel palette — provided */
const PALETTE = [
    '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf',
    '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc',
]

/* 4x4 Bayer ordered-dithering matrix */
const BAYER4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]

interface AvatarArt {
    base: string
    ditherUrl: string
}

const cache = new Map<string, AvatarArt>()

function buildArt(seed: string): AvatarArt {
    const cached = cache.get(seed)
    if (cached) return cached

    const h = hashString(seed)
    const baseHex = PALETTE[h % PALETTE.length]
    const [r, g, b] = hexToRgb(baseHex)

    /* Two shades of the SAME hue — strong contrast for visible dithering.
       light: blend towards white, dark: blend towards black.
       Same hue, just luminance shift — no ugly synthesized colors. */
    const light: [number, number, number] = [
        Math.min(255, Math.round(r + (255 - r) * 0.6)),
        Math.min(255, Math.round(g + (255 - g) * 0.6)),
        Math.min(255, Math.round(b + (255 - b) * 0.6)),
    ]
    const dark: [number, number, number] = [
        Math.round(r * 0.55),
        Math.round(g * 0.55),
        Math.round(b * 0.55),
    ]

    /* 12x12 canvas — each canvas pixel is large when scaled to avatar size.
       Binary 2-level dither (no gradient) → crisp, bold halftone dots. */
    const size = 12
    let ditherUrl = ''
    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d')
        if (ctx) {
            const img = ctx.createImageData(size, size)
            const data = img.data
            const n = size - 1
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const t = (x + y) / (2 * n)
                    const thr = (BAYER4[y & 3][x & 3] + 0.5) / 16
                    // binary: above threshold → light, below → dark
                    const isLight = t + (thr - 0.5) * 1.2 > 0.5

                    const i = (y * size + x) * 4
                    const c = isLight ? light : dark
                    data[i] = c[0]
                    data[i + 1] = c[1]
                    data[i + 2] = c[2]
                    data[i + 3] = 255
                }
            }
            ctx.putImageData(img, 0, 0)
            ditherUrl = canvas.toDataURL()
        }
    }

    const art: AvatarArt = { base: baseHex, ditherUrl }
    cache.set(seed, art)
    return art
}

export interface PostAvatarProps extends HTMLAttributes<HTMLSpanElement> {
    seed: string
}

export function PostAvatar({ seed, className, style, ...props }: PostAvatarProps) {
    const art = useMemo(() => buildArt(seed), [seed])

    return (
        <span
            aria-hidden
            className={cn(
                'relative block h-full aspect-square overflow-hidden rounded-[6px] md:rounded-[8px]',
                className,
            )}
            style={{
                ...style,
                backgroundColor: art.base,
                backgroundImage: art.ditherUrl
                    ? `url(${art.ditherUrl})`
                    : 'none',
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated',
                boxShadow:
                    'inset 0 0.5px 0.5px rgba(255,255,255,0.5), inset 0 -0.5px 0.5px rgba(0,0,0,0.1)',
            }}
            {...props}
        >
            <span
                className='block h-full w-full rounded-[6px] md:rounded-[8px]'
                style={{
                    background:
                        'linear-gradient(150deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.06) 100%)',
                }}
            />
        </span>
    )
}

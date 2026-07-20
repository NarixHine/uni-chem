'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import getStroke from 'perfect-freehand'
import { Button } from '@heroui/react'
import {
    ArrowUUpLeftIcon,
    EraserIcon,
    PencilLineIcon,
    TrashSimpleIcon,
} from '@phosphor-icons/react'
import { cn } from 'cnfast'

type Point = [number, number, number]
type Mode = 'pen' | 'eraser'

type Stroke = {
    points: Point[]
    color: string
    size: number
    mode: Mode
}

const PEN_SIZE = 3
const ERASER_SIZE = 26

const STROKE_OPTIONS = {
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: true,
    last: true,
} as const

function outlineToPath(outline: number[][]): Path2D {
    const path = new Path2D()
    if (outline.length === 0) return path
    if (outline.length === 1) {
        const [x, y] = outline[0]
        path.arc(x, y, 0.5, 0, Math.PI * 2)
        return path
    }
    path.moveTo(outline[0][0], outline[0][1])
    for (let i = 1; i < outline.length - 1; i++) {
        const [x0, y0] = outline[i]
        const [x1, y1] = outline[i + 1]
        path.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    }
    const last = outline[outline.length - 1]
    path.lineTo(last[0], last[1])
    path.closePath()
    return path
}

function centroid(map: Map<number, { x: number; y: number }>) {
    let x = 0
    let y = 0
    for (const p of map.values()) {
        x += p.x
        y += p.y
    }
    const n = map.size || 1
    return { x: x / n, y: y / n }
}

export interface WhiteboardProps {
    className?: string
}

export function Whiteboard({ className }: WhiteboardProps) {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'
    const ink = isDark ? '#f5f5f4' : '#1f2933'

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [mode, setMode] = useState<Mode>('pen')
    const [committed, setCommitted] = useState<Stroke[]>([])
    const committedRef = useRef<Stroke[]>(committed)
    const drawingRef = useRef<Stroke | null>(null)
    const offsetRef = useRef({ x: 0, y: 0 })
    const pointersRef = useRef(new Map<number, { x: number; y: number }>())
    const panRef = useRef<{ x: number; y: number; kind: 'touch' | 'middle' } | null>(null)
    const rafRef = useRef<number | null>(null)
    const [panning, setPanning] = useState(false)
    const hasInk = committed.length > 0

    const drawAll = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        const w = Math.max(1, Math.round(rect.width * dpr))
        const h = Math.max(1, Math.round(rect.height * dpr))
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w
            canvas.height = h
        }
        const { x: ox, y: oy } = offsetRef.current
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, rect.width, rect.height)
        ctx.translate(ox, oy)

        const all = drawingRef.current
            ? [...committedRef.current, drawingRef.current]
            : committedRef.current
        for (const s of all) {
            if (s.points.length === 0) continue
            const path = outlineToPath(getStroke(s.points, { ...STROKE_OPTIONS, size: s.size }))
            if (s.mode === 'eraser') {
                ctx.save()
                ctx.globalCompositeOperation = 'destination-out'
                ctx.fill(path)
                ctx.restore()
            } else {
                ctx.fillStyle = s.color
                ctx.fill(path)
            }
        }
    }, [])

    const scheduleDraw = useCallback(() => {
        if (rafRef.current != null) return
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            drawAll()
        })
    }, [drawAll])

    useLayoutEffect(() => {
        drawAll()
    }, [committed, drawAll])

    useEffect(() => {
        const el = canvasRef.current
        if (!el) return
        const ro = new ResizeObserver(() => scheduleDraw())
        ro.observe(el)
        return () => ro.disconnect()
    }, [scheduleDraw])

    useEffect(() => {
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    // Block iOS touch bleed (text selection, button taps) while a stroke is
    // active. Pointer capture is unreliable on Safari; a document-level
    // non-passive listener is the only reliable gate.
    const drawingActiveRef = useRef(false)
    useEffect(() => {
        const prevent = (e: TouchEvent) => {
            if (drawingActiveRef.current) e.preventDefault()
        }
        const gestureStart = (e: Event) => {
            if (drawingActiveRef.current) e.preventDefault()
        }
        document.addEventListener('touchmove', prevent, { passive: false })
        document.addEventListener('touchstart', prevent, { passive: false })
        document.addEventListener('gesturestart', gestureStart)
        return () => {
            document.removeEventListener('touchmove', prevent)
            document.removeEventListener('touchstart', prevent)
            document.removeEventListener('gesturestart', gestureStart)
        }
    }, [])

    const toWorld = (e: React.PointerEvent): Point => {
        const rect = canvasRef.current!.getBoundingClientRect()
        const { x, y } = offsetRef.current
        const pressure = e.pressure > 0 ? e.pressure : 0.5
        return [e.clientX - rect.left - x, e.clientY - rect.top - y, pressure]
    }

    const onDown = (e: React.PointerEvent) => {
        try {
            canvasRef.current?.setPointerCapture(e.pointerId)
        } catch {
            /* noop */
        }
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

        if (pointersRef.current.size >= 2) {
            const c = centroid(pointersRef.current)
            panRef.current = { x: c.x, y: c.y, kind: 'touch' }
            drawingRef.current = null
            drawingActiveRef.current = false
            setPanning(true)
            return
        }
        if (e.button === 1) {
            e.preventDefault()
            panRef.current = { x: e.clientX, y: e.clientY, kind: 'middle' }
            drawingRef.current = null
            drawingActiveRef.current = false
            setPanning(true)
            return
        }
        if (e.button !== 0 && e.pointerType === 'mouse') return
        e.preventDefault()
        drawingActiveRef.current = true
        drawingRef.current = {
            points: [toWorld(e)],
            color: ink,
            size: mode === 'pen' ? PEN_SIZE : ERASER_SIZE,
            mode,
        }
        scheduleDraw()
    }

    const onMove = (e: React.PointerEvent) => {
        if (pointersRef.current.has(e.pointerId)) {
            pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        }

        const pan = panRef.current
        if (pan) {
            if (pan.kind === 'touch') {
                if (pointersRef.current.size < 2) {
                    panRef.current = null
                    setPanning(false)
                    return
                }
                const c = centroid(pointersRef.current)
                offsetRef.current.x += c.x - pan.x
                offsetRef.current.y += c.y - pan.y
                pan.x = c.x
                pan.y = c.y
            } else {
                offsetRef.current.x += e.clientX - pan.x
                offsetRef.current.y += e.clientY - pan.y
                pan.x = e.clientX
                pan.y = e.clientY
            }
            scheduleDraw()
            return
        }

        const cur = drawingRef.current
        if (!cur) return
        cur.points.push(toWorld(e))
        scheduleDraw()
    }

    const onUp = (e: React.PointerEvent) => {
        pointersRef.current.delete(e.pointerId)
        try {
            if (canvasRef.current?.hasPointerCapture(e.pointerId)) {
                canvasRef.current.releasePointerCapture(e.pointerId)
            }
        } catch {
            /* noop */
        }

        const pan = panRef.current
        if (pan) {
            if (pan.kind === 'touch' && pointersRef.current.size < 2) {
                panRef.current = null
                setPanning(false)
            } else if (pan.kind === 'middle' && e.button === 1) {
                panRef.current = null
                setPanning(false)
            }
            scheduleDraw()
            return
        }

        const done = drawingRef.current
        drawingRef.current = null
        drawingActiveRef.current = false
        if (done && done.points.length > 0) {
            const next = [...committedRef.current, done]
            committedRef.current = next
            setCommitted(next)
        }
    }

    const undo = () => {
        const next = committedRef.current.slice(0, -1)
        committedRef.current = next
        setCommitted(next)
    }
    const clear = () => {
        committedRef.current = []
        setCommitted([])
    }

    const cursorClass = panning
        ? 'cursor-grabbing'
        : mode === 'pen'
          ? 'cursor-crosshair'
          : 'cursor-cell'

    return (
        <div
            className={cn(
                'relative isolate h-full w-full overflow-hidden rounded-2xl bg-surface',
                className,
            )}
        >
            <canvas
                ref={canvasRef}
                className={cn('absolute inset-0 h-full w-full touch-none', cursorClass)}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
            />

            <div className='pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3'>
                <div className='pointer-events-auto flex items-center gap-0.5 rounded-full border border-border/40 bg-surface/70 p-1 backdrop-blur-md'>
                    <Tool active={mode === 'pen'} onPress={() => setMode('pen')} label='笔'>
                        <PencilLineIcon className='size-4' weight='fill' />
                    </Tool>
                    <Tool active={mode === 'eraser'} onPress={() => setMode('eraser')} label='橡皮'>
                        <EraserIcon className='size-4' weight='fill' />
                    </Tool>
                    <Tool active={false} onPress={undo} label='撤销' disabled={!hasInk}>
                        <ArrowUUpLeftIcon className='size-4' weight='bold' />
                    </Tool>
                    <Tool active={false} onPress={clear} label='清空' disabled={!hasInk}>
                        <TrashSimpleIcon className='size-4' weight='fill' />
                    </Tool>
                </div>
            </div>
        </div>
    )
}

function Tool({
    active,
    onPress,
    disabled,
    label,
    children,
}: {
    active: boolean
    onPress: () => void
    disabled?: boolean
    label: string
    children: React.ReactNode
}) {
    return (
        <Button
            variant={active ? 'secondary' : 'ghost'}
            isIconOnly
            isDisabled={disabled}
            onPress={onPress}
            aria-label={label}
            className='size-8 rounded-full'
        >
            {children}
        </Button>
    )
}

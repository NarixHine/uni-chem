'use client'

import cn from 'cnfast'
import { useEffect, useId, useRef, useState } from 'react'

export interface VisualizerProps {
    mol: CDContent
    id?: string
    width?: number
    height?: number
    className?: string
    canvasStyle?: Record<string, unknown>
    moleculeStyle?: Record<string, unknown>
    scriptSrc?: string
    bridgeSrc?: string
}

type ChemDoodleGlobal = typeof ChemDoodle
type ChemDoodleViewer = InstanceType<typeof ChemDoodle.ViewerCanvas>

const DEFAULT_SCRIPT_SRC = '/ChemDoodleWeb-11.0.0/ChemDoodleWeb.js'
const DEFAULT_BRIDGE_SRC = '/ChemDoodleWeb-11.0.0/chemdoodle-bridge.js'

/**
 * Shell layout shared by the canvas and its loading placeholder: a
 * full-bleed strip that extends past the prose gutters (negative margins
 * matched to the positive width calc), capped at 200px (`max-h-50`) tall.
 * Keeping the placeholder in sync with this prevents layout shift when the
 * client-only canvas mounts.
 */
export const VISUALIZER_SHELL_CLASS =
    'w-[calc(100%+2*clamp(1.25rem,calc(1.25rem+100vw-580px),4rem))] max-h-50 -mx-[clamp(1.25rem,calc(1.25rem+100vw-580px),4rem)]'

const chemPromises = new Map<string, Promise<ChemDoodleGlobal>>()

function getChemDoodle(): ChemDoodleGlobal | undefined {
    return (globalThis as unknown as { ChemDoodle?: ChemDoodleGlobal }).ChemDoodle
}

let probeEl: HTMLDivElement | null = null
function getProbe(): HTMLDivElement {
    if (!probeEl) {
        probeEl = document.createElement('div')
        probeEl.style.position = 'absolute'
        probeEl.style.visibility = 'hidden'
        probeEl.style.pointerEvents = 'none'
        document.documentElement.appendChild(probeEl)
    }
    return probeEl
}

/** Convert an oklch(L C H) string to an rgb() string canvas 2D can parse. */
function oklchToRgb(oklch: string): string | undefined {
    // L may be a percentage (0-100%) or a number (0-1). Normalize to 0-1.
    const m = oklch.match(/oklch\(\s*([\d.]+)(%)?\s+([\d.]+)(%)?\s+([\d.]+)deg?\s*\)/)
    if (!m) return undefined
    const L = parseFloat(m[1]) / (m[2] ? 100 : 1)
    const C = parseFloat(m[3]) / (m[4] ? 100 : 1)
    const H = parseFloat(m[5])
    const hRad = (H * Math.PI) / 180
    const a = C * Math.cos(hRad)
    const b = C * Math.sin(hRad)
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b
    const s_ = L - 0.0894841775 * a - 1.291485548 * b
    const lC = l_ ** 3
    const mC = m_ ** 3
    const sC = s_ ** 3
    const r = +4.0767416621 * lC - 3.3077115913 * mC + 0.2309699292 * sC
    const g = -1.2684380046 * lC + 2.6097574011 * mC - 0.3413193965 * sC
    const bl = -0.0041960863 * lC - 0.7034186147 * mC + 1.707614701 * sC
    const toSrgb = (x: number) =>
        x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
    const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(toSrgb(x) * 255)))
    return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(bl)})`
}

function readThemeColor(varName: string): string | undefined {
    if (typeof window === 'undefined') return undefined
    const probe = getProbe()
    probe.style.color = `var(${varName})`
    const resolved = getComputedStyle(probe).color
    if (!resolved) return undefined
    // Canvas 2D fillStyle can't parse oklch(); convert to rgb().
    if (resolved.startsWith('oklch')) return oklchToRgb(resolved) ?? undefined
    return resolved
}

/** Resolve a `var(--token)` color to an rgb() string canvas 2D can parse. */
function resolveCanvasColor(value: string | undefined): string | undefined {
    if (!value) return undefined
    const m = value.match(/^var\(\s*(--[\w-]+)\s*\)$/)
    if (m) return readThemeColor(m[1]) ?? value
    return value
}

/** Resolved theme colors; re-read whenever dark/light mode flips. */
function useThemeColors() {
    const [token, bump] = useState(0)
    useEffect(() => {
        const el = document.documentElement
        const observer = new MutationObserver(() => bump(t => t + 1))
        observer.observe(el, { attributes: true, attributeFilter: ['class', 'data-theme'] })
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => bump(t => t + 1)
        media.addEventListener('change', onChange)
        return () => {
            observer.disconnect()
            media.removeEventListener('change', onChange)
        }
    }, [])
    return {
        background: readThemeColor('--background'),
        foreground: readThemeColor('--foreground'),
        token,
    }
}

function ensureScript(src: string): HTMLScriptElement {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) return existing
    const el = document.createElement('script')
    el.src = src
    el.async = false
    document.head.appendChild(el)
    return el
}

function ensureChemDoodle(src: string, bridgeSrc: string): Promise<ChemDoodleGlobal> {
    const existing = getChemDoodle()
    if (existing) return Promise.resolve(existing)
    const cached = chemPromises.get(src)
    if (cached) return cached

    const promise = new Promise<ChemDoodleGlobal>((resolve, reject) => {
        let settled = false

        const finish = (chem: ChemDoodleGlobal | undefined, err?: Error) => {
            if (settled) return
            settled = true
            clearInterval(pollHandle)
            if (chem) resolve(chem)
            else reject(err ?? new Error('ChemDoodle failed to load'))
        }

        const cwcScript = ensureScript(src)
        ensureScript(bridgeSrc)

        cwcScript.addEventListener('error', () => {
            finish(undefined, new Error(`Failed to load script from ${src}`))
        })

        const start = Date.now()
        const pollHandle = setInterval(() => {
            const chem = getChemDoodle()
            if (chem) {
                finish(chem)
                return
            }
            if (Date.now() - start > 15_000) {
                finish(undefined, new Error(`ChemDoodle not available after 15s (src=${src})`))
            }
        }, 100)
    })
    chemPromises.set(src, promise)
    return promise
}

function toIndexContent(content: CDContent): Record<string, unknown> {
    const m = content.m?.map(molecule => {
        const idToIndex = new Map<string, number>()
        molecule.a.forEach((atom, index) => {
            if (atom.i !== undefined) idToIndex.set(atom.i, index)
        })
        const resolve = (ref: number | string): number =>
            typeof ref === 'number' ? ref : (idToIndex.get(ref) ?? 0)
        const b = molecule.b?.map(bond => ({
            ...bond,
            b: resolve(bond.b),
            e: resolve(bond.e),
        }))
        return { ...molecule, b }
    })
    return { m, s: content.s }
}

export default function Visualizer({
    mol,
    id,
    width = 200,
    height = 200,
    className,
    canvasStyle,
    moleculeStyle,
    scriptSrc = DEFAULT_SCRIPT_SRC,
    bridgeSrc = DEFAULT_BRIDGE_SRC,
}: VisualizerProps) {
    const autoId = useId()
    const canvasId = id ?? `cd-${autoId.replace(/[:]/g, '')}`
    const canvasRef = useRef<ChemDoodleViewer | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ width, height })
    const theme = useThemeColors()

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const update = () => {
            const rect = el.getBoundingClientRect()
            setSize({
                width: Math.max(1, Math.floor(rect.width)),
                height: Math.max(1, Math.floor(rect.height || height)),
            })
        }

        update()

        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [height])

    useEffect(() => {
        let cancelled = false

        ensureChemDoodle(scriptSrc, bridgeSrc)
            .then(chem => {
                if (cancelled) return

                const canvas = new chem.ViewerCanvas(canvasId, size.width, size.height)

                const themeDefaults: Record<string, unknown> = {}
                if (theme.background) themeDefaults.backgroundColor = theme.background
                if (theme.foreground) {
                    themeDefaults.atoms_color = theme.foreground
                    themeDefaults.atoms_HBlack_2D = false
                    themeDefaults.bonds_color = theme.foreground
                    themeDefaults.shapes_color = theme.foreground
                    themeDefaults.text_color = theme.foreground
                }

                canvas.styles = { ...canvas.styles, ...themeDefaults, ...canvasStyle }

                const indexed = toIndexContent(mol)
                const { molecules, shapes } = new chem.io.JSONInterpreter().contentFrom(indexed)

                if (mol.m) {
                    for (let i = 0; i < mol.m.length && i < molecules.length; i++) {
                        const src = mol.m[i]
                        const target = molecules[i] as {
                            atoms: Array<{ styles?: Record<string, unknown> }>
                            bonds: Array<{ styles?: Record<string, unknown> }>
                        }

                        for (let j = 0; j < src.a.length && j < target.atoms.length; j++) {
                            const clr = src.a[j].clr
                            if (clr) {
                                target.atoms[j].styles = Object.assign(
                                    new (chem.structures.Styles as new () => Record<
                                        string,
                                        unknown
                                    >)(),
                                    { atoms_color: resolveCanvasColor(clr) },
                                )
                            }
                        }
                        if (src.b && target.bonds) {
                            for (let j = 0; j < src.b.length && j < target.bonds.length; j++) {
                                const clr = src.b[j].clr
                                if (clr) {
                                    target.bonds[j].styles = Object.assign(
                                        new (chem.structures.Styles as new () => Record<
                                            string,
                                            unknown
                                        >)(),
                                        { bonds_color: resolveCanvasColor(clr) },
                                    )
                                }
                            }
                        }
                    }
                }

                if (molecules.length > 0 || shapes.length > 0) {
                    if (moleculeStyle) {
                        for (const molecule of molecules) {
                            const stylable = molecule as unknown as Record<
                                string,
                                ((value: unknown) => void) | undefined
                            >
                            for (const key in moleculeStyle) {
                                stylable[key]?.(moleculeStyle[key])
                            }
                        }
                    }
                    canvas.loadContent(molecules, shapes)
                    canvas.repaint()
                }

                canvasRef.current = canvas
            })
            .catch((err: unknown) => {
                if (!cancelled) console.error('[Visualizer] error:', err)
            })

        return () => {
            cancelled = true
            try {
                canvasRef.current?.clearCanvas()
            } catch {
                // canvas may already be gone
            }
            canvasRef.current = null
        }
    }, [
        canvasId,
        size.width,
        size.height,
        canvasStyle,
        mol,
        moleculeStyle,
        scriptSrc,
        bridgeSrc,
        theme.background,
        theme.foreground,
        theme.token,
    ])

    return (
        <div ref={containerRef} className={cn(VISUALIZER_SHELL_CLASS, className)}>
            <canvas
                id={canvasId}
                width={size.width}
                height={size.height}
                className='block h-full w-full'
            />
        </div>
    )
}

'use client'

import 'katex/dist/katex.min.css'
import PinchZoom, { make2dTransformValue } from 'react-quick-pinch-zoom'
import type { UpdateAction } from 'react-quick-pinch-zoom'
import cn from 'cnfast'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PinchAffordance } from './pinch-affordance'

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
    /**
     * Padding (CSS px) between the structure bounding box and the canvas edge.
     * Defaults to a safe margin (40px) so arrow notation labels/arrowheads that
     * fall outside `getContentBounds` don't clip. Pass a smaller value for
     * contexts that only render bare molecules, e.g. quiz options.
     */
    fitPadding?: number
    /**
     * When `true` (default), the structure is uniformly scaled to fit the
     * canvas (up- and down-scaling, capped at `MAX_FIT_SCALE`). Set to `false`
     * to render at the molecule's native scale — useful in quiz options where
     * a consistent atom/bond size matters more than fitting the viewport.
     */
    autoFit?: boolean
}

type ChemDoodleGlobal = typeof ChemDoodle
interface ChemDoodleViewer {
    width: number
    height: number
    pixelRatio: number
    styles: Record<string, unknown> & { scale: number }
    molecules: unknown[]
    shapes: unknown[]
    getContentBounds(): { minX: number; minY: number; maxX: number; maxY: number }
    loadContent(molecules: unknown[], shapes: unknown[]): void
    resize(width: number, height: number): void
    repaint(): void
    clearCanvas(): void
}

export const DEFAULT_SCRIPT_SRC = '/ChemDoodleWeb-11.0.0/ChemDoodleWeb.js'
const DEFAULT_BRIDGE_SRC = '/ChemDoodleWeb-11.0.0/chemdoodle-bridge.js'

/**
 * Font family used by ChemDoodle for atom labels and text shapes. KaTeX_Main
 * is declared by `katex.min.css` (imported above) and ships a serif math-style
 * face that pairs well with chemistry notation.
 */
const CANVAS_FONT_FAMILIES = ['KaTeX_Main']

/**
 * Minimum backing-store pixel ratio. ChemDoodle already multiplies the canvas
 * backing store by `devicePixelRatio`, but on low-DPI screens that is 1, which
 * leaves the serif KaTeX_Main glyphs looking soft. Force at least 2x sampling
 * so strokes and text stay crisp.
 */
const MIN_PIXEL_RATIO = 2

/**
 * Cap on the uniform fit scale. Without it a single tiny atom would be blown
 * up to fill the viewport; 1.5x keeps simple molecules readable without
 * distorting atom/bond proportions.
 */
const MAX_FIT_SCALE = 1.5

/**
 * Padding (CSS px) between the structure bounding box and the canvas edge.
 * ChemDoodle's `getContentBounds` only accounts for shape control points, not
 * visual extents like arrowheads or text labels on reaction arrows, so a
 * generous default margin keeps those from clipping at the viewport edge.
 */
const DEFAULT_FIT_PADDING = 30

/** Safety timeout for the ChemDoodle script to load before rejecting. */
const SCRIPT_LOAD_TIMEOUT = 10_000

/**
 * Shell layout shared by the canvas and its loading placeholder: a full-width
 * strip capped at 200px (`max-h-50`) tall. Keeping the placeholder in sync
 * with this prevents layout shift when the client-only canvas mounts.
 */
export const VISUALIZER_SHELL_CLASS = 'w-full max-h-50'

/**
 * Compute a uniform scale that fits the canvas content (atoms, bonds, shapes,
 * including atom label text bounds) inside the viewport with `FIT_PADDING`
 * margin on each side. Unlike ChemDoodle's `center()` this scales UP small
 * structures too, capped at `MAX_FIT_SCALE`. Returns `undefined` when the
 * content has no extent (degenerate/empty).
 */
function computeFitScale(
    canvasWidth: number,
    canvasHeight: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    padding: number,
): number | undefined {
    const cw = bounds.maxX - bounds.minX
    const ch = bounds.maxY - bounds.minY
    if (cw <= 0 && ch <= 0) return undefined
    const availW = canvasWidth - 2 * padding
    const availH = canvasHeight - 2 * padding
    let s: number
    if (cw > 0 && ch > 0) s = Math.min(availW / cw, availH / ch)
    else if (cw > 0) s = availW / cw
    else s = availH / ch
    return Math.min(s, MAX_FIT_SCALE)
}

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

/**
 * Load the ChemDoodle library exactly once per `src`. The main script declares
 * a top-level `let ChemDoodle` (not on `window`); the tiny bridge script
 * assigns it to `window.ChemDoodle`. Both load with `async=false`, so they
 * execute in order — when the bridge script's `load` event fires the global
 * is guaranteed to be set. Listening to that event avoids polling entirely.
 */
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
            clearTimeout(timer)
            if (chem) resolve(chem)
            else reject(err ?? new Error('ChemDoodle failed to load'))
        }

        const cwcScript = ensureScript(src)
        const bridgeScript = ensureScript(bridgeSrc)

        // Already loaded (e.g. served from preload cache and executed)?
        const chem = getChemDoodle()
        if (chem) {
            finish(chem)
            return
        }

        cwcScript.addEventListener('error', () =>
            finish(undefined, new Error(`Failed to load script from ${src}`)),
        )
        bridgeScript.addEventListener('error', () =>
            finish(undefined, new Error(`Failed to load bridge from ${bridgeSrc}`)),
        )
        // Bridge runs last (ordered), so its `load` => global is ready.
        bridgeScript.addEventListener('load', () => finish(getChemDoodle()))

        const timer = setTimeout(
            () =>
                finish(
                    undefined,
                    new Error(`ChemDoodle not available after ${SCRIPT_LOAD_TIMEOUT}ms`),
                ),
            SCRIPT_LOAD_TIMEOUT,
        )
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

/** Apply the fit scale (up- and down-scaling) to a ready canvas. */
function refit(canvas: ChemDoodleViewer, padding: number) {
    const scale = computeFitScale(canvas.width, canvas.height, canvas.getContentBounds(), padding)
    if (scale !== undefined) canvas.styles.scale = scale
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
    fitPadding = DEFAULT_FIT_PADDING,
    autoFit = true,
}: VisualizerProps) {
    const autoId = useId()
    const canvasId = id ?? `cd-${autoId.replace(/[:]/g, '')}`
    const canvasRef = useRef<ChemDoodleViewer | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ width, height })
    const theme = useThemeColors()

    // `mol` arrives as a fresh object each render (re-parsed from markdown), so
    // identity comparison would rebuild the canvas on every parent render.
    // Serialise → re-parse into a stable reference keyed on content, so the
    // load effect only re-runs when the structure genuinely changes.
    const molKey = JSON.stringify(mol)
    const stableMol = useMemo(() => JSON.parse(molKey) as CDContent, [molKey])

    // Measure the container; track width so viewport shrink/grow resizes the
    // canvas, and height so parent `[&_canvas]` overrides (e.g. quiz `h-32`)
    // are honoured.
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

    // Resize an existing canvas when the viewport/container dimensions change.
    // Uses `useLayoutEffect` so the canvas is re-rendered before the browser
    // paints the cleared backing store (no flash). Cheap: just recenter + refit
    // + repaint, no JSON re-parse, no canvas recreation.
    useLayoutEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.resize(size.width, size.height)
        if (autoFit) refit(canvas, fitPadding)
        canvas.repaint()
    }, [size.width, size.height, fitPadding, autoFit])

    // Build the canvas + load content once per molecule/theme/style. Does NOT
    // depend on `size` (read via `sizeRef`), so viewport changes are handled by
    // the cheap resize effect above instead of rebuilding here.
    useEffect(() => {
        let cancelled = false

        ensureChemDoodle(scriptSrc, bridgeSrc)
            .then(chem => {
                if (cancelled) return

                // Read live container dimensions at resolution time so a viewport
                // change during script loading isn't lost (the effect closure
                // doesn't depend on `size`).
                const rect = containerRef.current?.getBoundingClientRect()
                const w = rect && rect.width > 0 ? Math.floor(rect.width) : width
                const h = rect && rect.height > 0 ? Math.floor(rect.height) : height
                const canvas = new chem.ViewerCanvas(canvasId, w, h) as unknown as ChemDoodleViewer
                // Boost backing-store resolution on low-DPI screens so the serif
                // atom labels stay crisp. Must be set before the first repaint
                // (which happens inside loadContent) so the pixelRatio block in
                // repaint() resizes the backing store once.
                canvas.pixelRatio = Math.max(window.devicePixelRatio || 1, MIN_PIXEL_RATIO)

                const themeDefaults: Record<string, unknown> = {
                    atoms_font_families_2D: CANVAS_FONT_FAMILIES,
                    text_font_families: CANVAS_FONT_FAMILIES,
                }
                if (theme.background) themeDefaults.backgroundColor = theme.background
                if (theme.foreground) {
                    themeDefaults.atoms_color = theme.foreground
                    themeDefaults.atoms_HBlack_2D = false
                    themeDefaults.bonds_color = theme.foreground
                    themeDefaults.shapes_color = theme.foreground
                    themeDefaults.text_color = theme.foreground
                }

                canvas.styles = { ...canvas.styles, ...themeDefaults, ...canvasStyle }

                const indexed = toIndexContent(stableMol)
                const { molecules, shapes } = new chem.io.JSONInterpreter().contentFrom(indexed)

                if (stableMol.m) {
                    for (let i = 0; i < stableMol.m.length && i < molecules.length; i++) {
                        const src = stableMol.m[i]
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
                                    {
                                        atoms_color: resolveCanvasColor(clr),
                                        atoms_font_families_2D: CANVAS_FONT_FAMILIES,
                                    },
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
                                        {
                                            bonds_color: resolveCanvasColor(clr),
                                            atoms_font_families_2D: CANVAS_FONT_FAMILIES,
                                        },
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
                    if (autoFit) refit(canvas, fitPadding)
                    // Paint immediately so content is visible ASAP, even if the
                    // web font hasn't finished loading (brief fallback font).
                    canvas.repaint()
                    canvasRef.current = canvas
                    // Canvas 2D only resolves web fonts once they're loaded;
                    // repaint again when KaTeX_Main is ready so labels switch to
                    // the correct serif face.
                    if ('fonts' in document) {
                        document.fonts.load(`12px ${CANVAS_FONT_FAMILIES.join(',')}`).then(() => {
                            if (!cancelled) canvas.repaint()
                        })
                    }
                } else {
                    canvasRef.current = canvas
                }
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
        stableMol,
        canvasStyle,
        moleculeStyle,
        scriptSrc,
        bridgeSrc,
        fitPadding,
        autoFit,
        width,
        height,
        theme.background,
        theme.foreground,
        theme.token,
    ])
    const zoomChildRef = useRef<HTMLDivElement>(null)

    const handleZoomUpdate = useCallback(({ x, y, scale }: UpdateAction) => {
        const el = zoomChildRef.current
        if (el) el.style.transform = make2dTransformValue({ x, y, scale })
    }, [])

    return (
        <div ref={containerRef} className={cn(VISUALIZER_SHELL_CLASS, className, 'relative')}>
            <PinchAffordance />
            <PinchZoom
                onUpdate={handleZoomUpdate}
                maxZoom={5}
                minZoom={0.8}
                doubleTapToggleZoom
                tapZoomFactor={2}
                containerProps={{ className: 'w-full h-full touch-pinch-zoom cursor-zoom-in' }}
            >
                <div ref={zoomChildRef} className='w-full h-full'>
                    <canvas
                        id={canvasId}
                        width={size.width}
                        height={size.height}
                        className='block h-full w-full'
                    />
                </div>
            </PinchZoom>
        </div>
    )
}

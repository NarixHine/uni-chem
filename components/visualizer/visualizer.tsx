'use client'

import { useEffect, useId, useRef, type CSSProperties } from 'react'

export interface VisualizerProps {
    mol: CDContent
    id?: string
    width?: number
    height?: number
    style?: CSSProperties
    canvasStyle?: Record<string, unknown>
    moleculeStyle?: Record<string, unknown>
    scriptSrc?: string
    bridgeSrc?: string
}

type ChemDoodleGlobal = typeof ChemDoodle
type ChemDoodleViewer = InstanceType<typeof ChemDoodle.ViewerCanvas>

const DEFAULT_SCRIPT_SRC = '/ChemDoodleWeb-11.0.0/ChemDoodleWeb.js'
const DEFAULT_BRIDGE_SRC = '/ChemDoodleWeb-11.0.0/chemdoodle-bridge.js'

const chemPromises = new Map<string, Promise<ChemDoodleGlobal>>()

function getChemDoodle(): ChemDoodleGlobal | undefined {
    return (globalThis as unknown as { ChemDoodle?: ChemDoodleGlobal }).ChemDoodle
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
    width = 300,
    height = 300,
    style,
    canvasStyle,
    moleculeStyle,
    scriptSrc = DEFAULT_SCRIPT_SRC,
    bridgeSrc = DEFAULT_BRIDGE_SRC,
}: VisualizerProps) {
    const autoId = useId()
    const canvasId = id ?? `cd-${autoId.replace(/[:]/g, '')}`
    const canvasRef = useRef<ChemDoodleViewer | null>(null)

    useEffect(() => {
        let cancelled = false

        ensureChemDoodle(scriptSrc, bridgeSrc)
            .then(chem => {
                if (cancelled) return

                const canvas = new chem.ViewerCanvas(canvasId, width, height)

                if (canvasStyle) {
                    canvas.styles = { ...canvas.styles, ...canvasStyle }
                }

        const indexed = toIndexContent(mol)
        const { molecules, shapes } = new chem.io.JSONInterpreter().contentFrom(indexed)

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
    }, [canvasId, width, height, canvasStyle, mol, moleculeStyle, scriptSrc, bridgeSrc])

    return <canvas id={canvasId} width={width} height={height} style={style} />
}

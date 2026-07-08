export {}

declare global {
  const ChemDoodle: {
    getVersion(): string

    ViewerCanvas: new (
      id: string,
      width?: number,
      height?: number
    ) => {
      styles: Record<string, unknown>
      molecules: unknown[]
      shapes: unknown[]
      loadMolecule(mol: unknown): void
      loadContent(mols: unknown[], shapes: unknown[]): void
      clearCanvas(): void
      getMolecule(): unknown
      getMolecules(): unknown[]
      getShapes(): unknown[]
      repaint(): void
    }

    io: {
      JSONInterpreter: new () => {
        molTo(mol: unknown): Record<string, unknown>
        molFrom(json: Record<string, unknown>): unknown
        contentTo(
          molecules: unknown[],
          shapes: unknown[]
        ): Record<string, unknown>
        contentFrom(
          json: Record<string, unknown>
        ): { molecules: unknown[]; shapes: unknown[] }
      }
    }

    structures: {
      Styles: new () => Record<string, unknown>
    }

    readMOL(molString: string): unknown
  }

  interface CDQueryClause {
    v: number | number[] | string | string[]
    n?: boolean
  }

  interface CDQuery {
    as?: CDQueryClause
    bs?: CDQueryClause
    A?: CDQueryClause
    C?: CDQueryClause
    H?: CDQueryClause
    R?: CDQueryClause
    S?: CDQueryClause
    X?: CDQueryClause
    x?: CDQueryClause
    '@'?: CDQueryClause
  }

  interface CDAtom {
    x: number
    y: number
    z?: number
    i?: string
    l?: string
    c?: number
    m?: number
    h?: number
    r?: number
    p?: number
    s2?: { t: number; g?: number }
    q?: CDQuery
    p_h?: boolean | number
    p_w?: boolean | number
    p_d?: number
    clr?: string
    styles?: Record<string, unknown>
  }

  interface CDBond {
    b: number | string
    e: number | string
    i?: string
    o?: number
    s?: number
    q?: CDQuery
    clr?: string
    styles?: Record<string, unknown>
  }

  interface CDMolecule {
    i?: string
    a: CDAtom[]
    b?: CDBond[]
  }

  interface CDShapeBase {
    i?: string
  }

  type CDShape =
    | CDShapeBase & { t: 'Line'; x1: number; y1: number; x2: number; y2: number; a?: number | string; rs?: string[]; ps?: string[] }
    | CDShapeBase & { t: 'Pusher'; o1: string; o2: string; e?: number }
    | CDShapeBase & { t: 'AtomMapping'; a1: string; a2: string; n?: string }
    | CDShapeBase & { t: 'Bracket'; x1: number; y1: number; x2: number; y2: number; c?: number; m?: number; r?: number }
    | CDShapeBase & { t: 'RepeatUnit'; b1: string; b2: string; n1: string | number; n2: string | number; f?: boolean }
    | CDShapeBase & { t: 'VAP'; x: number; y: number; o?: number; s?: string; a: string[] }
    | CDShapeBase & { t: 'Distance'; a1: string; a2: string; n?: string; o?: number }
    | CDShapeBase & { t: 'Angle'; a1: string; a2: string; a3: string }
    | CDShapeBase & { t: 'Torsion'; a1: string; a2: string; a3: string; a4: string }
    | CDShapeBase & { t: 'Surface'; a: string[]; p?: number; r: number; f: 'vdw' | 'sas' | 'ses' }
    | CDShapeBase & { t: 'UnitCell'; ls: number[]; as: number[]; os: number[] }

  interface CDContent {
    m?: CDMolecule[]
    s?: CDShape[]
  }
}

declare module 'react-chemdoodle' {
  import type { CSSProperties, FC, MemoExoticComponent } from 'react'

  export interface ViewerCanvasProps {
    id: string
    data: { mol: string }
    style?: CSSProperties
    width?: number
    height?: number
    canvasStyle?: Record<string, unknown>
    moleculeStyle?: Record<string, unknown>
  }

  export const ViewerCanvas: FC<ViewerCanvasProps>

  export interface SketcherCanvasOptions {
    isMobile?: boolean
    useServices?: boolean
    oneMolecule?: boolean
    requireStartingAtom?: boolean
    includeToolbar?: boolean
    floatDrawTools?: boolean
    resizable?: boolean
    includeQuery?: boolean
  }

  export interface SketcherCanvasProps {
    id: string
    width?: number
    height?: number
    canvasOptions?: SketcherCanvasOptions
  }

  export const SketcherCanvas: MemoExoticComponent<FC<SketcherCanvasProps>>
}

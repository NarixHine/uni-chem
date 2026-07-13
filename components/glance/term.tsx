'use client'

import cn from 'cnfast'
import { InlineMath } from '../markdown/math'

export type GlanceTermProps = {
    /** Raw term exactly as stored in the glossary. */
    term: string
    className?: string
}

const MATH_DELIMITER = '$'

/**
 * Renders the trigger text for a Glance. Terms may contain inline KaTeX
 * (e.g. `$α\\text{-H}$`); this splits on `$` pairs and renders math spans via
 * `<InlineMath>` so the trigger visually matches the surrounding article text.
 *
 * The trigger is a bare inline `<span>` (no Glance overlay here) — the parent
 * Glance component wraps it with Tooltip/Popover. We expose this as a separate
 * module because the inner-text is needed both as the visible trigger and as
 * the key used to look up the glossary definition.
 */
export function GlanceTerm({ term, className }: GlanceTermProps) {
    const parts = term.split(MATH_DELIMITER)
    return (
        <span className={cn(className, '[text-decoration:inherit]')}>
            {parts.map((part, i) => (i % 2 === 1 ? <InlineMath key={i} expr={part} /> : part))}
        </span>
    )
}

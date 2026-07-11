'use client'

import { useEffect, useState } from 'react'

/**
 * Returns `true` when the current primary pointer supports hover (mouse) and
 * `false` for touch/pen inputs. SSR-safe (defaults to `false` on the server).
 *
 * Drives the Tooltip-vs-Popover split in `Glance`: hovering clients get a
 * lightweight tooltip; touch devices get a tappable popover.
 */
export function useHoverCapable(): boolean {
    const [hoverable, setHoverable] = useState(false)

    useEffect(() => {
        const mql = window.matchMedia('(hover: hover) and (pointer: fine)')
        const update = () => setHoverable(mql.matches)
        update()
        mql.addEventListener('change', update)
        return () => mql.removeEventListener('change', update)
    }, [])

    return hoverable
}

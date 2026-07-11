'use client'

import type { DetailedHTMLProps, HTMLAttributes } from 'react'
import { Popover, Tooltip } from '@heroui/react'
import cn from 'cnfast'
import { findGlossaryEntry } from '@/lib/glossary'
import { FlavoredMarkdown } from '../markdown/flavor'
import { GlanceTerm } from './term'
import { useHoverCapable } from './use-hover-capable'

type SpanProps = DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>

const spanRender = (props: SpanProps) => <span {...props} />

export interface GlanceProps {
    /** URL-encoded JSON string containing the glossary term to look up. */
    data: string
    className?: string
}

const TRIGGER_CLASS =
    'underline decoration-dashed decoration-from-font underline-offset-4 cursor-help text-inherit'

/**
 * Glance — a peek at the definition of a nomenclature term found in article
 * Markdown. The trigger renders the term verbatim (including any KaTeX) with a
 * dashed underline; the overlay renders the entry's definition as flavored
 * Markdown.
 *
 * Rendering strategy is environment-aware:
 *   - hover-capable pointers (mouse) → HeroUI `Tooltip` (hover/focus)
 *   - touch/pen pointers              → HeroUI `Popover` (tap)
 *
 * Triggers render as `<span>` (not the default `<div>`) so they stay valid
 * inside block elements like `<p>`.
 */
export function Glance({ data, className }: GlanceProps) {
    const hoverable = useHoverCapable()

    let term = ''
    try {
        term = JSON.parse(decodeURIComponent(data))
    } catch {
        return null
    }

    const entry = findGlossaryEntry(term)
    if (!entry) {
        return <GlanceTerm term={term} className={className} />
    }

    if (hoverable) {
        return (
            <Tooltip delay={0}>
                <Tooltip.Trigger render={spanRender} className={cn(TRIGGER_CLASS, className)}>
                    <GlanceTerm term={term} />
                </Tooltip.Trigger>
                <Tooltip.Content className={'px-5 py-1 shadow-sm'}>
                        <FlavoredMarkdown>{entry.definition}</FlavoredMarkdown>
                </Tooltip.Content>
            </Tooltip>
        )
    }

    return (
        <Popover>
            <Popover.Trigger render={spanRender} className={cn(TRIGGER_CLASS, className)}>
                <GlanceTerm term={term} />
            </Popover.Trigger>
            <Popover.Content className='max-w-xs'>
                <Popover.Dialog>
                    <Popover.Arrow />
                    <div className='px-5'>
                        <FlavoredMarkdown>{entry.definition}</FlavoredMarkdown>
                    </div>
                </Popover.Dialog>
            </Popover.Content>
        </Popover>
    )
}

'use client'

import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import Visualizer from '@/components/visualizer'

// Renders a `chemdoodle` block node as the real <Visualizer> canvas. The node
// is an atom (read-only) — users delete or replace it, never edit the JSON
// inline. Malformed JSON degrades to a quiet empty canvas rather than throwing.

export function ChemdoodleView({ node }: ReactNodeViewProps) {
    const raw = (node.attrs.json as string | undefined) ?? ''
    let mol: CDContent | null = null
    try {
        mol = raw.trim() ? (JSON.parse(raw) as CDContent) : null
    } catch {
        mol = null
    }

    return (
        <NodeViewWrapper as='div' className='my-6 not-prose'>
            <Visualizer mol={mol ?? {}} canvasStyle={{ backgroundColor: 'transparent' }} />
        </NodeViewWrapper>
    )
}


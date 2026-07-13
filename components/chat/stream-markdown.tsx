'use client'

import { useMemo } from 'react'
import { Markdown } from '@/components/markdown'
import { repairStreamingMarkdown } from '@/lib/chat/stream-repair'

/**
 * Renders assistant text that may still be streaming.
 *
 * The flavored-Markdown `Visualizer` fence (`:::json\n{ … }\n:::`) is only
 * recognized once its closing `:::` arrives. While the model is mid-stream,
 * that fence is unclosed and its inner JSON is incomplete, so neither the
 * fence nor its molecule would preview. We run the raw text through
 * `repairStreamingMarkdown`, which completes the trailing JSON structurally
 * and synthesizes the closing `:::` — yielding a live `<Visualizer>` that
 * grows as tokens arrive, without ever throwing on a half-written value.
 */
export function StreamMarkdown({ text, className }: { text: string; className?: string }) {
    const source = useMemo(() => repairStreamingMarkdown(text), [text])
    return <Markdown className={className}>{source}</Markdown>
}

'use client'

import { Disclosure } from '@heroui/react'
import type { UIMessage } from 'ai'
import { motion } from 'motion/react'
import cn from 'cnfast'
import { StreamMarkdown } from './stream-markdown'

/** Concatenate every `reasoning` part of a message into one string. */
function reasoningText(message: UIMessage): string {
    return message.parts
        .filter((p): p is Extract<typeof p, { type: 'reasoning' }> => p.type === 'reasoning')
        .map(p => p.text)
        .join('')
}

/** True if any reasoning part is still streaming. */
export function isReasoningStreaming(message: UIMessage): boolean {
    return message.parts.some(p => p.type === 'reasoning' && p.state === 'streaming')
}

export interface ReasoningProps {
    message: UIMessage
    className?: string
}

const WAVE_ANIMATE = { opacity: [0.35, 1, 0.35] }
const WAVE_TRANSITION = { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }

/**
 * Minimalist, collapsible reasoning surface. A quiet, muted block rendered
 * above the assistant's answer — expanded by default while the model thinks,
 * collapsible to a single labelled line once it's done. While thinking, a
 * soft brightness wave travels left-to-right through the dot, the label and
 * the chevron.
 */
export function Reasoning({ message, className }: ReasoningProps) {
    const text = reasoningText(message)
    if (!text) return null
    const streaming = isReasoningStreaming(message)

    return (
        <Disclosure className={cn(className)}>
            <Disclosure.Heading>
                <Disclosure.Trigger className='inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:text-foreground'>
                    <motion.span
                        aria-hidden
                        className='size-1.5 rounded-full bg-current'
                        animate={streaming ? WAVE_ANIMATE : undefined}
                        transition={streaming ? { ...WAVE_TRANSITION, delay: 0 } : undefined}
                    />
                    <motion.span
                        animate={streaming ? WAVE_ANIMATE : undefined}
                        transition={streaming ? { ...WAVE_TRANSITION, delay: 0.18 } : undefined}
                    >
                        {streaming ? 'Thinking' : 'Thoughts'}
                    </motion.span>
                    <motion.span
                        animate={streaming ? WAVE_ANIMATE : undefined}
                        transition={streaming ? { ...WAVE_TRANSITION, delay: 0.36 } : undefined}
                    >
                        <Disclosure.Indicator />
                    </motion.span>
                </Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content>
                <Disclosure.Body className='mt-1 border-l-2 border-border pl-3'>
                    <StreamMarkdown text={text} className='prose-sm text-muted' />
                </Disclosure.Body>
            </Disclosure.Content>
        </Disclosure>
    )
}

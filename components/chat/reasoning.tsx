'use client'

import { Disclosure } from '@heroui/react'
import type { UIMessage } from 'ai'
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
function isReasoningStreaming(message: UIMessage): boolean {
    return message.parts.some(p => p.type === 'reasoning' && p.state === 'streaming')
}

export interface ReasoningProps {
    message: UIMessage
    className?: string
}

/**
 * Minimalist, collapsible reasoning surface. A quiet, muted block rendered
 * above the assistant's answer — expanded by default while the model thinks,
 * collapsible to a single labelled line once it's done.
 */
export function Reasoning({ message, className }: ReasoningProps) {
    const text = reasoningText(message)
    if (!text) return null
    const streaming = isReasoningStreaming(message)

    return (
        <Disclosure className={cn(className)}>
            <Disclosure.Heading>
                <Disclosure.Trigger className='inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:text-foreground'>
                    <span
                        aria-hidden
                        className={cn(
                            'size-1.5 rounded-full bg-current',
                            streaming && 'animate-pulse',
                        )}
                    />
                    {streaming ? 'Thinking' : 'Thoughts'}
                    <Disclosure.Indicator />
                </Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content>
                <Disclosure.Body className='mt-1 border-l-2 border-border pl-3'>
                    <StreamMarkdown
                        text={text}
                        className='prose-sm text-muted'
                    />
                </Disclosure.Body>
            </Disclosure.Content>
        </Disclosure>
    )
}

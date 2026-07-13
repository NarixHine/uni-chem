'use client'

import type { UIMessage } from 'ai'
import { motion } from 'motion/react'
import { Spinner } from '@heroui/react'
import { StreamMarkdown } from './stream-markdown'
import { Reasoning } from './reasoning'
import { MessageImages, imageFileParts } from './attachments'

export interface ChatMessageProps {
    message: UIMessage
    /** True while this assistant message is actively streaming. */
    streaming?: boolean
}

/** Concatenate every text part of a message into one string. */
function textOf(message: UIMessage): string {
    return message.parts
        .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
        .map(p => p.text)
        .join('')
}

/** Concatenate every reasoning part of a message into one string. */
function reasoningText(message: UIMessage): string {
    return message.parts
        .filter((p): p is Extract<typeof p, { type: 'reasoning' }> => p.type === 'reasoning')
        .map(p => p.text)
        .join('')
}

export function ChatMessage({ message, streaming }: ChatMessageProps) {
    const images = imageFileParts(message)
    const text = textOf(message)

    if (message.role === 'user') {
        return (
            <div className='flex justify-end'>
                <div className='flex flex-col w-full items-end gap-2'>
                    {images.length > 0 && <MessageImages parts={images} />}
                    {text && (
                        <motion.p
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                            className='max-w-[80%] whitespace-pre-wrap rounded-field bg-default px-3.5 py-2 text-sm text-default-foreground shadow-surface'
                        >
                            {text}
                        </motion.p>
                    )}
                </div>
            </div>
        )
    }

    // The assistant has connected but no text or reasoning has arrived yet —
    // show a quiet typing indicator instead of an empty, centered prose block.
    if (streaming && text.length === 0 && images.length === 0 && reasoningText(message) === '') {
        return (
            <div className='flex justify-center py-2'>
                <Spinner size='sm' />
            </div>
        )
    }

    return (
        <div className='mx-auto w-full max-w-2xl'>
            {images.length > 0 && (
                <div className='mb-3 flex justify-center'>
                    <MessageImages parts={images} />
                </div>
            )}
            <Reasoning message={message} className='mb-4' />
            <StreamMarkdown text={text} />
            {streaming && (
                <span
                    aria-hidden
                    className='ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-foreground/60'
                />
            )}
        </div>
    )
}

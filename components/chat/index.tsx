'use client'

import { ViewTransition } from 'react'
import { ChatProvider } from './chat-provider'
import { MessageList } from './message-list'
import { Composer } from './composer'

export interface ChatProps {
    id: string
    /** Opening prompt to fire once, after mount. */
    initialPrompt?: string
}

/**
 * Self-contained AI conversation surface.
 *
 * - Assistant output is rendered centered, bubble-free, via `<Markdown>` so
 *   flavored blocks (math, Visualizer, Quiz) work mid-stream.
 * - The user's own messages are pushed right inside a subtle bubble.
 * - The composer is sticky within the content column and carries the
 *   `engage-composer` view-transition name so it morphs from the hub.
 */
export function Chat({ id, initialPrompt }: ChatProps) {
    return (
        <ChatProvider id={id} initialPrompt={initialPrompt}>
            <ViewTransition enter='content-enter' default='none'>
                <div className='flex min-h-dvh flex-col pt-8'>
                    <div className='flex flex-1 flex-col gap-12 pb-48'>
                        <MessageList />
                    </div>
                    <div className='pointer-events-none sticky bottom-24 z-40 flex justify-center px-1 pb-2'>
                        <ViewTransition name='engage-composer' share='morph' default='none'>
                            <Composer />
                        </ViewTransition>
                    </div>
                </div>
            </ViewTransition>
        </ChatProvider>
    )
}

'use client'

import { ChatProvider } from './chat-provider'
import { MessageList } from './message-list'
import { Composer } from './composer'

export interface ChatProps {
    id: string
}

/**
 * Self-contained AI conversation surface.
 *
 * - Assistant output is rendered centered, bubble-free, via `<Markdown>` so
 *   flavored blocks (math, Visualizer, Quiz) work mid-stream.
 * - The user's own messages are pushed right inside a subtle bubble.
 * - The composer floats above the dock and stays blank by default (no
 *   pre-filled prompt).
 */
export function Chat({ id }: ChatProps) {
    return (
        <ChatProvider id={id}>
            <div className='flex flex-col gap-12 pb-44'>
                <MessageList />
            </div>
            <div className='pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-5'>
                <Composer />
            </div>
        </ChatProvider>
    )
}

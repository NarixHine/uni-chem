'use client'

import { Suspense, use, useEffect, useRef } from 'react'
import { ViewTransition } from 'react'
import { usePathname } from 'next/navigation'
import type { UIMessage } from 'ai'
import { ChatProvider } from './chat-provider'
import { useChat } from './chat-provider'
import { MessageList } from './message-list'
import { Composer } from './composer'
import { takePendingAttachments } from './attachments'
import { Spinner } from '@heroui/react'

/** Data resolved from the server-side conversation fetch. */
export interface ConversationData {
    prompt?: string
    messages: UIMessage[] | null
}

export interface ChatProps {
    dataPromise: Promise<ConversationData>
}

/**
 * Self-contained AI conversation surface.
 *
 * The page stays synchronous — it hands over a data-fetch promise which is
 * resolved inside `<ConversationHydrator>` with React `use()`. The composer
 * (carrying the `engage-composer` view-transition name) is available
 * immediately, so the morph from the Engage hub stays intact while the
 * transcript resolves. No streaming starts until the conversation is proven
 * non-existent.
 */
export function Chat({ dataPromise }: ChatProps) {
    const id = useConversationId()
    return (
        <ChatProvider id={id}>
            <ViewTransition enter='content-enter' default='none'>
                <div className='flex min-h-dvh flex-col pt-8 w-full'>
                    <Suspense
                        fallback={
                            <div className='w-full flex flex-1 justify-center items-center'>
                                <Spinner />
                            </div>
                        }
                    >
                        <div className='flex flex-1 flex-col gap-12'>
                            <MessageList />
                        </div>
                        <ConversationHydrator id={id} dataPromise={dataPromise} />
                    </Suspense>
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

function useConversationId(): string {
    const pathname = usePathname()
    const match = pathname?.match(/^\/engage\/([^/]+)/)
    return match?.[1] ?? ''
}

/**
 * Resolves the page's data promise and, once the conversation's existence is
 * proven, either hydrates the chat with the stored transcript or fires the
 * opening prompt (plus any seeded attachments). Until the promise resolves it
 * suspends inside its own `<Suspense>` boundary, leaving the composer visible.
 */
function ConversationHydrator({
    id,
    dataPromise,
}: {
    id: string
    dataPromise: Promise<ConversationData>
}) {
    const data = use(dataPromise)
    const { setMessages, sendMessage, status } = useChat()
    const settled = useRef(false)

    useEffect(() => {
        if (settled.current || status !== 'ready') return
        settled.current = true

        const { messages, prompt } = data

        if (messages && messages.length > 0) {
            setMessages(messages)
            return
        }

        const text = prompt?.trim()
        const files = takePendingAttachments(id)
        if (!text && !files?.length) return
        if (text && files?.length) sendMessage({ text, files })
        else if (text) sendMessage({ text })
        else sendMessage({ files: files! })
    }, [data, id, setMessages, sendMessage, status])

    // Strip the `?prompt=` search param after it has been consumed so
    // refreshes/back-navigation don't re-fire it.
    useEffect(() => {
        if (!data.prompt) return
        const url = new URL(window.location.href)
        if (!url.searchParams.has('prompt')) return
        url.searchParams.delete('prompt')
        window.history.replaceState(window.history.state, '', url)
    }, [data.prompt])

    return null
}

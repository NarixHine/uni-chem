'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage } from './message'
import { useChat } from './chat-provider'

export function MessageList() {
    const { messages, status } = useChat()
    const endRef = useRef<HTMLDivElement>(null)

    // Keep the latest message in view as tokens stream in.
    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }, [messages, status])

    const streaming = status === 'streaming' || status === 'submitted'

    return (
        <div className='flex flex-col gap-10'>
            {messages.map((message, i) => (
                <ChatMessage
                    key={message.id}
                    message={message}
                    streaming={
                        streaming && i === messages.length - 1 && message.role === 'assistant'
                    }
                />
            ))}
            <div ref={endRef} className='mt-20' />
        </div>
    )
}

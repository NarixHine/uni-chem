'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useChat as useChatHook, type UseChatHelpers } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'

type ChatContextValue = UseChatHelpers<UIMessage>

const ChatContext = createContext<ChatContextValue | null>(null)

export interface ChatProviderProps {
    id: string
    children: ReactNode
}

/**
 * Owns the single `useChat` instance for a conversation and exposes it via
 * context so the message list, composer, and any controls share one stream
 * without prop-drilling.
 */
export function ChatProvider({ id, children }: ChatProviderProps) {
    const chat = useChatHook({
        id,
        transport: new DefaultChatTransport({ api: '/api/chat' }),
    })
    return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
    const ctx = useContext(ChatContext)
    if (!ctx) throw new Error('useChat must be used within a <ChatProvider>')
    return ctx
}

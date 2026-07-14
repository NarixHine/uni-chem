'use client'

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useChat as useChatHook, type UseChatHelpers } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useAction } from 'next-safe-action/hooks'
import { saveMessages } from '@/service/conversations'

type ChatContextValue = UseChatHelpers<UIMessage>

const ChatContext = createContext<ChatContextValue | null>(null)

export interface ChatProviderProps {
    id: string
    /** Opening prompt to fire once, after mount. */
    initialPrompt?: string
    children: ReactNode
}

/**
 * Owns the single `useChat` instance for a conversation and exposes it via
 * context so the message list, composer, and any controls share one stream
 * without prop-drilling.
 *
 * After each assistant turn finishes, the full transcript is persisted to
 * the database via the `saveMessages` safe action.
 */
export function ChatProvider({ id, initialPrompt, children }: ChatProviderProps) {
    const { execute: execSave } = useAction(saveMessages)

    const chat = useChatHook({
        id,
        transport: new DefaultChatTransport({ api: '/api/chat' }),
        onFinish: ({ messages, isError }) => {
            if (isError) return
            execSave({ id, messages })
        },
    })

    // Fire an optional opening prompt exactly once after mount.
    const fired = useRef(false)
    useEffect(() => {
        const prompt = initialPrompt?.trim()
        if (!prompt || fired.current || chat.status !== 'ready') return
        fired.current = true
        chat.sendMessage({ text: prompt })
    }, [chat, initialPrompt])

    return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
    const ctx = useContext(ChatContext)
    if (!ctx) throw new Error('useChat must be used within a <ChatProvider>')
    return ctx
}

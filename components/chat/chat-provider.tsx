'use client'

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useChat as useChatHook, type UseChatHelpers } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useAction } from 'next-safe-action/hooks'
import { saveMessages } from '@/service/conversations'
import { takePendingAttachments } from './attachments'

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
    const { execute: execSave } = useAction(saveMessages, {
        onSuccess: ({ data }) => {
            if (data?.title) {
                window.dispatchEvent(
                    new CustomEvent('conversation:renamed', {
                        detail: { id: data.id, title: data.title },
                    }),
                )
            }
        },
    })

    const chat = useChatHook({
        id,
        transport: new DefaultChatTransport({ api: '/api/chat' }),
        onFinish: ({ messages, isError }) => {
            if (isError) return
            execSave({ id, messages })
        },
    })

    // Fire an optional opening prompt (and any attachments seeded from the
    // Engage hub) exactly once after mount.
    const fired = useRef(false)
    useEffect(() => {
        if (fired.current || chat.status !== 'ready') return
        const text = initialPrompt?.trim()
        const files = takePendingAttachments(id)
        if (!text && !files?.length) return
        fired.current = true
        if (text && files?.length) chat.sendMessage({ text, files })
        else if (text) chat.sendMessage({ text })
        else chat.sendMessage({ files: files! })
    }, [chat, id, initialPrompt])

    return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
    const ctx = useContext(ChatContext)
    if (!ctx) throw new Error('useChat must be used within a <ChatProvider>')
    return ctx
}

import { createContext, useContext, type ReactNode } from 'react'
import { useChat as useChatHook, type UseChatHelpers } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useAction } from 'next-safe-action/hooks'
import { saveMessages } from '@/service/conversations'

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
 *
 * After each assistant turn finishes, the full transcript is persisted to
 * the database via the `saveMessages` safe action. Hydration of an existing
 * transcript and firing of the opening prompt are handled by
 * `<ConversationHydrator>`, which resolves the page's data promise before
 * touching the chat.
 */
export function ChatProvider({ id, children }: ChatProviderProps) {
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

    return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
    const ctx = useContext(ChatContext)
    if (!ctx) throw new Error('useChat must be used within a <ChatProvider>')
    return ctx
}

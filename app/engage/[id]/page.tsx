import { headers } from 'next/headers'
import Main from '@/components/main'
import { Chat, type ConversationData } from '@/components/chat'
import { auth } from '@/lib/auth'
import { getConversationMessages } from '@/db/conversations'

type ChatPageParams = Promise<{ id: string }>
type ChatPageSearch = Promise<{ prompt?: string }>

export default function ChatPage({
    params,
    searchParams,
}: {
    params: ChatPageParams
    searchParams: ChatPageSearch
}) {
    // Don't await — hand the promise to <Chat> so the page renders
    // synchronously and the composer (view-transition target) is available
    // immediately. The promise is resolved with React `use()` inside Chat.
    const dataPromise = loadConversation(params, searchParams)
    return (
        <Main padded={false} className='pt-8'>
            <Chat dataPromise={dataPromise} />
        </Main>
    )
}

async function loadConversation(
    params: ChatPageParams,
    searchParams: ChatPageSearch,
): Promise<ConversationData> {
    const { id } = await params
    const { prompt } = await searchParams
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return { prompt, messages: null }
    const messages = await getConversationMessages(session.user.id, id)
    return { prompt, messages }
}
